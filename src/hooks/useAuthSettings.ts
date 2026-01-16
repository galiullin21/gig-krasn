import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuthSettings {
  auth_email_enabled: boolean;
  auth_phone_enabled: boolean;
  auth_google_enabled: boolean;
  auth_email_confirm_required: boolean;
  auth_phone_confirm_required: boolean;
}

const defaultAuthSettings: AuthSettings = {
  auth_email_enabled: true,
  auth_phone_enabled: true,
  auth_google_enabled: true,
  auth_email_confirm_required: true,
  auth_phone_confirm_required: true,
};

export function useAuthSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["auth-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", [
          "auth_email_enabled",
          "auth_phone_enabled",
          "auth_google_enabled",
          "auth_email_confirm_required",
          "auth_phone_confirm_required",
        ]);

      if (error) throw error;

      const settingsMap: Partial<AuthSettings> = {};
      data.forEach((item) => {
        const value = item.value;
        // Handle boolean conversion
        if (value === "true" || value === true) {
          settingsMap[item.key as keyof AuthSettings] = true;
        } else if (value === "false" || value === false) {
          settingsMap[item.key as keyof AuthSettings] = false;
        } else if (typeof value === "boolean") {
          settingsMap[item.key as keyof AuthSettings] = value;
        } else {
          // Default to true for auth settings if value is unexpected
          settingsMap[item.key as keyof AuthSettings] = true;
        }
      });

      return { ...defaultAuthSettings, ...settingsMap };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    settings: settings || defaultAuthSettings,
    isLoading,
  };
}
