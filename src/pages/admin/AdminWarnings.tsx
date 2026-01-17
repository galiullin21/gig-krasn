import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { WarningChat } from "@/components/cabinet/WarningChat";
import {
  AlertTriangle,
  MessageCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
} from "lucide-react";

interface Warning {
  id: string;
  user_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  is_read: boolean;
  issued_by: string;
  user_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  issuer_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  messages_count?: number;
}

export default function AdminWarnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedChat, setExpandedChat] = useState<string | null>(null);

  const { data: warnings, isLoading } = useQuery({
    queryKey: ["admin-all-warnings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_warnings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs and issuer IDs
      const userIds = [...new Set([
        ...(data?.map((w) => w.user_id) || []),
        ...(data?.map((w) => w.issued_by) || []),
      ])];

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

      // Get message counts
      const { data: messages } = await supabase
        .from("warning_messages")
        .select("warning_id");

      const messageCounts: Record<string, number> = {};
      messages?.forEach((m) => {
        messageCounts[m.warning_id] = (messageCounts[m.warning_id] || 0) + 1;
      });

      return data?.map((w) => ({
        ...w,
        user_profile: profiles[w.user_id] || null,
        issuer_profile: profiles[w.issued_by] || null,
        messages_count: messageCounts[w.id] || 0,
      })) as Warning[];
    },
  });

  const removeWarningMutation = useMutation({
    mutationFn: async (warning: Warning) => {
      const { error } = await supabase
        .from("user_warnings")
        .delete()
        .eq("id", warning.id);

      if (error) throw error;

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: warning.user_id,
        type: "warning_removed",
        title: "Предупреждение снято",
        message: "Одно из ваших предупреждений было снято администрацией",
        link: "/cabinet?tab=warnings",
      });

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        action_type: "warning_removed",
        target_type: "user_warning",
        target_id: warning.id,
        details: {
          user_name: warning.user_profile?.full_name,
          reason: warning.reason,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-warnings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-actions"] });
      toast({ title: "Предупреждение снято" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const unreadChats = warnings?.filter((w) => w.messages_count > 0).length || 0;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-condensed font-bold">Предупреждения</h1>
          <p className="text-muted-foreground">
            Управление предупреждениями пользователей
          </p>
        </div>
        {unreadChats > 0 && (
          <Badge variant="secondary">
            <MessageCircle className="h-3 w-3 mr-1" />
            {unreadChats} с сообщениями
          </Badge>
        )}
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
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : warnings && warnings.length > 0 ? (
        <div className="space-y-4">
          {warnings.map((warning) => (
            <Card
              key={warning.id}
              className={warning.messages_count > 0 ? "border-orange-300" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* User avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={warning.user_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium">
                        {warning.user_profile?.full_name || "Пользователь"}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Предупреждение
                      </Badge>
                      {warning.messages_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {warning.messages_count} сообщ.
                        </Badge>
                      )}
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-destructive font-medium">
                      {warning.reason}
                    </p>
                    {warning.details && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {warning.details}
                      </p>
                    )}

                    {/* Issuer info */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>Выдал: {warning.issuer_profile?.full_name || "Администратор"}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(warning.created_at), "d MMM yyyy, HH:mm", {
                          locale: ru,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedChat(expandedChat === warning.id ? null : warning.id)
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
                      onClick={() => removeWarningMutation.mutate(warning)}
                      disabled={removeWarningMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Снять
                    </Button>
                  </div>
                </div>

                {/* Chat section */}
                {expandedChat === warning.id && (
                  <div className="mt-4 pt-4 border-t">
                    <WarningChat
                      warningId={warning.id}
                      isAdmin
                      onClose={() => setExpandedChat(null)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет активных предупреждений</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
