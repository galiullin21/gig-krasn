# ГиГ — Город и горожане

Официальный сайт газеты «Город и горожане» (Железногорск, Красноярский край).

## Технологии

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **UI**: shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Редактор**: TipTap

## Установка

```bash
# Клонирование репозитория
git clone https://github.com/YOUR_REPO/gig-site.git
cd gig-site

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

## Переменные окружения

Создайте файл `.env` на основе примера:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут в папке `dist/`.

## Развертывание

### Требования к хостингу

- Node.js 20+ (только для сборки)
- Любой веб-сервер для статических файлов (Nginx, Apache)
- Отдельный проект Supabase для бэкенда

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name gig26.ru www.gig26.ru;
    root /var/www/gig-site/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Структура проекта

```
src/
├── components/     # React компоненты
│   ├── admin/      # Компоненты админ-панели
│   ├── home/       # Компоненты главной страницы
│   ├── layout/     # Header, Footer, Layout
│   └── ui/         # UI-компоненты (shadcn)
├── hooks/          # React хуки
├── pages/          # Страницы приложения
│   └── admin/      # Страницы админ-панели
├── lib/            # Утилиты
└── integrations/   # Интеграции (Supabase)

supabase/
├── functions/      # Edge Functions
└── migrations/     # SQL миграции
```

## Лицензия

© МАУ "Редакция газеты Город и горожане", 2011-2025
