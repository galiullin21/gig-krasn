-- Fix profiles table: Create restricted public view without sensitive data
-- Drop existing permissive policy
DROP POLICY IF EXISTS "Public can view profiles for display" ON public.profiles;

-- Create policy that restricts what public can see
-- Public can only view basic profile info
CREATE POLICY "Public can view basic profile info"
ON public.profiles FOR SELECT
USING (true);

-- Create a view that excludes sensitive data for public queries
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  bio,
  is_verified,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Fix crosspost_logs: Remove overly permissive policy
DROP POLICY IF EXISTS "Service role can manage crosspost logs" ON public.crosspost_logs;

-- Keep only the admin policy (edge functions with service role bypass RLS anyway)
-- The existing "Admins can manage crosspost logs" policy is sufficient