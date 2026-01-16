import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, BookOpen, FileText, Image, Archive, TrendingUp, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [news, blogs, documents, galleries, archive] = await Promise.all([
        supabase.from("news").select("id", { count: "exact", head: true }),
        supabase.from("blogs").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("galleries").select("id", { count: "exact", head: true }),
        supabase.from("newspaper_archive").select("id", { count: "exact", head: true }),
      ]);

      return {
        news: news.count || 0,
        blogs: blogs.count || 0,
        documents: documents.count || 0,
        galleries: galleries.count || 0,
        archive: archive.count || 0,
      };
    },
  });

  const { data: recentNews } = useQuery({
    queryKey: ["admin-recent-news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id, title, status, views_count, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    { name: "Новости", count: stats?.news, icon: Newspaper, href: "/admin/news", color: "text-blue-500" },
    { name: "Блоги", count: stats?.blogs, icon: BookOpen, href: "/admin/blogs", color: "text-green-500" },
    { name: "Документы", count: stats?.documents, icon: FileText, href: "/admin/documents", color: "text-orange-500" },
    { name: "Галереи", count: stats?.galleries, icon: Image, href: "/admin/galleries", color: "text-purple-500" },
    { name: "Архив", count: stats?.archive, icon: Archive, href: "/admin/archive", color: "text-red-500" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-condensed font-bold">Обзор</h1>
        <p className="text-muted-foreground mt-1">Статистика и быстрые действия</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.name} to={stat.href}>
            <Card className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <span className="text-3xl font-bold">{stat.count}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{stat.name}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Быстрые действия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/admin/news/new">
                <Newspaper className="h-4 w-4 mr-2" />
                Добавить новость
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/admin/blogs/new">
                <BookOpen className="h-4 w-4 mr-2" />
                Написать блог
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/admin/documents/new">
                <FileText className="h-4 w-4 mr-2" />
                Загрузить документ
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/admin/galleries/new">
                <Image className="h-4 w-4 mr-2" />
                Создать галерею
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Последние новости
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNews?.map((item) => (
                <Link
                  key={item.id}
                  to={`/admin/news/${item.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.status === "published" ? "Опубликовано" : "Черновик"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    {item.views_count || 0}
                  </div>
                </Link>
              ))}
              {!recentNews?.length && (
                <p className="text-center text-muted-foreground py-4">
                  Новостей пока нет
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
