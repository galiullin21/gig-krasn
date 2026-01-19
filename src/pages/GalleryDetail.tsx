import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Video, Play, ExternalLink } from "lucide-react";

interface VideoItem {
  url: string;
  type: string;
  title?: string;
}

// Video utilities
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractVkVideoId(url: string): { oid: string; id: string } | null {
  const match = url.match(/video(-?\d+)_(\d+)/);
  if (match) return { oid: match[1], id: match[2] };
  return null;
}

function extractRutubeId(url: string): string | null {
  const match = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function VideoPlayer({ video }: { video: VideoItem }) {
  const { url, type } = video;

  if (type === "youtube") {
    const videoId = extractYoutubeId(url);
    if (videoId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      );
    }
  }

  if (type === "vk") {
    const vkId = extractVkVideoId(url);
    if (vkId) {
      return (
        <iframe
          src={`https://vk.com/video_ext.php?oid=${vkId.oid}&id=${vkId.id}&hd=2`}
          className="w-full aspect-video rounded-lg"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          title="VK video"
        />
      );
    }
  }

  if (type === "rutube") {
    const rutubeId = extractRutubeId(url);
    if (rutubeId) {
      return (
        <iframe
          src={`https://rutube.ru/play/embed/${rutubeId}`}
          className="w-full aspect-video rounded-lg"
          allow="clipboard-write; autoplay"
          allowFullScreen
          title="Rutube video"
        />
      );
    }
  }

  // Direct video link
  if (type === "direct" || url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video
        src={url}
        className="w-full aspect-video rounded-lg bg-black"
        controls
        preload="metadata"
      />
    );
  }

  // Fallback - show link
  return (
    <div className="w-full aspect-video rounded-lg bg-muted flex flex-col items-center justify-center gap-4">
      <Video className="w-16 h-16 text-muted-foreground" />
      <Button asChild variant="outline">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4 mr-2" />
          Открыть видео
        </a>
      </Button>
    </div>
  );
}

export default function GalleryDetail() {
  const { slug } = useParams();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);

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
  const videos = Array.isArray(gallery?.videos) ? gallery.videos as unknown as VideoItem[] : [];
  const isVideoGallery = gallery?.type === "video" || gallery?.type === "reportage";

  const goToPrev = () => {
    if (isVideoGallery) {
      setCurrentVideo((prev) => (prev - 1 + videos.length) % videos.length);
    } else {
      setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const goToNext = () => {
    if (isVideoGallery) {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    } else {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [images.length, videos.length, isVideoGallery]);

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
            <Link to="/galleries" className="text-muted-foreground hover:text-foreground">
              {isVideoGallery ? "Видео" : "Фотогалереи"}
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="text-foreground">{gallery.title}</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant={isVideoGallery ? "default" : "secondary"}>
                {isVideoGallery ? (
                  <><Video className="w-3 h-3 mr-1" /> Видео</>
                ) : (
                  <><ImageIcon className="w-3 h-3 mr-1" /> Фото</>
                )}
              </Badge>
              {gallery.published_at && (
                <span className="text-sm text-muted-foreground">
                  {format(new Date(gallery.published_at), "d MMMM yyyy", { locale: ru })}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-condensed font-bold text-foreground mb-6">
              {gallery.title}
            </h1>

            {isVideoGallery ? (
              // Video Gallery
              videos.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Video Player */}
                  <VideoPlayer video={videos[currentVideo]} />
                  
                  {/* Video List */}
                  {videos.length > 1 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Видео {currentVideo + 1} из {videos.length}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {videos.map((video, index) => {
                          const isActive = index === currentVideo;
                          const youtubeId = video.type === "youtube" ? extractYoutubeId(video.url) : null;
                          const thumbnail = youtubeId 
                            ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
                            : null;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => setCurrentVideo(index)}
                              className={`relative aspect-video rounded-lg overflow-hidden bg-muted transition-all ${
                                isActive 
                                  ? "ring-2 ring-primary ring-offset-2" 
                                  : "hover:opacity-80"
                              }`}
                            >
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={`Видео ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-6 h-6 text-white" fill="white" />
                              </div>
                              <div className="absolute bottom-1 right-1">
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  {index + 1}
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">В репортаже пока нет видео</p>
                  </div>
                </div>
              )
            ) : (
              // Photo Gallery
              images.length > 0 ? (
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

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                            index === currentSlide
                              ? "ring-2 ring-primary ring-offset-2"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Миниатюра ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">В галерее пока нет фотографий</p>
                  </div>
                </div>
              )
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
