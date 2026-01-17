import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CommentProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  text: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: CommentProfile | null;
  replies?: Comment[];
}

interface CommentsSectionProps {
  contentType: "news" | "blog";
  contentId: string;
}

export function CommentsSection({ contentType, contentId }: CommentsSectionProps) {
  const { user } = useAuth();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", contentType, contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data?.map((c) => c.user_id) || [])];
      const profiles: Record<string, CommentProfile> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        profilesData?.forEach((p) => {
          profiles[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
      }

      // Build tree structure
      const commentsWithProfiles = data?.map((c) => ({
        ...c,
        profile: profiles[c.user_id] || null,
        replies: [] as Comment[],
      })) || [];

      const rootComments: Comment[] = [];
      const commentMap = new Map<string, Comment>();

      commentsWithProfiles.forEach((c) => commentMap.set(c.id, c));

      commentsWithProfiles.forEach((c) => {
        if (c.parent_id && commentMap.has(c.parent_id)) {
          commentMap.get(c.parent_id)!.replies!.push(c);
        } else {
          rootComments.push(c);
        }
      });

      return rootComments;
    },
  });

  const totalCount = comments?.reduce((acc, c) => {
    const countReplies = (comment: Comment): number => {
      return 1 + (comment.replies?.reduce((a, r) => a + countReplies(r), 0) || 0);
    };
    return acc + countReplies(c);
  }, 0) || 0;

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-condensed font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        Комментарии ({totalCount})
      </h2>

      {/* Comment form for authenticated users */}
      {user ? (
        <div className="mb-8">
          <CommentForm contentType={contentType} contentId={contentId} />
        </div>
      ) : (
        <div className="mb-8 p-4 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground mb-3">
            Войдите, чтобы оставлять комментарии
          </p>
          <Button asChild variant="outline">
            <Link to="/auth">Войти</Link>
          </Button>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              contentType={contentType}
              contentId={contentId}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Пока нет комментариев. Будьте первым!
        </p>
      )}
    </div>
  );
}
