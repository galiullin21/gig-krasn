-- Fix security issues: restrict profiles access and add storage delete/update policies

-- 1. Drop overly permissive profile policy and create proper ones
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Create new restrictive policy - only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 2. Add DELETE policies for storage buckets

-- Admins can delete files from covers bucket
CREATE POLICY "Admins can delete covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Admins can delete files from galleries bucket
CREATE POLICY "Admins can delete galleries files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'galleries' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Admins can delete files from documents bucket
CREATE POLICY "Admins can delete documents files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Admins can delete files from newspapers bucket
CREATE POLICY "Admins can delete newspapers files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'newspapers' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Admins can delete files from ads bucket
CREATE POLICY "Admins can delete ads files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ads' 
  AND public.is_admin_or_editor(auth.uid())
);

-- 3. Add UPDATE policies for storage buckets

-- Admins can update files in covers bucket
CREATE POLICY "Admins can update covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Admins can update files in galleries bucket
CREATE POLICY "Admins can update galleries files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'galleries' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Admins can update files in documents bucket
CREATE POLICY "Admins can update documents files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Admins can update files in newspapers bucket
CREATE POLICY "Admins can update newspapers files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'newspapers' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Admins can update files in ads bucket
CREATE POLICY "Admins can update ads files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ads' 
  AND public.is_admin_or_editor(auth.uid())
);