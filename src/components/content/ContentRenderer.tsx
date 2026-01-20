import { useMemo } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { EmbeddedGallery } from "./EmbeddedGallery";

interface ContentRendererProps {
  content: string;
  className?: string;
}

export function ContentRenderer({ content, className = "" }: ContentRendererProps) {
  const { htmlParts, galleries } = useMemo(() => {
    if (!content) return { htmlParts: [], galleries: [] };

    // Find all embedded galleries
    const galleryRegex = /<div class="embedded-gallery" data-images='([^']+)'[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
    const htmlParts: { type: "html" | "gallery"; content: string; images?: string[] }[] = [];
    const galleries: string[][] = [];
    
    let lastIndex = 0;
    let match;

    while ((match = galleryRegex.exec(content)) !== null) {
      // Add HTML before the gallery
      if (match.index > lastIndex) {
        const htmlContent = content.slice(lastIndex, match.index);
        if (htmlContent.trim()) {
          htmlParts.push({ type: "html", content: htmlContent });
        }
      }

      // Parse gallery images
      try {
        const images = JSON.parse(match[1]);
        if (Array.isArray(images) && images.length > 0) {
          galleries.push(images);
          htmlParts.push({ type: "gallery", content: "", images });
        }
      } catch (e) {
        console.error("Failed to parse gallery images:", e);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining HTML after last gallery
    if (lastIndex < content.length) {
      const htmlContent = content.slice(lastIndex);
      if (htmlContent.trim()) {
        htmlParts.push({ type: "html", content: htmlContent });
      }
    }

    // If no galleries found, just return the whole content as HTML
    if (htmlParts.length === 0 && content.trim()) {
      htmlParts.push({ type: "html", content });
    }

    return { htmlParts, galleries };
  }, [content]);

  if (!content) return null;

  return (
    <div className={className}>
      {htmlParts.map((part, index) => {
        if (part.type === "gallery" && part.images) {
          return (
            <div key={index} className="my-6">
              <EmbeddedGallery images={part.images} />
            </div>
          );
        }
        
        return (
          <div
            key={index}
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-condensed prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(part.content) }}
          />
        );
      })}
    </div>
  );
}
