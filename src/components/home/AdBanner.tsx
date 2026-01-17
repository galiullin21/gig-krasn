import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdBannerProps {
  position?: "header" | "content" | "sidebar";
  className?: string;
}

export function AdBanner({ position = "content", className = "" }: AdBannerProps) {
  const { data: ads } = useQuery({
    queryKey: ["ads", position],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("priority", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Pick a random ad weighted by priority
  const ad = ads && ads.length > 0
    ? ads[Math.floor(Math.random() * Math.min(ads.length, 3))]
    : null;

  // Track impression
  useEffect(() => {
    if (ad?.id) {
      supabase.functions.invoke("track-ad-click", {
        body: { ad_id: ad.id, type: "impression" },
      }).catch(console.error);
    }
  }, [ad?.id]);

  const trackClick = () => {
    if (ad?.id) {
      supabase.functions.invoke("track-ad-click", {
        body: { ad_id: ad.id, type: "click" },
      }).catch(console.error);
    }
  };

  const maxHeightClasses = {
    header: "max-h-32 md:max-h-40",
    content: "max-h-40 md:max-h-52",
    sidebar: "max-h-64 md:max-h-96",
  };

  if (!ad) {
    return null;
  }

  const content = (
    <div className={`bg-muted rounded-lg overflow-hidden ${className}`}>
      <div className="text-center py-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Реклама
        </span>
      </div>
      <div className={`${maxHeightClasses[position]} overflow-hidden`}>
        <img
          src={ad.image_url}
          alt={ad.title}
          className="w-full h-auto object-contain"
          loading="lazy"
        />
      </div>
    </div>
  );

  return ad.link_url ? (
    <a href={ad.link_url} target="_blank" rel="noopener noreferrer" onClick={trackClick}>
      {content}
    </a>
  ) : (
    content
  );
}
