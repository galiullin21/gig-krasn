import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, Cloud, Sun, X, Crown, LogOut, Bell } from "lucide-react";
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
import { BurgerMenu } from "./BurgerMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Новости", href: "/news" },
  { name: "Блоги", href: "/blogs" },
  { name: "Архив газеты", href: "/archive" },
  { name: "Документы", href: "/documents" },
  { name: "Фотогалерея", href: "/galleries" },
  { name: "Карта города", href: "/map" },
  { name: "Контакты", href: "/contacts" },
];

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile, isAdmin, isEditor, signOut } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar - Red */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-2xl md:text-3xl font-bold font-condensed tracking-tight">
                ГиГ
              </span>
              <span className="ml-1 text-xs bg-primary-foreground/20 px-1 rounded">
                16+
              </span>
            </div>
          </Link>

          {/* City name - Desktop */}
          <div className="hidden md:flex flex-col items-center">
            <span className="text-lg font-condensed font-bold uppercase tracking-wider">
              Железногорск
            </span>
            <span className="text-xs opacity-80">Красноярский край</span>
          </div>

          {/* Weather Widget */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Sun className="w-5 h-5" />
            <span>-12°C</span>
            <Cloud className="w-4 h-4 opacity-70" />
          </div>

          {/* Social Icons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://vk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="VKontakte"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.189 1.366 1.259 2.18 1.815.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.246.999-1.33 1.398-2.142 1.273-2.489-.12-.332-.859-.244-.859-.244l-2.45.015s-.182-.025-.316.056c-.131.079-.216.263-.216.263s-.387 1.028-.903 1.903c-1.088 1.848-1.523 1.946-1.701 1.831-.414-.267-.31-1.075-.31-1.648 0-1.793.273-2.539-.532-2.733-.267-.064-.463-.106-1.146-.113-.876-.009-1.617.003-2.036.208-.278.136-.493.44-.363.457.162.022.528.099.722.363.251.341.242 1.107.242 1.107s.144 2.11-.336 2.372c-.33.179-.782-.187-1.753-1.868-.497-.861-.872-1.814-.872-1.814s-.072-.177-.201-.272c-.156-.115-.374-.151-.374-.151l-2.328.015s-.35.01-.478.161c-.114.135-.009.413-.009.413s1.819 4.254 3.878 6.399c1.889 1.966 4.032 1.837 4.032 1.837h.972z" />
              </svg>
            </a>
            <a
              href="https://ok.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="Odnoklassniki"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm4.5 8.5c-.69.69-1.602 1.063-2.546 1.206l2.046 2.044a1 1 0 01-1.414 1.414L12 17.078l-2.586 2.586a1 1 0 01-1.414-1.414l2.046-2.044c-.944-.143-1.856-.516-2.546-1.206a1 1 0 011.414-1.414c1.17 1.17 3.002 1.17 4.172 0a1 1 0 011.414 1.414z" />
              </svg>
            </a>
          </div>

          {/* Search, Theme & Auth - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 h-8 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
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
                  <User className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-4 h-4" />
            </Button>
            <BurgerMenu
              isOpen={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-primary-foreground"
            />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetContent side="right" className="w-72">
                <nav className="flex flex-col gap-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <hr className="my-2" />
                  {user ? (
                    <>
                      <Link
                        to="/notifications"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                      >
                        <Bell className="w-5 h-5" />
                        Уведомления
                      </Link>
                      <Link
                        to="/cabinet"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                      >
                        <User className="w-5 h-5" />
                        Личный кабинет
                      </Link>
                      {isEditor && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
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
                        className="flex items-center gap-2 text-lg font-medium text-destructive hover:opacity-80 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        Выйти
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                    >
                      <User className="w-5 h-5" />
                      Войти
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden px-4 pb-3">
            <form onSubmit={handleSearch}>
              <Input
                type="search"
                placeholder="Поиск по сайту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
              />
            </form>
          </div>
        )}
      </div>

      {/* Navigation bar - White */}
      <nav className="bg-card border-b hidden md:block">
        <div className="container">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className="block px-4 py-3 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
