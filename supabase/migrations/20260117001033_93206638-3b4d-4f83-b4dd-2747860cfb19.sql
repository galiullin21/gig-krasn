-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

-- Create new policy that allows both admins and developers to manage settings
CREATE POLICY "Admins and developers can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'developer'::app_role)
);