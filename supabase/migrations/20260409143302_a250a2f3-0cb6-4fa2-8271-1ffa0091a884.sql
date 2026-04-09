
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'manager', 'employee');

-- Create performance class enum
CREATE TYPE public.performance_class AS ENUM ('good', 'average', 'poor');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');

-- Create task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Employees table (employee performance data)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  job_role TEXT NOT NULL DEFAULT 'General',
  date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
  working_hours_per_week NUMERIC(5,2) DEFAULT 40,
  training_hours NUMERIC(6,2) DEFAULT 0,
  satisfaction_score NUMERIC(3,1) DEFAULT 5.0 CHECK (satisfaction_score >= 0 AND satisfaction_score <= 10),
  years_of_experience NUMERIC(4,1) DEFAULT 0,
  manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Performance predictions table
CREATE TABLE public.performance_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  prediction_class performance_class NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL,
  working_hours_score NUMERIC(5,2),
  training_score NUMERIC(5,2),
  satisfaction_score NUMERIC(5,2),
  task_completion_score NUMERIC(5,2),
  experience_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.performance_predictions ENABLE ROW LEVEL SECURITY;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: admins can manage, users can read their own
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles: users can read/update own, admins/hr can read all
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "HR can read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'hr'));

-- departments: all authenticated can read, admins can manage
CREATE POLICY "Authenticated can read departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- employees: role-based access
CREATE POLICY "Admins can manage employees" ON public.employees FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "HR can read all employees" ON public.employees FOR SELECT USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "HR can insert employees" ON public.employees FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "HR can update employees" ON public.employees FOR UPDATE USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Managers can read department employees" ON public.employees FOR SELECT USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Employees can read own data" ON public.employees FOR SELECT USING (auth.uid() = user_id);

-- tasks: role-based access
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can manage tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "HR can read tasks" ON public.tasks FOR SELECT USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Employees can read own tasks" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees WHERE employees.id = tasks.assigned_to AND employees.user_id = auth.uid())
);
CREATE POLICY "Employees can update own tasks" ON public.tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.employees WHERE employees.id = tasks.assigned_to AND employees.user_id = auth.uid())
);

-- performance_predictions: employees CANNOT see, only admin/hr/manager
CREATE POLICY "Admins can manage predictions" ON public.performance_predictions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "HR can read predictions" ON public.performance_predictions FOR SELECT USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Managers can read predictions" ON public.performance_predictions FOR SELECT USING (public.has_role(auth.uid(), 'manager'));
