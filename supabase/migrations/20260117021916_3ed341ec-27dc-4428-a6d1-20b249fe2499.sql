-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'news' CHECK (type IN ('news', 'blog')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_tags junction table
CREATE TABLE public.news_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(news_id, tag_id)
);

-- Create blog_tags junction table
CREATE TABLE public.blog_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(blog_id, tag_id)
);

-- Create email_subscriptions table
CREATE TABLE public.email_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_documents junction table
CREATE TABLE public.news_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(news_id, document_id)
);

-- Create media_library table
CREATE TABLE public.media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add priority and impressions to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS impressions_count INTEGER DEFAULT 0;

-- Enable RLS on all new tables
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Public can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON public.tags FOR ALL USING (is_admin_or_editor(auth.uid()));

-- News_tags policies
CREATE POLICY "Public can view news_tags" ON public.news_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage news_tags" ON public.news_tags FOR ALL USING (is_admin_or_editor(auth.uid()));

-- Blog_tags policies
CREATE POLICY "Public can view blog_tags" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog_tags" ON public.blog_tags FOR ALL USING (is_admin_or_editor(auth.uid()));

-- Email_subscriptions policies
CREATE POLICY "Admins can view subscriptions" ON public.email_subscriptions FOR SELECT USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can manage subscriptions" ON public.email_subscriptions FOR ALL USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Public can subscribe" ON public.email_subscriptions FOR INSERT WITH CHECK (true);

-- News_documents policies
CREATE POLICY "Public can view news_documents" ON public.news_documents FOR SELECT USING (true);
CREATE POLICY "Admins can manage news_documents" ON public.news_documents FOR ALL USING (is_admin_or_editor(auth.uid()));

-- Media_library policies
CREATE POLICY "Public can view media" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Admins can manage media" ON public.media_library FOR ALL USING (is_admin_or_editor(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_tags_type ON public.tags(type);
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_news_tags_news_id ON public.news_tags(news_id);
CREATE INDEX idx_news_tags_tag_id ON public.news_tags(tag_id);
CREATE INDEX idx_blog_tags_blog_id ON public.blog_tags(blog_id);
CREATE INDEX idx_blog_tags_tag_id ON public.blog_tags(tag_id);
CREATE INDEX idx_email_subscriptions_email ON public.email_subscriptions(email);
CREATE INDEX idx_news_documents_news_id ON public.news_documents(news_id);
CREATE INDEX idx_media_library_file_type ON public.media_library(file_type);