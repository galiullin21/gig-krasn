import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, subMonths, addMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useState } from "react";

export function NewsSectionRedesign() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: news, isLoading } = useQuery({
    queryKey: ["home-news-redesign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, lead, cover_image, slug, published_at, category_id, categories(name)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  // Get news dates for calendar highlighting
  const { data: newsDates } = useQuery({
    queryKey: ["news-dates", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const { data, error } = await supabase
        .from("news")
        .select("published_at")
        .eq("status", "published")
        .gte("published_at", start.toISOString())
        .lte("published_at", end.toISOString());
      if (error) throw error;
      return data?.map(n => new Date(n.published_at!)) || [];
    },
  });

  const featuredNews = news?.slice(0, 2) || [];
  const regularNews = news?.slice(2, 6) || [];

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1; // Monday start

  if (isLoading) {
    return (
      <section className="py-6 border-t border-border">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-96" />
          <Skeleton className="lg:col-span-5 h-96" />
          <Skeleton className="lg:col-span-3 h-96" />
        </div>
      </section>
    );
  }

  if (!news?.length) {
    return null;
  }

  return (
    <section className="py-6 border-t border-border">
      <h2 className="text-2xl font-condensed font-bold uppercase mb-6">Новости</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Featured News */}
        <div className="lg:col-span-4 space-y-6">
          {featuredNews.map((item) => (
            <article key={item.id} className="group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-primary uppercase">
                  {(item.categories as any)?.name || "Новости"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.published_at
                    ? format(new Date(item.published_at), "d.MM.yyyy", { locale: ru })
                    : ""}
                </span>
              </div>
              <Link to={`/news/${item.slug}`}>
                <h3 className="font-condensed font-bold text-lg leading-tight line-clamp-3 group-hover:text-primary transition-colors mb-2">
                  {item.title}
                </h3>
              </Link>
              {item.lead && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.lead}
                </p>
              )}
            </article>
          ))}
        </div>

        {/* Center Column - News with Images */}
        <div className="lg:col-span-5">
          <div className="grid grid-cols-2 gap-4">
            {regularNews.map((item) => (
              <article key={item.id} className="group">
                <Link to={`/news/${item.slug}`} className="block">
                  <div className="aspect-[4/3] overflow-hidden bg-muted mb-2">
                    {item.cover_image ? (
                      <OptimizedImage
                        src={item.cover_image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray">
                        Фото
                      </div>
                    )}
                  </div>
                </Link>
                <Link to={`/news/${item.slug}`}>
                  <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-primary uppercase">
                    {(item.categories as any)?.name || "Новости"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.published_at
                      ? format(new Date(item.published_at), "d.MM.yyyy", { locale: ru })
                      : ""}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right Column - Archive Calendar & Ad */}
        <div className="lg:col-span-3 space-y-4">
          {/* Ad Banner */}
          <div className="bg-muted p-4 flex flex-col items-center justify-center min-h-[120px]">
            <span className="text-sm text-muted-foreground mb-1">Рекламный</span>
            <span className="text-sm text-muted-foreground">баннер</span>
          </div>

          {/* Archive Calendar */}
          <div className="border border-border p-4">
            <h3 className="font-condensed font-bold text-sm uppercase mb-3">
              Архив новостей
            </h3>
            
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium capitalize">
                {format(currentMonth, "LLLL yyyy", { locale: ru })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Weekday headers */}
              {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((day) => (
                <div key={day} className="font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
              
              {/* Empty cells before first day */}
              {[...Array(adjustedStartDay)].map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {/* Days */}
              {daysInMonth.map((day) => {
                const hasNews = newsDates?.some(d => isSameDay(d, day));
                const isToday = isSameDay(day, new Date());
                
                return (
                  <Link
                    key={day.toISOString()}
                    to={`/news?date=${format(day, "yyyy-MM-dd")}`}
                    className={`py-1 rounded text-xs transition-colors ${
                      hasNews
                        ? "bg-primary text-primary-foreground font-medium"
                        : isToday
                        ? "bg-muted font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {format(day, "d")}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* More News Button */}
      <div className="text-center mt-8">
        <Button variant="default" className="bg-primary hover:bg-primary/90 px-8" asChild>
          <Link to="/news">Больше новостей</Link>
        </Button>
      </div>
    </section>
  );
}
