import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Image, Video, Play } from "lucide-react";
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

      if (selectedType === "photo") {
        query = query.in("type", ["photo", "photogallery", "gallery"]);
      } else if (selectedType === "video") {
        query = query.in("type", ["video", "reportage"]);
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

  const handleLoadMore = () => {
    handlePageChange(currentPage + 1);
  };

  const getImageCount = (images: unknown) => {
    if (Array.isArray(images)) return images.length;
    return 0;
  };

  const getVideoCount = (videos: unknown) => {
    if (Array.isArray(videos)) return videos.length;
    return 0;
  };

  const isVideoType = (type: string | null) => {
    return type === "video" || type === "reportage";
  };

  const getPageTitle = () => {
    switch (selectedType) {
      case "photo": return "Фотогалереи";
      case "video": return "Видео";
      default: return "Галереи и видео";
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="border-b-4 border-primary pb-2 inline-block">
            <h1 className="text-2xl md:text-3xl font-condensed font-bold text-foreground">
              {getPageTitle()}
            </h1>
          </div>
          
          <Tabs value={selectedType} onValueChange={handleTypeChange}>
            <TabsList>
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="photo">
                <Image className="w-4 h-4 mr-1.5" />
                Фото
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="w-4 h-4 mr-1.5" />
                Видео
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
              const isVideo = isVideoType(gallery.type);
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
                        {isVideo ? (
                          <Video className="w-12 h-12 text-primary/40" />
                        ) : (
                          <Image className="w-12 h-12 text-primary/40" />
                        )}
                      </div>
                    )}
                    
                    {/* Video play icon overlay */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    )}
                    
                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={isVideo ? "default" : "secondary"} className="text-xs">
                        {isVideo ? (
                          <><Video className="w-3 h-3 mr-1" />{getVideoCount(gallery.videos)}</>
                        ) : (
                          <><Image className="w-3 h-3 mr-1" />{getImageCount(gallery.images)}</>
                        )}
                      </Badge>
                    </div>
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
            {selectedType === "video" ? (
              <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            ) : (
              <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            )}
            <p className="text-muted-foreground text-lg">
              {selectedType === "video" ? "Видео пока нет" : selectedType === "photo" ? "Галерей пока нет" : "Контента пока нет"}
            </p>
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
              Загрузить ещё
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
