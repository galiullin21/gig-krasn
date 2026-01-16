-- 1. Расширение таблицы profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Добавление роли developer в enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- 3. Создание таблицы предупреждений пользователей
CREATE TABLE public.user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    issued_by UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_read BOOLEAN DEFAULT false
);

-- Включаем RLS
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- Политики для предупреждений
CREATE POLICY "Users can view own warnings"
ON public.user_warnings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all warnings"
ON public.user_warnings
FOR ALL
USING (is_admin_or_editor(auth.uid()));

-- 4. Создание таблицы для хранения настроек темы пользователя (опционально)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Обновление политики профилей для просмотра публичной информации
CREATE POLICY "Public can view profiles for display"
ON public.profiles
FOR SELECT
USING (true);

-- 6. Разрешить админам просматривать все профили
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin_or_editor(auth.uid()));