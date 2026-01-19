import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  fallback?: string;
}

export const OptimizedImage = forwardRef<HTMLDivElement, OptimizedImageProps>(({
  src,
  alt,
  className,
  width,
  height,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  fallback = "/placeholder.svg",
}, ref) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Generate srcset for Supabase storage images
  const generateSrcSet = (originalSrc: string) => {
    // Check if it's a Supabase storage URL
    if (originalSrc.includes("supabase.co/storage")) {
      const widths = [320, 640, 768, 1024, 1280, 1920];
      return widths
        .map((w) => {
          // Supabase storage image transformations
          const transformedUrl = originalSrc.includes("?")
            ? `${originalSrc}&width=${w}`
            : `${originalSrc}?width=${w}`;
          return `${transformedUrl} ${w}w`;
        })
        .join(", ");
    }
    return undefined;
  };

  const srcSet = generateSrcSet(src);
  const imageSrc = error ? fallback : src;

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={error ? undefined : srcSet}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";
