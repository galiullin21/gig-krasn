import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useState, useEffect } from "react";

export function ArticlesSectionRedesign() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const { data: blogs, isLoading } = useQuery({
    queryKey: ["home-articles-redesign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("id, title, content, cover_image, slug, published_at, category_id, categories(name)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const featuredBlogs = blogs?.slice(0, 4) || [];

  // Auto-advance slider
  useEffect(() => {
    if (featuredBlogs.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredBlogs.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredBlogs.length]);

  if (isLoading) {
    return (
      <section className="py-6 border-t-4 border-primary">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 aspect-[3/4]" />
          <Skeleton className="lg:col-span-5 aspect-[4/3]" />
          <Skeleton className="lg:col-span-3 h-64" />
        </div>
      </section>
    );
  }

  if (!blogs?.length) {
    return null;
  }

  const currentBlog = featuredBlogs[currentSlide];

  return (
    <section className="py-6 border-t-4 border-primary">
      <h2 className="text-2xl font-condensed font-bold uppercase mb-6">Статьи</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Slider Image */}
        <div className="lg:col-span-4">
          <div className="relative">
            <Link to={`/blogs/${currentBlog?.slug}`} className="block">
              <div className="aspect-[3/4] overflow-hidden bg-muted">
                {currentBlog?.cover_image ? (
                  <OptimizedImage
                    src={currentBlog.cover_image}
                    alt={currentBlog.title}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, 30vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray text-xl">
                    Фото
                  </div>
                )}
              </div>
            </Link>
            
            {/* Slider Dots */}
            <div className="flex justify-center gap-2 mt-3">
              {featuredBlogs.map((_, index) => (
                <button
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center Column - Article Text */}
        <div className="lg:col-span-5">
          {currentBlog && (
            <article className="group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-primary uppercase">
                  {(currentBlog.categories as any)?.name || "Статья"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentBlog.published_at
                    ? format(new Date(currentBlog.published_at), "d.MM.yyyy", { locale: ru })
                    : ""}
                </span>
              </div>
              <Link to={`/blogs/${currentBlog.slug}`}>
                <h3 className="font-condensed font-bold text-xl leading-tight line-clamp-3 group-hover:text-primary transition-colors mb-3">
                  {currentBlog.title}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground line-clamp-6 mb-4">
                {currentBlog.content?.replace(/<[^>]*>/g, '').slice(0, 300)}...
              </p>
              <Link 
                to={`/blogs/${currentBlog.slug}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
              >
                Подробнее
              </Link>
            </article>
          )}
        </div>

        {/* Right Column - Ad Banner */}
        <div className="lg:col-span-3">
          <div className="bg-muted h-full flex flex-col items-center justify-center p-4 min-h-[250px]">
            <span className="text-lg text-muted-foreground mb-2">Рекламный</span>
            <span className="text-lg text-muted-foreground">баннер</span>
          </div>
        </div>
      </div>
    </section>
  );
}
