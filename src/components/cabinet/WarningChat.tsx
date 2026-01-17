import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningChatProps {
  warningId: string;
  isAdmin?: boolean;
  onClose?: () => void;
}

interface Message {
  id: string;
  message: string;
  is_from_admin: boolean;
  created_at: string;
  sender_id: string;
}

export function WarningChat({ warningId, isAdmin = false, onClose }: WarningChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["warning-messages", warningId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warning_messages")
        .select("*")
        .eq("warning_id", warningId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!user || !message.trim()) return;

      const { error } = await supabase.from("warning_messages").insert({
        warning_id: warningId,
        sender_id: user.id,
        message: message.trim(),
        is_from_admin: isAdmin,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["warning-messages", warningId] });
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
    if (message.trim()) {
      sendMutation.mutate();
    }
  };

  return (
    <div className="border rounded-lg bg-background">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium text-sm">Обсуждение предупреждения</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="h-64 p-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground text-sm">Загрузка...</p>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%] rounded-lg p-2.5",
                  msg.is_from_admin
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                <span
                  className={cn(
                    "text-xs mt-1",
                    msg.is_from_admin ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {format(new Date(msg.created_at), "d MMM, HH:mm", { locale: ru })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">
            Нет сообщений. Напишите, чтобы оспорить или задать вопрос.
          </p>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Напишите сообщение..."
          rows={2}
          className="resize-none flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || sendMutation.isPending}
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
