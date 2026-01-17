import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdBannerDisplayProps {
  position: string;
  className?: string;
}

export function AdBannerDisplay({ position, className = "" }: AdBannerDisplayProps) {
  const { data: ad } = useQuery({
    queryKey: ["ad-banner", position],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("priority", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Track impression when ad is displayed
  useEffect(() => {
    if (ad?.id) {
      supabase.functions.invoke("track-ad-click", {
        body: { ad_id: ad.id, type: "impression" },
      }).catch(console.error);
    }
  }, [ad?.id]);

  const handleClick = async () => {
    if (ad?.id) {
      try {
        await supabase.functions.invoke("track-ad-click", {
          body: { ad_id: ad.id, type: "click" },
        });
      } catch (error) {
        console.error("Error tracking click:", error);
      }
    }
  };

  if (!ad) {
    return (
      <div className={`border rounded-lg p-4 bg-muted/30 ${className}`}>
        <div className="text-center text-muted-foreground text-sm mb-2">Реклама</div>
        <div className="bg-muted rounded-lg flex items-center justify-center min-h-[200px]">
          <p className="text-xs text-muted-foreground text-center px-4">
            Здесь может быть размещено ваше рекламное объявление
          </p>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>РЕКЛАМА</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden bg-muted/30 ${className}`}>
      <div className="text-center text-muted-foreground text-xs py-1 bg-muted/50">
        Реклама
      </div>
      {ad.link_url ? (
        <a
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block"
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
          />
        </a>
      ) : (
        <img
          src={ad.image_url}
          alt={ad.title}
          className="w-full h-auto object-cover"
        />
      )}
    </div>
  );
}
