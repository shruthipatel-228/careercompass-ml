
-- Create a function to auto-assign admin to the first user who signs up
CREATE OR REPLACE FUNCTION public.assign_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If no roles exist yet, make this user an admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-assign admin on first signup
CREATE TRIGGER on_first_user_assign_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_first_user_admin();

-- Insert admin role for the existing first user (john@gmail.com)
INSERT INTO public.user_roles (user_id, role)
VALUES ('0705ca73-d920-4030-bfca-1185818b8957', 'admin')
ON CONFLICT DO NOTHING;
