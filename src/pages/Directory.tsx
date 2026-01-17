import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Building2, ExternalLink } from "lucide-react";

// Сайты города - данные
const citySites = [
  { name: "Администрация ЗАТО г.Железногорск", url: "https://www.admk26.ru", icon: "🏛️" },
  { name: "ВГИ (Горно-химический комбинат)", url: "https://www.sibghk.ru", icon: "🏭" },
  { name: "АО \"НЧС\" комплект М.Ф. Решетнёва", url: "https://www.iss-reshetnev.ru", icon: "🚀" },
  { name: "Клиническая больница №51 ФМБА РФ", url: "https://kb51.ru", icon: "🏥" },
  { name: "МБУ ДО ДО г.Железногорск", url: "#", icon: "🎓" },
  { name: "\"Комбинат оздоровительных и спортивных сооружений (МАУ \"КОС\")\"", url: "#", icon: "🏟️" },
  { name: "ООО \"Красно-Электро\"", url: "#", icon: "⚡" },
  { name: "МБУ \"Комбинат благоустройства\"", url: "#", icon: "🌳" },
  { name: "МП ПАТП", url: "#", icon: "🚌" },
  { name: "Парк культуры им. С.М. Кирова", url: "#", icon: "🌲" },
  { name: "Дворец культуры", url: "#", icon: "🎭" },
  { name: "Театр оперетты", url: "#", icon: "🎪" },
  { name: "МБУК \"Центр досуга\"", url: "#", icon: "🎯" },
  { name: "Центральная городская библиотека им. М. Горького", url: "#", icon: "📚" },
  { name: "Музейно-выставочный центр", url: "#", icon: "🖼️" },
  { name: "Городская образовательная сеть", url: "#", icon: "🎓" },
  { name: "Сибирская пожарно-спасательная академия ГПС МЧС России", url: "#", icon: "🚒" },
  { name: "Детская школа искусств им. А.П. Гайдара", url: "#", icon: "🎨" },
  { name: "Детская школа искусств им. М.П.Мусоргского", url: "#", icon: "🎼" },
  { name: "Дворец творчества детей и молодёжи", url: "#", icon: "🧒" },
  { name: "Наноцентр \"Сигма\"", url: "#", icon: "🔬" },
  { name: "Саянское заповедное Железногорск", url: "#", icon: "🦌" },
  { name: "МП \"Городская электрическая сеть\"", url: "#", icon: "💡" },
  { name: "МП \"Чага\"", url: "#", icon: "🍄" },
];

export default function Directory() {
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
              <div className="border-l-4 border-primary pl-4 mb-6">
                <h1 className="font-condensed font-bold text-2xl md:text-3xl">Сайты города</h1>
              </div>

              {/* Sites Grid */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <h2 className="font-medium text-center">Сайты города</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-border">
                  {citySites.map((site, index) => (
                    <a
                      key={index}
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-card p-3 hover:bg-muted/50 transition-colors text-center group"
                    >
                      <div className="text-2xl mb-2">{site.icon}</div>
                      <p className="text-xs text-muted-foreground group-hover:text-primary line-clamp-3">
                        {site.name}
                      </p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Navigation to other sections */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link 
                  to="/directory/emergency"
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Building2 className="h-5 w-5" />
                  Аварийные службы
                </Link>
                <Link 
                  to="/directory/urgent"
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  Экстренные службы
                </Link>
              </div>
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
