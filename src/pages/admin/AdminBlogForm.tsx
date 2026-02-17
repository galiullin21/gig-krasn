import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { ArrowLeft, Loader2, Save, Eye, CalendarIcon, Clock, Share2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { generateSlug } from "@/lib/transliterate";
import { TagSelector } from "@/components/admin/TagSelector";
import { useCrosspost } from "@/hooks/useCrosspost";

const RichTextEditor = lazy(() => import("@/components/admin/RichTextEditor").then(m => ({ default: m.RichTextEditor })));

const blogSchema = z.object({
  title: z.string().min(1, "Введите заголовок").max(255),
  slug: z.string().min(1, "Введите URL").max(255),
  content: z.string().optional(),
  cover_image: z.string().optional(),
  category_id: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  published_at: z.date().optional().nullable(),
  scheduled_at: z.date().optional().nullable(),
  scheduled_crosspost: z.boolean(),
});

type BlogFormData = z.infer<typeof blogSchema>;

export default function AdminBlogForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { crosspost } = useCrosspost();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Create default date with 12:00 time for new blogs
  const getDefaultPublishedAt = () => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
  };

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      cover_image: "",
      category_id: "",
      status: "draft",
      published_at: getDefaultPublishedAt(),
      scheduled_at: null,
      scheduled_crosspost: true,
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "blog"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .eq("type", "blog");
      return data || [];
    },
  });

  const { data: blogItem, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Fetch existing tags for the blog
  const { data: existingTags } = useQuery({
    queryKey: ["blog-tags", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_tags")
        .select("tag_id")
        .eq("blog_id", id);
      if (error) throw error;
      return data?.map((t) => t.tag_id) || [];
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (blogItem) {
      form.reset({
        title: blogItem.title,
        slug: blogItem.slug,
        content: blogItem.content || "",
        cover_image: blogItem.cover_image || "",
        category_id: blogItem.category_id || "",
        status: blogItem.status,
        published_at: blogItem.published_at ? new Date(blogItem.published_at) : getDefaultPublishedAt(),
        scheduled_at: blogItem.scheduled_at ? new Date(blogItem.scheduled_at) : null,
        scheduled_crosspost: blogItem.scheduled_crosspost ?? true,
      });
    }
  }, [blogItem, form]);

  useEffect(() => {
    if (existingTags) {
      setSelectedTagIds(existingTags);
    }
  }, [existingTags]);


  const onSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);
    try {
      const wasPublished = blogItem?.status === "published";
      const isPublishing = data.status === "published" && !wasPublished;
      const isScheduling = data.status === "draft" && data.scheduled_at && data.scheduled_at > new Date();

      // Determine published_at date
      let publishedAt: string | null = null;
      if (data.status === "published") {
        if (data.published_at) {
          publishedAt = data.published_at.toISOString();
        } else {
          publishedAt = new Date().toISOString();
        }
      }

      // Determine scheduled_at
      let scheduledAt: string | null = null;
      if (isScheduling && data.scheduled_at) {
        scheduledAt = data.scheduled_at.toISOString();
      }

      const payload = {
        title: data.title,
        slug: data.slug,
        status: data.status,
        category_id: data.category_id || null,
        cover_image: data.cover_image || null,
        content: data.content || null,
        author_id: user?.id,
        published_at: publishedAt,
        scheduled_at: scheduledAt,
        scheduled_crosspost: data.scheduled_crosspost,
      };

      let contentId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("blogs")
          .update(payload)
          .eq("id", id);
        if (error) throw error;

        // Update tags
        await supabase.from("blog_tags").delete().eq("blog_id", id);
        if (selectedTagIds.length > 0) {
          await supabase.from("blog_tags").insert(
            selectedTagIds.map((tagId) => ({ blog_id: id, tag_id: tagId }))
          );
        }

        toast({ title: "Блог обновлён" });
      } else {
        const { data: insertData, error } = await supabase
          .from("blogs")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;
        contentId = insertData.id;

        // Insert tags
        if (selectedTagIds.length > 0) {
          await supabase.from("blog_tags").insert(
            selectedTagIds.map((tagId) => ({ blog_id: contentId, tag_id: tagId }))
          );
        }

        toast({ title: "Блог создан" });
      }

      // Кросс-постинг при публикации
      if (isPublishing && contentId) {
        crosspost("blog", contentId);
      }

      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      navigate("/admin/blogs");
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
          <Link to="/admin/blogs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-condensed font-bold">
            {isEditing ? "Редактировать блог" : "Новый блог"}
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
                        <FormLabel>Заголовок *</FormLabel>
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
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Содержание</FormLabel>
                        <FormControl>
                          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Начните писать статью..."
                            />
                          </Suspense>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Статус</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Черновик</SelectItem>
                            <SelectItem value="published">Опубликовано</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Scheduled Publication Section */}
                  {form.watch("status") === "draft" && (
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
                                Блог автоматически опубликуется в указанное время
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

                  <FormField
                    control={form.control}
                    name="published_at"
                    render={({ field }) => {
                      const handleDateSelect = (date: Date | undefined) => {
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

                      const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
                        const numValue = parseInt(value, 10);
                        if (isNaN(numValue)) return;
                        
                        const date = field.value ? new Date(field.value) : new Date();
                        if (type === 'hours') {
                          date.setHours(Math.max(0, Math.min(23, numValue)));
                        } else {
                          date.setMinutes(Math.max(0, Math.min(59, numValue)));
                        }
                        field.onChange(date);
                      };

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Дата и время публикации</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
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
                                onSelect={handleDateSelect}
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
                                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                                  className="w-16 text-center"
                                  placeholder="ЧЧ"
                                />
                                <span>:</span>
                                <Input
                                  type="number"
                                  min={0}
                                  max={59}
                                  value={field.value ? format(field.value, "mm") : "00"}
                                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                                  className="w-16 text-center"
                                  placeholder="ММ"
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Если не указать — будет текущая дата при публикации
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Категория</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Теги</FormLabel>
                    <TagSelector
                      type="blog"
                      selectedTagIds={selectedTagIds}
                      onChange={setSelectedTagIds}
                    />
                  </div>
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
                            bucket="covers"
                            folder="blogs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Сохранить
                </Button>
                {isEditing && blogItem?.status === "published" && (
                  <Button asChild variant="outline">
                    <Link to={`/blogs/${blogItem.slug}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
