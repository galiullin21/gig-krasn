import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save, Upload, X, Image, Video, Link2, Play, Plus, CalendarIcon, Clock, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCrosspost } from "@/hooks/useCrosspost";
import { generateSlug } from "@/lib/transliterate";

const gallerySchema = z.object({
  title: z.string().min(1, "Введите название").max(255),
  slug: z.string().min(1, "Введите URL").max(255),
  type: z.enum(["gallery", "reportage"]),
  cover_image: z.string().url().optional().or(z.literal("")),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.object({
    url: z.string(),
    type: z.enum(["youtube", "vk", "rutube", "direct"]),
    title: z.string().optional(),
  })).optional(),
  published: z.boolean(),
  scheduled_at: z.date().optional().nullable(),
  scheduled_crosspost: z.boolean(),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

interface VideoItem {
  url: string;
  type: "youtube" | "vk" | "rutube" | "direct";
  title?: string;
}

// Функции для извлечения ID видео из URL
const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractVkVideoId = (url: string): { ownerId: string; videoId: string } | null => {
  // vk.com/video-123456_789012 or vk.com/video123456_789012
  const match = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (match) return { ownerId: match[1], videoId: match[2] };
  return null;
};

const extractRutubeId = (url: string): string | null => {
  // rutube.ru/video/XXXXX/
  const match = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (match) return match[1];
  return null;
};

const detectVideoType = (url: string): VideoItem["type"] => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vk.com/video")) return "vk";
  if (url.includes("rutube.ru")) return "rutube";
  return "direct";
};

const getVideoThumbnail = (video: VideoItem): string | null => {
  if (video.type === "youtube") {
    const id = extractYoutubeId(video.url);
    if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }
  return null;
};

export default function AdminGalleryForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { crosspost } = useCrosspost();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: "",
      slug: "",
      type: "gallery",
      cover_image: "",
      images: [],
      videos: [],
      published: false,
      scheduled_at: null,
      scheduled_crosspost: true,
    },
  });

  const currentType = form.watch("type");

  const { data: galleryItem, isLoading } = useQuery({
    queryKey: ["gallery", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (galleryItem) {
      const galleryImages = Array.isArray(galleryItem.images) 
        ? (galleryItem.images as string[])
        : [];
      
      // videos column added via migration - use type assertion
      const galleryData = galleryItem as typeof galleryItem & { videos?: unknown };
      const galleryVideos = Array.isArray(galleryData.videos)
        ? (galleryData.videos as unknown as VideoItem[])
        : [];
      
      form.reset({
        title: galleryItem.title,
        slug: galleryItem.slug,
        type: galleryItem.type as "gallery" | "reportage",
        cover_image: galleryItem.cover_image || "",
        images: galleryImages,
        videos: galleryVideos,
        published: !!galleryItem.published_at,
        scheduled_at: galleryItem.scheduled_at ? new Date(galleryItem.scheduled_at) : null,
        scheduled_crosspost: galleryItem.scheduled_crosspost ?? true,
      });
      setImages(galleryImages);
      setVideos(galleryVideos);
    }
  }, [galleryItem, form]);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("galleries")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("galleries")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      form.setValue("images", newImages);

      if (!form.getValues("cover_image") && uploadedUrls.length > 0) {
        form.setValue("cover_image", uploadedUrls[0]);
      }

      toast({ title: `Загружено ${uploadedUrls.length} фото` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    form.setValue("images", newImages);

    if (form.getValues("cover_image") === images[index]) {
      form.setValue("cover_image", newImages[0] || "");
    }
  };

  const setCoverImage = (url: string) => {
    form.setValue("cover_image", url);
  };

  const addVideo = () => {
    if (!newVideoUrl.trim()) {
      toast({ variant: "destructive", title: "Введите URL видео" });
      return;
    }

    const videoType = detectVideoType(newVideoUrl);
    
    // Валидация URL в зависимости от типа
    if (videoType === "youtube" && !extractYoutubeId(newVideoUrl)) {
      toast({ variant: "destructive", title: "Неверный формат YouTube URL" });
      return;
    }
    if (videoType === "vk" && !extractVkVideoId(newVideoUrl)) {
      toast({ variant: "destructive", title: "Неверный формат VK Video URL", description: "Пример: vk.com/video-123456_789012" });
      return;
    }
    if (videoType === "rutube" && !extractRutubeId(newVideoUrl)) {
      toast({ variant: "destructive", title: "Неверный формат Rutube URL" });
      return;
    }

    const newVideo: VideoItem = {
      url: newVideoUrl.trim(),
      type: videoType,
      title: newVideoTitle.trim() || undefined,
    };

    const updatedVideos = [...videos, newVideo];
    setVideos(updatedVideos);
    form.setValue("videos", updatedVideos);
    setNewVideoUrl("");
    setNewVideoTitle("");

    toast({ title: "Видео добавлено" });
  };

  const removeVideo = (index: number) => {
    const updatedVideos = videos.filter((_, i) => i !== index);
    setVideos(updatedVideos);
    form.setValue("videos", updatedVideos);
  };

  const getVideoTypeBadge = (type: VideoItem["type"]) => {
    switch (type) {
      case "youtube": return { label: "YouTube", color: "bg-red-500" };
      case "vk": return { label: "VK Video", color: "bg-blue-500" };
      case "rutube": return { label: "Rutube", color: "bg-green-600" };
      case "direct": return { label: "Прямая ссылка", color: "bg-gray-500" };
    }
  };

  const onSubmit = async (data: GalleryFormData) => {
    setIsSubmitting(true);
    try {
      const wasPublished = !!galleryItem?.published_at;
      const isPublishing = data.published && !wasPublished;
      const isScheduling = !data.published && data.scheduled_at && data.scheduled_at > new Date();

      // Determine scheduled_at
      let scheduledAt: string | null = null;
      if (isScheduling && data.scheduled_at) {
        scheduledAt = data.scheduled_at.toISOString();
      }

      const payload: Record<string, unknown> = {
        title: data.title,
        slug: data.slug,
        type: data.type,
        cover_image: data.cover_image || null,
        images: images,
        videos: videos,
        published_at: data.published ? (galleryItem?.published_at || new Date().toISOString()) : null,
        scheduled_at: scheduledAt,
        scheduled_crosspost: data.scheduled_crosspost,
      };

      let contentId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("galleries")
          .update(payload as any)
          .eq("id", id);
        if (error) throw error;
        toast({ title: "Галерея обновлена" });
      } else {
        const { data: insertData, error } = await supabase
          .from("galleries")
          .insert(payload as any)
          .select("id")
          .single();
        if (error) throw error;
        contentId = insertData.id;
        toast({ title: "Галерея создана" });
      }

      // Кросс-постинг при публикации
      if (isPublishing && contentId) {
        crosspost("gallery", contentId);
      }

      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
      navigate("/admin/galleries");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/galleries">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-condensed font-bold">
            {isEditing ? "Редактировать галерею" : "Новая галерея"}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (!isEditing && !form.getValues("slug")) {
                                form.setValue("slug", generateSlug(e.target.value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL (slug) *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gallery">Фотогалерея</SelectItem>
                            <SelectItem value="reportage">Видеорепортаж</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Контент в зависимости от типа */}
              {currentType === "gallery" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Фотографии ({images.length})
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="relative"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Загрузить
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {images.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {images.map((url, index) => (
                          <div
                            key={index}
                            className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                              form.getValues("cover_image") === url
                                ? "border-primary"
                                : "border-transparent"
                            }`}
                          >
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => setCoverImage(url)}
                                title="Сделать обложкой"
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {form.getValues("cover_image") === url && (
                              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                                Обложка
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Загрузите фотографии для галереи</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Видео ({videos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Форма добавления видео */}
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Play className="h-4 w-4 text-red-500" />
                        <span>YouTube</span>
                        <span className="mx-1">•</span>
                        <span className="text-blue-500">VK Video</span>
                        <span className="mx-1">•</span>
                        <span className="text-green-600">Rutube</span>
                        <span className="mx-1">•</span>
                        <Link2 className="h-4 w-4" />
                        <span>Прямая ссылка</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="Вставьте URL видео..."
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="Название видео (опционально)"
                          value={newVideoTitle}
                          onChange={(e) => setNewVideoTitle(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" onClick={addVideo} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Добавить
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Примеры поддерживаемых форматов:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li>YouTube: youtube.com/watch?v=XXX или youtu.be/XXX</li>
                          <li>VK Video: vk.com/video-123456_789012</li>
                          <li>Rutube: rutube.ru/video/XXXXX</li>
                          <li>Прямая ссылка: https://example.com/video.mp4</li>
                        </ul>
                      </div>
                    </div>

                    {/* Список добавленных видео */}
                    {videos.length > 0 ? (
                      <div className="space-y-3">
                        {videos.map((video, index) => {
                          const badge = getVideoTypeBadge(video.type);
                          const thumbnail = getVideoThumbnail(video);
                          
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                            >
                              {/* Превью */}
                              <div className="w-24 h-16 rounded overflow-hidden bg-muted flex-shrink-0 relative">
                                {thumbnail ? (
                                  <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className={`absolute bottom-1 left-1 text-white text-[10px] px-1.5 py-0.5 rounded ${badge.color}`}>
                                  {badge.label}
                                </div>
                              </div>
                              
                              {/* Информация */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {video.title || `Видео ${index + 1}`}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {video.url}
                                </p>
                              </div>
                              
                              {/* Действия */}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeVideo(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Добавьте видео по ссылке</p>
                        <p className="text-sm mt-1">Поддерживаются YouTube, VK Video, Rutube и прямые ссылки</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Обложка для видеорепортажа */}
              {currentType === "reportage" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Обложка репортажа</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="relative"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Загрузить
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploading(true);
                            try {
                              const fileExt = file.name.split(".").pop();
                              const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                              const { error } = await supabase.storage.from("galleries").upload(fileName, file);
                              if (error) throw error;
                              const { data: urlData } = supabase.storage.from("galleries").getPublicUrl(fileName);
                              form.setValue("cover_image", urlData.publicUrl);
                              toast({ title: "Обложка загружена" });
                            } catch (err: any) {
                              toast({ variant: "destructive", title: "Ошибка", description: err.message });
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                          disabled={isUploading}
                        />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {form.watch("cover_image") ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <img
                          src={form.watch("cover_image")}
                          alt="Обложка"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => form.setValue("cover_image", "")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Загрузите обложку для репортажа</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Публикация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Статус</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === "true")}
                          value={field.value ? "true" : "false"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="false">Черновик</SelectItem>
                            <SelectItem value="true">Опубликовано</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Scheduled Publication Section */}
                  {!form.watch("published") && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Отложенная публикация</span>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="scheduled_at"
                        render={({ field }) => {
                          const handleScheduleDateSelect = (date: Date | undefined) => {
                            if (date) {
                              if (field.value) {
                                date.setHours(field.value.getHours());
                                date.setMinutes(field.value.getMinutes());
                              } else {
                                date.setHours(12, 0, 0, 0);
                              }
                              field.onChange(date);
                            } else {
                              field.onChange(null);
                            }
                          };

                          const handleScheduleTimeChange = (type: 'hours' | 'minutes', value: string) => {
                            const numValue = parseInt(value, 10);
                            if (isNaN(numValue)) return;
                            const date = field.value ? new Date(field.value) : new Date();
                            if (!field.value) date.setHours(12, 0, 0, 0);
                            if (type === 'hours') {
                              date.setHours(Math.max(0, Math.min(23, numValue)));
                            } else {
                              date.setMinutes(Math.max(0, Math.min(59, numValue)));
                            }
                            field.onChange(date);
                          };

                          return (
                            <FormItem className="flex flex-col">
                              <FormLabel>Запланировать на</FormLabel>
                              <div className="flex gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "flex-1 pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "d MMMM yyyy, HH:mm", { locale: ru })
                                        ) : (
                                          <span>Выберите дату и время</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value || undefined}
                                      onSelect={handleScheduleDateSelect}
                                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                      initialFocus
                                      className={cn("p-3 pointer-events-auto")}
                                    />
                                    <div className="border-t p-3 flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">Время:</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={field.value ? format(field.value, "HH") : "12"}
                                        onChange={(e) => handleScheduleTimeChange('hours', e.target.value)}
                                        className="w-16 text-center"
                                        placeholder="ЧЧ"
                                      />
                                      <span>:</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={59}
                                        value={field.value ? format(field.value, "mm") : "00"}
                                        onChange={(e) => handleScheduleTimeChange('minutes', e.target.value)}
                                        className="w-16 text-center"
                                        placeholder="ММ"
                                      />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                {field.value && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => field.onChange(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <FormDescription>
                                Галерея автоматически опубликуется в указанное время
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {form.watch("scheduled_at") && (
                        <FormField
                          control={form.control}
                          name="scheduled_crosspost"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Share2 className="h-4 w-4 text-muted-foreground" />
                                <FormLabel className="cursor-pointer">Кросс-постинг при публикации</FormLabel>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}