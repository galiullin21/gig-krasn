import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Eye, Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactionButtons } from "@/components/reactions/ReactionButtons";
import { CommentsSection } from "@/components/comments/CommentsSection";

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: news, isLoading } = useQuery({
    queryKey: ["news", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*, categories(name, slug)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      
      // Fetch author profile separately if author_id exists
      let authorProfile = null;
      if (data?.author_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", data.author_id)
          .maybeSingle();
        authorProfile = profile;
      }
      
      return data ? { ...data, author_profile: authorProfile } : null;
    },
    enabled: !!slug,
  });

  const { data: similarNews } = useQuery({
    queryKey: ["similar-news", news?.category_id, news?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, cover_image, published_at")
        .eq("status", "published")
        .eq("category_id", news!.category_id!)
        .neq("id", news!.id)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!news?.category_id && !!news?.id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-6 md:py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-64 mb-6" />
          <Skeleton className="aspect-video w-full rounded-lg mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!news) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Новость не найдена</h1>
          <p className="text-muted-foreground mb-6">
            Запрашиваемая новость не существует или была удалена
          </p>
          <Button asChild>
            <Link to="/news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к новостям
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container py-6 md:py-8 max-w-4xl">
        {/* Back button */}
        <Link
          to="/news"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Все новости
        </Link>

        {/* Category */}
        {news.categories?.name && (
          <Link to={`/news?category=${news.categories.slug}`}>
            <Badge variant="secondary" className="mb-4">
              {news.categories.name}
            </Badge>
          </Link>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-condensed font-bold text-foreground leading-tight mb-4">
          {news.title}
        </h1>

        {/* Lead */}
        {news.lead && (
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
            {news.lead}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
          {news.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(news.published_at), "d MMMM yyyy, HH:mm", { locale: ru })}
            </span>
          )}
          {news.author_profile?.full_name && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {news.author_profile.full_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {news.views_count || 0} просмотров
          </span>
        </div>

        {/* Cover image */}
        {news.cover_image && (
          <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-8">
            <img
              src={news.cover_image}
              alt={news.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-condensed prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: news.content || "" }}
        />

        {/* Reactions */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t">
          <span className="text-sm text-muted-foreground">Оцените материал:</span>
          <ReactionButtons contentType="news" contentId={news.id} />
        </div>

        {/* Comments */}
        <CommentsSection contentType="news" contentId={news.id} />

        {/* Similar news */}
        {similarNews && similarNews.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-condensed font-bold mb-6">Похожие новости</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarNews.map((item) => (
                <Link key={item.id} to={`/news/${item.slug}`} className="group">
                  <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted mb-3">
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                  </div>
                  <h3 className="font-condensed font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.published_at && (
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {format(new Date(item.published_at), "d MMMM yyyy", { locale: ru })}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
}
