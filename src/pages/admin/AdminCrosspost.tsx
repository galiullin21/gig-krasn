import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Send, ExternalLink, Loader2, Settings, History } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useCrosspost } from "@/hooks/useCrosspost";
import { CrosspostSettings } from "@/components/admin/CrosspostSettings";

type ContentType = "news" | "blog" | "gallery";

interface CrosspostLog {
  id: string;
  content_type: string;
  content_id: string;
  platform: string;
  post_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  content_title?: string;
  content_slug?: string;
}

export default function AdminCrosspost() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { crosspost } = useCrosspost();
  const [filter, setFilter] = useState<string>("all");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["crosspost-logs", filter],
    queryFn: async () => {
      let query = supabase
        .from("crosspost_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch content titles
      const logsWithTitles: CrosspostLog[] = [];
      
      for (const log of data || []) {
        let contentTitle = "";
        let contentSlug = "";
        
        const tableName = log.content_type === "blog" ? "blogs" : 
                          log.content_type === "gallery" ? "galleries" : "news";
        
        const { data: content } = await supabase
          .from(tableName)
          .select("title, slug")
          .eq("id", log.content_id)
          .maybeSingle();
        
        if (content) {
          contentTitle = content.title;
          contentSlug = content.slug;
        }
        
        logsWithTitles.push({
          ...log,
          content_title: contentTitle,
          content_slug: contentSlug,
        });
      }

      return logsWithTitles;
    },
  });

  const handleResend = async (log: CrosspostLog) => {
    setResendingId(log.id);
    try {
      await crosspost(log.content_type as ContentType, log.content_id);
      queryClient.invalidateQueries({ queryKey: ["crosspost-logs"] });
    } finally {
      setResendingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Успешно</Badge>;
      case "error":
        return <Badge variant="destructive">Ошибка</Badge>;
      default:
        return <Badge variant="secondary">Ожидание</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === "vk") {
      return (
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.673 4 8.252c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.864 2.5 2.304 4.7 2.896 4.7.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.78 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
          </svg>
          VK
        </span>
      );
    }
    // OK.ru (Odnoklassniki)
    return (
      <span className="inline-flex items-center gap-1.5">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 4.8c1.983 0 3.6 1.617 3.6 3.6S13.983 12 12 12s-3.6-1.617-3.6-3.6S10.017 4.8 12 4.8zm0 2.4c-.663 0-1.2.537-1.2 1.2s.537 1.2 1.2 1.2 1.2-.537 1.2-1.2-.537-1.2-1.2-1.2zm4.243 8.357a6.002 6.002 0 01-2.656 1.131l2.291 2.291a1.2 1.2 0 11-1.697 1.697L12 18.494l-2.181 2.182a1.2 1.2 0 11-1.697-1.697l2.291-2.291a6.002 6.002 0 01-2.656-1.131 1.2 1.2 0 111.486-1.886A3.598 3.598 0 0012 14.4a3.598 3.598 0 002.757-1.129 1.2 1.2 0 111.486 1.886z"/>
        </svg>
        Одноклассники
      </span>
    );
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "news": return "Новость";
      case "blog": return "Блог";
      case "gallery": return "Галерея";
      default: return type;
    }
  };

  const getContentUrl = (log: CrosspostLog) => {
    if (!log.content_slug) return null;
    const path = log.content_type === "blog" ? "blogs" : 
                 log.content_type === "gallery" ? "galleries" : "news";
    return `/${path}/${log.content_slug}`;
  };

  const stats = {
    total: logs?.length || 0,
    success: logs?.filter(l => l.status === "success").length || 0,
    error: logs?.filter(l => l.status === "error").length || 0,
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-condensed font-bold">Кросс-постинг</h1>
          <p className="text-muted-foreground mt-1">
            Автоматическая публикация в VK и Одноклассники
          </p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Настройки соцсетей
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            История публикаций
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <CrosspostSettings />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["crosspost-logs"] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего публикаций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Успешных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              С ошибками
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.error}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>История публикаций</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Фильтр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="success">Успешные</SelectItem>
                <SelectItem value="error">С ошибками</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Пока нет публикаций в соцсетях</p>
              <p className="text-sm mt-1">
                Они появятся здесь после публикации контента
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Контент</TableHead>
                  <TableHead>Платформа</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">
                          {log.content_title || "Удалённый контент"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getContentTypeLabel(log.content_type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getPlatformIcon(log.platform)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(log.status)}
                        {log.error_message && (
                          <span className="text-xs text-destructive line-clamp-1">
                            {log.error_message}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getContentUrl(log) && (
                          <Button asChild variant="ghost" size="icon">
                            <a href={getContentUrl(log)!} target="_blank" rel="noopener">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {log.status === "error" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(log)}
                            disabled={resendingId === log.id}
                          >
                            {resendingId === log.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Повторить
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
