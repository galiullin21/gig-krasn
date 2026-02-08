-- Add scheduled publication fields to news table
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS scheduled_crosspost boolean DEFAULT false;

-- Add scheduled publication fields to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS scheduled_crosspost boolean DEFAULT false;

-- Add scheduled publication fields to galleries table
ALTER TABLE public.galleries 
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS scheduled_crosspost boolean DEFAULT false;

-- Create index for efficient scheduled content queries
CREATE INDEX IF NOT EXISTS idx_news_scheduled_at ON public.news(scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'draft';
CREATE INDEX IF NOT EXISTS idx_blogs_scheduled_at ON public.blogs(scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'draft';
CREATE INDEX IF NOT EXISTS idx_galleries_scheduled_at ON public.galleries(scheduled_at) WHERE scheduled_at IS NOT NULL AND published_at IS NULL;