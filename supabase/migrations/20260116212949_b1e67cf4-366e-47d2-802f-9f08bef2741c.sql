-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'author');

-- Create enum for content status
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'news', -- news, blog, document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create news table
CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    lead TEXT,
    content TEXT,
    cover_image TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status public.content_status DEFAULT 'draft' NOT NULL,
    views_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,
    author_id UUID,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create blogs table
CREATE TABLE public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    cover_image TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status public.content_status DEFAULT 'draft' NOT NULL,
    views_count INTEGER DEFAULT 0,
    author_id UUID,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create newspaper archive table
CREATE TABLE public.newspaper_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_number INTEGER NOT NULL,
    issue_date DATE NOT NULL,
    year INTEGER NOT NULL,
    pdf_url TEXT NOT NULL,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create ads/banners table
CREATE TABLE public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position TEXT NOT NULL, -- header, sidebar, content, footer
    is_active BOOLEAN DEFAULT true,
    clicks_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create galleries table
CREATE TABLE public.galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    cover_image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    type TEXT NOT NULL DEFAULT 'gallery', -- gallery, photoreport
    views_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create site settings table
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newspaper_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to check if user is admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'editor')
    )
$$;

-- RLS Policies for public read access (published content)
CREATE POLICY "Public can view published news" ON public.news
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public can view published blogs" ON public.blogs
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Public can view documents" ON public.documents
    FOR SELECT USING (true);

CREATE POLICY "Public can view newspaper archive" ON public.newspaper_archive
    FOR SELECT USING (true);

CREATE POLICY "Public can view active ads" ON public.ads
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view galleries" ON public.galleries
    FOR SELECT USING (published_at IS NOT NULL);

CREATE POLICY "Public can view site settings" ON public.site_settings
    FOR SELECT USING (true);

-- RLS Policies for authenticated users (profiles)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for admin/editor write access
CREATE POLICY "Admins can manage all news" ON public.news
    FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage all blogs" ON public.blogs
    FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage documents" ON public.documents
    FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage newspaper archive" ON public.newspaper_archive
    FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage ads" ON public.ads
    FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage galleries" ON public.galleries
    FOR ALL USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can manage site settings" ON public.site_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for user_roles (only admins can manage)
CREATE POLICY "Only admins can view roles" ON public.user_roles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON public.blogs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default categories
INSERT INTO public.categories (name, slug, type) VALUES
    ('Город', 'gorod', 'news'),
    ('Власть', 'vlast', 'news'),
    ('Общество', 'obschestvo', 'news'),
    ('Спорт', 'sport', 'news'),
    ('Культура', 'kultura', 'news'),
    ('Происшествия', 'proisshestviya', 'news'),
    ('Экономика', 'ekonomika', 'news'),
    ('Философия', 'filosofiya', 'blog'),
    ('Размышления', 'razmyshleniya', 'blog'),
    ('Опыт', 'opyt', 'blog'),
    ('Постановления', 'postanovleniya', 'document'),
    ('Нормативные акты', 'normativnye-akty', 'document');

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('newspapers', 'newspapers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('galleries', 'galleries', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true);

-- Storage policies
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

CREATE POLICY "Authenticated users can upload covers" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload newspapers" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'newspapers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload galleries" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'galleries' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload ads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ads' AND auth.role() = 'authenticated');