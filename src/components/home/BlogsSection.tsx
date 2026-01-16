import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function BlogsSection() {
  const { data: blogs, isLoading } = useQuery({
    queryKey: ["home-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("id, title, cover_image, slug, category_id, categories(name)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/3] rounded-lg mb-2" />
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!blogs?.length) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-condensed font-bold uppercase">Блоги</h2>
        <Link
          to="/blogs"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Все блоги
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {blogs.map((blog) => (
          <article key={blog.id} className="group">
            <Link to={`/blogs/${blog.slug}`} className="block">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted mb-2">
                {blog.cover_image ? (
                  <img
                    src={blog.cover_image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Нет изображения
                  </div>
                )}
              </div>
            </Link>
            <span className="text-xs font-medium text-primary uppercase">
              {(blog.categories as any)?.name || "Блог"}
            </span>
            <Link to={`/blogs/${blog.slug}`}>
              <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors mt-1">
                {blog.title}
              </h3>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
