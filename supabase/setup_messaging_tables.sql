-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- ============================================

-- Create message_channels table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'group',
    description TEXT,
    avatar_url TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create channel_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.channel_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.message_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ,
    UNIQUE(channel_id, user_id)
);

-- Create message_reads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Add attachment columns to messages table if they don't exist
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

-- Enable Row Level Security
ALTER TABLE public.message_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_channels
DROP POLICY IF EXISTS "Users can view all channels" ON public.message_channels;
CREATE POLICY "Users can view all channels" ON public.message_channels
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create channels" ON public.message_channels;
CREATE POLICY "Users can create channels" ON public.message_channels
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their channels" ON public.message_channels;
CREATE POLICY "Users can update their channels" ON public.message_channels
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for channel_participants
DROP POLICY IF EXISTS "Users can view participants" ON public.channel_participants;
CREATE POLICY "Users can view participants" ON public.channel_participants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join channels" ON public.channel_participants;
CREATE POLICY "Users can join channels" ON public.channel_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for message_reads
DROP POLICY IF EXISTS "Users can view their reads" ON public.message_reads;
CREATE POLICY "Users can view their reads" ON public.message_reads
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_reads;
CREATE POLICY "Users can mark messages as read" ON public.message_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.message_channels TO authenticated;
GRANT ALL ON public.channel_participants TO authenticated;
GRANT ALL ON public.message_reads TO authenticated;

-- Update profiles RLS policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

-- Success message
SELECT 'Database setup complete!' AS status;
