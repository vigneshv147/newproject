-- Create a function to handle new user signup and insert role into user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from user metadata, default to 'officer' if not specified
  user_role := COALESCE(
    (new.raw_user_meta_data->>'role')::app_role,
    'officer'::app_role
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, user_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  
  RETURN new;
END;
$$;

-- Create trigger for new user signups to assign roles
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Also add unique constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Insert role for existing users who don't have one yet
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, COALESCE(p.role, 'officer'::app_role)
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
)
ON CONFLICT (user_id) DO NOTHING;