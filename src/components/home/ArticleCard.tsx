import { Link } from "react-router-dom";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface ArticleCardProps {
  id: string;
  title: string;
  lead?: string;
  coverImage?: string;
  category?: string;
  date: string;
  slug: string;
  variant?: "large" | "medium" | "small";
}

export function ArticleCard({
  title,
  lead,
  coverImage,
  category,
  date,
  slug,
  variant = "medium",
}: ArticleCardProps) {
  if (variant === "large") {
    return (
      <article className="group">
        <Link to={`/blogs/${slug}`} className="block">
          <div className="aspect-[4/3] overflow-hidden bg-muted mb-3">
            {coverImage ? (
              <OptimizedImage
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray">
                Фото
              </div>
            )}
          </div>
        </Link>
        {category && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-primary uppercase">
              {category}
            </span>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
        )}
        <Link to={`/blogs/${slug}`}>
          <h3 className="font-condensed font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        {lead && (
          <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{lead}</p>
        )}
      </article>
    );
  }

  if (variant === "small") {
    return (
      <article className="group flex gap-3">
        <Link to={`/blogs/${slug}`} className="shrink-0">
          <div className="w-24 h-20 overflow-hidden bg-muted">
            {coverImage ? (
              <OptimizedImage
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs bg-gig-light-gray">
                Фото
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/blogs/${slug}`}>
            <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h4>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            {category && (
              <span className="text-xs text-primary uppercase">{category}</span>
            )}
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
        </div>
      </article>
    );
  }

  // Medium variant
  return (
    <article className="group">
      <Link to={`/blogs/${slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-muted mb-2">
          {coverImage ? (
            <OptimizedImage
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray">
              Фото
            </div>
          )}
        </div>
      </Link>
      <Link to={`/blogs/${slug}`}>
        <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h4>
      </Link>
      <div className="flex items-center gap-2 mt-1">
        {category && (
          <span className="text-xs text-primary uppercase">{category}</span>
        )}
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </article>
  );
}
