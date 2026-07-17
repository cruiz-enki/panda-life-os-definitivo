
-- 1. Enum de roles
CREATE TYPE public.app_role AS ENUM ('owner', 'invited');

-- 2. Tabla user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Función has_role (SECURITY DEFINER para evitar recursión)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
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

-- 4. Políticas user_roles
CREATE POLICY "users see own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owner sees all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "owner manages roles insert"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "owner manages roles update"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "owner manages roles delete"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'owner'));

-- 5. Tabla allowed_emails
CREATE TABLE public.allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  is_owner boolean NOT NULL DEFAULT false,
  invited_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- normalizar emails siempre en minúsculas
CREATE OR REPLACE FUNCTION public.normalize_allowed_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER allowed_emails_normalize
  BEFORE INSERT OR UPDATE ON public.allowed_emails
  FOR EACH ROW EXECUTE FUNCTION public.normalize_allowed_email();

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads allowed_emails"
  ON public.allowed_emails FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "owner inserts allowed_emails"
  ON public.allowed_emails FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "owner updates allowed_emails"
  ON public.allowed_emails FOR UPDATE
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "owner deletes allowed_emails"
  ON public.allowed_emails FOR DELETE
  USING (public.has_role(auth.uid(), 'owner'));

-- 6. Función is_email_allowed
CREATE OR REPLACE FUNCTION public.is_email_allowed(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_emails
    WHERE email = lower(trim(_email))
  )
$$;

-- 7. Trigger BEFORE INSERT en auth.users: bloquea signups no autorizados
CREATE OR REPLACE FUNCTION public.enforce_email_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NOT public.is_email_allowed(NEW.email) THEN
    RAISE EXCEPTION 'Acceso no autorizado: este email no está en la lista de invitados.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_allowlist_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_email_allowlist();

-- 8. Trigger AFTER INSERT en auth.users: asigna rol
CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_owner boolean;
BEGIN
  SELECT is_owner INTO _is_owner FROM public.allowed_emails WHERE email = lower(NEW.email);
  IF COALESCE(_is_owner, false) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
      ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'invited')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_role_after_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_role();

-- 9. Seed: tu email como owner + asignar rol al usuario existente
INSERT INTO public.allowed_emails (email, is_owner, note)
VALUES ('martin.ruiz.sosa@hotmail.com', true, 'Owner inicial')
ON CONFLICT (email) DO UPDATE SET is_owner = true;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::public.app_role FROM auth.users WHERE lower(email) = 'martin.ruiz.sosa@hotmail.com'
ON CONFLICT DO NOTHING;
