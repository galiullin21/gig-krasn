import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface CommentFormProps {
  contentType: "news" | "blog";
  contentId: string;
  parentId?: string;
  onSuccess?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  contentType,
  contentId,
  parentId,
  onSuccess,
  placeholder = "Напишите комментарий...",
  autoFocus = false,
}: CommentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Необходима авторизация");
      if (!text.trim()) throw new Error("Введите текст комментария");

      const { error } = await supabase.from("comments").insert({
        content_type: contentType,
        content_id: contentId,
        user_id: user.id,
        parent_id: parentId || null,
        text: text.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
      onSuccess?.();
      toast({ title: "Комментарий добавлен" });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Войдите, чтобы оставлять комментарии",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!text.trim() || createMutation.isPending}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          Отправить
        </Button>
      </div>
    </form>
  );
}
