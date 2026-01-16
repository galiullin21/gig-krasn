import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

const ITEMS_PER_PAGE = 12;

export default function Blogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");

  const { data: blogsData, isLoading } = useQuery({
    queryKey: ["blogs", currentPage],
    queryFn: async () => {
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
  });

  const totalPages = Math.ceil((blogsData?.total || 0) / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
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
                      <img
                        src={blog.cover_image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            <p className="text-muted-foreground text-lg">Блогов пока нет</p>
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
