-- ============================================
-- COMPLETE DATABASE FIX
-- Run this in Supabase SQL Editor
-- This fixes all permission and table issues
-- ============================================

-- =============================================
-- 1. FIX PROFILES TABLE RLS POLICIES
-- =============================================

-- First, enable RLS if not already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create proper policies
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. FIX MESSAGE_CHANNELS TABLE
-- =============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.message_channels (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'group',
    description TEXT,
    avatar_url TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.message_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all channels" ON public.message_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.message_channels;
DROP POLICY IF EXISTS "Users can update their channels" ON public.message_channels;
DROP POLICY IF EXISTS "Anyone can view channels" ON public.message_channels;
DROP POLICY IF EXISTS "Users can update own channels" ON public.message_channels;

CREATE POLICY "Anyone can view channels"
ON public.message_channels FOR SELECT
USING (true);

CREATE POLICY "Users can create channels"
ON public.message_channels FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own channels"
ON public.message_channels FOR UPDATE
USING (auth.uid() = created_by);

-- =============================================
-- 3. FIX CHANNEL_PARTICIPANTS TABLE  
-- =============================================

CREATE TABLE IF NOT EXISTS public.channel_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ,
    UNIQUE(channel_id, user_id)
);

ALTER TABLE public.channel_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view participants" ON public.channel_participants;
DROP POLICY IF EXISTS "Users can join channels" ON public.channel_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.channel_participants;
DROP POLICY IF EXISTS "Anyone can view participants" ON public.channel_participants;

CREATE POLICY "Anyone can view participants"
ON public.channel_participants FOR SELECT
USING (true);

CREATE POLICY "Users can add participants"
ON public.channel_participants FOR INSERT
WITH CHECK (true);

-- =============================================
-- 4. FIX MESSAGE_READS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their reads" ON public.message_reads;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_reads;
DROP POLICY IF EXISTS "Users can view reads" ON public.message_reads;
DROP POLICY IF EXISTS "Users can insert reads" ON public.message_reads;

CREATE POLICY "Users can view their reads"
ON public.message_reads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark messages as read"
ON public.message_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 5. FIX MESSAGES TABLE
-- =============================================

-- Add attachment columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'attachment_url') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'attachment_name') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'attachment_type') THEN
        ALTER TABLE public.messages ADD COLUMN attachment_type TEXT;
    END IF;
END $$;

-- Make sure messages RLS is correct
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;

CREATE POLICY "Anyone can view messages"
ON public.messages FOR SELECT
USING (true);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- =============================================
-- 6. FIX STORAGE BUCKET FOR FILE UPLOADS
-- =============================================

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments', 
  'message-attachments', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760;

-- Drop all existing policies on storage.objects for this bucket
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "allow_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated uploads to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated reads from message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create new permissive policies
CREATE POLICY "Allow all authenticated uploads to message-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Allow all authenticated reads from message-attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'message-attachments');

CREATE POLICY "Allow public reads from message-attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.message_channels TO authenticated;
GRANT ALL ON public.channel_participants TO authenticated;
GRANT ALL ON public.message_reads TO authenticated;
GRANT ALL ON public.messages TO authenticated;

-- =============================================
-- SUCCESS!
-- =============================================

SELECT 'All database fixes applied successfully!' AS status;
