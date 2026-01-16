import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Download, File, FileSpreadsheet, FileImage } from "lucide-react";
import { useState } from "react";

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return FileText;
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return FileSpreadsheet;
  if (fileType.includes("image")) return FileImage;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

export default function Documents() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories", "documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("type", "documents")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*, categories(name, slug)")
        .order("created_at", { ascending: false });

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-condensed font-bold text-foreground">
            Документы
          </h1>
          <p className="text-muted-foreground mt-2">
            Официальные документы и материалы
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            Все документы
          </Button>
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="rounded-full"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              return (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 bg-card rounded-lg border hover:border-primary hover:shadow-md transition-all group"
                >
                  <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      {doc.categories?.name && <span>{doc.categories.name}</span>}
                      {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                      <span>
                        {format(new Date(doc.created_at), "d MMMM yyyy", { locale: ru })}
                      </span>
                      {doc.download_count && doc.download_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {doc.download_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Документов пока нет</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
