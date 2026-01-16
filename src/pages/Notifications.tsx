import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Trash2,
  Check,
  ExternalLink 
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  warning: { icon: <AlertTriangle className="w-5 h-5" />, color: "text-yellow-500" },
  error: { icon: <AlertTriangle className="w-5 h-5" />, color: "text-destructive" },
  success: { icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500" },
  info: { icon: <Info className="w-5 h-5" />, color: "text-blue-500" },
  system: { icon: <Bell className="w-5 h-5" />, color: "text-muted-foreground" },
};

export default function Notifications() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark notifications as read when viewed
  useEffect(() => {
    if (notifications) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        // Auto-mark as read after 3 seconds
        const timer = setTimeout(() => {
          markAllAsReadMutation.mutate();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <h1 className="text-2xl font-condensed font-bold">Уведомления</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} новых</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
              >
                <Check className="w-4 h-4 mr-2" />
                Прочитать все
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.system;
                
                return (
                  <Card 
                    key={notification.id}
                    className={`transition-colors ${!notification.is_read ? "border-primary/50 bg-primary/5" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={config.color}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium flex items-center gap-2">
                                {notification.title}
                                {!notification.is_read && (
                                  <Badge variant="secondary" className="text-xs">Новое</Badge>
                                )}
                              </h3>
                              {notification.message && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(notification.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {notification.link && (
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={notification.link}>
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                </Button>
                              )}
                              {!notification.is_read && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
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
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет уведомлений</h3>
                <p className="text-muted-foreground">
                  Здесь будут отображаться ваши уведомления
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
