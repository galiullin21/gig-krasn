-- Create function to increment views count
CREATE OR REPLACE FUNCTION public.increment_views(table_name text, record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF table_name = 'news' THEN
    UPDATE news SET views_count = COALESCE(views_count, 0) + 1 WHERE id = record_id;
  ELSIF table_name = 'blogs' THEN
    UPDATE blogs SET views_count = COALESCE(views_count, 0) + 1 WHERE id = record_id;
  END IF;
END;
$$;