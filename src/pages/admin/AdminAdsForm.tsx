import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ArrowLeft } from "lucide-react";

const adsSchema = z.object({
  title: z.string().min(1, "Введите название"),
  image_url: z.string().min(1, "Загрузите изображение"),
  link_url: z.string().url("Введите корректный URL").optional().or(z.literal("")),
  position: z.string().min(1, "Выберите позицию"),
  is_active: z.boolean(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
});

type AdsFormData = z.infer<typeof adsSchema>;

const AdminAdsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdsFormData>({
    resolver: zodResolver(adsSchema),
    defaultValues: {
      title: "",
      image_url: "",
      link_url: "",
      position: "header",
      is_active: true,
      start_date: "",
      end_date: "",
    },
  });

  const { data: adData, isLoading } = useQuery({
    queryKey: ["admin-ad", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (adData) {
      form.reset({
        title: adData.title,
        image_url: adData.image_url,
        link_url: adData.link_url || "",
        position: adData.position,
        is_active: adData.is_active ?? true,
        start_date: adData.start_date
          ? new Date(adData.start_date).toISOString().split("T")[0]
          : "",
        end_date: adData.end_date
          ? new Date(adData.end_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [adData, form]);

  const onSubmit = async (data: AdsFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        image_url: data.image_url,
        link_url: data.link_url || null,
        position: data.position,
        is_active: data.is_active,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("ads")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ads").insert(payload);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      toast({ title: isEditing ? "Реклама обновлена" : "Реклама добавлена" });
      navigate("/admin/ads");
    } catch (error) {
      console.error("Error saving ad:", error);
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/admin/ads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <h1 className="font-condensed font-bold text-2xl">
          {isEditing ? "Редактировать рекламу" : "Добавить рекламу"}
        </h1>
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
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input placeholder="Название рекламы" {...field} />
                        </FormControl>
                        <FormDescription>
                          Внутреннее название для идентификации
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="link_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ссылка</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL для перехода при клике на баннер
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Позиция</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите позицию" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="header">Шапка</SelectItem>
                            <SelectItem value="content">Контент</SelectItem>
                            <SelectItem value="sidebar">Боковая панель</SelectItem>
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
                  <CardTitle>Период показа</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата начала</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата окончания</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Оставьте пустым для показа без ограничений по времени
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Статус</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Активна</FormLabel>
                          <FormDescription>
                            Показывать рекламу на сайте
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Изображение</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => {
                      const position = form.watch("position");
                      const sizeHints: Record<string, string> = {
                        header: "1200×150 px",
                        content: "1200×200 px",
                        sidebar: "300×400 px",
                      };
                      return (
                        <FormItem>
                          <FormControl>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              bucket="ads"
                            />
                          </FormControl>
                          <FormDescription>
                            Рекомендуемый размер: {sizeHints[position] || "1200×150 px"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin/ads")}>
              Отмена
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdminAdsForm;
