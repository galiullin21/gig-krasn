import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { NewsCard } from "./NewsCard";
import { Button } from "@/components/ui/button";
import { AdBanner } from "./AdBanner";
import { Skeleton } from "@/components/ui/skeleton";

export function NewsSection() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["home-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, lead, cover_image, slug, published_at, category_id, categories(name)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </section>
    );
  }

  if (!news?.length) {
    return null;
  }

  const featuredNews = news.slice(0, 2);
  const regularNews = news.slice(2, 4);
  const smallNews = news.slice(4);

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-condensed font-bold uppercase">Новости</h2>
        <Link
          to="/news"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Все новости
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured news - Left column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredNews.map((item) => (
            <NewsCard
              key={item.id}
              id={item.id}
              title={item.title}
              lead={item.lead || undefined}
              coverImage={item.cover_image || undefined}
              category={(item.categories as any)?.name || "Новости"}
              date={item.published_at 
                ? format(new Date(item.published_at), "d MMMM yyyy", { locale: ru })
                : ""
              }
              slug={item.slug}
            />
          ))}
          {regularNews.map((item) => (
            <NewsCard
              key={item.id}
              id={item.id}
              title={item.title}
              coverImage={item.cover_image || undefined}
              category={(item.categories as any)?.name || "Новости"}
              date={item.published_at 
                ? format(new Date(item.published_at), "d MMMM yyyy", { locale: ru })
                : ""
              }
              slug={item.slug}
              variant="horizontal"
            />
          ))}
        </div>

        {/* Sidebar - Right column */}
        <div className="space-y-6">
          {smallNews.length > 0 && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-condensed font-bold text-lg mb-4 uppercase">
                Ещё новости
              </h3>
              <div className="space-y-4">
                {smallNews.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <span className="text-2xl font-bold text-muted-foreground/30">
                      {index + 1}
                    </span>
                    <NewsCard
                      id={item.id}
                      title={item.title}
                      category={(item.categories as any)?.name || "Новости"}
                      date={item.published_at 
                        ? format(new Date(item.published_at), "d MMMM yyyy", { locale: ru })
                        : ""
                      }
                      slug={item.slug}
                      variant="small"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Ad */}
          <AdBanner position="sidebar" />
        </div>
      </div>

      <div className="text-center mt-8">
        <Button variant="default" size="lg" asChild>
          <Link to="/news">Больше новостей</Link>
        </Button>
      </div>
    </section>
  );
}
