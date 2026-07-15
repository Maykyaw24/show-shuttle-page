
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  pending jsonb := meta -> 'pending_signup';
  v_role text := pending ->> 'role';
  v_full_name text := COALESCE(pending ->> 'full_name', meta ->> 'full_name', '');
  v_seller_type text := NULLIF(pending ->> 'seller_type','');
BEGIN
  INSERT INTO public.profiles (
    id, full_name, phone, city, avatar_url,
    organization, seller_type, event_category, bio
  )
  VALUES (
    NEW.id,
    v_full_name,
    NULLIF(pending ->> 'phone',''),
    NULLIF(pending ->> 'city',''),
    NULLIF(pending ->> 'avatar_url',''),
    NULLIF(pending ->> 'organization',''),
    v_seller_type::seller_type,
    NULLIF(pending ->> 'event_category',''),
    NULLIF(pending ->> 'bio','')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name      = COALESCE(NULLIF(EXCLUDED.full_name,''), public.profiles.full_name),
    phone          = COALESCE(EXCLUDED.phone,          public.profiles.phone),
    city           = COALESCE(EXCLUDED.city,           public.profiles.city),
    avatar_url     = COALESCE(EXCLUDED.avatar_url,     public.profiles.avatar_url),
    organization   = COALESCE(EXCLUDED.organization,   public.profiles.organization),
    seller_type    = COALESCE(EXCLUDED.seller_type,    public.profiles.seller_type),
    event_category = COALESCE(EXCLUDED.event_category, public.profiles.event_category),
    bio            = COALESCE(EXCLUDED.bio,            public.profiles.bio);

  IF v_role IN ('buyer','seller','admin') THEN
    IF v_role = 'admin' AND COALESCE(pending ->> 'admin_code','') <> 'trio123' THEN
      v_role := 'buyer';
    END IF;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users.
DO $$
DECLARE
  u RECORD;
  pending jsonb;
  v_role text;
  v_seller_type text;
BEGIN
  FOR u IN SELECT id, raw_user_meta_data FROM auth.users LOOP
    pending := COALESCE(u.raw_user_meta_data, '{}'::jsonb) -> 'pending_signup';
    IF pending IS NULL OR pending = 'null'::jsonb THEN CONTINUE; END IF;
    v_role := pending ->> 'role';
    v_seller_type := NULLIF(pending ->> 'seller_type','');

    UPDATE public.profiles SET
      full_name      = COALESCE(NULLIF(pending ->> 'full_name',''),      full_name),
      phone          = COALESCE(NULLIF(pending ->> 'phone',''),          phone),
      city           = COALESCE(NULLIF(pending ->> 'city',''),           city),
      avatar_url     = COALESCE(NULLIF(pending ->> 'avatar_url',''),     avatar_url),
      organization   = COALESCE(NULLIF(pending ->> 'organization',''),   organization),
      seller_type    = COALESCE(v_seller_type::seller_type,              seller_type),
      event_category = COALESCE(NULLIF(pending ->> 'event_category',''), event_category),
      bio            = COALESCE(NULLIF(pending ->> 'bio',''),            bio)
    WHERE id = u.id;

    IF v_role IN ('buyer','seller','admin') THEN
      IF v_role = 'admin' AND COALESCE(pending ->> 'admin_code','') <> 'trio123' THEN
        v_role := 'buyer';
      END IF;
      INSERT INTO public.user_roles (user_id, role)
      VALUES (u.id, v_role::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END LOOP;
END $$;
