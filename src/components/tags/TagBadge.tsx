import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  tag: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
  linkable?: boolean;
  className?: string;
}

export function TagBadge({ tag, linkable = true, className = "" }: TagBadgeProps) {
  const badge = (
    <Badge variant="secondary" className={`text-xs ${className}`}>
      #{tag.name}
    </Badge>
  );

  if (linkable) {
    const basePath = tag.type === "news" ? "/news" : "/blogs";
    return (
      <Link to={`${basePath}?tag=${tag.slug}`} className="hover:opacity-80 transition-opacity">
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
