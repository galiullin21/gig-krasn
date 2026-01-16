import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdBannerProps {
  position?: "header" | "content" | "sidebar";
  className?: string;
}

export function AdBanner({ position = "content", className = "" }: AdBannerProps) {
  const { data: ad } = useQuery({
    queryKey: ["ad", position],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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
        />
      </div>
    </div>
  );

  return ad.link_url ? (
    <a href={ad.link_url} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    content
  );
}
