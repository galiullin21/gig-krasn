import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export function SmallNewsGrid() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["home-small-news-grid"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, cover_image, slug, published_at, category_id, categories(name)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(0, 3);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </section>
    );
  }

  if (!news?.length) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {news.map((item) => (
          <article key={item.id} className="group">
            <Link to={`/news/${item.slug}`} className="block">
              <div className="aspect-square overflow-hidden bg-muted mb-2">
                {item.cover_image ? (
                  <OptimizedImage
                    src={item.cover_image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray">
                    Фото
                  </div>
                )}
              </div>
            </Link>
            <Link to={`/news/${item.slug}`}>
              <h4 className="text-sm font-medium leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                {item.title}
              </h4>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-primary uppercase">
                {(item.categories as any)?.name || "Новости"}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.published_at
                  ? format(new Date(item.published_at), "d.MM.yyyy", { locale: ru })
                  : ""}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
