import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Link as LinkIcon } from "lucide-react";

interface ArticleData {
  title: string;
  lead: string;
  content: string;
  cover_image: string;
  gallery_images: string[];
  source_url: string;
}

interface ArticleImportDialogProps {
  onImport: (data: ArticleData) => void;
}

export function ArticleImportDialog({ onImport }: ArticleImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!url.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите URL статьи",
      });
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите корректный URL",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-article", {
        body: { url: url.trim() },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Не удалось загрузить статью");
      }

      onImport(data.data);
      setOpen(false);
      setUrl("");
      
      toast({
        title: "Статья импортирована",
        description: "Проверьте и отредактируйте содержимое перед публикацией",
      });
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка импорта",
        description: error.message || "Не удалось загрузить статью",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Импорт по ссылке
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Импорт статьи</DialogTitle>
          <DialogDescription>
            Вставьте ссылку на статью с другого сайта. Содержимое будет автоматически извлечено и добавлено в форму.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleImport()}
              className="pl-9"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
            Отмена
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Импортировать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
