import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Download, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function Archive() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Generate years from 2012 to current
  const availableYears = Array.from(
    { length: currentYear - 2011 },
    (_, i) => currentYear - i
  );

  const { data: newspapers, isLoading } = useQuery({
    queryKey: ["archive", selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newspaper_archive")
        .select("*")
        .eq("year", selectedYear)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Group newspapers by month
  const groupedByMonth = newspapers?.reduce((acc, issue) => {
    const month = format(new Date(issue.issue_date), "LLLL yyyy", { locale: ru });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(issue);
    return acc;
  }, {} as Record<string, typeof newspapers>);

  // Get latest issue for subscription block
  const latestIssue = newspapers?.[0];

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="bg-muted">
        <div className="container py-6">
          <div className="bg-primary/10 rounded-lg flex items-center justify-center min-h-[100px] text-muted-foreground">
            <span>Рекламный баннер</span>
          </div>
        </div>
      </div>

      <div className="bg-card">
        <div className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1">
              {/* Header */}
              <div className="border-l-4 border-primary pl-4 mb-6">
                <h1 className="font-condensed font-bold text-2xl md:text-3xl">Архив</h1>
              </div>

              {/* Year Filter */}
              <div className="flex flex-wrap gap-2 md:gap-4 mb-8">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`text-sm font-medium transition-colors ${
                      selectedYear === year
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="space-y-8">
                  {[1, 2].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-8 w-40 mb-4" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <Skeleton key={j} className="aspect-[3/4] rounded-lg" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : newspapers && newspapers.length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedByMonth || {}).map(([month, issues]) => (
                    <div key={month}>
                      {/* Month header */}
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-r-lg inline-block mb-4 capitalize">
                        {month}
                      </div>

                      {/* Issues grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {issues?.map((issue) => (
                          <a
                            key={issue.id}
                            href={issue.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                          >
                            <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-2 relative border">
                              {issue.cover_image ? (
                                <img
                                  src={issue.cover_image}
                                  alt={`Выпуск №${issue.issue_number}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                  <FileText className="w-12 h-12 text-primary-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Download className="w-8 h-8 text-white" />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              "Город и горожане" №{issue.issue_number} ({issue.year})
                              <br />
                              {format(new Date(issue.issue_date), "d.MM.yyyy", { locale: ru })}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}

                </div>
              ) : (
                /* Empty state with subscription block */
                <div className="flex gap-6 items-start">
                  {latestIssue ? (
                    <a
                      href={latestIssue.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-32 shrink-0"
                    >
                      {latestIssue.cover_image ? (
                        <img
                          src={latestIssue.cover_image}
                          alt={`Выпуск №${latestIssue.issue_number}`}
                          className="w-full rounded-lg border"
                        />
                      ) : (
                        <div className="aspect-[3/4] bg-muted rounded-lg" />
                      )}
                    </a>
                  ) : (
                    <div className="w-32 aspect-[3/4] bg-muted rounded-lg shrink-0" />
                  )}
                  
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm mb-4">
                      Материалы свежего номера еженедельника «Город и горожане» появляются на сайте в течение недели после выхода номера в продажу.
                    </p>
                    <p className="text-muted-foreground text-sm mb-4">
                      Если вы не хотите ждать – купите PDF-версию газеты, бумажную версию в киосках или оформите подписку на еженедельник прямо на сайте за пару минут.
                    </p>
                    {latestIssue && (
                      <p className="text-xs text-muted-foreground mb-4">
                        Выпуск №{latestIssue.issue_number} от {format(new Date(latestIssue.issue_date), "d.MM.yyyy", { locale: ru })}
                      </p>
                    )}
                    <Button variant="default" className="rounded-full">
                      Оформить подписку
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-72 space-y-6">
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="text-center text-muted-foreground text-sm mb-2">Реклама</div>
                <div className="bg-muted rounded-lg flex items-center justify-center min-h-[200px]">
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Здесь может быть размещено ваше рекламное объявление
                  </p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>РЕКЛАМА</span>
                  <span>16.02.2024</span>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="text-center text-muted-foreground text-sm mb-2">Реклама</div>
                <div className="bg-muted rounded-lg flex items-center justify-center min-h-[200px]">
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Здесь может быть размещено ваше рекламное объявление
                  </p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>РЕКЛАМА</span>
                  <span>16.02.2024</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}
