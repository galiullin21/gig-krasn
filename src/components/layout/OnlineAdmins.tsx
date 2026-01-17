import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnlineAdmin {
  id: string;
  name: string;
  avatar: string | null;
}

export function OnlineAdmins({ className }: { className?: string }) {
  const [onlineAdmins, setOnlineAdmins] = useState<OnlineAdmin[]>([]);

  // Fetch admin profiles
  const { data: adminProfiles } = useQuery({
    queryKey: ["public-admin-profiles"],
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
    if (!adminProfiles?.length) return;

    const channel = supabase.channel("admin-presence");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const onlineIds = Object.keys(state);
        
        const online = adminProfiles.filter((p) => onlineIds.includes(p.id));
        setOnlineAdmins(online);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfiles]);

  if (onlineAdmins.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        <span className="hidden sm:inline">Админы онлайн:</span>
      </div>
      <div className="flex -space-x-1.5">
        {onlineAdmins.slice(0, 3).map((admin) => (
          <Tooltip key={admin.id}>
            <TooltipTrigger>
              <div className="relative">
                <Avatar className="h-5 w-5 border border-background">
                  <AvatarImage src={admin.avatar || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {admin.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-background" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{admin.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {onlineAdmins.length > 3 && (
          <Tooltip>
            <TooltipTrigger>
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center border border-background">
                <span className="text-[8px] text-muted-foreground">
                  +{onlineAdmins.length - 3}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{onlineAdmins.slice(3).map(a => a.name).join(", ")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
