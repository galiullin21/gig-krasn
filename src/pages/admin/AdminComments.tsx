import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Trash2, 
  Reply, 
  Send, 
  ExternalLink,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
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

interface Comment {
  id: string;
  text: string;
  user_id: string;
  content_type: string;
  content_id: string;
  parent_id: string | null;
  is_approved: boolean;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  content_title?: string;
  content_slug?: string;
}

export default function AdminComments() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      // Fetch all comments
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = [...new Set(commentsData?.map((c) => c.user_id) || [])];
      const profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        profilesData?.forEach((p) => {
          profiles[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
      }

      // Fetch content titles
      const newsIds = commentsData?.filter(c => c.content_type === "news").map(c => c.content_id) || [];
      const blogIds = commentsData?.filter(c => c.content_type === "blog").map(c => c.content_id) || [];

      const contentMap: Record<string, { title: string; slug: string }> = {};

      if (newsIds.length > 0) {
        const { data: newsData } = await supabase
          .from("news")
          .select("id, title, slug")
          .in("id", newsIds);
        newsData?.forEach((n) => {
          contentMap[n.id] = { title: n.title, slug: n.slug };
        });
      }

      if (blogIds.length > 0) {
        const { data: blogsData } = await supabase
          .from("blogs")
          .select("id, title, slug")
          .in("id", blogIds);
        blogsData?.forEach((b) => {
          contentMap[b.id] = { title: b.title, slug: b.slug };
        });
      }

      return commentsData?.map((c) => ({
        ...c,
        profile: profiles[c.user_id] || null,
        content_title: contentMap[c.content_id]?.title,
        content_slug: contentMap[c.content_id]?.slug,
      })) as Comment[];
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ commentId, contentType, contentId }: { commentId: string; contentType: string; contentId: string }) => {
      if (!user || !replyText.trim()) throw new Error("Введите текст ответа");

      const { error } = await supabase.from("comments").insert({
        content_type: contentType,
        content_id: contentId,
        user_id: user.id,
        parent_id: commentId,
        text: replyText.trim(),
        is_approved: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setReplyingTo(null);
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast({ title: "Ответ добавлен" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast({ title: "Комментарий удалён" });
    },
  });

  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const { error } = await supabase
        .from("comments")
        .update({ is_approved: !isApproved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    },
  });

  const getContentLink = (comment: Comment) => {
    if (!comment.content_slug) return null;
    const basePath = comment.content_type === "news" ? "/news" : "/blogs";
    return `${basePath}/${comment.content_slug}`;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-condensed font-bold">Комментарии</h1>
          <p className="text-muted-foreground">
            Управление комментариями пользователей
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => {
            const initials = comment.profile?.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "U";
            const contentLink = getContentLink(comment);

            return (
              <Card key={comment.id} className={!comment.is_approved ? "border-orange-300 dark:border-orange-700" : ""}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.profile?.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">
                          {comment.profile?.full_name || "Пользователь"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
                        </span>
                        <Badge variant={comment.content_type === "news" ? "default" : "secondary"} className="text-xs">
                          {comment.content_type === "news" ? "Новость" : "Блог"}
                        </Badge>
                        {!comment.is_approved && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            Скрыт
                          </Badge>
                        )}
                      </div>

                      {comment.content_title && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-xs text-muted-foreground">К материалу:</span>
                          {contentLink ? (
                            <Link
                              to={contentLink}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              {comment.content_title.substring(0, 50)}
                              {comment.content_title.length > 50 && "..."}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-xs">{comment.content_title}</span>
                          )}
                        </div>
                      )}

                      <p className="text-sm whitespace-pre-wrap mb-3">{comment.text}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        >
                          <Reply className="h-3.5 w-3.5 mr-1" />
                          Ответить
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => toggleApprovalMutation.mutate({ id: comment.id, isApproved: comment.is_approved })}
                        >
                          {comment.is_approved ? (
                            <>
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Скрыть
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Одобрить
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(comment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Удалить
                        </Button>
                      </div>

                      {/* Reply form */}
                      {replyingTo === comment.id && (
                        <div className="mt-4 space-y-2">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Введите ответ..."
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                replyMutation.mutate({
                                  commentId: comment.id,
                                  contentType: comment.content_type,
                                  contentId: comment.content_id,
                                })
                              }
                              disabled={!replyText.trim() || replyMutation.isPending}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Отправить
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                            >
                              Отмена
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Комментариев пока нет</p>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Комментарий будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
