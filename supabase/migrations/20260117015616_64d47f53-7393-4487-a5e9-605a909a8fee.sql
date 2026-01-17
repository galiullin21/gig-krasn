-- Таблица для логирования кросс-постинга
CREATE TABLE public.crosspost_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,  -- 'news', 'blog', 'gallery'
  content_id UUID NOT NULL,
  platform TEXT NOT NULL,       -- 'vk', 'telegram'
  post_id TEXT,                 -- ID поста в соцсети
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.crosspost_logs ENABLE ROW LEVEL SECURITY;

-- Только админы/редакторы могут управлять логами
CREATE POLICY "Admins can manage crosspost logs"
ON public.crosspost_logs
FOR ALL
USING (is_admin_or_editor(auth.uid()));

-- Публичный доступ на чтение для edge functions (через service role)
CREATE POLICY "Service role can manage crosspost logs"
ON public.crosspost_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Индекс для быстрого поиска по контенту
CREATE INDEX idx_crosspost_logs_content ON public.crosspost_logs(content_type, content_id);