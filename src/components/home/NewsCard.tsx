import { Link } from "react-router-dom";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface NewsCardProps {
  id: string;
  title: string;
  lead?: string;
  coverImage?: string;
  category?: string;
  date: string;
  slug: string;
  variant?: "default" | "horizontal" | "small";
}

export function NewsCard({
  title,
  lead,
  coverImage,
  category,
  date,
  slug,
  variant = "default",
}: NewsCardProps) {
  if (variant === "horizontal") {
    return (
      <article className="flex gap-4 group">
        <Link to={`/news/${slug}`} className="shrink-0">
          <div className="w-32 h-24 md:w-40 md:h-28 overflow-hidden rounded bg-muted">
            {coverImage ? (
              <OptimizedImage
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="160px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          {category && (
            <span className="text-xs font-medium text-primary uppercase">
              {category}
            </span>
          )}
          <Link to={`/news/${slug}`}>
            <h3 className="font-condensed font-bold text-base md:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors mt-1">
              {title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">{date}</p>
        </div>
      </article>
    );
  }

  if (variant === "small") {
    return (
      <article className="group">
        <Link to={`/news/${slug}`}>
          <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">{date}</p>
      </article>
    );
  }

  return (
    <article className="group">
      <Link to={`/news/${slug}`} className="block">
        <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted mb-3">
          {coverImage ? (
            <OptimizedImage
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
          )}
        </div>
      </Link>
      {category && (
        <span className="text-xs font-medium text-primary uppercase">
          {category}
        </span>
      )}
      <Link to={`/news/${slug}`}>
        <h3 className="font-condensed font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors mt-1">
          {title}
        </h3>
      </Link>
      {lead && (
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{lead}</p>
      )}
      <p className="text-xs text-muted-foreground mt-2">{date}</p>
    </article>
  );
}
