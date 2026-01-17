import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ArrowLeft, Upload, FileText } from "lucide-react";

const archiveSchema = z.object({
  issue_number: z.string().min(1, "Введите номер выпуска"),
  issue_date: z.string().min(1, "Выберите дату выпуска"),
  year: z.number().min(1900).max(2100),
  pdf_url: z.string().min(1, "Загрузите PDF файл"),
  cover_image: z.string().optional(),
});

type ArchiveFormData = z.infer<typeof archiveSchema>;

export default function AdminArchiveForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ArchiveFormData>({
    resolver: zodResolver(archiveSchema),
    defaultValues: {
      issue_number: "",
      issue_date: new Date().toISOString().split("T")[0],
      year: new Date().getFullYear(),
      pdf_url: "",
      cover_image: "",
    },
  });

  const { data: archive, isLoading } = useQuery({
    queryKey: ["archive", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("newspaper_archive")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (archive) {
      form.reset({
        issue_number: archive.issue_number || "",
        issue_date: archive.issue_date,
        year: archive.year,
        pdf_url: archive.pdf_url,
        cover_image: archive.cover_image || "",
      });
    }
  }, [archive, form]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Ошибка", description: "Выберите PDF файл", variant: "destructive" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Ошибка", description: "Файл слишком большой (макс. 50MB)", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `archive/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      form.setValue("pdf_url", publicUrl);
      toast({ title: "PDF загружен" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ArchiveFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        issue_number: data.issue_number,
        issue_date: data.issue_date,
        year: data.year,
        pdf_url: data.pdf_url,
        cover_image: data.cover_image || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("newspaper_archive")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        toast({ title: "Выпуск обновлён" });
      } else {
        const { error } = await supabase.from("newspaper_archive").insert(payload);
        if (error) throw error;
        toast({ title: "Выпуск добавлен" });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-archives"] });
      navigate("/admin/archive");
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/archive">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к архиву
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-condensed font-bold mb-6">
        {isEditing ? "Редактировать выпуск" : "Добавить выпуск"}
      </h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация о выпуске</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issue_number">Номер выпуска</Label>
                <Input
                  id="issue_number"
                  type="text"
                  {...form.register("issue_number")}
                />
                {form.formState.errors.issue_number && (
                  <p className="text-sm text-destructive">{form.formState.errors.issue_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_date">Дата выпуска</Label>
                <Input
                  id="issue_date"
                  type="date"
                  {...form.register("issue_date")}
                />
                {form.formState.errors.issue_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.issue_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Год</Label>
                <Input
                  id="year"
                  type="number"
                  {...form.register("year", { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Файлы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>PDF файл</Label>
                {form.watch("pdf_url") ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm truncate flex-1">PDF загружен</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue("pdf_url", "")}
                    >
                      Удалить
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={isUploading}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <Label
                      htmlFor="pdf-upload"
                      className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-5 w-5" />
                      <span>{isUploading ? "Загрузка..." : "Загрузить PDF"}</span>
                    </Label>
                  </div>
                )}
                {form.formState.errors.pdf_url && (
                  <p className="text-sm text-destructive">{form.formState.errors.pdf_url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Обложка</Label>
                <ImageUpload
                  value={form.watch("cover_image") || ""}
                  onChange={(url) => form.setValue("cover_image", url)}
                  bucket="images"
                  folder="archive-covers"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? "Сохранение..." : isEditing ? "Сохранить" : "Создать"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/archive")}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
