import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Eye, Tag } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { TagBadge } from "@/components/tags/TagBadge";

const ITEMS_PER_PAGE = 12;

export default function Blogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedTag = searchParams.get("tag") || "";

  // Fetch tags
  const { data: tags } = useQuery({
    queryKey: ["tags", "blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, slug")
        .eq("type", "blog")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: blogsData, isLoading } = useQuery({
    queryKey: ["blogs", selectedTag, currentPage],
    queryFn: async () => {
      // If filtering by tag
      if (selectedTag) {
        const tag = tags?.find((t) => t.slug === selectedTag);
        if (!tag) return { blogs: [], total: 0 };

        const { data: taggedBlogs } = await supabase
          .from("blog_tags")
          .select("blog_id")
          .eq("tag_id", tag.id);

        if (!taggedBlogs?.length) return { blogs: [], total: 0 };

        const blogIds = taggedBlogs.map((t) => t.blog_id);

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await supabase
          .from("blogs")
          .select("*, categories(name, slug)", { count: "exact" })
          .eq("status", "published")
          .in("id", blogIds)
          .order("published_at", { ascending: false })
          .range(from, to);

        if (error) throw error;
        return { blogs: data, total: count || 0 };
      }

      // Standard query
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("blogs")
        .select("*, categories(name, slug)", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { blogs: data, total: count || 0 };
    },
    enabled: !!tags || !selectedTag,
  });

  const totalPages = Math.ceil((blogsData?.total || 0) / ITEMS_PER_PAGE);

  const handleTagChange = (tagSlug: string) => {
    if (tagSlug === selectedTag) {
      setSearchParams({ page: "1" });
    } else {
      setSearchParams({ tag: tagSlug, page: "1" });
    }
  };

  const handlePageChange = (page: number) => {
    const params: Record<string, string> = { page: page.toString() };
    if (selectedTag) params.tag = selectedTag;
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-condensed font-bold text-foreground">
            Блоги
          </h1>
          <p className="text-muted-foreground mt-2">
            Авторские материалы и мнения
          </p>
        </div>

        {/* Tag Filters */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 md:mb-8">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagChange(tag.slug)}
                className="focus:outline-none"
              >
                <TagBadge
                  name={tag.name}
                  slug={tag.slug}
                  isActive={selectedTag === tag.slug}
                />
              </button>
            ))}
            {selectedTag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTagChange(selectedTag)}
                className="text-xs h-6"
              >
                Сбросить тег
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] rounded-lg" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : blogsData?.blogs && blogsData.blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogsData.blogs.map((blog) => (
              <article key={blog.id} className="group">
                <Link to={`/blogs/${blog.slug}`} className="block">
                  <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted mb-3">
                    {blog.cover_image ? (
                      <OptimizedImage
                        src={blog.cover_image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                  </div>
                </Link>
                {blog.categories?.name && (
                  <span className="text-xs font-medium text-primary uppercase">
                    {blog.categories.name}
                  </span>
                )}
                <Link to={`/blogs/${blog.slug}`}>
                  <h3 className="font-condensed font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors mt-1">
                    {blog.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span>
                    {blog.published_at
                      ? format(new Date(blog.published_at), "d MMMM yyyy", { locale: ru })
                      : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {blog.views_count || 0}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {selectedTag ? "Блогов с этим тегом пока нет" : "Блогов пока нет"}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(page)}
                className="w-10 h-10"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
