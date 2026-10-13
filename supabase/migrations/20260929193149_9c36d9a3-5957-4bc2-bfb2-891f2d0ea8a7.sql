CREATE OR REPLACE FUNCTION public.stores_protect_status()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.subscription_paid_until IS DISTINCT FROM OLD.subscription_paid_until
       OR NEW.featured IS DISTINCT FROM OLD.featured
       OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
       OR NEW.slug IS DISTINCT FROM OLD.slug
       OR (NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status NOT IN ('submitted','unpaid')) THEN
      RAISE EXCEPTION 'ONLY_SITE_OWNER_CHANGES_STATUS';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
INSERT INTO public.app_settings (key, value) VALUES ('store_fee', '12000') ON CONFLICT (key) DO NOTHING;