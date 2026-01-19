import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ArrowLeft, Loader2, Save, Eye, FileText, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { TagSelector } from "@/components/admin/TagSelector";
import { useCrosspost } from "@/hooks/useCrosspost";

const RichTextEditor = lazy(() => import("@/components/admin/RichTextEditor").then(m => ({ default: m.RichTextEditor })));

const newsSchema = z.object({
  title: z.string().min(1, "Введите заголовок").max(255),
  slug: z.string().min(1, "Введите URL").max(255),
  lead: z.string().max(500).optional(),
  content: z.string().optional(),
  cover_image: z.string().optional(),
  category_id: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  is_featured: z.boolean(),
  is_important: z.boolean(),
});

type NewsFormData = z.infer<typeof newsSchema>;

interface Document {
  id: string;
  title: string;
  file_url: string;
}

export default function AdminNewsForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { crosspost } = useCrosspost();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const form = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      slug: "",
      lead: "",
      content: "",
      cover_image: "",
      category_id: "",
      status: "draft",
      is_featured: false,
      is_important: false,
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .eq("type", "news");
      return data || [];
    },
  });

  // Fetch all documents
  const { data: documents } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, file_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const { data: newsItem, isLoading } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Fetch existing tags for the news item
  const { data: existingTags } = useQuery({
    queryKey: ["news-tags", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_tags")
        .select("tag_id")
        .eq("news_id", id);
      if (error) throw error;
      return data?.map((t) => t.tag_id) || [];
    },
    enabled: isEditing,
  });

  // Fetch existing documents for the news item
  const { data: existingDocuments } = useQuery({
    queryKey: ["news-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_documents")
        .select("document_id")
        .eq("news_id", id);
      if (error) throw error;
      return data?.map((d) => d.document_id) || [];
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (newsItem) {
      form.reset({
        title: newsItem.title,
        slug: newsItem.slug,
        lead: newsItem.lead || "",
        content: newsItem.content || "",
        cover_image: newsItem.cover_image || "",
        category_id: newsItem.category_id || "",
        status: newsItem.status,
        is_featured: newsItem.is_featured || false,
        is_important: newsItem.is_important || false,
      });
    }
  }, [newsItem, form]);

  useEffect(() => {
    if (existingTags) {
      setSelectedTagIds(existingTags);
    }
  }, [existingTags]);

  useEffect(() => {
    if (existingDocuments) {
      setSelectedDocumentIds(existingDocuments);
    }
  }, [existingDocuments]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-а-яё]/gi, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const onSubmit = async (data: NewsFormData) => {
    setIsSubmitting(true);
    try {
      const wasPublished = newsItem?.status === "published";
      const isPublishing = data.status === "published" && !wasPublished;

      const payload = {
        title: data.title,
        slug: data.slug,
        status: data.status,
        is_featured: data.is_featured,
        is_important: data.is_important,
        category_id: data.category_id || null,
        cover_image: data.cover_image || null,
        lead: data.lead || null,
        content: data.content || null,
        author_id: user?.id,
        published_at: data.status === "published" ? new Date().toISOString() : null,
      };

      let contentId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("news")
          .update(payload)
          .eq("id", id);
        if (error) throw error;

        // Update tags
        await supabase.from("news_tags").delete().eq("news_id", id);
        if (selectedTagIds.length > 0) {
          await supabase.from("news_tags").insert(
            selectedTagIds.map((tagId) => ({ news_id: id, tag_id: tagId }))
          );
        }

        // Update documents
        await supabase.from("news_documents").delete().eq("news_id", id);
        if (selectedDocumentIds.length > 0) {
          await supabase.from("news_documents").insert(
            selectedDocumentIds.map((docId) => ({ news_id: id, document_id: docId }))
          );
        }

        toast({ title: "Новость обновлена" });
      } else {
        const { data: insertData, error } = await supabase
          .from("news")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;
        contentId = insertData.id;

        // Insert tags
        if (selectedTagIds.length > 0) {
          await supabase.from("news_tags").insert(
            selectedTagIds.map((tagId) => ({ news_id: contentId, tag_id: tagId }))
          );
        }

        // Insert documents
        if (selectedDocumentIds.length > 0) {
          await supabase.from("news_documents").insert(
            selectedDocumentIds.map((docId) => ({ news_id: contentId, document_id: docId }))
          );
        }

        toast({ title: "Новость создана" });
      }

      // Кросс-постинг при публикации
      if (isPublishing && contentId) {
        crosspost("news", contentId);
      }

      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      navigate("/admin/news");
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

  const selectedDocs = documents?.filter((d) => selectedDocumentIds.includes(d.id)) || [];

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/news">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-condensed font-bold">
            {isEditing ? "Редактировать новость" : "Новая новость"}
          </h1>
        </div>
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
                        <FormDescription>
                          Уникальный идентификатор в URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lead"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Лид (краткое описание)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
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
                              placeholder="Начните писать новость..."
                            />
                          </Suspense>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Прикрепленные документы
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected documents */}
                  {selectedDocs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Выбранные документы:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="max-w-[200px] truncate">{doc.title}</span>
                            <button
                              type="button"
                              onClick={() => toggleDocument(doc.id)}
                              className="hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available documents */}
                  {documents && documents.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Доступные документы:
                      </p>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                        {documents
                          .filter((d) => !selectedDocumentIds.includes(d.id))
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => toggleDocument(doc.id)}
                            >
                              <Checkbox
                                checked={selectedDocumentIds.includes(doc.id)}
                                onCheckedChange={() => toggleDocument(doc.id)}
                              />
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate">{doc.title}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Документы ещё не загружены.{" "}
                      <Link to="/admin/documents/new" className="text-primary hover:underline">
                        Добавить документ
                      </Link>
                    </p>
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
                      type="news"
                      selectedTagIds={selectedTagIds}
                      onChange={setSelectedTagIds}
                    />
                  </div>

                  <div className="flex flex-col gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="is_featured"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="cursor-pointer">Главная новость</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_important"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="cursor-pointer">Важная новость</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
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
                            folder="news"
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
                {isEditing && newsItem?.status === "published" && (
                  <Button asChild variant="outline">
                    <Link to={`/news/${newsItem.slug}`} target="_blank">
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
