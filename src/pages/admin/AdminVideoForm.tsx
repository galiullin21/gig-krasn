import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Plus, X, Video, Play, ExternalLink } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useCrosspost } from "@/hooks/useCrosspost";

const videoSchema = z.object({
  title: z.string().min(1, "Введите название").max(255),
  slug: z.string().min(1, "Введите URL").max(255),
  cover_image: z.string().optional(),
  published: z.boolean().default(false),
});

type VideoFormData = z.infer<typeof videoSchema>;

interface VideoItem {
  url: string;
  type: string;
  title?: string;
}

// Video URL utilities
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractVkVideoId(url: string): { oid: string; id: string } | null {
  const match = url.match(/video(-?\d+)_(\d+)/);
  if (match) return { oid: match[1], id: match[2] };
  return null;
}

function extractRutubeId(url: string): string | null {
  const match = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function detectVideoType(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vk.com") || url.includes("vkvideo.ru")) return "vk";
  if (url.includes("rutube.ru")) return "rutube";
  return "direct";
}

function getVideoThumbnail(url: string, type: string): string | null {
  if (type === "youtube") {
    const id = extractYoutubeId(url);
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }
  return null;
}

export default function AdminVideoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const { crosspost } = useCrosspost();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      slug: "",
      cover_image: "",
      published: false,
    },
  });

  const { data: videoData, isLoading } = useQuery({
    queryKey: ["admin-video", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("galleries")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (videoData) {
      form.reset({
        title: videoData.title,
        slug: videoData.slug,
        cover_image: videoData.cover_image || "",
        published: !!videoData.published_at,
      });
      if (videoData.videos && Array.isArray(videoData.videos)) {
        setVideos(videoData.videos as unknown as VideoItem[]);
      }
    }
  }, [videoData, form]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[а-яё]/g, (char) => {
        const map: Record<string, string> = {
          а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
          ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
          н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
          ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "",
          ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
        };
        return map[char] || char;
      })
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const addVideo = () => {
    if (!newVideoUrl.trim()) {
      toast.error("Введите URL видео");
      return;
    }

    const type = detectVideoType(newVideoUrl);
    
    // Validate URL based on type
    if (type === "youtube" && !extractYoutubeId(newVideoUrl)) {
      toast.error("Некорректная ссылка YouTube");
      return;
    }
    if (type === "vk" && !extractVkVideoId(newVideoUrl)) {
      toast.error("Некорректная ссылка VK Video");
      return;
    }
    if (type === "rutube" && !extractRutubeId(newVideoUrl)) {
      toast.error("Некорректная ссылка Rutube");
      return;
    }

    const newVideo: VideoItem = {
      url: newVideoUrl.trim(),
      type,
    };

    setVideos([...videos, newVideo]);
    setNewVideoUrl("");

    // Auto-set cover image from first YouTube video
    if (type === "youtube" && !form.getValues("cover_image")) {
      const thumbnail = getVideoThumbnail(newVideoUrl, type);
      if (thumbnail) {
        form.setValue("cover_image", thumbnail);
      }
    }

    toast.success("Видео добавлено");
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const getVideoTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      youtube: { label: "YouTube", variant: "destructive" },
      vk: { label: "VK Video", variant: "default" },
      rutube: { label: "Rutube", variant: "secondary" },
      direct: { label: "Прямая ссылка", variant: "outline" },
    };
    return badges[type] || badges.direct;
  };

  const getVideoPreviewThumbnail = (video: VideoItem) => {
    if (video.type === "youtube") {
      const id = extractYoutubeId(video.url);
      if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    return null;
  };

  const onSubmit = async (data: VideoFormData) => {
    if (videos.length === 0) {
      toast.error("Добавьте хотя бы одно видео");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: data.title,
        slug: data.slug,
        cover_image: data.cover_image || null,
        type: "video" as const,
        videos: JSON.parse(JSON.stringify(videos)),
        published_at: data.published ? new Date().toISOString() : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("galleries")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        toast.success("Видео обновлено");
      } else {
        const { data: newVideo, error } = await supabase
          .from("galleries")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;

        if (data.published && newVideo) {
          crosspost("gallery", newVideo.id);
        }

        toast.success("Видео создано");
      }

      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      queryClient.invalidateQueries({ queryKey: ["home-video-galleries-slider"] });
      navigate("/admin/videos");
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при сохранении");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/admin/videos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <h1 className="font-condensed text-2xl md:text-3xl font-bold">
          {isEditing ? "Редактирование видео" : "Новое видео"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
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
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Название видео-репортажа"
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
                        <FormLabel>URL (slug)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="video-slug" />
                        </FormControl>
                        <FormDescription>
                          Будет использоваться в адресе: /galleries/{field.value || "slug"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Видео
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Video Input */}
                  <div className="flex gap-2">
                    <Input
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="Вставьте ссылку на видео (YouTube, VK, Rutube)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addVideo();
                        }
                      }}
                    />
                    <Button type="button" onClick={addVideo}>
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Поддерживаются: YouTube, VK Video, Rutube, прямые ссылки на видеофайлы
                  </p>

                  {/* Videos List */}
                  {videos.length > 0 ? (
                    <div className="space-y-3">
                      {videos.map((video, index) => {
                        const badge = getVideoTypeBadge(video.type);
                        const thumbnail = getVideoPreviewThumbnail(video);
                        
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            {thumbnail ? (
                              <div className="relative w-24 h-14 rounded overflow-hidden bg-muted shrink-0">
                                <img
                                  src={thumbnail}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-6 h-6 text-white" fill="white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-24 h-14 rounded bg-muted flex items-center justify-center shrink-0">
                                <Video className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {video.url}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <a href={video.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVideo(index)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                      <Video className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        Добавьте видео по ссылке
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
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
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="cursor-pointer">Опубликовать</FormLabel>
                          <FormDescription>
                            Видео будет доступно на сайте
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Сохранить
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Обложка</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="cover_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            bucket="gallery-images"
                            folder="covers"
                          />
                        </FormControl>
                        <FormDescription>
                          Автоматически подставляется из YouTube
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
