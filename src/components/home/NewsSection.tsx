import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { NewsCard } from "./NewsCard";
import { Button } from "@/components/ui/button";

interface NewsItem {
  id: string;
  title: string;
  lead?: string;
  coverImage?: string;
  category: string;
  date: string;
  slug: string;
}

const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Железногорский ГХК отметил 75-летие",
    lead: "Юбилейные торжества прошли в городском дворце культуры с участием губернатора края",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop",
    category: "Город",
    date: "16 января 2026",
    slug: "ghk-75-let",
  },
  {
    id: "2",
    title: "Новый детский сад открылся в микрорайоне №5",
    lead: "Учреждение рассчитано на 280 детей и оборудовано по последним стандартам",
    coverImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop",
    category: "Общество",
    date: "15 января 2026",
    slug: "novyj-detskij-sad",
  },
  {
    id: "3",
    title: "Хоккеисты «Сокола» одержали победу в краевом турнире",
    coverImage: "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=600&h=400&fit=crop",
    category: "Спорт",
    date: "14 января 2026",
    slug: "sokol-pobeda",
  },
  {
    id: "4",
    title: "В городе стартовала программа благоустройства дворов",
    coverImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    category: "Город",
    date: "13 января 2026",
    slug: "blagoustrojstvo-dvorov",
  },
  {
    id: "5",
    title: "Культурный центр представил новую выставку",
    category: "Культура",
    date: "12 января 2026",
    slug: "novaya-vystavka",
  },
  {
    id: "6",
    title: "Городская администрация утвердила бюджет на 2026 год",
    category: "Власть",
    date: "11 января 2026",
    slug: "byudzhet-2026",
  },
];

export function NewsSection() {
  const featuredNews = mockNews.slice(0, 2);
  const regularNews = mockNews.slice(2, 4);
  const smallNews = mockNews.slice(4);

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-condensed font-bold uppercase">Новости</h2>
        <Link
          to="/news"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Все новости
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured news - Left column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredNews.map((news) => (
            <NewsCard
              key={news.id}
              id={news.id}
              title={news.title}
              lead={news.lead}
              coverImage={news.coverImage}
              category={news.category}
              date={news.date}
              slug={news.slug}
            />
          ))}
          {regularNews.map((news) => (
            <NewsCard
              key={news.id}
              id={news.id}
              title={news.title}
              coverImage={news.coverImage}
              category={news.category}
              date={news.date}
              slug={news.slug}
              variant="horizontal"
            />
          ))}
        </div>

        {/* Sidebar - Right column */}
        <div className="space-y-6">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-condensed font-bold text-lg mb-4 uppercase">
              Популярное
            </h3>
            <div className="space-y-4">
              {smallNews.map((news, index) => (
                <div key={news.id} className="flex gap-3">
                  <span className="text-2xl font-bold text-muted-foreground/30">
                    {index + 1}
                  </span>
                  <NewsCard
                    id={news.id}
                    title={news.title}
                    category={news.category}
                    date={news.date}
                    slug={news.slug}
                    variant="small"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ad placeholder */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <span className="text-xs text-muted-foreground uppercase">
              Реклама
            </span>
            <div className="h-48 bg-muted-foreground/10 rounded mt-2 flex items-center justify-center">
              <span className="text-muted-foreground">Рекламный баннер</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Button variant="default" size="lg" asChild>
          <Link to="/news">Больше новостей</Link>
        </Button>
      </div>
    </section>
  );
}
