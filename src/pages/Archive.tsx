import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Download, Calendar } from "lucide-react";

export default function Archive() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: years } = useQuery({
    queryKey: ["archive-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newspaper_archive")
        .select("year")
        .order("year", { ascending: false });

      if (error) throw error;
      const uniqueYears = [...new Set(data.map((d) => d.year))];
      return uniqueYears.length > 0 ? uniqueYears : [currentYear];
    },
  });

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

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-condensed font-bold text-foreground">
            Архив газеты
          </h1>
          <p className="text-muted-foreground mt-2">
            Электронные версии газеты «Город и горожане»
          </p>
        </div>

        {/* Year Filter */}
        <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
          {years?.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear(year)}
              className="rounded-full"
            >
              {year}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] rounded-lg" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : newspapers && newspapers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newspapers.map((issue) => (
              <a
                key={issue.id}
                href={issue.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-2 relative">
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
                <p className="text-sm font-medium text-center">
                  №{issue.issue_number}
                </p>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(issue.issue_date), "d MMM", { locale: ru })}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Выпусков за {selectedYear} год пока нет
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
