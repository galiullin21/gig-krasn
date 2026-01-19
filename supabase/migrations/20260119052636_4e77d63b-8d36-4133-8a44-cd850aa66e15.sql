-- Fix remaining security issues

-- 1. FIX: Profiles - add policy for users to view their own profile
DROP POLICY IF EXISTS "Users can view own full profile" ON profiles;
CREATE POLICY "Users can view own full profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. FIX: Recreate public_profiles view with security_invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = on) AS
SELECT id, user_id, full_name, avatar_url, bio, is_verified, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. FIX: Email subscriptions - restrict SELECT to admins only
DROP POLICY IF EXISTS "Admins can view subscriptions" ON email_subscriptions;
DROP POLICY IF EXISTS "Only admins can view subscriptions" ON email_subscriptions;

CREATE POLICY "Only admins can view email subscriptions"
ON email_subscriptions FOR SELECT
TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

-- 4. FIX: Media library - restrict full access to admins, create public view
DROP POLICY IF EXISTS "Public can view media" ON media_library;
DROP POLICY IF EXISTS "Admins can view full media library" ON media_library;

CREATE POLICY "Admins can view media library"
ON media_library FOR SELECT
TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

-- Create public view without uploaded_by field
DROP VIEW IF EXISTS public.public_media_library;
CREATE VIEW public.public_media_library
WITH (security_invoker = on) AS
SELECT id, file_url, file_name, file_type, file_size, width, height, alt_text, created_at
FROM public.media_library;

GRANT SELECT ON public.public_media_library TO anon;
GRANT SELECT ON public.public_media_library TO authenticated;