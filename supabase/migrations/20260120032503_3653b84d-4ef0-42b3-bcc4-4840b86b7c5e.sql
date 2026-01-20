-- Add video_urls column to news table for video carousel
ALTER TABLE public.news 
ADD COLUMN video_urls TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.news.video_urls IS 'Array of video URLs (YouTube, VK Video, Rutube, etc.) for video carousel block';