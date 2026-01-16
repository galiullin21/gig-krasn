import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, ExternalLink, MousePointer } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const AdminAdsList = () => {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-ads", search],
    queryFn: async () => {
      let query = supabase
        .from("ads")
        .select("*")
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
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      toast({ title: "Реклама удалена" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    },
  });

  const getPositionLabel = (position: string) => {
    switch (position) {
      case "header":
        return "Шапка";
      case "content":
        return "Контент";
      case "sidebar":
        return "Боковая панель";
      default:
        return position;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-condensed font-bold text-2xl">Рекламные баннеры</h1>
          <p className="text-muted-foreground">Управление рекламой на сайте</p>
        </div>
        <Button asChild>
          <Link to="/admin/ads/new">
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Link>
        </Button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Превью</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Позиция</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Клики</TableHead>
              <TableHead>Период</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))}
              </>
            )}

            {!isLoading && ads?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Рекламных баннеров пока нет
                </TableCell>
              </TableRow>
            )}

            {ads?.map((ad) => {
              const now = new Date();
              const startDate = ad.start_date ? new Date(ad.start_date) : null;
              const endDate = ad.end_date ? new Date(ad.end_date) : null;
              const isActive = ad.is_active && 
                (!startDate || startDate <= now) && 
                (!endDate || endDate >= now);

              return (
                <TableRow key={ad.id}>
                  <TableCell>
                    {ad.image_url && (
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="h-12 w-20 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ad.title}</div>
                    {ad.link_url && (
                      <a
                        href={ad.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {ad.link_url.substring(0, 30)}...
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getPositionLabel(ad.position)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Активна" : "Неактивна"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MousePointer className="h-3 w-3" />
                      {ad.clicks_count || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {startDate && (
                      <div>с {format(startDate, "dd.MM.yyyy", { locale: ru })}</div>
                    )}
                    {endDate && (
                      <div>до {format(endDate, "dd.MM.yyyy", { locale: ru })}</div>
                    )}
                    {!startDate && !endDate && "Без ограничений"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/ads/${ad.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(ad.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить рекламу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Рекламный баннер будет удалён навсегда.
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
};

export default AdminAdsList;
