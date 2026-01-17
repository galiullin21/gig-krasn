import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OnlineAdmin {
  id: string;
  name: string;
  avatar: string | null;
}

export function AdminOnlineIndicator({ className }: { className?: string }) {
  const { user, isEditor } = useAuth();
  const [onlineAdmins, setOnlineAdmins] = useState<OnlineAdmin[]>([]);

  // Fetch admin profiles
  const { data: adminProfiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "editor", "developer"]);

      if (!roles?.length) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      return profiles?.map((p) => ({
        id: p.user_id,
        name: p.full_name || "Админ",
        avatar: p.avatar_url,
      })) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!user || !isEditor) return;

    const channel = supabase.channel("admin-presence", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const onlineIds = Object.keys(state);
        
        if (adminProfiles) {
          const online = adminProfiles.filter((p) => onlineIds.includes(p.id));
          setOnlineAdmins(online);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const profile = adminProfiles?.find((p) => p.id === user.id);
          await channel.track({
            user_id: user.id,
            name: profile?.name || "Админ",
            avatar: profile?.avatar || null,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isEditor, adminProfiles]);

  if (onlineAdmins.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground">Онлайн:</span>
      <div className="flex -space-x-2">
        {onlineAdmins.slice(0, 5).map((admin) => (
          <Tooltip key={admin.id}>
            <TooltipTrigger>
              <div className="relative">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={admin.avatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {admin.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{admin.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {onlineAdmins.length > 5 && (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border-2 border-background">
            <span className="text-[10px] text-muted-foreground">
              +{onlineAdmins.length - 5}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
