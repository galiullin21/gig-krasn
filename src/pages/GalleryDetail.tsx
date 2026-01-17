import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export default function GalleryDetail() {
  const { slug } = useParams();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: gallery, isLoading } = useQuery({
    queryKey: ["gallery", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Increment view count
        await supabase
          .from("galleries")
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq("id", data.id);
      }
      
      return data;
    },
    enabled: !!slug,
  });

  const images = Array.isArray(gallery?.images) ? gallery.images as string[] : [];

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  if (isLoading) {
    return (
      <Layout>
        <div className="bg-primary text-primary-foreground py-8">
          <div className="container">
            <div className="h-20 flex items-center justify-center text-xl opacity-70">
              Рекламный баннер
            </div>
          </div>
        </div>
        <div className="container py-6">
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-8 w-96 mb-6" />
          <Skeleton className="aspect-video rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (!gallery) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Галерея не найдена</h1>
          <p className="text-muted-foreground mb-6">
            Возможно, она была удалена или ещё не опубликована.
          </p>
          <Button asChild>
            <Link to="/galleries">Все галереи</Link>
          </Button>
        </div>
      </Layout>
    );
  }

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
        {/* Breadcrumbs */}
        <div className="mb-6 border-b-4 border-primary pb-2 inline-block">
          <nav className="text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Главная</Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <Link to="/galleries" className="text-muted-foreground hover:text-foreground">Фотогалереи</Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="text-foreground">{gallery.title}</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content */}
          <div className="lg:col-span-8">
            <h1 className="text-2xl md:text-3xl font-condensed font-bold text-foreground mb-6">
              {gallery.title}
            </h1>

            {images.length > 0 ? (
              <div className="space-y-4">
                {/* Main slider */}
                <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                  <img
                    src={images[currentSlide]}
                    alt={`Фото ${currentSlide + 1}`}
                    className="w-full h-full object-contain"
                  />
                  
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 h-10 w-10"
                        onClick={goToPrev}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 h-10 w-10"
                        onClick={goToNext}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Dots navigation */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentSlide
                          ? "bg-foreground"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      aria-label={`Перейти к фото ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">В галерее пока нет фотографий</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Ad Banner */}
            <div className="bg-muted rounded-lg overflow-hidden">
              <div className="aspect-[4/3] flex items-center justify-center text-muted-foreground">
                Реклама
              </div>
              <div className="p-3 text-sm text-muted-foreground">
                <p>Здесь может быть размещено ваше рекламное объявление</p>
              </div>
              <div className="px-3 pb-3 flex justify-between text-xs text-muted-foreground">
                <span>РЕКЛАМА</span>
                <span>{format(new Date(), "d.MM.yyyy", { locale: ru })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
