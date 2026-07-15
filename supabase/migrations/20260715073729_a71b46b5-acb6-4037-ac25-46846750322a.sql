CREATE POLICY "Admins create tickets"
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers update tickets on their events"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = tickets.event_id
        AND e.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = tickets.event_id
        AND e.seller_id = auth.uid()
    )
  );