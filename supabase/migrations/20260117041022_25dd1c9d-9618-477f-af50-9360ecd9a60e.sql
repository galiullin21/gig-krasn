-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Create a more restrictive public policy that only returns non-sensitive data
-- Note: Column-level RLS isn't fully supported, so we'll use the view approach
-- The public_profiles view already excludes phone and social_links

-- Ensure authenticated users can see full profiles of other users (for admin panel)
-- But anonymous users should use the public_profiles view

-- Create policy: Only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Anonymous users should use public_profiles view instead
-- No policy for anon role means they can't access the base table