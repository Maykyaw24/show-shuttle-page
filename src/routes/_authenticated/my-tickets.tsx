import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { myTickets, myOrders } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/my-tickets")({
  head: () => ({ meta: [{ title: "My tickets — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: MyTickets,
});

function TicketCard({ t }: { t: { id: string; qr_code: string; status: string; events: { title: string; artist: string; venue: string; city: string; event_date: string } | null } }) {
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(t.qr_code, { width: 220, margin: 1 }).then(setQr).catch(() => undefined);
  }, [t.qr_code]);
  const ev = t.events;
  return (
    <div className="rounded-2xl border border-border/60 card-premium overflow-hidden">
      <div className="p-5 grid grid-cols-[1fr_auto] gap-4 items-center">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.status}</div>
          <div className="font-bold truncate">{ev?.title ?? "Event"}</div>
          <div className="text-xs text-muted-foreground truncate">{ev?.artist}</div>
          <div className="mt-3 text-xs text-muted-foreground">{ev?.venue}, {ev?.city}</div>
          <div className="text-xs">{ev?.event_date && new Date(ev.event_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
          <div className="mt-3 text-[10px] font-mono text-muted-foreground break-all">{t.qr_code}</div>
        </div>
        <div className="shrink-0 rounded-lg bg-white p-2">
          {qr ? <img src={qr} alt="qr" className="w-32 h-32" /> : <div className="w-32 h-32 grid place-items-center text-xs text-black">…</div>}
        </div>
      </div>
    </div>
  );
}

function MyTickets() {
  const fetchTickets = useServerFn(myTickets);
  const fetchOrders = useServerFn(myOrders);
  const { data: tickets } = useQuery({ queryKey: ["tickets"], queryFn: () => fetchTickets() });
  const { data: orders } = useQuery({ queryKey: ["orders"], queryFn: () => fetchOrders() });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-black text-gradient-gold">LiveBeat</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/browse" className="hover:text-primary">Browse</Link>
            <Link to="/" className="hover:text-primary">Home</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black">My tickets</h1>
        <p className="text-muted-foreground text-sm">Show these QR codes at the venue entrance.</p>

        <section className="mt-8">
          <h2 className="font-semibold mb-3">Confirmed tickets</h2>
          {tickets && tickets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {tickets.map((t) => <TicketCard key={t.id} t={t as never} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No confirmed tickets yet. Once admin approves your order, tickets appear here.
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-semibold mb-3">Order history</h2>
          <div className="rounded-2xl border border-border/60 divide-y divide-border/60">
            {orders && orders.length > 0 ? orders.map((o) => (
              <div key={o.id} className="p-4 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{(o as { events?: { title?: string } }).events?.title ?? "Event"}</div>
                  <div className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)} · {o.quantity} ticket(s) · ₹{Number(o.total_price).toLocaleString()}</div>
                </div>
                <span className="text-[10px] uppercase px-2 py-1 rounded-full border border-border">{o.status}</span>
              </div>
            )) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No orders yet.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
