-- Create security definer functions for role-based access
CREATE OR REPLACE FUNCTION public.is_dispatcher_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'dispatcher')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_support_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role = 'support'
  )
$$;

-- Update profiles policy: Support staff and dispatchers can view all profiles
DROP POLICY IF EXISTS "Dispatchers and support can view all profiles" ON public.profiles;
CREATE POLICY "Dispatchers and support can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.is_dispatcher_or_admin(auth.uid()) OR 
  public.is_support_staff(auth.uid())
);

-- Update messages policy: Support staff can view all messages (read-only)
DROP POLICY IF EXISTS "Support staff can view all messages" ON public.messages;
CREATE POLICY "Support staff can view all messages"
ON public.messages
FOR SELECT
USING (public.is_support_staff(auth.uid()));

-- Dispatchers can view all messages
DROP POLICY IF EXISTS "Dispatchers can view all messages" ON public.messages;
CREATE POLICY "Dispatchers can view all messages"
ON public.messages
FOR SELECT
USING (public.is_dispatcher_or_admin(auth.uid()));

-- Update message_channels: Dispatchers can view all channels
DROP POLICY IF EXISTS "Dispatchers can view all channels" ON public.message_channels;
CREATE POLICY "Dispatchers can view all channels"
ON public.message_channels
FOR SELECT
USING (public.is_dispatcher_or_admin(auth.uid()));

-- Dispatchers can manage channels (insert/update/delete)
DROP POLICY IF EXISTS "Dispatchers can manage channels" ON public.message_channels;
CREATE POLICY "Dispatchers can manage channels"
ON public.message_channels
FOR ALL
USING (public.is_dispatcher_or_admin(auth.uid()))
WITH CHECK (public.is_dispatcher_or_admin(auth.uid()));

-- Update tor_tracking: Officers can only view, not manage
DROP POLICY IF EXISTS "Officers can view tor tracking" ON public.tor_tracking;
CREATE POLICY "Officers can view tor tracking"
ON public.tor_tracking
FOR SELECT
USING (public.has_role(auth.uid(), 'officer'));

-- Dispatchers can view tor tracking
DROP POLICY IF EXISTS "Dispatchers can view tor tracking" ON public.tor_tracking;
CREATE POLICY "Dispatchers can view tor tracking"
ON public.tor_tracking
FOR SELECT
USING (public.is_dispatcher_or_admin(auth.uid()));