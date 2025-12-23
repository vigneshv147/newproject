-- Fix: Restrict message visibility to channel participants and message senders only

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view messages" ON messages;

-- Create proper channel-based access policy
CREATE POLICY "Users can view messages in their channels" ON messages
FOR SELECT USING (
  channel_id IN (
    SELECT channel_id FROM channel_participants 
    WHERE user_id = auth.uid()
  )
  OR sender_id = auth.uid()
);