import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, subMonths, addMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function NewsSectionFinal() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();

  const { data: news, isLoading } = useQuery({
    queryKey: ["home-news-final"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, lead, cover_image, slug, published_at, category_id, is_featured, is_important, categories(name)")
        .eq("status", "published")
        .order("is_important", { ascending: false })
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Get news dates for calendar highlighting
  const { data: newsDates } = useQuery({
    queryKey: ["news-dates-calendar", format(currentMonth, "yyyy-MM")],
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

  // Featured news (first one with text)
  const featuredNews = news?.slice(0, 2) || [];
  // News with images (next 2)
  const imageNews = news?.slice(2, 4) || [];
  // More news below (next 4)
  const moreNews = news?.slice(4, 8) || [];

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1; // Monday start

  const handleDateClick = (day: Date) => {
    navigate(`/news?date=${format(day, "yyyy-MM-dd")}`);
  };

  if (isLoading) {
    return (
      <section className="py-6 border-t-4 border-primary">
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
    <section className="py-6 border-t-4 border-primary">
      <h2 className="text-2xl font-condensed font-bold uppercase mb-6">Новости</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Featured News (text only) */}
        <div className="lg:col-span-4 space-y-6">
          {featuredNews.map((item) => (
            <article key={item.id} className="group">
              <div className="flex items-start gap-2 mb-1">
                {item.is_important && (
                  <Badge variant="destructive" className="shrink-0 gap-1 text-[10px] px-1.5 py-0.5">
                    <Flame className="w-3 h-3" />
                    Важно
                  </Badge>
                )}
                {item.is_featured && !item.is_important && (
                  <Badge variant="secondary" className="shrink-0 gap-1 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                    <Star className="w-3 h-3" />
                    Главная
                  </Badge>
                )}
              </div>
              <Link to={`/news/${item.slug}`}>
                <h3 className={`font-condensed font-bold text-lg leading-tight line-clamp-3 group-hover:text-primary transition-colors mb-2 ${item.is_important ? 'text-destructive' : ''}`}>
                  {item.title}
                </h3>
              </Link>
              {item.lead && (
                <p className="text-sm text-muted-foreground line-clamp-4 mb-2">
                  {item.lead}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary uppercase">
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

        {/* Center Column - News with Images */}
        <div className="lg:col-span-5">
          <div className="grid grid-cols-2 gap-4">
            {imageNews.map((item) => (
              <article key={item.id} className="group">
                <Link to={`/news/${item.slug}`} className="block relative">
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
                  {/* Badge overlay */}
                  {(item.is_important || item.is_featured) && (
                    <div className="absolute top-2 left-2">
                      {item.is_important ? (
                        <Badge variant="destructive" className="gap-1 text-[10px] px-1.5 py-0.5">
                          <Flame className="w-3 h-3" />
                          Важно
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary">
                          <Star className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>
                <Link to={`/news/${item.slug}`}>
                  <h4 className={`text-sm font-medium leading-snug line-clamp-3 group-hover:text-primary transition-colors ${item.is_important ? 'text-destructive font-bold' : ''}`}>
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

        {/* Right Column - Ad Banner */}
        <div className="lg:col-span-3">
          <div className="bg-muted flex flex-col items-center justify-center p-4 h-48">
            <span className="text-lg text-muted-foreground mb-1">Рекламный</span>
            <span className="text-lg text-muted-foreground">баннер</span>
          </div>
        </div>
      </div>

      {/* Second Row - More News */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* More News Cards */}
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moreNews.slice(0, 3).map((item) => (
              <article key={item.id} className="group">
                <Link to={`/news/${item.slug}`} className="block">
                  <div className="aspect-[4/3] overflow-hidden bg-muted mb-2">
                    {item.cover_image ? (
                      <OptimizedImage
                        src={item.cover_image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gig-light-gray">
                        Фото
                      </div>
                    )}
                  </div>
                </Link>
                <Link to={`/news/${item.slug}`}>
                  <h4 className="text-sm font-medium leading-snug line-clamp-3 group-hover:text-primary transition-colors">
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

        {/* Archive Calendar */}
        <div className="lg:col-span-3">
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
              <span className="text-sm capitalize">
                <span className="text-primary">{format(currentMonth, "LLLL", { locale: ru })}</span>
                <span className="text-muted-foreground">, {format(currentMonth, "yyyy")}</span>
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
              {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((day, idx) => (
                <div 
                  key={day} 
                  className={`font-medium py-1 ${idx >= 5 ? 'text-primary' : 'text-muted-foreground'}`}
                >
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
                const dayOfWeek = getDay(day);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`py-1 rounded text-xs transition-colors cursor-pointer ${
                      isToday
                        ? "bg-primary text-primary-foreground font-bold"
                        : hasNews
                        ? "text-primary font-medium hover:bg-primary/10"
                        : isWeekend
                        ? "text-primary hover:bg-muted"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* More News Button */}
      <div className="text-center mt-8">
        <Button variant="default" className="bg-primary hover:bg-primary/90 px-12 py-6 text-base" asChild>
          <Link to="/news">Больше новостей</Link>
        </Button>
      </div>
    </section>
  );
}
