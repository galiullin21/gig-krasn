import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCarouselProps {
  videoUrls: string[];
}

interface ParsedVideo {
  url: string;
  embedUrl: string;
  platform: string;
  thumbnail?: string;
}

const parseVideoUrl = (url: string): ParsedVideo | null => {
  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtube.com/watch")) {
      const match = url.match(/[?&]v=([^&]+)/);
      videoId = match ? match[1] : "";
    } else if (url.includes("youtu.be/")) {
      const match = url.match(/youtu\.be\/([^?]+)/);
      videoId = match ? match[1] : "";
    } else if (url.includes("youtube.com/embed/")) {
      const match = url.match(/embed\/([^?]+)/);
      videoId = match ? match[1] : "";
    }
    if (videoId) {
      return {
        url,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        platform: "YouTube",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  }

  // VK Video (vk.com и vkvideo.ru)
  if (url.includes("vk.com/video") || url.includes("vk.com/clip") || url.includes("vkvideo.ru")) {
    const match = url.match(/video(-?\d+)_(\d+)/);
    if (match) {
      return {
        url,
        embedUrl: `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2`,
        platform: "VK Video",
      };
    }
  }

  // Rutube
  if (url.includes("rutube.ru")) {
    const match = url.match(/video\/([a-zA-Z0-9]+)/);
    if (match) {
      return {
        url,
        embedUrl: `https://rutube.ru/play/embed/${match[1]}`,
        platform: "Rutube",
      };
    }
  }

  // Vimeo
  if (url.includes("vimeo.com")) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) {
      return {
        url,
        embedUrl: `https://player.vimeo.com/video/${match[1]}`,
        platform: "Vimeo",
      };
    }
  }

  return null;
};

export function VideoCarousel({ videoUrls }: VideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const parsedVideos = useMemo(() => {
    return videoUrls
      .map(parseVideoUrl)
      .filter((v): v is ParsedVideo => v !== null);
  }, [videoUrls]);

  if (parsedVideos.length === 0) return null;

  const currentVideo = parsedVideos[currentIndex];

  const goToPrevious = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? parsedVideos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev === parsedVideos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main video player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {isPlaying ? (
          <iframe
            src={`${currentVideo.embedUrl}?autoplay=1`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
            onClick={() => setIsPlaying(true)}
          >
            {currentVideo.thumbnail ? (
              <img
                src={currentVideo.thumbnail}
                alt={`${currentVideo.platform} video`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/80" />
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="relative z-10 w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="h-10 w-10 text-primary-foreground ml-1" fill="currentColor" />
            </div>
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-white text-sm">
              {currentVideo.platform}
            </div>
          </div>
        )}

        {/* Navigation arrows */}
        {parsedVideos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-20"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-20"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {parsedVideos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {parsedVideos.map((video, index) => (
            <button
              key={index}
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(index);
              }}
              className={`relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={`${video.platform} thumbnail`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-white text-xs">
                {video.platform}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      {parsedVideos.length > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          {currentIndex + 1} / {parsedVideos.length}
        </div>
      )}
    </div>
  );
}
