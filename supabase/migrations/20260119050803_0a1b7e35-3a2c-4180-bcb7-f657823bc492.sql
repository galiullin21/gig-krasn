-- Add videos column to galleries table for video URLs
ALTER TABLE public.galleries 
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;