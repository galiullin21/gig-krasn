-- Удаляем слишком разрешительную политику
DROP POLICY IF EXISTS "Service role can manage crosspost logs" ON public.crosspost_logs;