DROP FUNCTION IF EXISTS public.claim_signup_role(public.app_role, text);

GRANT INSERT ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "Users can insert their own signup role" ON public.user_roles;
CREATE POLICY "Users can insert their own signup role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role IN ('buyer'::public.app_role, 'seller'::public.app_role));