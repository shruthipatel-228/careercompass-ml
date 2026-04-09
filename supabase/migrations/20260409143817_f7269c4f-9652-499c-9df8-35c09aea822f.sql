
-- Allow user_roles to join with profiles via user_id
-- Add policy for admins to insert into profiles (for user creation flow)
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
