import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useState, useEffect } from "react";

export function PhotoSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: galleries, isLoading } = useQuery({
    queryKey: ["home-photo-galleries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, title, cover_image, slug, type")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  // Auto-advance slider
  useEffect(() => {
    if (!galleries || galleries.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % galleries.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [galleries?.length]);

  const goToPrev = () => {
    if (galleries) {
      setCurrentSlide((prev) => (prev - 1 + galleries.length) % galleries.length);
    }
  };

  const goToNext = () => {
    if (galleries) {
      setCurrentSlide((prev) => (prev + 1) % galleries.length);
    }
  };

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

  if (!galleries?.length) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {galleries.map((gallery, index) => (
          <article key={gallery.id} className="group relative">
            <Link to={`/galleries/${gallery.slug}`} className="block">
              <div className="aspect-square overflow-hidden bg-muted relative">
                {gallery.cover_image ? (
                  <OptimizedImage
                    src={gallery.cover_image}
                    alt={gallery.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray">
                    Фото
                  </div>
                )}
                
                {/* Navigation Arrows */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPrev();
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    goToNext();
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Video Play Icon for specific items */}
                {index === 2 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                )}
              </div>
            </Link>
            
            {/* Title Below */}
            <div className="mt-2">
              <span className="text-xs text-primary uppercase block">
                {gallery.type === "photoreport" ? "Фоторепортаж" : "Фотогалерея"}
              </span>
              <Link to={`/galleries/${gallery.slug}`}>
                <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {gallery.title}
                </h4>
              </Link>
              <Link 
                to="/galleries" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Все галереи
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
