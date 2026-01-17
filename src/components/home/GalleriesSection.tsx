import { Link } from "react-router-dom";
import { ChevronRight, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export function GalleriesSection() {
  const { data: galleries, isLoading } = useQuery({
    queryKey: ["home-galleries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, title, cover_image, slug, type, images")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!galleries?.length) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-condensed font-bold uppercase">
          Фотогалереи
        </h2>
        <Link
          to="/galleries"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Все галереи
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {galleries.map((gallery) => {
          const images = gallery.images as any[] | null;
          const photosCount = images?.length || 0;

          return (
            <article key={gallery.id} className="group relative">
              <Link to={`/galleries/${gallery.slug}`} className="block">
                <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                  {gallery.cover_image ? (
                    <OptimizedImage
                      src={gallery.cover_image}
                      alt={gallery.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Camera className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 text-white/80 text-xs mb-2">
                      <Camera className="w-4 h-4" />
                      <span>{photosCount} фото</span>
                      <span className="uppercase">
                        {gallery.type === "photoreport"
                          ? "Фоторепортаж"
                          : "Галерея"}
                      </span>
                    </div>
                    <h3 className="text-white font-condensed font-bold text-lg leading-tight line-clamp-2 text-shadow">
                      {gallery.title}
                    </h3>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
