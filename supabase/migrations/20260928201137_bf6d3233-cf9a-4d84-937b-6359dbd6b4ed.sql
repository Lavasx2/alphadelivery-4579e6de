-- 1. New role value for store owners
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_owner';

-- 2. Stores table (central entity)
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  category text,
  logo_url text,
  banner_url text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  place_id text,
  plus_code text,
  maps_url text,
  primary_color text DEFAULT '#facc15',
  secondary_color text,
  opening_hours jsonb,
  delivery_max_km numeric NOT NULL DEFAULT 16,
  delivery_fee_min numeric NOT NULL DEFAULT 150,
  delivery_fee_max numeric NOT NULL DEFAULT 350,
  rating numeric DEFAULT 4.9,
  rating_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  owner_user_id uuid,
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_reference text,
  payment_holder text,
  payment_last4 text,
  fee_amount numeric,
  paid_at timestamptz,
  subscription_paid_until timestamptz,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores public read" ON public.stores FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "store owner reads own store" ON public.stores FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "site owner reads all stores" ON public.stores FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'owner'));
CREATE POLICY "anyone can propose a store" ON public.stores FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid() AND status = 'pending');
CREATE POLICY "site owner updates stores" ON public.stores FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'owner'));
CREATE POLICY "store owner updates own store" ON public.stores FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "site owner deletes stores" ON public.stores FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'owner'));

-- protect status changes: only site owner
CREATE OR REPLACE FUNCTION public.stores_protect_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.has_role(auth.uid(), 'owner') THEN
      RAISE EXCEPTION 'ONLY_SITE_OWNER_CHANGES_STATUS';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER stores_protect_status BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.stores_protect_status();

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER stores_set_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Helper functions
CREATE OR REPLACE FUNCTION public.store_is_live(_store_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND status = 'approved');
$$;

CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'owner') OR EXISTS (
    SELECT 1 FROM public.stores WHERE id = _store_id AND owner_user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.claim_store_owner_role() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.stores WHERE owner_user_id = auth.uid()) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'store_owner') ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_store_owner_role() TO authenticated;

-- 4. menu_items: link to stores + store-owner management
ALTER TABLE public.menu_items ADD COLUMN store_id uuid REFERENCES public.stores(id);
REVOKE UPDATE ON public.menu_items FROM authenticated;
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE (name, description, price, category, image_url, popular, available, sort_order), DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;

DROP POLICY IF EXISTS "menu public read" ON public.menu_items;
CREATE POLICY "menu public read" ON public.menu_items FOR SELECT TO anon, authenticated
USING (public.store_is_live(store_id) OR store_id IS NULL);

DROP POLICY IF EXISTS "owner manages menu" ON public.menu_items;
CREATE POLICY "store owner manages own menu" ON public.menu_items FOR ALL TO authenticated
USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));

-- 5. orders: link to stores + store-owner access
ALTER TABLE public.orders ADD COLUMN store_id uuid REFERENCES public.stores(id);
DROP POLICY IF EXISTS "staff read orders" ON public.orders;
CREATE POLICY "staff read orders" ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'courier') OR public.is_store_owner(store_id));
DROP POLICY IF EXISTS "staff update orders" ON public.orders;
CREATE POLICY "staff update orders" ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'courier') OR public.is_store_owner(store_id))
WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'courier') OR public.is_store_owner(store_id));

-- 6. Settings defaults for store subscriptions
INSERT INTO public.app_settings (key, value) VALUES
  ('store_annual_fee', '5000'),
  ('store_card_number', COALESCE((SELECT value FROM public.app_settings WHERE key='store_card_number'), (SELECT value FROM public.app_settings WHERE key='courier_card_number'), '')),
  ('store_card_holder', COALESCE((SELECT value FROM public.app_settings WHERE key='store_card_holder'), (SELECT value FROM public.app_settings WHERE key='courier_card_holder'), '')),
  ('courier_fee', COALESCE((SELECT value FROM public.app_settings WHERE key='courier_fee'), '0')),
  ('courier_card_number', COALESCE((SELECT value FROM public.app_settings WHERE key='courier_card_number'), '')),
  ('courier_card_holder', COALESCE((SELECT value FROM public.app_settings WHERE key='courier_card_holder'), ''))
ON CONFLICT (key) DO NOTHING;

-- 7. Seed first store: Crust Tebessa
INSERT INTO public.stores (slug, name, tagline, description, category, phone, address, lat, lng, place_id, plus_code, maps_url, primary_color, secondary_color, rating, rating_count, status, featured)
VALUES ('crust-tebessa','كراست تبسة','Snacks & Drinks','بيتزا، طاكوس، برغر، مقلوب وصوفلي — مكونات طازجة كل يوم.','بيتزا وطاكوس','0666321449','تبسة، الجزائر',35.4066917,8.1204584,'ChIJO-B2EwDt-RIRll19KgssiKE','C44C+M5G تبسة','https://www.google.com/maps/place/Crust+tebessa/@35.4066917,8.1204584,17z','#facc15','#ef4444',4.9,7,'approved',true)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.menu_items SET store_id = (SELECT id FROM public.stores WHERE slug='crust-tebessa') WHERE store_id IS NULL;