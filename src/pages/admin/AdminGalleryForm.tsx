import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
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
import { ArrowLeft, Loader2, Save, Upload, X, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { useCrosspost } from "@/hooks/useCrosspost";

const gallerySchema = z.object({
  title: z.string().min(1, "Введите название").max(255),
  slug: z.string().min(1, "Введите URL").max(255),
  type: z.enum(["gallery", "reportage"]),
  cover_image: z.string().url().optional().or(z.literal("")),
  images: z.array(z.string().url()).optional(),
  published: z.boolean(),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

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

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: "",
      slug: "",
      type: "gallery",
      cover_image: "",
      images: [],
      published: false,
    },
  });

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
      
      form.reset({
        title: galleryItem.title,
        slug: galleryItem.slug,
        type: galleryItem.type as "gallery" | "reportage",
        cover_image: galleryItem.cover_image || "",
        images: galleryImages,
        published: !!galleryItem.published_at,
      });
      setImages(galleryImages);
    }
  }, [galleryItem, form]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-а-яё]/gi, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

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

  const onSubmit = async (data: GalleryFormData) => {
    setIsSubmitting(true);
    try {
      const wasPublished = !!galleryItem?.published_at;
      const isPublishing = data.published && !wasPublished;

      const payload = {
        title: data.title,
        slug: data.slug,
        type: data.type,
        cover_image: data.cover_image || null,
        images: images,
        published_at: data.published ? new Date().toISOString() : null,
      };

      let contentId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("galleries")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        toast({ title: "Галерея обновлена" });
      } else {
        const { data: insertData, error } = await supabase
          .from("galleries")
          .insert(payload)
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
                            <SelectItem value="gallery">Галерея</SelectItem>
                            <SelectItem value="reportage">Репортаж</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Фотографии ({images.length})</span>
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
