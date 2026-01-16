import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, Eye, Calendar, ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";

export default function GalleryDetail() {
  const { slug } = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

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

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const goToPrev = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % images.length);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") closeLightbox();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
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
      <div className="container py-6 md:py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/galleries">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Все галереи
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant={gallery.type === "reportage" ? "default" : "secondary"}>
              {gallery.type === "reportage" ? "Репортаж" : "Галерея"}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {gallery.published_at
                ? format(new Date(gallery.published_at), "d MMMM yyyy", { locale: ru })
                : format(new Date(gallery.created_at), "d MMMM yyyy", { locale: ru })}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {gallery.views_count || 0}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-condensed font-bold text-foreground">
            {gallery.title}
          </h1>
          
          <p className="text-muted-foreground mt-2">
            {images.length} {images.length === 1 ? "фото" : images.length < 5 ? "фото" : "фотографий"}
          </p>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => openLightbox(index)}
                className="aspect-square overflow-hidden rounded-lg group relative"
              >
                <img
                  src={image}
                  alt={`Фото ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">В галерее пока нет фотографий</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {selectedImageIndex !== null && (
              <>
                <img
                  src={images[selectedImageIndex]}
                  alt={`Фото ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={closeLightbox}
                >
                  <X className="h-6 w-6" />
                </Button>

                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                      onClick={goToPrev}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                      onClick={goToNext}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
