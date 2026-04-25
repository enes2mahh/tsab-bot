-- ============================================================
-- TSAB BOT - V6 Storage Setup
-- Creates the 'media' bucket and policies for file uploads.
-- Run AFTER complete_setup.sql + v2/v3/v4/v5
-- Safe to re-run.
-- ============================================================

-- 1) Create the 'media' bucket (public read so URLs work in <img>)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760, -- 10MB max
  ARRAY['image/png','image/jpeg','image/jpg','image/gif','image/webp','image/svg+xml','video/mp4','video/webm','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) Policies
-- Authenticated users can upload to their own folder OR if admin to any folder
DROP POLICY IF EXISTS "media_auth_upload" ON storage.objects;
CREATE POLICY "media_auth_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- Public can read all media (since bucket is public)
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

-- Owners can update their own files (by checking the first folder = user_id)
DROP POLICY IF EXISTS "media_owner_update" ON storage.objects;
CREATE POLICY "media_owner_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'media'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Owners can delete their own files (admin can delete anything)
DROP POLICY IF EXISTS "media_owner_delete" ON storage.objects;
CREATE POLICY "media_owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- 3) Verify
SELECT
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'media') AS has_bucket,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'media_%') AS policies_count;
