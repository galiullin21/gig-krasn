import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const categories = [
  { id: "all", name: "Все" },
  { id: "society", name: "Общество" },
  { id: "sport", name: "Спорт" },
  { id: "culture", name: "Культура" },
  { id: "persona", name: "Персона" },
  { id: "svo", name: "СВО" },
  { id: "city", name: "Город" },
  { id: "health", name: "Здоровье" },
];

export default function SpecialProjects() {
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch blogs as special projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ["special-projects", activeCategory],
    queryFn: async () => {
      let query = supabase
        .from("blogs")
        .select("*, categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(24);

      // Filter by category if not "all"
      // Note: In real implementation, you'd filter by category_id matching the category
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

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
          {/* Header */}
          <div className="border-l-4 border-primary pl-4 mb-6">
            <h1 className="font-condensed font-bold text-2xl md:text-3xl">Спецпроекты</h1>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-4 mb-8 border-b pb-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`pb-2 text-sm font-medium transition-colors relative ${
                  activeCategory === cat.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
                {activeCategory === cat.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content - Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[4/3] rounded-lg" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {projects.map((project, index) => (
                    <>
                      <Link
                        key={project.id}
                        to={`/blogs/${project.slug}`}
                        className="group"
                      >
                        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted mb-2 relative">
                          {project.cover_image ? (
                            <img
                              src={project.cover_image}
                              alt={project.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                              Фото
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {project.categories && (
                            <span className="text-primary">{project.categories.name}</span>
                          )}
                          {project.published_at && (
                            <span>
                              {format(new Date(project.published_at), "d.MM.yyyy", { locale: ru })}
                            </span>
                          )}
                        </div>
                      </Link>
                      
                      {/* Ad placeholder every 4th item */}
                      {(index + 1) % 4 === 0 && index < projects.length - 1 && (
                        <div key={`ad-${index}`} className="border rounded-lg p-3 bg-muted/30 flex flex-col">
                          <div className="text-center text-muted-foreground text-xs mb-2">Реклама</div>
                          <div className="flex-1 bg-muted rounded flex items-center justify-center min-h-[100px]">
                            <p className="text-xs text-muted-foreground text-center px-2">
                              Здесь может быть размещено ваше рекламное объявление
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Спецпроектов пока нет
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
