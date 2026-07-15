CREATE OR REPLACE FUNCTION public.claim_signup_role(_role public.app_role, _admin_code text DEFAULT NULL)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.app_role;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _role IS NULL THEN
    RAISE EXCEPTION 'Role is required';
  END IF;

  IF _role = 'admin'::public.app_role AND COALESCE(_admin_code, '') <> 'trio123' THEN
    RAISE EXCEPTION 'Invalid admin code';
  END IF;

  SELECT role INTO v_existing
  FROM public.user_roles
  WHERE user_id = v_user_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN _role;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_signup_role(public.app_role, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_signup_role(public.app_role, text) TO authenticated;