-- Allow any authenticated user to INSERT admin notifications (for comment/reaction/share events)
DROP POLICY IF EXISTS "Admins can manage admin notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admins can view admin notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Authenticated users can create admin notifications" ON public.admin_notifications;

-- Admins can do everything
CREATE POLICY "Admins can manage admin notifications"
ON public.admin_notifications
FOR ALL
TO authenticated
USING (is_admin_or_editor(auth.uid()))
WITH CHECK (is_admin_or_editor(auth.uid()));

-- Admins can view all
CREATE POLICY "Admins can view admin notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (is_admin_or_editor(auth.uid()));

-- Any authenticated user can INSERT notifications (for system events)
CREATE POLICY "Authenticated users can create admin notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);