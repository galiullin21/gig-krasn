import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Video, Eye, Play } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface VideoItem {
  url: string;
  type: string;
  title?: string;
}

export default function AdminVideosList() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-videos", search],
    queryFn: async () => {
      let query = supabase
        .from("galleries")
        .select("*")
        .eq("type", "video")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("galleries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast.success("Видео удалено");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Ошибка при удалении");
    },
  });

  const getVideosCount = (videos: unknown) => {
    if (!videos || !Array.isArray(videos)) return 0;
    return videos.length;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-condensed text-2xl md:text-3xl font-bold">Видео</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Управление видео-репортажами
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/videos/new">
            <Plus className="h-4 w-4 mr-2" />
            Добавить видео
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Обложка</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-24 text-center">Видео</TableHead>
                <TableHead className="w-24 text-center">Просмотры</TableHead>
                <TableHead className="w-32">Статус</TableHead>
                <TableHead className="w-40">Дата</TableHead>
                <TableHead className="w-24 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    {video.cover_image ? (
                      <div className="relative w-12 h-8 rounded overflow-hidden bg-muted">
                        <img
                          src={video.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-3 h-3 text-white" fill="white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-8 rounded bg-muted flex items-center justify-center">
                        <Video className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/admin/videos/${video.id}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {video.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {getVideosCount(video.videos)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      <span className="text-sm">{video.views_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {video.published_at ? (
                      <Badge variant="default">Опубликовано</Badge>
                    ) : (
                      <Badge variant="secondary">Черновик</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(video.created_at), "d MMM yyyy", {
                      locale: ru,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/videos/${video.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(video.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">Видео не найдено</h3>
          <p className="text-muted-foreground mb-4">
            {search ? "Попробуйте изменить поисковый запрос" : "Добавьте первое видео"}
          </p>
          {!search && (
            <Button asChild>
              <Link to="/admin/videos/new">
                <Plus className="h-4 w-4 mr-2" />
                Добавить видео
              </Link>
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить видео?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Видео будет удалено безвозвратно.
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
