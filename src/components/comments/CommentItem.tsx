import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ReactionButtons } from "@/components/reactions/ReactionButtons";
import { CommentForm } from "./CommentForm";
import { useToast } from "@/hooks/use-toast";
import { Reply, Edit2, Trash2, Check, X, Crown, Edit, Code, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentProfile {
  full_name: string | null;
  avatar_url: string | null;
}

type AppRole = "admin" | "editor" | "author" | "developer";

interface Comment {
  id: string;
  text: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: CommentProfile | null;
  replies?: Comment[];
  roles?: AppRole[];
}

interface CommentItemProps {
  comment: Comment;
  contentType: "news" | "blog";
  contentId: string;
  contentSlug?: string;
  depth?: number;
}

const roleConfig: Record<AppRole, { label: string; bgColor: string; icon: typeof Crown }> = {
  admin: { label: "Администратор", bgColor: "bg-red-500", icon: Crown },
  editor: { label: "Редактор", bgColor: "bg-blue-500", icon: Edit },
  author: { label: "Автор", bgColor: "bg-green-500", icon: Edit },
  developer: { label: "Разработчик", bgColor: "bg-purple-600", icon: Code },
};

function getHighestRole(roles: AppRole[]): AppRole | null {
  const priority: AppRole[] = ["developer", "admin", "editor", "author"];
  for (const role of priority) {
    if (roles.includes(role)) return role;
  }
  return null;
}

export function CommentItem({
  comment,
  contentType,
  contentId,
  contentSlug,
  depth = 0,
}: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const isOwner = user?.id === comment.user_id;
  const maxDepth = 3;

  // Get user roles for this comment's author
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", comment.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", comment.user_id);
      return (data?.map(r => r.role) || []) as AppRole[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const highestRole = userRoles ? getHighestRole(userRoles) : null;
  const roleInfo = highestRole ? roleConfig[highestRole] : null;

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editText.trim()) throw new Error("Введите текст");
      const { error } = await supabase
        .from("comments")
        .update({ text: editText.trim() })
        .eq("id", comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
      toast({ title: "Комментарий обновлён" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("comments").delete().eq("id", comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
      toast({ title: "Комментарий удалён" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const initials = comment.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className={cn("group", depth > 0 && "ml-6 md:ml-10 border-l-2 border-muted pl-4")}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {comment.profile?.full_name || "Пользователь"}
            </span>
            {roleInfo && (
              <Badge className={cn(roleInfo.bgColor, "text-white text-[10px] px-1.5 py-0 h-4 gap-0.5")}>
                <roleInfo.icon className="w-2.5 h-2.5" />
                {roleInfo.label}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
            </span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-muted-foreground">(изменён)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Сохранить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.text);
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.text}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              <ReactionButtons 
                contentType="comment" 
                contentId={comment.id} 
                contentOwnerId={comment.user_id}
                contentTitle={comment.text.substring(0, 50)}
                size="sm" 
              />

              {depth < maxDepth && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <Reply className="h-3.5 w-3.5 mr-1" />
                  Ответить
                </Button>
              )}

              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-3">
              <CommentForm
                contentType={contentType}
                contentId={contentId}
                contentSlug={contentSlug}
                parentId={comment.id}
                parentUserId={comment.user_id}
                placeholder="Напишите ответ..."
                autoFocus
                onSuccess={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              contentType={contentType}
              contentId={contentId}
              contentSlug={contentSlug}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
