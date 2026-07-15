import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { getEvent, createOrder, submitPaymentProof } from "@/lib/marketplace.functions";
import { toast } from "sonner";

const searchSchema = z.object({ qty: z.number().int().min(1).max(10).default(1) });

export const Route = createFileRoute("/_authenticated/checkout/$eventId")({
  head: () => ({ meta: [{ title: "Checkout — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Checkout,
});

function Checkout() {
  const { eventId } = Route.useParams();
  const { qty } = Route.useSearch();
  const fetchEvent = useServerFn(getEvent);
  const createOrderFn = useServerFn(createOrder);
  const submitProofFn = useServerFn(submitPaymentProof);
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEvent({ data: { id: eventId } }),
  });

  const total = event ? Number(event.price) * qty : 0;

  const onCreateOrder = async () => {
    setSubmitting(true);
    try {
      const o = await createOrderFn({ data: { event_id: eventId, quantity: qty } });
      setOrderId(o.id);
      toast.success("Order created. Please upload payment proof.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const onFile = (f: File) => {
    if (f.size > 1_500_000) { toast.error("Please upload an image under 1.5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setProof(reader.result as string);
    reader.readAsDataURL(f);
  };

  const onSubmitProof = async () => {
    if (!orderId || !proof) return;
    setSubmitting(true);
    try {
      await submitProofFn({ data: { order_id: orderId, proof_data_url: proof } });
      toast.success("Payment submitted for review. You'll get tickets once admin confirms.");
      navigate({ to: "/my-tickets" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit proof");
    } finally {
      setSubmitting(false);
    }
  };

  if (!event) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-black text-gradient-gold">LiveBeat</Link>
          <div className="text-xs text-muted-foreground">Secure checkout</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-border/60 card-premium p-6">
          <h1 className="text-2xl font-black">Checkout</h1>
          {!orderId ? (
            <>
              <p className="text-sm text-muted-foreground mt-2">Review your order, then create it to get manual payment instructions.</p>
              <div className="mt-6 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Event</span><span>{event.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(event.event_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tickets</span><span>{qty}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price / ticket</span><span>₹{Number(event.price).toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border/60 mt-2"><span>Total</span><span className="text-gradient-gold">₹{total.toLocaleString()}</span></div>
              </div>
              <button
                onClick={onCreateOrder}
                disabled={submitting}
                className="mt-6 w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold disabled:opacity-50"
              >{submitting ? "Creating…" : "Create order"}</button>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 p-3 text-sm">
                ✅ Order created. Please pay manually and upload the receipt below.
              </div>
              <div className="mt-6 space-y-3 text-sm">
                <div className="font-medium">Manual payment instructions</div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="text-muted-foreground">Send</div>
                  <div className="font-bold text-lg text-gradient-gold">₹{total.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-2">UPI: livebeat@upi · Bank: LiveBeat Ltd · Ref: {orderId.slice(0, 8)}</div>
                </div>
                <label className="block">
                  <span className="text-sm">Upload payment screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                    className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                  />
                </label>
                {proof && <img src={proof} alt="proof" className="rounded-lg max-h-56 border border-border/60" />}
                <button
                  onClick={onSubmitProof}
                  disabled={!proof || submitting}
                  className="w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold disabled:opacity-50"
                >{submitting ? "Submitting…" : "Submit for admin review"}</button>
              </div>
            </>
          )}
        </div>

        <aside className="rounded-2xl border border-border/60 card-premium p-6 text-sm">
          <div className="font-semibold mb-2">How it works</div>
          <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
            <li>Create your order</li>
            <li>Pay manually via UPI/bank</li>
            <li>Upload your payment screenshot</li>
            <li>Admin verifies and confirms</li>
            <li>Your QR tickets appear in "My tickets"</li>
          </ol>
        </aside>
      </main>
    </div>
  );
}
