-- Add gallery_images column to news table for storing multiple images
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';