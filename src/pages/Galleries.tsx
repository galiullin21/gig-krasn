import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Image, Eye, Images } from "lucide-react";

const ITEMS_PER_PAGE = 12;

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

  const handleTypeChange = (type: string) => {
    setSearchParams({ type, page: "1" });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ type: selectedType, page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getImageCount = (images: unknown) => {
    if (Array.isArray(images)) return images.length;
    return 0;
  };

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-condensed font-bold text-foreground">
            Фотогалерея
          </h1>
          <p className="text-muted-foreground mt-2">
            Фоторепортажи и галереи событий города
          </p>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeChange("all")}
            className="rounded-full"
          >
            Все галереи
          </Button>
          <Button
            variant={selectedType === "gallery" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeChange("gallery")}
            className="rounded-full"
          >
            Фотогалереи
          </Button>
          <Button
            variant={selectedType === "reportage" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeChange("reportage")}
            className="rounded-full"
          >
            Фоторепортажи
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-lg" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : galleriesData?.galleries && galleriesData.galleries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleriesData.galleries.map((gallery) => (
              <Link
                key={gallery.id}
                to={`/galleries/${gallery.slug}`}
                className="group"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted mb-3 relative">
                  {gallery.cover_image ? (
                    <img
                      src={gallery.cover_image}
                      alt={gallery.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Image className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {getImageCount(gallery.images)}
                  </div>
                </div>
                <h3 className="font-condensed font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {gallery.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span>
                    {gallery.published_at
                      ? format(new Date(gallery.published_at), "d MMMM yyyy", { locale: ru })
                      : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {gallery.views_count || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Галерей пока нет</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(page)}
                className="w-10 h-10"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
