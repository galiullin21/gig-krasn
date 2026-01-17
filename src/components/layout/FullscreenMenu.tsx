import { Link } from "react-router-dom";
import { X, Search, Newspaper, FileText, Star, Camera, Video, FolderOpen, BookOpen, Phone, Megaphone, Archive, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Social icons
const VKIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.189 1.366 1.259 2.18 1.815.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.246.999-1.33 1.398-2.142 1.273-2.489-.12-.332-.859-.244-.859-.244l-2.45.015s-.182-.025-.316.056c-.131.079-.216.263-.216.263s-.387 1.028-.903 1.903c-1.088 1.848-1.523 1.946-1.701 1.831-.414-.267-.31-1.075-.31-1.648 0-1.793.273-2.539-.532-2.733-.267-.064-.463-.106-1.146-.113-.876-.009-1.617.003-2.036.208-.278.136-.493.44-.363.457.162.022.528.099.722.363.251.341.242 1.107.242 1.107s.144 2.11-.336 2.372c-.33.179-.782-.187-1.753-1.868-.497-.861-.872-1.814-.872-1.814s-.072-.177-.201-.272c-.156-.115-.374-.151-.374-.151l-2.328.015s-.35.01-.478.161c-.114.135-.009.413-.009.413s1.819 4.254 3.878 6.399c1.889 1.966 4.032 1.837 4.032 1.837h.972z" />
  </svg>
);

const OKIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm4.5 8.5c-.69.69-1.602 1.063-2.546 1.206l2.046 2.044a1 1 0 01-1.414 1.414L12 17.078l-2.586 2.586a1 1 0 01-1.414-1.414l2.046-2.044c-.944-.143-1.856-.516-2.546-1.206a1 1 0 011.414-1.414c1.17 1.17 3.002 1.17 4.172 0a1 1 0 011.414 1.414z" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
  </svg>
);

const ViberIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.18 1.88 5.82L2 22l4.18-1.88C7.82 21.3 9.83 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.5 14.5c-.25.7-1.45 1.33-2 1.4-.5.07-1.15.1-1.85-.12-.42-.13-1-.32-1.7-.62-3-1.3-4.95-4.4-5.1-4.6-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.15 1.05-2.45.25-.25.55-.35.75-.35h.55c.2 0 .45-.05.7.5.25.6.9 2.15.95 2.3.1.15.1.35 0 .55-.05.15-.1.25-.2.4-.1.1-.2.25-.3.35-.1.1-.2.2-.1.4.15.2.6.95 1.25 1.55.85.75 1.55 1 1.8 1.1.2.1.35.1.5-.05.1-.15.5-.6.65-.8.15-.2.3-.2.5-.1.2.05 1.25.6 1.45.7.25.1.4.15.45.25.1.1.1.6-.15 1.15z" />
  </svg>
);

const newsCategories = [
  { name: "Общество", slug: "obshchestvo" },
  { name: "Полиция/МЧС/ГИБДД", slug: "politsiya-mchs-gibdd" },
  { name: "Здоровье/медицина", slug: "zdorove-meditsina" },
  { name: "Образование", slug: "obrazovanie" },
  { name: "ЖКХ/ремонт", slug: "zhkkh-remont" },
  { name: "Культура", slug: "kultura" },
  { name: "Спорт", slug: "sport" },
  { name: "Мероприятия", slug: "meropriyatiya" },
  { name: "СВО", slug: "svo" },
];

const directoryItems = [
  { name: "Сайты города", href: "/directory" },
  { name: "Экстренные службы", href: "/emergency" },
  { name: "Где купить газету", href: "/where-to-buy" },
];

const specProjectCategories = [
  { name: "Все проекты", slug: "" },
  { name: "Общество", slug: "society" },
  { name: "Спорт", slug: "sport" },
  { name: "Культура", slug: "culture" },
  { name: "Персона", slug: "persona" },
  { name: "СВО", slug: "svo" },
  { name: "Город", slug: "city" },
  { name: "Здоровье", slug: "health" },
];

const documentYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

interface FullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveSubmenu = "news" | "articles" | "specprojects" | "directory" | "documents" | null;

export function FullscreenMenu({ isOpen, onClose }: FullscreenMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubmenu, setActiveSubmenu] = useState<ActiveSubmenu>(null);
  const navigate = useNavigate();

  // Fetch latest newspaper
  const { data: latestNewspaper } = useQuery({
    queryKey: ["latest-newspaper"],
    queryFn: async () => {
      const { data } = await supabase
        .from("newspaper_archive")
        .select("*")
        .order("issue_date", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: isOpen,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      onClose();
    }
  };

  const handleLinkClick = () => {
    setActiveSubmenu(null);
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Red left panel with main menu */}
      <div className="w-full lg:w-[320px] bg-primary text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          <Link to="/" onClick={handleLinkClick} className="flex items-center">
            <span className="text-2xl font-black tracking-tight">
              <span className="text-white">°</span>ГиГ
            </span>
          </Link>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Main navigation */}
        <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
          {/* Новости с подменю */}
          <button
            onClick={() => setActiveSubmenu(activeSubmenu === "news" ? null : "news")}
            className={`flex items-center gap-3 w-full text-left text-lg font-medium py-2 transition-colors ${
              activeSubmenu === "news" ? "text-white" : "text-white/80 hover:text-white"
            }`}
          >
            <Newspaper className="w-5 h-5" />
            <span className="flex-1">НОВОСТИ</span>
            {activeSubmenu === "news" ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {activeSubmenu === "news" && (
            <div className="pl-4 space-y-1 border-l border-white/20 ml-2">
              <Link to="/news" onClick={handleLinkClick} className="block text-sm py-1 text-white/70 hover:text-white">
                Все новости
              </Link>
              {newsCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/news?category=${cat.slug}`}
                  onClick={handleLinkClick}
                  className="block text-sm py-1 text-white/70 hover:text-white"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
          
          {/* Статьи с подменю */}
          <button
            onClick={() => setActiveSubmenu(activeSubmenu === "articles" ? null : "articles")}
            className={`flex items-center gap-3 w-full text-left text-lg font-medium py-2 transition-colors ${
              activeSubmenu === "articles" ? "text-white" : "text-white/80 hover:text-white"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="flex-1">СТАТЬИ</span>
            {activeSubmenu === "articles" ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {activeSubmenu === "articles" && (
            <div className="pl-4 space-y-1 border-l border-white/20 ml-2">
              <Link to="/blogs" onClick={handleLinkClick} className="block text-sm py-1 text-white/70 hover:text-white">
                Все статьи
              </Link>
              {newsCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/blogs?category=${cat.slug}`}
                  onClick={handleLinkClick}
                  className="block text-sm py-1 text-white/70 hover:text-white"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Спецпроекты с подменю */}
          <button
            onClick={() => setActiveSubmenu(activeSubmenu === "specprojects" ? null : "specprojects")}
            className={`flex items-center gap-3 w-full text-left text-lg font-medium py-2 transition-colors ${
              activeSubmenu === "specprojects" ? "text-white" : "text-white/80 hover:text-white"
            }`}
          >
            <Star className="w-5 h-5" />
            <span className="flex-1">СПЕЦПРОЕКТЫ</span>
            {activeSubmenu === "specprojects" ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {activeSubmenu === "specprojects" && (
            <div className="pl-4 space-y-1 border-l border-white/20 ml-2">
              {specProjectCategories.map((cat) => (
                <Link
                  key={cat.slug || "all"}
                  to={cat.slug ? `/special-projects?category=${cat.slug}` : "/special-projects"}
                  onClick={handleLinkClick}
                  className="block text-sm py-1 text-white/70 hover:text-white"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Медиа */}
          <Link
            to="/galleries"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-lg font-medium py-2 text-white/80 hover:text-white transition-colors"
          >
            <Camera className="w-5 h-5" />
            ФОТО
          </Link>

          <Link
            to="/galleries?type=video"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-lg font-medium py-2 text-white/80 hover:text-white transition-colors"
          >
            <Video className="w-5 h-5" />
            ВИДЕО
          </Link>

          {/* Документы с подменю */}
          <button
            onClick={() => setActiveSubmenu(activeSubmenu === "documents" ? null : "documents")}
            className={`flex items-center gap-3 w-full text-left text-lg font-medium py-2 transition-colors ${
              activeSubmenu === "documents" ? "text-white" : "text-white/80 hover:text-white"
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="flex-1">ДОКУМЕНТЫ</span>
            {activeSubmenu === "documents" ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {activeSubmenu === "documents" && (
            <div className="pl-4 space-y-1 border-l border-white/20 ml-2">
              <Link to="/documents" onClick={handleLinkClick} className="block text-sm py-1 text-white/70 hover:text-white">
                Все документы
              </Link>
              {documentYears.slice(0, 5).map((year) => (
                <Link
                  key={year}
                  to={`/documents?year=${year}`}
                  onClick={handleLinkClick}
                  className="block text-sm py-1 text-white/70 hover:text-white"
                >
                  {year}
                </Link>
              ))}
            </div>
          )}

          {/* Справочная с подменю */}
          <button
            onClick={() => setActiveSubmenu(activeSubmenu === "directory" ? null : "directory")}
            className={`flex items-center gap-3 w-full text-left text-lg font-medium py-2 transition-colors ${
              activeSubmenu === "directory" ? "text-white" : "text-white/80 hover:text-white"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="flex-1">СПРАВОЧНАЯ</span>
            {activeSubmenu === "directory" ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {activeSubmenu === "directory" && (
            <div className="pl-4 space-y-1 border-l border-white/20 ml-2">
              {directoryItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleLinkClick}
                  className="block text-sm py-1 text-white/70 hover:text-white"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          {/* Простые ссылки */}
          <Link
            to="/emergency"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-lg font-medium py-2 text-white/80 hover:text-white transition-colors"
          >
            <Phone className="w-5 h-5" />
            ЭКСТРЕННЫЕ СЛУЖБЫ
          </Link>

          <Link
            to="/advertising"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-lg font-medium py-2 text-white/80 hover:text-white transition-colors"
          >
            <Megaphone className="w-5 h-5" />
            РЕКЛАМОДАТЕЛЯМ
          </Link>

          <Link
            to="/archive"
            onClick={handleLinkClick}
            className="flex items-center gap-3 text-lg font-medium py-2 text-white/80 hover:text-white transition-colors"
          >
            <Archive className="w-5 h-5" />
            АРХИВ
          </Link>
        </nav>

        {/* Bottom section - Latest newspaper */}
        <div className="p-6 border-t border-white/10">
          <h4 className="text-sm font-medium mb-3 text-white/80">СВЕЖИЙ НОМЕР/КУПИТЬ ПОДПИСКУ</h4>
          {latestNewspaper && (
            <Link 
              to="/archive" 
              onClick={handleLinkClick}
              className="flex items-start gap-3 group"
            >
              {latestNewspaper.cover_image ? (
                <div className="w-20 h-28 rounded overflow-hidden flex-shrink-0 bg-white/10">
                  <OptimizedImage
                    src={latestNewspaper.cover_image}
                    alt="Свежий номер"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-28 rounded bg-white/10 flex-shrink-0" />
              )}
              <div className="text-sm text-white/70 group-hover:text-white transition-colors">
                <p>Город и горожане №{latestNewspaper.issue_number}</p>
                <p>({format(new Date(latestNewspaper.issue_date), "d.MM.yyyy", { locale: ru })})</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* White right panel - expanded content */}
      <div className="hidden lg:flex flex-1 bg-background overflow-y-auto">
        <div className="p-8 w-full">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative max-w-md mb-8">
            <Input
              type="search"
              placeholder="поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-0 border-b border-border rounded-none px-0 focus-visible:ring-0"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-10 w-10"
            >
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {/* Categories grid */}
          <div className="grid grid-cols-3 gap-12">
            {/* News categories */}
            <div>
              <h3 className="font-bold text-lg mb-4 border-b pb-2">НОВОСТИ</h3>
              <nav className="space-y-2">
                {newsCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/news?category=${cat.slug}`}
                    onClick={handleLinkClick}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors uppercase"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Articles categories */}
            <div>
              <h3 className="font-bold text-lg mb-4 border-b pb-2">СТАТЬИ</h3>
              <nav className="space-y-2">
                {newsCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/blogs?category=${cat.slug}`}
                    onClick={handleLinkClick}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors uppercase"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Documents */}
            <div>
              <h3 className="font-bold text-lg mb-4 border-b pb-2">ДОКУМЕНТЫ</h3>
              <nav className="space-y-2">
                {documentYears.map((year) => (
                  <Link
                    key={year}
                    to={`/documents?year=${year}`}
                    onClick={handleLinkClick}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {year}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4 mt-12 pt-6 border-t">
            <a
              href="https://vk.com/gig26"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <VKIcon />
            </a>
            <a
              href="https://t.me/gig26"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <TelegramIcon />
            </a>
            <a
              href="https://ok.ru/gig26"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <OKIcon />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ViberIcon />
            </a>
          </div>
        </div>
      </div>

      {/* Mobile submenu overlay */}
      {activeSubmenu && (
        <div className="lg:hidden absolute inset-0 bg-background text-foreground overflow-y-auto">
          <div className="p-4 border-b flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveSubmenu(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            <span className="font-bold">
              {activeSubmenu === "news" && "Новости"}
              {activeSubmenu === "articles" && "Статьи"}
              {activeSubmenu === "specprojects" && "Спецпроекты"}
              {activeSubmenu === "directory" && "Справочная"}
              {activeSubmenu === "documents" && "Документы"}
            </span>
          </div>
          <nav className="p-6 space-y-3">
            {activeSubmenu === "news" && newsCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/news?category=${cat.slug}`}
                onClick={handleLinkClick}
                className="block py-2 border-b border-border/50"
              >
                {cat.name}
              </Link>
            ))}
            {activeSubmenu === "articles" && newsCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/blogs?category=${cat.slug}`}
                onClick={handleLinkClick}
                className="block py-2 border-b border-border/50"
              >
                {cat.name}
              </Link>
            ))}
            {activeSubmenu === "specprojects" && (
              <Link
                to="/special-projects"
                onClick={handleLinkClick}
                className="block py-2 border-b border-border/50"
              >
                Все спецпроекты
              </Link>
            )}
            {activeSubmenu === "directory" && directoryItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleLinkClick}
                className="block py-2 border-b border-border/50"
              >
                {item.name}
              </Link>
            ))}
            {activeSubmenu === "documents" && documentYears.map((year) => (
              <Link
                key={year}
                to={`/documents?year=${year}`}
                onClick={handleLinkClick}
                className="block py-2 border-b border-border/50"
              >
                {year}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
