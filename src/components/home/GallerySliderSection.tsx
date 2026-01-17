import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useState, useEffect } from "react";

export function GallerySliderSection() {
  const [photoSlide, setPhotoSlide] = useState(0);
  const [videoSlide, setVideoSlide] = useState(0);

  const { data: photoGalleries, isLoading: loadingPhotos } = useQuery({
    queryKey: ["home-photo-galleries-slider"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, title, cover_image, slug, type")
        .eq("type", "photogallery")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: videoGalleries, isLoading: loadingVideos } = useQuery({
    queryKey: ["home-video-galleries-slider"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, title, cover_image, slug, type")
        .eq("type", "video")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Auto-advance sliders
  useEffect(() => {
    if (!photoGalleries || photoGalleries.length <= 1) return;
    const timer = setInterval(() => {
      setPhotoSlide((prev) => (prev + 1) % photoGalleries.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photoGalleries?.length]);

  useEffect(() => {
    if (!videoGalleries || videoGalleries.length <= 1) return;
    const timer = setInterval(() => {
      setVideoSlide((prev) => (prev + 1) % videoGalleries.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [videoGalleries?.length]);

  if (loadingPhotos || loadingVideos) {
    return (
      <section className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="aspect-[16/10]" />
          <Skeleton className="aspect-[16/10]" />
        </div>
      </section>
    );
  }

  const currentPhoto = photoGalleries?.[photoSlide];
  const currentVideo = videoGalleries?.[videoSlide];

  return (
    <section className="py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo Galleries Slider */}
        <div className="group relative">
          <Link to={currentPhoto ? `/galleries/${currentPhoto.slug}` : "/galleries"} className="block">
            <div className="aspect-[16/10] overflow-hidden bg-muted relative">
              {currentPhoto?.cover_image ? (
                <OptimizedImage
                  src={currentPhoto.cover_image}
                  alt={currentPhoto.title}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray text-xl">
                  Фото
                </div>
              )}
              
              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  if (photoGalleries) {
                    setPhotoSlide((prev) => (prev - 1 + photoGalleries.length) % photoGalleries.length);
                  }
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  if (photoGalleries) {
                    setPhotoSlide((prev) => (prev + 1) % photoGalleries.length);
                  }
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Link>
          
          {/* Info Below */}
          <div className="mt-3">
            <span className="text-xs text-muted-foreground uppercase block">Фотогалерея</span>
            <Link to={currentPhoto ? `/galleries/${currentPhoto.slug}` : "/galleries"}>
              <h4 className="font-condensed font-bold text-lg leading-snug line-clamp-2 hover:text-primary transition-colors">
                {currentPhoto?.title || "Фотогалерея"}
              </h4>
            </Link>
            <Link 
              to="/galleries?type=photo" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Все галереи
            </Link>
          </div>
        </div>

        {/* Video Galleries Slider */}
        <div className="group relative">
          <Link to={currentVideo ? `/galleries/${currentVideo.slug}` : "/galleries"} className="block">
            <div className="aspect-[16/10] overflow-hidden bg-muted relative">
              {currentVideo?.cover_image ? (
                <OptimizedImage
                  src={currentVideo.cover_image}
                  alt={currentVideo.title}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray text-xl">
                  Видео
                </div>
              )}
              
              {/* Play Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-foreground ml-1" fill="currentColor" />
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.preventDefault();
                  if (videoGalleries) {
                    setVideoSlide((prev) => (prev - 1 + videoGalleries.length) % videoGalleries.length);
                  }
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.preventDefault();
                  if (videoGalleries) {
                    setVideoSlide((prev) => (prev + 1) % videoGalleries.length);
                  }
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Link>
          
          {/* Info Below */}
          <div className="mt-3">
            <span className="text-xs text-muted-foreground uppercase block">Видео-репортажи</span>
            <Link to={currentVideo ? `/galleries/${currentVideo.slug}` : "/galleries"}>
              <h4 className="font-condensed font-bold text-lg leading-snug line-clamp-2 hover:text-primary transition-colors">
                {currentVideo?.title || "Видео репортаж"}
              </h4>
            </Link>
            <Link 
              to="/galleries?type=video" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Все репортажи
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
