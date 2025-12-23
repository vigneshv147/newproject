-- Fix 1: Remove overly permissive OTP policy (edge functions use service role key which bypasses RLS)
DROP POLICY IF EXISTS "Service can manage OTP" ON otp_codes;

-- Fix 2: Update handle_new_user to always assign 'officer' role, ignoring client-provided roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always assign default 'officer' role, never trust client-provided role
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'officer'  -- Fixed role - ignore any client-provided role for security
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'officer');  -- Fixed role
  
  RETURN NEW;
END;
$$;