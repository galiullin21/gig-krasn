import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Image, Images } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const ITEMS_PER_PAGE = 16;

export default function Galleries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedType = searchParams.get("type") || "all";

  const { data: galleriesData, isLoading } = useQuery({
    queryKey: ["galleries", selectedType, currentPage],
    queryFn: async () => {
      let query = supabase
        .from("galleries")
        .select("*", { count: "exact" })
        .not("published_at", "is", null)
        .order("published_at", { ascending: false });

      if (selectedType !== "all") {
        query = query.eq("type", selectedType);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      return { galleries: data, total: count || 0 };
    },
  });

  const totalPages = Math.ceil((galleriesData?.total || 0) / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setSearchParams({ type: selectedType, page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoadMore = () => {
    handlePageChange(currentPage + 1);
  };

  const getImageCount = (images: unknown) => {
    if (Array.isArray(images)) return images.length;
    return 0;
  };

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container">
          <div className="h-20 flex items-center justify-center text-xl opacity-70">
            Рекламный баннер
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 border-b-4 border-primary pb-2 inline-block">
          <h1 className="text-2xl md:text-3xl font-condensed font-bold text-foreground">
            Фотогалереи
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : galleriesData?.galleries && galleriesData.galleries.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {galleriesData.galleries.map((gallery, index) => {
              // Every 4th item in each row is an ad placeholder
              const isAd = (index + 1) % 4 === 0;
              
              if (isAd && index < 4) {
                return (
                  <div key={`ad-${index}`} className="flex flex-col">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                      Реклама
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p className="line-clamp-2">Здесь может быть размещено ваше рекламное объявление</p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>РЕКЛАМА</span>
                      <span>{format(new Date(), "d.MM.yyyy", { locale: ru })}</span>
                    </div>
                  </div>
                );
              }
              
              return (
                <Link
                  key={gallery.id}
                  to={`/galleries/${gallery.slug}`}
                  className="group flex flex-col"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted relative">
                    {gallery.cover_image ? (
                      <OptimizedImage
                        src={gallery.cover_image}
                        alt={gallery.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Image className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors mt-2">
                    {gallery.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>
                      {gallery.published_at
                        ? format(new Date(gallery.published_at), "d.MM.yyyy", { locale: ru })
                        : ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Галерей пока нет</p>
          </div>
        )}

        {/* Load More Button */}
        {currentPage < totalPages && galleriesData && galleriesData.galleries.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              variant="default"
              size="lg"
              onClick={handleLoadMore}
              className="px-12 rounded-full"
            >
              Больше галерей
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
