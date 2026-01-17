import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WarningChat } from "@/components/cabinet/WarningChat";
import { Trash2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Warning {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  is_read: boolean;
}

interface UserWarningsDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserWarningsDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: UserWarningsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedChat, setExpandedChat] = useState<string | null>(null);

  const { data: warnings, isLoading } = useQuery({
    queryKey: ["admin-user-warnings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_warnings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Warning[];
    },
    enabled: open,
  });

  const removeWarningMutation = useMutation({
    mutationFn: async (warningId: string) => {
      // Delete the warning
      const { error } = await supabase
        .from("user_warnings")
        .delete()
        .eq("id", warningId);

      if (error) throw error;

      // Create notification about removal
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "warning_removed",
        title: "Предупреждение снято",
        message: "Одно из ваших предупреждений было снято администрацией",
        link: "/cabinet?tab=warnings",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-warnings", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Предупреждение снято" });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Предупреждения: {userName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : warnings && warnings.length > 0 ? (
            <div className="space-y-4">
              {warnings.map((warning) => (
                <div
                  key={warning.id}
                  className="p-4 border border-destructive/20 rounded-lg bg-destructive/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-destructive">
                          {warning.reason}
                        </p>
                        {!warning.is_read && (
                          <Badge variant="secondary" className="text-xs">
                            Не прочитано
                          </Badge>
                        )}
                      </div>
                      {warning.details && (
                        <p className="text-sm text-muted-foreground">
                          {warning.details}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(warning.created_at), "d MMMM yyyy, HH:mm", {
                          locale: ru,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedChat(
                            expandedChat === warning.id ? null : warning.id
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Чат
                        {expandedChat === warning.id ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeWarningMutation.mutate(warning.id)}
                        disabled={removeWarningMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Снять
                      </Button>
                    </div>
                  </div>

                  {expandedChat === warning.id && (
                    <div className="mt-4">
                      <WarningChat
                        warningId={warning.id}
                        isAdmin
                        onClose={() => setExpandedChat(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              У пользователя нет предупреждений
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
