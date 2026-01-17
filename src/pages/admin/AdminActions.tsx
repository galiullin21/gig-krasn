import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  AlertTriangle,
  FileEdit,
  Trash2,
  Settings,
  Activity,
} from "lucide-react";

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  admin_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function AdminActions() {
  const { data: actions, isLoading } = useQuery({
    queryKey: ["admin-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch admin profiles
      const adminIds = [...new Set(data?.map((a) => a.admin_id) || [])];
      const profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

      if (adminIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", adminIds);

        profilesData?.forEach((p) => {
          profiles[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
      }

      return data?.map((a) => ({
        ...a,
        admin_profile: profiles[a.admin_id] || null,
      })) as AdminAction[];
    },
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case "warning_issued":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "warning_removed":
        return <AlertTriangle className="h-4 w-4 text-green-500" />;
      case "user_created":
      case "role_updated":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "content_created":
      case "content_updated":
        return <FileEdit className="h-4 w-4 text-primary" />;
      case "content_deleted":
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case "settings_updated":
        return <Settings className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: AdminAction) => {
    const details = action.details || {};
    switch (action.action_type) {
      case "warning_issued":
        return `выдал предупреждение пользователю ${details.user_name || ""}`;
      case "warning_removed":
        return `снял предупреждение с пользователя ${details.user_name || ""}`;
      case "role_updated":
        return `изменил роль пользователя ${details.user_name || ""} на ${details.new_role || ""}`;
      case "content_created":
        return `создал ${details.content_type || "контент"}: ${details.title || ""}`;
      case "content_updated":
        return `обновил ${details.content_type || "контент"}: ${details.title || ""}`;
      case "content_deleted":
        return `удалил ${details.content_type || "контент"}: ${details.title || ""}`;
      case "settings_updated":
        return `изменил настройки: ${details.setting || ""}`;
      default:
        return action.action_type;
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-condensed font-bold">Журнал действий</h1>
        <p className="text-muted-foreground">История действий администраторов</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
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
      ) : actions && actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map((action) => (
            <Card key={action.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={action.admin_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {action.admin_profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {action.admin_profile?.full_name || "Администратор"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {getActionLabel(action)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getActionIcon(action.action_type)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(action.created_at), "d MMM yyyy, HH:mm", {
                          locale: ru,
                        })}
                      </span>
                      {action.target_type && (
                        <Badge variant="outline" className="text-xs">
                          {action.target_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет записей в журнале</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
