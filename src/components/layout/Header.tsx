import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Menu, X, Crown, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/hooks/useAuth";

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

const menuCategories = {
  news: [
    "ОБЩЕСТВО",
    "ПОЛИЦИЯ/МЧС/ГИБДД",
    "ЗДОРОВЬЕ/МЕДИЦИНА",
    "ОБРАЗОВАНИЕ",
    "ЖКХ/РЕМОНТ",
    "КУЛЬТУРА",
    "СПОРТ",
    "МЕРОПРИЯТИЯ",
    "СВО",
  ],
  articles: [
    "ОБЩЕСТВО",
    "ПОЛИЦИЯ/МЧС/ГИБДД",
    "ЗДОРОВЬЕ/МЕДИЦИНА",
    "ОБРАЗОВАНИЕ",
    "ЖКХ/РЕМОНТ",
    "КУЛЬТУРА",
    "СПОРТ",
    "МЕРОПРИЯТИЯ",
    "СВО",
  ],
};

const mainMenu = [
  { name: "НОВОСТИ", href: "/news", hasSubmenu: true },
  { name: "СТАТЬИ", href: "/blogs", hasSubmenu: true },
  { name: "СПЕЦПРОЕКТЫ", href: "/projects", hasSubmenu: false },
  { name: "ФОТО", href: "/galleries", hasSubmenu: false },
  { name: "ВИДЕО", href: "/video", hasSubmenu: false },
  { name: "ДОКУМЕНТЫ", href: "/documents", hasSubmenu: false },
  { name: "СПРАВОЧНАЯ", href: "/directory", hasSubmenu: false },
  { name: "РЕКЛАМОДАТЕЛЯМ", href: "/advertising", hasSubmenu: false },
  { name: "АРХИВ", href: "/archive", hasSubmenu: false },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile, isAdmin, isEditor, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar - Red */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between h-12 md:h-14">
          {/* Menu button - visible on all devices */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <span className="text-primary-foreground/60 text-xl">°</span>
            <span className="text-2xl md:text-3xl font-bold font-condensed tracking-tight">
              ГиГ
            </span>
          </Link>

          {/* City name - Desktop */}
          <div className="hidden md:block text-sm">
            <span className="font-medium">Железногорск, Красноярский край</span>
          </div>

          {/* Weather Widget - Desktop */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            <span className="opacity-80">24 мкр/ч</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <span>-18</span>
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>

          {/* Social Icons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="https://t.me/gig26"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="Telegram"
            >
              <TelegramIcon />
            </a>
            <a
              href="https://ok.ru/gig26"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="Odnoklassniki"
            >
              <OKIcon />
            </a>
            <a
              href="https://vk.com/gig26"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="VKontakte"
            >
              <VKIcon />
            </a>
            <a
              href="#"
              className="hover:opacity-80 transition-opacity"
              aria-label="Viber"
            >
              <ViberIcon />
            </a>
          </div>

          {/* Search, Notifications & Auth - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="search"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 lg:w-48 h-8 bg-primary-foreground/10 border-0 text-primary-foreground placeholder:text-primary-foreground/60 pr-8"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8 text-primary-foreground hover:bg-transparent"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/search")}
            >
              <Search className="w-5 h-5" />
            </Button>
            
            <NotificationBell />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 relative"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary-foreground/20 text-primary-foreground">
                        {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                      <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/cabinet" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  {isEditor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Crown className="mr-2 h-4 w-4" />
                          {isAdmin ? "Админ-панель" : "Редактирование"}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-full max-w-md p-0 bg-primary">
          <div className="h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-foreground/10">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
              <Link to="/" className="flex items-center gap-1" onClick={() => setIsMenuOpen(false)}>
                <span className="text-primary-foreground/60 text-xl">°</span>
                <span className="text-2xl font-bold font-condensed text-primary-foreground">
                  ГиГ
                </span>
              </Link>
              <div className="text-primary-foreground text-sm">
                <span className="font-medium">Железногорск, Красноярский край</span>
              </div>
            </div>

            {/* Menu content */}
            <div className="p-6 text-primary-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main menu */}
                <div>
                  <nav className="space-y-4">
                    {mainMenu.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-lg font-medium hover:opacity-80 transition-opacity"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Latest issue */}
                  <div className="mt-8">
                    <h4 className="text-sm font-bold uppercase mb-4">Свежий номер/Купить подписку</h4>
                    <Link 
                      to="/archive" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block"
                    >
                      <div className="bg-primary-foreground/10 rounded-lg p-4 hover:bg-primary-foreground/20 transition-colors">
                        <p className="text-sm">Город и горожане</p>
                        <p className="text-xs opacity-70">Последний выпуск</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-2 gap-8">
                  {/* News categories */}
                  <div>
                    <h4 className="font-bold mb-4">НОВОСТИ</h4>
                    <nav className="space-y-2 text-sm">
                      {menuCategories.news.map((cat) => (
                        <Link
                          key={cat}
                          to={`/news?category=${encodeURIComponent(cat.toLowerCase())}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          {cat}
                        </Link>
                      ))}
                    </nav>
                  </div>

                  {/* Articles categories */}
                  <div>
                    <h4 className="font-bold mb-4">СТАТЬИ</h4>
                    <nav className="space-y-2 text-sm">
                      {menuCategories.articles.map((cat) => (
                        <Link
                          key={cat}
                          to={`/blogs?category=${encodeURIComponent(cat.toLowerCase())}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          {cat}
                        </Link>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>

              {/* Documents by year */}
              <div className="mt-8 pt-6 border-t border-primary-foreground/10">
                <h4 className="font-bold mb-4">ДОКУМЕНТЫ</h4>
                <div className="flex flex-wrap gap-2">
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].map((year) => (
                    <Link
                      key={year}
                      to={`/documents?year=${year}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="px-3 py-1 text-sm border border-primary-foreground/20 rounded hover:bg-primary-foreground/10 transition-colors"
                    >
                      {year}
                    </Link>
                  ))}
                </div>
              </div>

              {/* User section */}
              <div className="mt-8 pt-6 border-t border-primary-foreground/10">
                {user ? (
                  <div className="space-y-3">
                    <Link
                      to="/notifications"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 hover:opacity-80"
                    >
                      <Bell className="w-5 h-5" />
                      Уведомления
                    </Link>
                    <Link
                      to="/cabinet"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 hover:opacity-80"
                    >
                      <User className="w-5 h-5" />
                      Личный кабинет
                    </Link>
                    {isEditor && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 hover:opacity-80"
                      >
                        <Crown className="w-5 h-5" />
                        {isAdmin ? "Админ-панель" : "Редактирование"}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground"
                    >
                      <LogOut className="w-5 h-5" />
                      Выйти
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <User className="w-5 h-5" />
                    Войти
                  </Link>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
