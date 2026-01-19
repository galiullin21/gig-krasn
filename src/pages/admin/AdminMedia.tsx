import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Loader2,
  Search,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
  Film,
  File,
  Copy,
  Link2,
  Plus,
  Play,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MediaItem {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

// Функции для работы с видео URL
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
  const match = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (match) return { ownerId: match[1], videoId: match[2] };
  return null;
};

const extractRutubeId = (url: string): string | null => {
  const match = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  if (match) return match[1];
  return null;
};

const detectVideoType = (url: string): "youtube" | "vk" | "rutube" | "direct" => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vk.com/video")) return "vk";
  if (url.includes("rutube.ru")) return "rutube";
  return "direct";
};

const getVideoThumbnail = (url: string): string | null => {
  const type = detectVideoType(url);
  if (type === "youtube") {
    const id = extractYoutubeId(url);
    if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }
  return null;
};

const getVideoPlatformLabel = (url: string): string => {
  const type = detectVideoType(url);
  switch (type) {
    case "youtube": return "YouTube";
    case "vk": return "VK Video";
    case "rutube": return "Rutube";
    default: return "Видео";
  }
};

export default function AdminMedia() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["admin-media", search, filter],
    queryFn: async () => {
      let query = supabase
        .from("media_library")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("file_name", `%${search}%`);
      }

      if (filter === "images") {
        query = query.like("file_type", "image/%");
      } else if (filter === "documents") {
        query = query.or("file_type.like.application/pdf,file_type.like.application/%,file_type.like.text/%");
      } else if (filter === "videos") {
        query = query.or("file_type.like.video/%,file_type.eq.video/youtube,file_type.eq.video/vk,file_type.eq.video/rutube,file_type.eq.video/external");
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("media_library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast({ title: "Файл удалён" });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    },
  });

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      const uploadedFiles: string[] = [];

      try {
        for (const file of Array.from(files)) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `media/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("covers")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from("covers").getPublicUrl(filePath);

          const { error: insertError } = await supabase.from("media_library").insert([
            {
              file_url: urlData.publicUrl,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              uploaded_by: user?.id,
            },
          ]);

          if (insertError) throw insertError;
          uploadedFiles.push(file.name);
        }

        queryClient.invalidateQueries({ queryKey: ["admin-media"] });
        toast({ title: `Загружено файлов: ${uploadedFiles.length}` });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Ошибка загрузки", description: error.message });
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [user, queryClient, toast]
  );

  const handleAddVideoUrl = async () => {
    if (!videoUrl.trim()) {
      toast({ variant: "destructive", title: "Введите URL видео" });
      return;
    }

    const videoType = detectVideoType(videoUrl);
    
    // Валидация
    if (videoType === "youtube" && !extractYoutubeId(videoUrl)) {
      toast({ variant: "destructive", title: "Неверный формат YouTube URL" });
      return;
    }
    if (videoType === "vk" && !extractVkVideoId(videoUrl)) {
      toast({ variant: "destructive", title: "Неверный формат VK Video URL", description: "Пример: vk.com/video-123456_789012" });
      return;
    }
    if (videoType === "rutube" && !extractRutubeId(videoUrl)) {
      toast({ variant: "destructive", title: "Неверный формат Rutube URL" });
      return;
    }

    setIsAddingVideo(true);
    try {
      const fileName = videoTitle.trim() || `${getVideoPlatformLabel(videoUrl)} видео`;
      const fileType = videoType === "direct" ? "video/external" : `video/${videoType}`;

      const { error } = await supabase.from("media_library").insert([
        {
          file_url: videoUrl.trim(),
          file_name: fileName,
          file_type: fileType,
          file_size: null,
          uploaded_by: user?.id,
        },
      ]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast({ title: "Видео добавлено" });
      setShowVideoDialog(false);
      setVideoUrl("");
      setVideoTitle("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    } finally {
      setIsAddingVideo(false);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "URL скопирован" });
    } catch {
      toast({ variant: "destructive", title: "Не удалось скопировать" });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string | null) => {
    if (!type) return <File className="h-8 w-8" />;
    if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8" />;
    if (type.startsWith("video/") || type === "video/youtube" || type === "video/vk" || type === "video/rutube" || type === "video/external") {
      return <Film className="h-8 w-8" />;
    }
    return <FileText className="h-8 w-8" />;
  };

  const isExternalVideo = (item: MediaItem) => {
    return item.file_type === "video/youtube" || 
           item.file_type === "video/vk" || 
           item.file_type === "video/rutube" || 
           item.file_type === "video/external";
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-condensed font-bold">Медиабиблиотека</h1>
          <p className="text-muted-foreground">Управление загруженными файлами</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowVideoDialog(true)}>
            <Link2 className="h-4 w-4 mr-2" />
            Видео по URL
          </Button>
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleUpload}
              disabled={isUploading}
            />
            <Button disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Загрузить
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени файла..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="images">Изображения</TabsTrigger>
                <TabsTrigger value="documents">Документы</TabsTrigger>
                <TabsTrigger value="videos">Видео</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Файлы ({media.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {filter === "videos" ? (
                <div className="space-y-4">
                  <Film className="h-12 w-12 mx-auto opacity-50" />
                  <p>Видео не найдены</p>
                  <Button variant="outline" onClick={() => setShowVideoDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить видео по URL
                  </Button>
                </div>
              ) : (
                search ? "Файлы не найдены" : "Медиабиблиотека пуста"
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.map((item) => {
                const isVideo = isExternalVideo(item);
                const thumbnail = isVideo ? getVideoThumbnail(item.file_url) : null;
                
                return (
                  <div
                    key={item.id}
                    className="group relative border rounded-lg overflow-hidden bg-muted/30"
                  >
                    <div className="aspect-square flex items-center justify-center p-2 relative">
                      {item.file_type?.startsWith("image/") ? (
                        <img
                          src={item.file_url}
                          alt={item.file_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : isVideo && thumbnail ? (
                        <>
                          <img
                            src={thumbnail}
                            alt={item.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-10 w-10 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                          {getFileIcon(item.file_type)}
                          {isVideo && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {getVideoPlatformLabel(item.file_url)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t bg-background">
                      <p className="text-xs font-medium truncate" title={item.file_name}>
                        {item.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isVideo ? getVideoPlatformLabel(item.file_url) : formatFileSize(item.file_size)}
                      </p>
                    </div>
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {isVideo && (
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => window.open(item.file_url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => copyUrl(item.file_url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Video URL Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить видео по URL</DialogTitle>
            <DialogDescription>
              Поддерживаются YouTube, VK Video, Rutube и прямые ссылки на видео
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL видео *</label>
              <Input
                placeholder="https://youtube.com/watch?v=... или vk.com/video..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Примеры: youtube.com/watch?v=XXX, vk.com/video-123_456, rutube.ru/video/XXX
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Название (опционально)</label>
              <Input
                placeholder="Название для отображения в библиотеке"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVideoDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddVideoUrl} disabled={isAddingVideo}>
              {isAddingVideo ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить файл?</AlertDialogTitle>
            <AlertDialogDescription>
              Файл будет удалён из медиабиблиотеки. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
