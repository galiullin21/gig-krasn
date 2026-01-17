import { useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminOnlineIndicator } from "./AdminOnlineIndicator";
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
} from "lucide-react";

const sidebarItems = [
  { name: "Обзор", href: "/admin", icon: LayoutDashboard },
  { name: "Новости", href: "/admin/news", icon: Newspaper },
  { name: "Блоги", href: "/admin/blogs", icon: BookOpen },
  { name: "Документы", href: "/admin/documents", icon: FileText },
  { name: "Галереи", href: "/admin/galleries", icon: Image },
  { name: "Архив газеты", href: "/admin/archive", icon: Archive },
  { name: "Реклама", href: "/admin/ads", icon: Megaphone },
  { name: "Кросс-постинг", href: "/admin/crosspost", icon: Share2 },
];

import { MessageSquare } from "lucide-react";

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

export function AdminLayout() {
  const { user, isEditor, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isEditor)) {
      navigate("/auth");
    }
  }, [user, isEditor, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || !isEditor) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Вернуться на сайт</span>
          </Link>
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
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
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                      {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
