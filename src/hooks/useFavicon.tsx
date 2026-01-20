import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFavicon() {
  const { data: faviconUrl } = useQuery({
    queryKey: ["favicon-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "favicon_url")
        .maybeSingle();

      if (error) throw error;
      return data?.value as string | null;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  useEffect(() => {
    if (faviconUrl) {
      // Update existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach((link) => {
        (link as HTMLLinkElement).href = faviconUrl;
      });

      // If no favicon link exists, create one
      if (existingLinks.length === 0) {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
    }
  }, [faviconUrl]);

  return faviconUrl;
}
