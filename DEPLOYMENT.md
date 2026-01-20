# Инструкция по развертыванию проекта ГиГ

Полное руководство по миграции проекта с Lovable Cloud на собственный хостинг.

## Содержание

1. [Требования](#требования)
2. [Экспорт кода](#экспорт-кода)
3. [Создание Supabase проекта](#создание-supabase-проекта)
4. [Миграция базы данных](#миграция-базы-данных)
5. [Миграция файлов](#миграция-файлов)
6. [Настройка Edge Functions](#настройка-edge-functions)
7. [Развертывание фронтенда](#развертывание-фронтенда)
8. [Настройка домена и SSL](#настройка-домена-и-ssl)
9. [Проверка работоспособности](#проверка-работоспособности)

---

## Требования

### Серверные требования

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| ОС | Ubuntu 22.04 | Ubuntu 24.04 |
| RAM | 2 GB | 4 GB |
| CPU | 1 vCPU | 2 vCPU |
| Диск | 20 GB SSD | 40 GB SSD |
| Node.js | 20.x | 20.x LTS |

### Необходимое ПО

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка Nginx
sudo apt install -y nginx

# Установка Git
sudo apt install -y git

# Проверка версий
node -v  # должно быть v20.x
npm -v   # должно быть 10.x
```

---

## Экспорт кода

### Вариант 1: Через GitHub (рекомендуется)

1. В Lovable: **Settings → GitHub → Connect to GitHub**
2. Создайте репозиторий и дождитесь синхронизации
3. На сервере клонируйте репозиторий:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### Вариант 2: Скачать ZIP

1. После синхронизации с GitHub скачайте ZIP-архив
2. Распакуйте на сервере в `/var/www/gig-site/`

---

## Создание Supabase проекта

### Шаг 1: Регистрация

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте бесплатный аккаунт
3. Нажмите **New Project**

### Шаг 2: Настройка проекта

- **Name**: `gig-site` (или любое другое)
- **Database Password**: сгенерируйте надежный пароль и **сохраните его**
- **Region**: выберите ближайший (например, Frankfurt для РФ)

### Шаг 3: Сохраните ключи

После создания проекта сохраните:

| Параметр | Где найти | Пример |
|----------|-----------|--------|
| Project URL | Settings → API | `https://xxxxx.supabase.co` |
| Anon Key | Settings → API | `eyJhbGciOiJI...` |
| Service Role Key | Settings → API | `eyJhbGciOiJI...` (секретный!) |
| Database Password | Вы создали при создании проекта | `your-db-password` |

---

## Миграция базы данных

### Шаг 1: Выполнение SQL миграций

В Supabase Dashboard перейдите в **SQL Editor** и выполните миграции **в хронологическом порядке**.

Список миграций (папка `supabase/migrations/`):

```
20250116202645_floral_salad.sql
20250117001234_news_table.sql
... (все файлы по порядку)
```

**Важно:** Выполняйте файлы строго по порядку имён!

### Шаг 2: Создание функций базы данных

Выполните в SQL Editor:

```sql
-- Функция проверки роли пользователя
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Функция проверки админа/редактора
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'editor', 'developer')
  )
$$;

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Функция увеличения просмотров
CREATE OR REPLACE FUNCTION public.increment_views(table_name text, record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF table_name = 'news' THEN
    UPDATE news SET views_count = COALESCE(views_count, 0) + 1 WHERE id = record_id;
  ELSIF table_name = 'blogs' THEN
    UPDATE blogs SET views_count = COALESCE(views_count, 0) + 1 WHERE id = record_id;
  END IF;
END;
$$;

-- Триггер для создания профиля нового пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Привязка триггера к auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Шаг 3: Экспорт данных из Lovable Cloud

Для каждой таблицы в Lovable Cloud:
1. Откройте **Cloud → Database → Tables**
2. Выберите таблицу
3. Нажмите **Export CSV**

Таблицы для экспорта:
- `news`
- `blogs`
- `galleries`
- `documents`
- `newspaper_archive`
- `categories`
- `tags`
- `news_tags`
- `blog_tags`
- `profiles`
- `user_roles`
- `ads`
- `site_settings`
- `comments`
- `reactions`
- `email_subscriptions`
- `crosspost_logs`
- `media_library`

### Шаг 4: Импорт данных в новый Supabase

1. В Supabase Dashboard: **Table Editor → [таблица] → Insert → Import from CSV**
2. Загрузите соответствующий CSV файл
3. Повторите для всех таблиц

**Порядок импорта важен** (сначала независимые таблицы):
1. `categories`, `tags`
2. `news`, `blogs`, `galleries`, `documents`
3. `news_tags`, `blog_tags`
4. Остальные таблицы

---

## Миграция файлов

### Шаг 1: Создание Storage бакетов

В SQL Editor выполните:

```sql
-- Создание бакетов для хранения файлов
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('newspapers', 'newspapers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('galleries', 'galleries', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- RLS политики для публичного чтения
CREATE POLICY "Public can view covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Public can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Public can view newspapers" ON storage.objects
  FOR SELECT USING (bucket_id = 'newspapers');

CREATE POLICY "Public can view galleries" ON storage.objects
  FOR SELECT USING (bucket_id = 'galleries');

CREATE POLICY "Public can view ads" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');

CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- RLS политики для загрузки (только админы)
CREATE POLICY "Admins can upload covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can upload newspapers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'newspapers' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can upload galleries" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'galleries' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can upload ads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ads' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    public.is_admin_or_editor(auth.uid())
  );

-- RLS политики для удаления (только админы)
CREATE POLICY "Admins can delete covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'covers' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can delete newspapers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'newspapers' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can delete galleries" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'galleries' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can delete ads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ads' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can delete images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND 
    public.is_admin_or_editor(auth.uid())
  );
```

### Шаг 2: Загрузка файлов

1. Скачайте все файлы из Lovable Cloud Storage
2. В Supabase Dashboard: **Storage → [бакет] → Upload**
3. Загрузите файлы, сохраняя структуру папок

### Шаг 3: Обновление URL в базе данных

После загрузки файлов обновите URL в базе данных:

```sql
-- Замените OLD_PROJECT_ID на ID старого проекта
-- Замените NEW_PROJECT_ID на ID нового проекта

UPDATE news 
SET cover_image = REPLACE(cover_image, 'OLD_PROJECT_ID', 'NEW_PROJECT_ID')
WHERE cover_image LIKE '%OLD_PROJECT_ID%';

UPDATE blogs 
SET cover_image = REPLACE(cover_image, 'OLD_PROJECT_ID', 'NEW_PROJECT_ID')
WHERE cover_image LIKE '%OLD_PROJECT_ID%';

UPDATE galleries 
SET cover_image = REPLACE(cover_image, 'OLD_PROJECT_ID', 'NEW_PROJECT_ID')
WHERE cover_image LIKE '%OLD_PROJECT_ID%';

UPDATE ads 
SET image_url = REPLACE(image_url, 'OLD_PROJECT_ID', 'NEW_PROJECT_ID')
WHERE image_url LIKE '%OLD_PROJECT_ID%';

UPDATE newspaper_archive 
SET pdf_url = REPLACE(pdf_url, 'OLD_PROJECT_ID', 'NEW_PROJECT_ID'),
    cover_image = REPLACE(cover_image, 'OLD_PROJECT_ID', 'NEW_PROJECT_ID')
WHERE pdf_url LIKE '%OLD_PROJECT_ID%';

UPDATE documents 
SET file_url = REPLACE(file_url, 'OLD_PROJECT_ID', 'NEW_PROJECT_ID')
WHERE file_url LIKE '%OLD_PROJECT_ID%';
```

---

## Настройка Edge Functions

### Шаг 1: Установка Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -sL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/

# Проверка
supabase --version
```

### Шаг 2: Авторизация и привязка проекта

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

### Шаг 3: Развертывание функций

```bash
# Развертывание всех функций
supabase functions deploy crosspost
supabase functions deploy send-newsletter
supabase functions deploy delete-user
supabase functions deploy get-users-with-email
supabase functions deploy import-archives
supabase functions deploy import-blogs
supabase functions deploy import-documents
supabase functions deploy import-galleries
supabase functions deploy import-news
supabase functions deploy migrate-archives
supabase functions deploy scrape-article
supabase functions deploy scrape-old-site
supabase functions deploy track-ad-click
```

### Шаг 4: Настройка секретов

```bash
# VK кросспостинг
supabase secrets set VK_ACCESS_TOKEN=your_vk_token
supabase secrets set VK_GROUP_ID=your_vk_group_id

# OK.ru кросспостинг (настраивается в админ-панели через site_settings)

# Рассылка (если используете Twilio)
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set TWILIO_PHONE_NUMBER=your_phone
```

---

## Развертывание фронтенда

### Шаг 1: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### Шаг 2: Сборка проекта

```bash
cd /var/www/gig-site
npm install
npm run build
```

Собранные файлы появятся в папке `dist/`.

### Шаг 3: Настройка Nginx

Создайте конфигурацию `/etc/nginx/sites-available/gig-site`:

```nginx
server {
    listen 80;
    server_name gig26.ru www.gig26.ru;
    root /var/www/gig-site/dist;
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # SPA роутинг
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/gig-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Настройка домена и SSL

### Шаг 1: DNS настройки

В панели управления доменом создайте A-записи:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | @ | IP вашего сервера |
| A | www | IP вашего сервера |

### Шаг 2: SSL сертификат (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d gig26.ru -d www.gig26.ru
```

Certbot автоматически обновит конфигурацию Nginx для HTTPS.

### Шаг 3: Настройка Supabase Authentication

В Supabase Dashboard: **Authentication → URL Configuration**

- **Site URL**: `https://gig26.ru`
- **Redirect URLs**: 
  - `https://gig26.ru`
  - `https://gig26.ru/auth`
  - `https://gig26.ru/cabinet`

---

## Проверка работоспособности

### Чек-лист после развертывания

- [ ] Главная страница загружается
- [ ] Новости отображаются корректно
- [ ] Изображения загружаются
- [ ] Регистрация работает
- [ ] Вход в систему работает
- [ ] Админ-панель доступна для администраторов
- [ ] Создание/редактирование новостей работает
- [ ] Загрузка файлов работает
- [ ] Кросспостинг в VK работает
- [ ] Кросспостинг в OK.ru работает
- [ ] Архив газеты отображается
- [ ] Документы скачиваются
- [ ] Комментарии работают

### Типичные проблемы

#### Проблема: Изображения не загружаются
**Решение:** Проверьте, что бакеты Storage созданы и имеют правильные RLS политики.

#### Проблема: 404 ошибки при переходе по ссылкам
**Решение:** Убедитесь, что в Nginx настроен `try_files $uri $uri/ /index.html;`

#### Проблема: Ошибки аутентификации
**Решение:** Проверьте Site URL и Redirect URLs в настройках Supabase Auth.

#### Проблема: Edge Functions не работают
**Решение:** Проверьте, что функции развернуты и секреты настроены:
```bash
supabase functions list
supabase secrets list
```

---

## Автоматизация обновлений

### Скрипт обновления (deploy.sh)

```bash
#!/bin/bash
set -e

echo "🔄 Обновление кода..."
cd /var/www/gig-site
git pull origin main

echo "📦 Установка зависимостей..."
npm install

echo "🔨 Сборка проекта..."
npm run build

echo "🔄 Перезагрузка Nginx..."
sudo systemctl reload nginx

echo "✅ Развертывание завершено!"
```

Сделайте скрипт исполняемым:
```bash
chmod +x deploy.sh
```

---

## Контакты поддержки

При возникновении проблем обращайтесь:
- Email: gig-26@mail.ru
- Телефон: +7 (3919) 74-66-11

---

*Документ обновлён: Январь 2025*
