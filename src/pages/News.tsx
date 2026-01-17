import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Calendar } from "@/components/ui/calendar";
import { AdBanner } from "@/components/home/AdBanner";

const ITEMS_PER_PAGE = 10;

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedCategory = searchParams.get("category") || "all";
  const dateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    dateParam ? new Date(dateParam) : undefined
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  // Fetch news with pagination
  const { data: newsData, isLoading } = useQuery({
    queryKey: ["news", selectedCategory, currentPage, selectedDate?.toISOString()],
    queryFn: async () => {
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
    enabled: !!categories || selectedCategory === "all",
  });

  // Fetch dates with news for calendar highlighting
  const { data: datesWithNews } = useQuery({
    queryKey: ["news-dates", currentMonth.toISOString()],
    queryFn: async () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data } = await supabase
        .from("news")
        .select("published_at")
        .eq("status", "published")
        .gte("published_at", monthStart.toISOString())
        .lte("published_at", monthEnd.toISOString());

      return data?.map((item) => new Date(item.published_at!)) || [];
    },
  });

  const totalPages = Math.ceil((newsData?.total || 0) / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    const params: Record<string, string> = { page: page.toString() };
    if (selectedCategory !== "all") params.category = selectedCategory;
    if (selectedDate) params.date = selectedDate.toISOString().split("T")[0];
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    const params: Record<string, string> = { page: "1" };
    if (selectedCategory !== "all") params.category = selectedCategory;
    if (date) params.date = date.toISOString().split("T")[0];
    setSearchParams(params);
  };

  const handleLoadMore = () => {
    handlePageChange(currentPage + 1);
  };

  // Custom day render for calendar
  const modifiers = {
    hasNews: (date: Date) =>
      datesWithNews?.some((d) => isSameDay(d, date)) || false,
  };

  const modifiersStyles = {
    hasNews: {
      fontWeight: "bold" as const,
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container">
          <div className="h-20 flex items-center justify-center text-xl opacity-70">
            Рекламный баннер
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 border-b-4 border-primary pb-2 inline-block">
          <h1 className="text-2xl md:text-3xl font-condensed font-bold text-foreground">
            Все новости
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* News List */}
          <div className="lg:col-span-8">
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 border-b pb-6">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="w-40 h-28 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : newsData?.news && newsData.news.length > 0 ? (
              <div className="space-y-0">
                {newsData.news.map((item) => (
                  <article key={item.id} className="border-b py-6 first:pt-0">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {item.categories?.name && (
                            <span className="text-xs font-medium text-primary uppercase">
                              {item.categories.name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {item.published_at
                              ? format(new Date(item.published_at), "HH:mm", { locale: ru })
                              : ""}
                          </span>
                        </div>
                        <Link to={`/news/${item.slug}`}>
                          <h2 className="font-bold text-lg leading-tight hover:text-primary transition-colors mb-2">
                            {item.title}
                          </h2>
                        </Link>
                        {item.lead && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.lead}
                          </p>
                        )}
                      </div>
                      {item.cover_image && (
                        <Link
                          to={`/news/${item.slug}`}
                          className="w-40 h-28 flex-shrink-0 overflow-hidden rounded bg-muted"
                        >
                          <OptimizedImage
                            src={item.cover_image}
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Новостей пока нет
                </p>
              </div>
            )}

            {/* Load More Button */}
            {currentPage < totalPages && newsData && newsData.news.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleLoadMore}
                  className="px-12 rounded-full"
                >
                  Больше новостей
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Ad Banner */}
            <div className="bg-muted rounded-lg overflow-hidden">
              <div className="aspect-[4/3] flex items-center justify-center text-muted-foreground">
                Реклама
              </div>
              <div className="p-3 text-sm text-muted-foreground">
                <p>Здесь может быть размещено ваше рекламное объявление</p>
              </div>
              <div className="px-3 pb-3 flex justify-between text-xs text-muted-foreground">
                <span>РЕКЛАМА</span>
                <span>{format(new Date(), "d.MM.yyyy", { locale: ru })}</span>
              </div>
            </div>

            {/* Archive Calendar */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-center mb-4">Архив новостей</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ru}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="w-full"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium capitalize",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex justify-between",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] uppercase",
                  row: "flex w-full mt-2 justify-between",
                  cell: "text-center text-sm p-0 relative",
                  day: "h-9 w-9 p-0 font-normal hover:bg-accent rounded-md transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                }}
              />
            </div>

            {/* Second Ad */}
            <div className="bg-muted rounded-lg overflow-hidden">
              <div className="aspect-[4/3] flex items-center justify-center text-muted-foreground">
                Реклама
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
