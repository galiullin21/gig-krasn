import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Code, 
  Shield, 
  Database, 
  Bell, 
  Lock,
  Smartphone,
  Palette,
  Zap,
  Menu,
  Image,
  Map,
  Phone,
  Newspaper,
  BarChart3
} from "lucide-react";

interface UpdateLog {
  version: string;
  date: string;
  type: "feature" | "fix" | "improvement" | "security";
  title: string;
  description: string;
  details?: string[];
}

const updateLogs: UpdateLog[] = [
  {
    version: "2.0.0",
    date: "2026-01-17",
    type: "feature",
    title: "Новые страницы и разделы",
    description: "Добавлены новые публичные страницы согласно обновлённому дизайну",
    details: [
      "Страница 'Справочная' (Сайты города)",
      "Страница 'Экстренные службы' (Аварийные и экстренные)",
      "Страница 'Спецпроекты' с категориями",
      "Страница 'Реклама на сайте'",
      "Страница 'Где купить газету'",
      "Обновлённое меню с иконками и подменю",
      "Расширенная админка для рекламы (11 позиций)"
    ]
  },
  {
    version: "1.9.0",
    date: "2026-01-17",
    type: "improvement",
    title: "Навигация с иконками",
    description: "Полностью переработанное главное меню с иконками и раскрывающимися подменю",
    details: [
      "Иконки Lucide для всех пунктов меню",
      "Раскрывающиеся подменю для разделов с категориями",
      "Шевроны для индикации подменю",
      "Пункт 'Экстренные службы' в главном меню"
    ]
  },
  {
    version: "1.8.0",
    date: "2026-01-17",
    type: "feature",
    title: "Расширенная система рекламы",
    description: "Добавлены новые позиции для рекламных баннеров и улучшена статистика",
    details: [
      "11 позиций для размещения рекламы",
      "Статистика показов, кликов и CTR",
      "Компонент AdBannerDisplay с автотрекингом",
      "Интеграция с edge function track-ad-click"
    ]
  },
  {
    version: "1.7.0",
    date: "2026-01-17",
    type: "improvement",
    title: "Улучшенный поиск",
    description: "Исправлена и улучшена работа поиска по сайту",
    details: [
      "Поиск по всем словам запроса",
      "Добавлен поиск по галереям",
      "Подсветка найденных терминов",
      "Очистка HTML-тегов из сниппетов"
    ]
  },
  {
    version: "1.6.0",
    date: "2026-01-17",
    type: "feature",
    title: "Архив газеты 2.0",
    description: "Переработана страница архива газеты согласно новому дизайну",
    details: [
      "Выбор года вверху страницы",
      "Группировка по месяцам с красными плашками",
      "Сетка обложек выпусков",
      "Интеграция с таблицей newspaper_archive"
    ]
  },
  {
    version: "1.5.0",
    date: "2026-01-17",
    type: "feature",
    title: "Realtime уведомления",
    description: "Добавлена система realtime уведомлений для админов и пользователей",
    details: [
      "Realtime обновление таблиц notifications и admin_notifications",
      "Автоматическое обновление счетчика непрочитанных уведомлений",
      "Подписка на изменения через Supabase Realtime"
    ]
  },
  {
    version: "1.4.0",
    date: "2026-01-17",
    type: "feature",
    title: "Уведомления о лайках и ответах",
    description: "Пользователи теперь получают уведомления о реакциях на их контент и ответах на комментарии",
    details: [
      "Уведомление при получении лайка/дизлайка на контент",
      "Уведомление при ответе на комментарий",
      "Ссылки в уведомлениях ведут на соответствующий контент"
    ]
  },
  {
    version: "1.3.0",
    date: "2026-01-17",
    type: "feature",
    title: "Управление комментариями в админ-панели",
    description: "Администраторы могут модерировать комментарии из админ-панели",
    details: [
      "Просмотр всех комментариев с информацией об авторе",
      "Возможность отвечать на комментарии от имени админа",
      "Одобрение/скрытие комментариев",
      "Удаление нежелательных комментариев",
      "Бейджи ролей (Администратор, Редактор, Разработчик) у комментариев"
    ]
  },
  {
    version: "1.2.0",
    date: "2026-01-17",
    type: "security",
    title: "Показ/скрытие пароля",
    description: "Добавлена возможность показать пароль при вводе на страницах авторизации",
    details: [
      "Компонент PasswordInput с кнопкой переключения видимости",
      "Интеграция на страницах входа и регистрации"
    ]
  },
  {
    version: "1.1.0",
    date: "2026-01-17",
    type: "improvement",
    title: "Адаптивная админ-панель",
    description: "Полная адаптация админ-панели для мобильных устройств",
    details: [
      "Мобильный хедер с бургер-меню",
      "Боковая панель открывается через Sheet на мобильных",
      "Автоматическое закрытие меню при переходе на страницу",
      "Корректное отображение на всех размерах экранов"
    ]
  },
  {
    version: "1.0.0",
    date: "2026-01-16",
    type: "feature",
    title: "Базовый функционал платформы",
    description: "Первоначальный релиз с основными функциями",
    details: [
      "Публикация новостей, блогов, галерей",
      "Система пользователей с ролями (admin, editor, author, developer)",
      "Комментарии и реакции",
      "Архив газеты",
      "Документы и категории",
      "Система рекламы",
      "Кросс-постинг в VK и Telegram",
      "Email-рассылка",
      "Предупреждения пользователей с чатом"
    ]
  }
];

const getTypeBadge = (type: UpdateLog["type"]) => {
  switch (type) {
    case "feature":
      return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Новое</Badge>;
    case "fix":
      return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Исправление</Badge>;
    case "improvement":
      return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Улучшение</Badge>;
    case "security":
      return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Безопасность</Badge>;
  }
};

const getTypeIcon = (type: UpdateLog["type"]) => {
  switch (type) {
    case "feature":
      return <Zap className="h-5 w-5 text-green-500" />;
    case "fix":
      return <Code className="h-5 w-5 text-red-500" />;
    case "improvement":
      return <Palette className="h-5 w-5 text-blue-500" />;
    case "security":
      return <Shield className="h-5 w-5 text-yellow-500" />;
  }
};

export default function AdminDevLogs() {
  const { isDeveloper, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!isDeveloper) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-condensed">Логи обновлений</h1>
        <p className="text-muted-foreground mt-1">
          История изменений и обновлений платформы (только для разработчиков)
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Zap className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {updateLogs.filter(l => l.type === "feature").length}
              </p>
              <p className="text-xs text-muted-foreground">Новых функций</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Palette className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {updateLogs.filter(l => l.type === "improvement").length}
              </p>
              <p className="text-xs text-muted-foreground">Улучшений</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Code className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {updateLogs.filter(l => l.type === "fix").length}
              </p>
              <p className="text-xs text-muted-foreground">Исправлений</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Shield className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {updateLogs.filter(l => l.type === "security").length}
              </p>
              <p className="text-xs text-muted-foreground">Безопасность</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            История изменений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {updateLogs.map((log, index) => (
                <div key={index} className="relative">
                  {index !== updateLogs.length - 1 && (
                    <div className="absolute left-[15px] top-12 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center">
                        {getTypeIcon(log.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">
                          v{log.version}
                        </span>
                        {getTypeBadge(log.type)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.date).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold">{log.title}</h3>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                      
                      {log.details && log.details.length > 0 && (
                        <ul className="text-sm space-y-1 mt-2">
                          {log.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary mt-1.5">•</span>
                              <span className="text-muted-foreground">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  {index !== updateLogs.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Technical Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Техническая информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" />
                База данных
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Supabase PostgreSQL</li>
                <li>• 27 таблиц</li>
                <li>• Realtime подписки включены</li>
                <li>• RLS политики настроены</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Безопасность
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Роли: admin, editor, author, developer</li>
                <li>• Разделение прав доступа</li>
                <li>• Защита от CSRF/XSS</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Адаптивность
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Mobile-first подход</li>
                <li>• Breakpoints: sm, md, lg, xl</li>
                <li>• Мобильное меню (Sheet)</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Уведомления
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Realtime для админов и пользователей</li>
                <li>• Лайки, комментарии, предупреждения</li>
                <li>• Email-рассылка</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
