-- Link existing employee records to their auth user accounts by matching email
UPDATE public.employees e
SET user_id = u.id
FROM auth.users u
WHERE LOWER(e.email) = LOWER(u.email)
  AND e.user_id IS NULL;

-- Auto-link future signups: when a new auth user signs up, link to existing employee record by email
CREATE OR REPLACE FUNCTION public.link_employee_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.employees
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_employee ON auth.users;
CREATE TRIGGER on_auth_user_created_link_employee
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_employee_on_signup();

-- Also link when an employee record is created with an email matching an existing auth user
CREATE OR REPLACE FUNCTION public.link_employee_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT id INTO NEW.user_id FROM auth.users WHERE LOWER(email) = LOWER(NEW.email) LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_employee_to_user_trigger ON public.employees;
CREATE TRIGGER link_employee_to_user_trigger
BEFORE INSERT ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.link_employee_to_user();