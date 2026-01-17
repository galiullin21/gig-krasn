import { useEffect, useRef } from "react";
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
import { ShareButtons } from "@/components/share/ShareButtons";
import { SEO } from "@/components/seo/SEO";
import { TagList } from "@/components/tags/TagBadge";

interface Tag {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const viewTracked = useRef(false);

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

      // Fetch tags
      let tags: Tag[] = [];
      if (data?.id) {
        const { data: tagData } = await supabase
          .from("news_tags")
          .select("tag_id, tags(id, name, slug, type)")
          .eq("news_id", data.id);
        tags = (tagData || []).map((t: any) => t.tags).filter(Boolean);
      }

      // Fetch attached documents
      let documents: any[] = [];
      if (data?.id) {
        const { data: docData } = await supabase
          .from("news_documents")
          .select("document_id, documents(id, title, file_url, file_type, file_size)")
          .eq("news_id", data.id)
          .order("sort_order");
        documents = (docData || []).map((d: any) => d.documents).filter(Boolean);
      }
      
      return data ? { ...data, author_profile: authorProfile, tags, documents } : null;
    },
    enabled: !!slug,
  });

  // Track view count - only once per page load
  useEffect(() => {
    const trackView = async () => {
      if (news?.id && !viewTracked.current) {
        viewTracked.current = true;
        try {
          await supabase.rpc("increment_views", { 
            table_name: "news", 
            record_id: news.id 
          });
          console.log("View tracked for news:", news.id);
        } catch (err) {
          console.error("Failed to track view:", err);
        }
      }
    };
    trackView();
  }, [news?.id]);

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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Layout>
      <SEO
        title={news.title}
        description={news.lead || undefined}
        image={news.cover_image || undefined}
        url={`/news/${news.slug}`}
        type="article"
        publishedTime={news.published_at || undefined}
        author={news.author_profile?.full_name || undefined}
      />
      
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

        {/* Tags */}
        {news.tags && news.tags.length > 0 && (
          <TagList tags={news.tags} className="mb-4" />
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
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-condensed prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: news.content || "" }}
        />

        {/* Attached Documents */}
        {news.documents && news.documents.length > 0 && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-3">Прикреплённые документы</h3>
            <ul className="space-y-2">
              {news.documents.map((doc: any) => (
                <li key={doc.id}>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <span>{doc.title}</span>
                    {doc.file_size && (
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(doc.file_size)})
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Share buttons */}
        <div className="mt-8 pt-6 border-t">
          <ShareButtons
            url={`/news/${news.slug}`}
            title={news.title}
            description={news.lead || ""}
            image={news.cover_image || undefined}
            contentType="news"
          />
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-4 mt-6 pt-6 border-t">
          <span className="text-sm text-muted-foreground">Оцените материал:</span>
          <ReactionButtons 
            contentType="news" 
            contentId={news.id}
            contentTitle={news.title}
            contentSlug={news.slug}
          />
        </div>

        {/* Comments */}
        <CommentsSection 
          contentType="news" 
          contentId={news.id}
          contentTitle={news.title}
          contentSlug={news.slug}
        />

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
                        loading="lazy"
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
