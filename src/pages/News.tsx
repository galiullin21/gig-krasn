import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { NewsCard } from "@/components/home/NewsCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Tag, CalendarIcon, X } from "lucide-react";
import { TagBadge } from "@/components/tags/TagBadge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedCategory = searchParams.get("category") || "all";
  const selectedTag = searchParams.get("tag") || "";
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories", "news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("type", "news")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch tags
  const { data: tags } = useQuery({
    queryKey: ["tags", "news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, slug")
        .eq("type", "news")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch news with pagination
  const { data: newsData, isLoading } = useQuery({
    queryKey: ["news", selectedCategory, selectedTag, currentPage, selectedDate?.toISOString()],
    queryFn: async () => {
      // If filtering by tag, we need a different approach
      if (selectedTag) {
        const tag = tags?.find((t) => t.slug === selectedTag);
        if (!tag) return { news: [], total: 0 };

        // Get news IDs that have this tag
        const { data: taggedNews } = await supabase
          .from("news_tags")
          .select("news_id")
          .eq("tag_id", tag.id);

        if (!taggedNews?.length) return { news: [], total: 0 };

        const newsIds = taggedNews.map((t) => t.news_id);

        let query = supabase
          .from("news")
          .select("*, categories(name, slug)", { count: "exact" })
          .eq("status", "published")
          .in("id", newsIds)
          .order("published_at", { ascending: false });

        if (selectedCategory !== "all") {
          const category = categories?.find((c) => c.slug === selectedCategory);
          if (category) {
            query = query.eq("category_id", category.id);
          }
        }

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;
        return { news: data, total: count || 0 };
      }

      // Standard query without tag filter
      let query = supabase
        .from("news")
        .select("*, categories(name, slug)", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (selectedCategory !== "all") {
        const category = categories?.find((c) => c.slug === selectedCategory);
        if (category) {
          query = query.eq("category_id", category.id);
        }
      }

      // Filter by date if selected
      if (selectedDate) {
        const dayStart = startOfDay(selectedDate).toISOString();
        const dayEnd = endOfDay(selectedDate).toISOString();
        query = query.gte("published_at", dayStart).lte("published_at", dayEnd);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      return { news: data, total: count || 0 };
    },
    enabled: (!!categories || selectedCategory === "all") && (!!tags || !selectedTag),
  });

  const totalPages = Math.ceil((newsData?.total || 0) / ITEMS_PER_PAGE);

  const handleCategoryChange = (categorySlug: string) => {
    setSearchParams({ category: categorySlug, page: "1", ...(selectedTag && { tag: selectedTag }) });
  };

  const handleTagChange = (tagSlug: string) => {
    if (tagSlug === selectedTag) {
      // Deselect tag
      const params: Record<string, string> = { category: selectedCategory, page: "1" };
      setSearchParams(params);
    } else {
      setSearchParams({ category: selectedCategory, tag: tagSlug, page: "1" });
    }
  };

  const handlePageChange = (page: number) => {
    const params: Record<string, string> = { category: selectedCategory, page: page.toString() };
    if (selectedTag) params.tag = selectedTag;
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // Reset to first page when date changes
    const params: Record<string, string> = { category: selectedCategory, page: "1" };
    if (selectedTag) params.tag = selectedTag;
    setSearchParams(params);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    const params: Record<string, string> = { category: selectedCategory, page: "1" };
    if (selectedTag) params.tag = selectedTag;
    setSearchParams(params);
  };

  const handleLoadMore = () => {
    handlePageChange(currentPage + 1);
  };

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-condensed font-bold text-foreground">
            Новости
          </h1>
          <p className="text-muted-foreground mt-2">
            Актуальные новости Железногорска и Красноярского края
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange("all")}
              className="rounded-full"
            >
              Все новости
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category.slug)}
                className="rounded-full"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Calendar Filter */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "rounded-full gap-2",
                    selectedDate && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate 
                    ? format(selectedDate, "d MMMM yyyy", { locale: ru })
                    : "Выбрать дату"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={ru}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearDateFilter}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
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

        {/* News Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] rounded-lg" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : newsData?.news && newsData.news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {newsData.news.map((item) => (
              <NewsCard
                key={item.id}
                id={item.id}
                title={item.title}
                lead={item.lead || undefined}
                coverImage={item.cover_image || undefined}
                category={item.categories?.name}
                slug={item.slug}
                date={
                  item.published_at
                    ? format(new Date(item.published_at), "d MMMM yyyy", {
                        locale: ru,
                      })
                    : ""
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {selectedTag ? "Новостей с этим тегом пока нет" : "Новостей в этой категории пока нет"}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {currentPage < totalPages && newsData && newsData.news.length > 0 && (
          <div className="flex justify-center mt-8 md:mt-12">
            <Button
              variant="default"
              size="lg"
              onClick={handleLoadMore}
              className="px-8"
            >
              Больше новостей
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, index, filtered) => {
                  const prevPage = filtered[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(page)}
                        className="w-10 h-10"
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
            </div>

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

        {/* Results info */}
        {newsData && newsData.total > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Показано {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, newsData.total)}–
            {Math.min(currentPage * ITEMS_PER_PAGE, newsData.total)} из {newsData.total} новостей
          </p>
        )}
      </div>
    </Layout>
  );
}
