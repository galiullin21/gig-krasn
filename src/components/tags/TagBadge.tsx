import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag?: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
  // Alternative props for simpler usage
  name?: string;
  slug?: string;
  isActive?: boolean;
  linkable?: boolean;
  className?: string;
}

export function TagBadge({ 
  tag, 
  name, 
  slug, 
  isActive = false, 
  linkable = true, 
  className = "" 
}: TagBadgeProps) {
  // Support both object and individual props
  const tagName = tag?.name || name || "";
  const tagSlug = tag?.slug || slug || "";
  const tagType = tag?.type || "news";

  const badge = (
    <Badge 
      variant={isActive ? "default" : "secondary"} 
      className={cn(
        "text-xs transition-colors",
        isActive && "bg-primary text-primary-foreground",
        className
      )}
    >
      #{tagName}
    </Badge>
  );

  if (linkable && !isActive) {
    const basePath = tagType === "blog" ? "/blogs" : "/news";
    return (
      <Link to={`${basePath}?tag=${tagSlug}`} className="hover:opacity-80 transition-opacity">
        {badge}
      </Link>
    );
  }

  return badge;
}

interface TagListProps {
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
  }>;
  linkable?: boolean;
  className?: string;
}

export function TagList({ tags, linkable = true, className = "" }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} linkable={linkable} />
      ))}
    </div>
  );
}
