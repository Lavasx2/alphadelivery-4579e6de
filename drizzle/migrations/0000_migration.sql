DROP POLICY IF EXISTS "courier reports assigned order" ON public.customer_reports;
CREATE POLICY "courier reports assigned order" ON public.customer_reports FOR INSERT TO authenticated
WITH CHECK (courier_id = auth.uid() AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.courier_id = auth.uid()));

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  message text NOT NULL,
  user_id uuid,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.support_tickets TO anon;
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone sends ticket" ON public.support_tickets FOR INSERT TO anon, authenticated
WITH CHECK (length(email) BETWEEN 5 AND 200 AND length(message) BETWEEN 5 AND 3000 AND status = 'open');
CREATE POLICY "owner reads tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner updates tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));