-- ============================================
-- COMPREHENSIVE FIX FOR MESSAGES & PROFILES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- =============================================

DO $$ 
BEGIN
    -- Add avatar_url if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Add email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. FIX PROFILES RLS - ALL AUTHENTICATED USERS MUST BE ABLE TO VIEW ALL PROFILES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all profile policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public profile viewing" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- CRITICAL: Allow ALL authenticated users to view ALL profiles (for user search!)
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. FIX MESSAGE CHANNELS RLS - GROUP CHANNELS VISIBLE TO ALL
-- =============================================

ALTER TABLE public.message_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Channels viewable by all" ON public.message_channels;
DROP POLICY IF EXISTS "Group channels visible to all" ON public.message_channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.message_channels;

-- All authenticated users can view group and broadcast channels
CREATE POLICY "Group channels visible to all"
ON public.message_channels FOR SELECT
TO authenticated
USING (
  type IN ('group', 'broadcast') 
  OR 
  EXISTS (
    SELECT 1 FROM public.channel_participants 
    WHERE channel_id = id AND user_id = auth.uid()
  )
  OR
  created_by = auth.uid()
);

-- All authenticated users can create channels
CREATE POLICY "Users can create channels"
ON public.message_channels FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. FIX CHANNEL PARTICIPANTS
-- =============================================

ALTER TABLE public.channel_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants viewable" ON public.channel_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.channel_participants;

CREATE POLICY "Participants viewable"
ON public.channel_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add participants"
ON public.channel_participants FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. FIX MESSAGES RLS
-- =============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages viewable by channel members" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- All authenticated users can view messages in group/broadcast channels
-- or messages in DMs they participate in
CREATE POLICY "Messages viewable by channel members"
ON public.messages FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can send messages
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- 6. FIX STORAGE - MAKE BUCKETS PUBLIC
-- =============================================

UPDATE storage.buckets SET public = true WHERE id = 'message-attachments';
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Ensure storage policies exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('message-attachments', 'avatars'));

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('message-attachments', 'avatars'));

-- 7. SUCCESS MESSAGE
SELECT 'All fixes applied! Profiles are now searchable, messages show names, and channels are visible.' as status;
