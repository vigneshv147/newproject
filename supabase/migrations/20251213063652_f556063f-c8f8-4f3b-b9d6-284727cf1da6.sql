-- ===========================================
-- FIX 1: Restrict channel visibility to participants only
-- ===========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view channels" ON message_channels;
DROP POLICY IF EXISTS "Users can view participants" ON channel_participants;

-- Create proper channel visibility policies
CREATE POLICY "Users can view their channels" ON message_channels
FOR SELECT USING (
  id IN (SELECT channel_id FROM channel_participants WHERE user_id = auth.uid())
  OR created_by = auth.uid()
);

CREATE POLICY "Users can view participants of their channels" ON channel_participants
FOR SELECT USING (
  channel_id IN (SELECT channel_id FROM channel_participants WHERE user_id = auth.uid())
);

-- ===========================================
-- FIX 2: Create rate_limits table for OTP rate limiting
-- ===========================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS (no public policies - only service role can access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits (identifier, action, created_at);

-- Auto-cleanup old entries (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE created_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cleanup_rate_limits ON public.rate_limits;
CREATE TRIGGER trigger_cleanup_rate_limits
  AFTER INSERT ON public.rate_limits
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_rate_limits();

-- ===========================================
-- FIX 3: Secure message-attachments storage bucket
-- ===========================================

-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'message-attachments';

-- Drop any existing policies for this bucket
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Channel members can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;

-- Allow authenticated users to upload to message-attachments
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Allow authenticated channel members to view attachments
CREATE POLICY "Channel members can view attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'message-attachments' AND
  EXISTS (
    SELECT 1 FROM channel_participants cp
    WHERE cp.user_id = auth.uid()
  )
);

-- Allow users to delete their own uploads (cast both to text for comparison)
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-attachments' AND
  (owner_id)::text = (auth.uid())::text
);