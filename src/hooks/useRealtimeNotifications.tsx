import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function useRealtimeNotifications() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Subscribe to user notifications
    const userChannel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate notifications query
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          
          // Show toast for new notification
          const notification = payload.new as { title: string; message?: string };
          toast({
            title: notification.title,
            description: notification.message || undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [user?.id, queryClient, toast]);

  // Admin notifications
  useEffect(() => {
    if (!isAdmin) return;

    const adminChannel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
        },
        (payload) => {
          // Invalidate admin notifications query
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
          queryClient.invalidateQueries({ queryKey: ["admin-notifications-count"] });
          
          // Show toast for new admin notification
          const notification = payload.new as { title: string; message?: string };
          toast({
            title: notification.title,
            description: notification.message || undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adminChannel);
    };
  }, [isAdmin, queryClient, toast]);
}
