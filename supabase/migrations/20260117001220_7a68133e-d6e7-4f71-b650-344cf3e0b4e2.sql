-- Drop existing policy
DROP POLICY IF EXISTS "Admins and developers can manage site settings" ON public.site_settings;

-- Create separate policies with proper WITH CHECK clauses

-- SELECT policy
CREATE POLICY "Admins and developers can select site settings" 
ON public.site_settings 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'developer'::app_role)
);

-- INSERT policy 
CREATE POLICY "Admins and developers can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'developer'::app_role)
);

-- UPDATE policy
CREATE POLICY "Admins and developers can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'developer'::app_role)
);

-- DELETE policy
CREATE POLICY "Admins and developers can delete site settings" 
ON public.site_settings 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'developer'::app_role)
);