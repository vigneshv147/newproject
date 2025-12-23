-- ============================================
-- FINAL FIX - Run this in Supabase SQL Editor
-- Adds avatar_url column and fixes storage access
-- ============================================

-- 1. ADD AVATAR_URL COLUMN TO PROFILES
-- =============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. CREATE/UPDATE AVATARS BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. FIX STORAGE POLICIES FOR PUBLIC ACCESS
-- =============================================

-- Drop all existing storage policies to recreate them
DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated uploads to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated reads from message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all files" ON storage.objects;

-- AVATARS BUCKET POLICIES
CREATE POLICY "Avatar uploads allowed"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatars publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- MESSAGE ATTACHMENTS BUCKET POLICIES  
CREATE POLICY "Message attachments upload allowed"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Message attachments publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

-- 4. MAKE SURE BUCKETS ARE PUBLIC
-- =============================================

UPDATE storage.buckets SET public = true WHERE id = 'avatars';
UPDATE storage.buckets SET public = true WHERE id = 'message-attachments';

-- 5. SUCCESS
-- =============================================

SELECT 'Fixed! Avatar column added and storage made publicly accessible.' AS status;
