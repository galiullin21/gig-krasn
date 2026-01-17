import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Eye, Calendar, ArrowLeft } from "lucide-react";
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

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const viewTracked = useRef(false);

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
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
          .from("blog_tags")
          .select("tag_id, tags(id, name, slug, type)")
          .eq("blog_id", data.id);
        tags = (tagData || []).map((t: any) => t.tags).filter(Boolean);
      }
      
      return data ? { ...data, author_profile: authorProfile, tags } : null;
    },
    enabled: !!slug,
  });

  // Track view count - only once per page load
  useEffect(() => {
    const trackView = async () => {
      if (blog?.id && !viewTracked.current) {
        viewTracked.current = true;
        try {
          await supabase.rpc("increment_views", { 
            table_name: "blogs", 
            record_id: blog.id 
          });
          console.log("View tracked for blog:", blog.id);
        } catch (err) {
          console.error("Failed to track view:", err);
        }
      }
    };
    trackView();
  }, [blog?.id]);

  const { data: similarBlogs } = useQuery({
    queryKey: ["similar-blogs", blog?.category_id, blog?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("id, title, slug, cover_image, published_at, author_id")
        .eq("status", "published")
        .eq("category_id", blog!.category_id!)
        .neq("id", blog!.id)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      
      // Fetch author profiles for similar blogs
      const blogsWithAuthors = await Promise.all(
        (data || []).map(async (item) => {
          let authorProfile = null;
          if (item.author_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", item.author_id)
              .maybeSingle();
            authorProfile = profile;
          }
          return { ...item, author_profile: authorProfile };
        })
      );
      
      return blogsWithAuthors;
    },
    enabled: !!blog?.category_id && !!blog?.id,
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

  if (!blog) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Блог не найден</h1>
          <p className="text-muted-foreground mb-6">
            Запрашиваемый материал не существует или был удалён
          </p>
          <Button asChild>
            <Link to="/blogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к блогам
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const authorInitials = blog.author_profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "A";

  // Extract first 160 chars for description
  const description = blog.content
    ? blog.content.replace(/<[^>]*>/g, "").substring(0, 160)
    : undefined;

  return (
    <Layout>
      <SEO
        title={blog.title}
        description={description}
        image={blog.cover_image || undefined}
        url={`/blogs/${blog.slug}`}
        type="article"
        publishedTime={blog.published_at || undefined}
        author={blog.author_profile?.full_name || undefined}
      />

      <article className="container py-6 md:py-8 max-w-4xl">
        {/* Back button */}
        <Link
          to="/blogs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Все блоги
        </Link>

        {/* Category */}
        {blog.categories?.name && (
          <Badge variant="secondary" className="mb-4">
            {blog.categories.name}
          </Badge>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-condensed font-bold text-foreground leading-tight mb-4">
          {blog.title}
        </h1>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <TagList tags={blog.tags} className="mb-4" />
        )}

        {/* Author card */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <Avatar className="h-12 w-12">
            <AvatarImage src={blog.author_profile?.avatar_url || undefined} />
            <AvatarFallback>{authorInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">
              {blog.author_profile?.full_name || "Автор"}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {blog.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(blog.published_at), "d MMMM yyyy", { locale: ru })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {blog.views_count || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Cover image */}
        {blog.cover_image && (
          <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-8">
            <img
              src={blog.cover_image}
              alt={blog.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-condensed prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: blog.content || "" }}
        />

        {/* Share buttons */}
        <div className="mt-8 pt-6 border-t">
          <ShareButtons
            url={`/blogs/${blog.slug}`}
            title={blog.title}
            description={description || ""}
            image={blog.cover_image || undefined}
          />
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-4 mt-6 pt-6 border-t">
          <span className="text-sm text-muted-foreground">Оцените материал:</span>
          <ReactionButtons contentType="blog" contentId={blog.id} />
        </div>

        {/* Comments */}
        <CommentsSection contentType="blog" contentId={blog.id} />

        {/* Similar blogs */}
        {similarBlogs && similarBlogs.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-condensed font-bold mb-6">Похожие материалы</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarBlogs.map((item) => (
                <Link key={item.id} to={`/blogs/${item.slug}`} className="group">
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {item.author_profile?.full_name && (
                      <span>{item.author_profile.full_name}</span>
                    )}
                    {item.published_at && (
                      <>
                        <span>•</span>
                        <span>{format(new Date(item.published_at), "d MMM yyyy", { locale: ru })}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
}
