import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DashboardShell, SectionCard, StatCard, StatusBadge } from "@/components/dashboard-shell";
import { getMyProfile } from "@/lib/auth.functions";
import { featuredEvents, myOrders, myTickets } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/buyer")({
  head: () => ({ meta: [{ title: "Buyer home — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: BuyerHome,
});

const NAV = [
  { label: "Home", to: "/buyer" },
  { label: "Browse", to: "/browse" },
  { label: "My Tickets", to: "/my-tickets" },
  { label: "Dashboard", to: "/dashboard" },
];

function BuyerHome() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchFeatured = useServerFn(featuredEvents);
  const fetchOrders = useServerFn(myOrders);
  const fetchTickets = useServerFn(myTickets);
  const [q, setQ] = useState("");

  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: featured } = useQuery({ queryKey: ["featured"], queryFn: () => fetchFeatured() });
  const { data: orders } = useQuery({ queryKey: ["orders"], queryFn: () => fetchOrders() });
  const { data: tickets } = useQuery({ queryKey: ["tickets"], queryFn: () => fetchTickets() });

  const name = profile?.profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <DashboardShell
      title={<>Welcome back, <span className="text-gradient-gold">{name}</span></>}
      subtitle="Find your next concert, manage your tickets, and check order status."
      nav={NAV}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Confirmed tickets" value={tickets?.length ?? 0} tone="success" />
        <StatCard label="Pending orders" value={orders?.filter(o => o.status === "pending" || o.status === "awaiting_review").length ?? 0} tone="warn" />
        <StatCard label="Confirmed orders" value={orders?.filter(o => o.status === "confirmed").length ?? 0} tone="gold" />
        <StatCard label="Total orders" value={orders?.length ?? 0} />
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 card-premium p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artists, venues, or cities…"
            className="flex-1 h-11 rounded-full bg-input px-5 outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          <Link
            to="/browse"
            search={{}}
            className="h-11 px-6 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center"
          >Browse all</Link>
        </div>
      </div>

      <div className="mt-8">
        <SectionCard title="🔥 Featured concerts" action={<Link to="/browse" className="text-sm text-primary hover:underline">See all →</Link>}>
          {featured && featured.length === 0 && <div className="text-sm text-muted-foreground">No approved events yet.</div>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured?.map((e) => {
              const remaining = e.ticket_count - e.tickets_sold;
              const soldOut = remaining <= 0;
              return (
                <Link key={e.id} to="/events/$id" params={{ id: e.id }} className="rounded-xl border border-border/60 overflow-hidden hover:border-primary/40 transition">
                  <div className="aspect-[16/10] bg-muted overflow-hidden">
                    {e.image_url ? <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-5xl">🎤</div>}
                  </div>
                  <div className="p-3">
                    <div className="font-medium truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{e.venue}, {e.city}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-gradient-gold">MMK {Number(e.price).toLocaleString()}</span>
                      {soldOut ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">Sold out</span> : <span className="text-[10px] text-muted-foreground">{remaining} left</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="🎟️ Recent orders" action={<Link to="/my-tickets" className="text-sm text-primary hover:underline">My tickets →</Link>}>
          {orders && orders.length === 0 ? (
            <div className="text-sm text-muted-foreground">No orders yet. <Link to="/browse" className="text-primary">Find a concert</Link>.</div>
          ) : (
            <div className="space-y-2">
              {orders?.slice(0, 5).map((o) => (
                <div key={o.id} className="rounded-lg border border-border/60 p-3 flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{(o as { events?: { title?: string } }).events?.title ?? "Event"}</div>
                    <div className="text-xs text-muted-foreground">{o.quantity} ticket(s) · MMK {Number(o.total_price).toLocaleString()}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
