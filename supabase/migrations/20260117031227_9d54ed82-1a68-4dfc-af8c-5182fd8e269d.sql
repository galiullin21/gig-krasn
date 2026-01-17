-- Fix comments INSERT policy - change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;

CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);