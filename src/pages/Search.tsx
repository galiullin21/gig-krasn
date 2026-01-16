import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Newspaper, BookOpen, FileText, Archive } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type SearchResult = {
  id: string;
  title: string;
  type: "news" | "blog" | "document" | "archive";
  slug?: string;
  date: string;
  snippet?: string;
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(initialQuery);

  const query = searchParams.get("q") || "";

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const searchTerm = `%${query}%`;

      const [newsRes, blogsRes, docsRes, archiveRes] = await Promise.all([
        supabase
          .from("news")
          .select("id, title, slug, published_at, lead")
          .eq("status", "published")
          .or(`title.ilike.${searchTerm},lead.ilike.${searchTerm},content.ilike.${searchTerm}`)
          .order("published_at", { ascending: false })
          .limit(20),
        supabase
          .from("blogs")
          .select("id, title, slug, published_at, content")
          .eq("status", "published")
          .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
          .order("published_at", { ascending: false })
          .limit(20),
        supabase
          .from("documents")
          .select("id, title, description, created_at")
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("newspaper_archive")
          .select("id, issue_number, year, issue_date")
          .or(`issue_number::text.ilike.${searchTerm},year::text.ilike.${searchTerm}`)
          .order("issue_date", { ascending: false })
          .limit(20),
      ]);

      const allResults: SearchResult[] = [];

      newsRes.data?.forEach((item) => {
        allResults.push({
          id: item.id,
          title: item.title,
          type: "news",
          slug: item.slug,
          date: item.published_at || "",
          snippet: item.lead || undefined,
        });
      });

      blogsRes.data?.forEach((item) => {
        allResults.push({
          id: item.id,
          title: item.title,
          type: "blog",
          slug: item.slug,
          date: item.published_at || "",
          snippet: item.content?.substring(0, 200) || undefined,
        });
      });

      docsRes.data?.forEach((item) => {
        allResults.push({
          id: item.id,
          title: item.title,
          type: "document",
          date: item.created_at,
          snippet: item.description || undefined,
        });
      });

      archiveRes.data?.forEach((item) => {
        allResults.push({
          id: item.id,
          title: `Выпуск №${item.issue_number} (${item.year})`,
          type: "archive",
          date: item.issue_date,
        });
      });

      return allResults;
    },
    enabled: query.trim().length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "news":
        return <Newspaper className="h-4 w-4" />;
      case "blog":
        return <BookOpen className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "archive":
        return <Archive className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "news":
        return "Новость";
      case "blog":
        return "Блог";
      case "document":
        return "Документ";
      case "archive":
        return "Архив";
    }
  };

  const getTypeLink = (result: SearchResult) => {
    switch (result.type) {
      case "news":
        return `/news/${result.slug}`;
      case "blog":
        return `/blogs/${result.slug}`;
      case "document":
        return `/documents`;
      case "archive":
        return `/archive`;
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-foreground px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const groupedResults = results?.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SearchResult["type"], SearchResult[]>
  );

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-condensed font-bold text-3xl md:text-4xl mb-6">
            Поиск по сайту
          </h1>

          <form onSubmit={handleSearch} className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Введите запрос..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Найти</Button>
          </form>

          {query && (
            <p className="text-muted-foreground mb-6">
              {isLoading
                ? "Поиск..."
                : `Найдено результатов: ${results?.length || 0}`}
            </p>
          )}

          {isLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && groupedResults && Object.keys(groupedResults).length > 0 && (
            <div className="space-y-8">
              {(["news", "blog", "document", "archive"] as const).map((type) => {
                const items = groupedResults[type];
                if (!items?.length) return null;

                return (
                  <section key={type}>
                    <h2 className="font-condensed font-bold text-xl mb-4 flex items-center gap-2">
                      {getTypeIcon(type)}
                      {type === "news" && "Новости"}
                      {type === "blog" && "Блоги"}
                      {type === "document" && "Документы"}
                      {type === "archive" && "Архив газеты"}
                      <Badge variant="secondary" className="ml-2">
                        {items.length}
                      </Badge>
                    </h2>

                    <div className="space-y-3">
                      {items.map((result) => (
                        <Link
                          key={result.id}
                          to={getTypeLink(result)}
                          className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 text-muted-foreground">
                              {getTypeIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground mb-1">
                                {highlightText(result.title, query)}
                              </h3>
                              {result.snippet && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {highlightText(result.snippet, query)}
                                </p>
                              )}
                              {result.date && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {format(new Date(result.date), "d MMMM yyyy", {
                                    locale: ru,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {!isLoading && query && results?.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-medium mb-2">Ничего не найдено</h2>
              <p className="text-muted-foreground">
                По запросу «{query}» результатов не найдено. Попробуйте изменить
                запрос.
              </p>
            </div>
          )}

          {!query && (
            <div className="text-center py-12 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Введите запрос для поиска по новостям, блогам, документам и архиву</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Search;
