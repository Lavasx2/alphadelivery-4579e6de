CREATE POLICY "owner deletes orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner deletes tickets" ON public.support_tickets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner deletes applications" ON public.courier_applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner deletes settings" ON public.app_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));
GRANT DELETE ON public.orders, public.support_tickets, public.courier_applications, public.app_settings TO authenticated;