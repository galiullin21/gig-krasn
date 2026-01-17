import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReactionButtonsProps {
  contentType: "news" | "blog" | "comment";
  contentId: string;
  size?: "sm" | "default";
}

interface ReactionCounts {
  likes: number;
  dislikes: number;
  userReaction: "like" | "dislike" | null;
}

export function ReactionButtons({
  contentType,
  contentId,
  size = "default",
}: ReactionButtonsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState<"like" | "dislike" | null>(null);

  const { data: reactions, isLoading } = useQuery({
    queryKey: ["reactions", contentType, contentId],
    queryFn: async (): Promise<ReactionCounts> => {
      // Get all reactions for this content
      const { data: allReactions, error } = await supabase
        .from("reactions")
        .select("reaction_type, user_id")
        .eq("content_type", contentType)
        .eq("content_id", contentId);

      if (error) throw error;

      const likes = allReactions?.filter((r) => r.reaction_type === "like").length || 0;
      const dislikes = allReactions?.filter((r) => r.reaction_type === "dislike").length || 0;
      const userReaction = user
        ? (allReactions?.find((r) => r.user_id === user.id)?.reaction_type as "like" | "dislike" | null) || null
        : null;

      return { likes, dislikes, userReaction };
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async (reactionType: "like" | "dislike") => {
      if (!user) throw new Error("Необходима авторизация");

      const currentReaction = reactions?.userReaction;

      if (currentReaction === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("content_type", contentType)
          .eq("content_id", contentId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else if (currentReaction) {
        // Update reaction
        const { error } = await supabase
          .from("reactions")
          .update({ reaction_type: reactionType })
          .eq("content_type", contentType)
          .eq("content_id", contentId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Create new reaction
        const { error } = await supabase.from("reactions").insert({
          content_type: contentType,
          content_id: contentId,
          user_id: user.id,
          reaction_type: reactionType,
        });
        if (error) throw error;
      }
    },
    onMutate: (reactionType) => {
      setIsAnimating(reactionType);
      setTimeout(() => setIsAnimating(null), 300);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactions", contentType, contentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReaction = (type: "like" | "dislike") => {
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Войдите, чтобы оставлять реакции",
        variant: "destructive",
      });
      return;
    }
    reactionMutation.mutate(type);
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-7 px-2 text-xs" : "h-9 px-3";

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          buttonSize,
          "gap-1.5",
          reactions?.userReaction === "like" && "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900",
          isAnimating === "like" && "scale-110"
        )}
        onClick={() => handleReaction("like")}
        disabled={reactionMutation.isPending || isLoading}
      >
        <ThumbsUp className={cn(iconSize, "transition-transform")} />
        <span>{reactions?.likes || 0}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          buttonSize,
          "gap-1.5",
          reactions?.userReaction === "dislike" && "text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900",
          isAnimating === "dislike" && "scale-110"
        )}
        onClick={() => handleReaction("dislike")}
        disabled={reactionMutation.isPending || isLoading}
      >
        <ThumbsDown className={cn(iconSize, "transition-transform")} />
        <span>{reactions?.dislikes || 0}</span>
      </Button>
    </div>
  );
}
