import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AdminOnlineIndicator } from "./AdminOnlineIndicator";
import { BurgerMenu } from "@/components/layout/BurgerMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  FileText,
  Image,
  Archive,
  Settings,
  Users,
  ArrowLeft,
  ChevronRight,
  Megaphone,
  AlertTriangle,
  Bell,
  Activity,
  Share2,
  Mail,
  Video,
} from "lucide-react";

const sidebarItems = [
  { name: "Обзор", href: "/admin", icon: LayoutDashboard },
  { name: "Новости", href: "/admin/news", icon: Newspaper },
  { name: "Блоги", href: "/admin/blogs", icon: BookOpen },
  { name: "Документы", href: "/admin/documents", icon: FileText },
  { name: "Галереи", href: "/admin/galleries", icon: Image },
  { name: "Видео", href: "/admin/videos", icon: Video },
  { name: "Архив газеты", href: "/admin/archive", icon: Archive },
  { name: "Реклама", href: "/admin/ads", icon: Megaphone },
  { name: "Кросс-постинг", href: "/admin/crosspost", icon: Share2 },
];

import { MessageSquare, Terminal, ClipboardList, DatabaseBackup } from "lucide-react";

const adminOnlyItems = [
  { name: "Пользователи", href: "/admin/users", icon: Users },
  { name: "Комментарии", href: "/admin/comments", icon: MessageSquare },
  { name: "Предупреждения", href: "/admin/warnings", icon: AlertTriangle },
  { name: "Действия", href: "/admin/actions", icon: Activity },
  { name: "Уведомления", href: "/admin/notifications", icon: Bell },
  { name: "Категории", href: "/admin/categories", icon: BookOpen },
  { name: "Рассылка", href: "/admin/newsletter", icon: Mail },
  { name: "Медиа", href: "/admin/media", icon: Image },
  { name: "Настройки", href: "/admin/settings", icon: Settings },
];

const developerOnlyItems = [
  { name: "Логи обновлений", href: "/admin/dev-logs", icon: Terminal },
  { name: "Отчёт по проекту", href: "/admin/project-report", icon: ClipboardList },
  { name: "Миграция данных", href: "/admin/migration", icon: DatabaseBackup },
];

export function AdminLayout() {
  const { user, isEditor, isAdmin, isDeveloper, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isEditor)) {
      navigate("/auth");
    }
  }, [user, isEditor, isLoading, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="hidden md:block w-64 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-4 md:p-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || !isEditor) {
    return null;
  }

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Вернуться на сайт</span>
          </Link>
          
        </div>
      </div>
      
      <div className="p-4 border-b">
        <h1 className="font-condensed font-bold text-xl">Админ-панель</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {isAdmin ? "Администратор" : "Редактор"}
        </p>
        <AdminOnlineIndicator className="mt-2" />
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/admin" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto shrink-0" />}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Администрирование
                </p>
              </div>
              {adminOnlyItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto shrink-0" />}
                  </Link>
                );
              })}
            </>
          )}

          {isDeveloper && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Разработка
                </p>
              </div>
              {developerOnlyItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto shrink-0" />}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 admin-glass-sidebar border-b border-border/50 flex items-center px-4 gap-3">
          <BurgerMenu 
            isOpen={sidebarOpen} 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
          />
          <h1 className="font-condensed font-bold text-lg">Админ-панель</h1>
        </header>
      )}

      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col admin-glass-sidebar border-r-border/30">
            <SheetHeader className="sr-only">
              <SheetTitle>Меню админ-панели</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 border-r border-border/50 admin-glass-sidebar flex flex-col shrink-0">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto",
        isMobile && "pt-14" // Add padding for mobile header
      )}>
        <Outlet />
      </main>
    </div>
  );
}
