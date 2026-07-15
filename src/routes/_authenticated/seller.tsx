import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, SectionCard, StatCard, StatusBadge } from "@/components/dashboard-shell";
import { getMyProfile } from "@/lib/auth.functions";
import { listMyEvents, deleteMyEvent } from "@/lib/marketplace.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({ meta: [{ title: "Seller home — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: SellerHome,
});

const NAV = [
  { label: "Home", to: "/seller" },
  { label: "My Events", to: "/seller/events" },
  { label: "Scan", to: "/scan" },
];

function SellerHome() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchEvents = useServerFn(listMyEvents);
  const delEvent = useServerFn(deleteMyEvent);
  const qc = useQueryClient();

  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: events } = useQuery({ queryKey: ["seller", "events"], queryFn: () => fetchEvents() });

  const name = profile?.profile?.full_name?.split(" ")[0] ?? "there";
  const org = profile?.profile?.organization ?? "Independent Organizer";
  const totalEvents = events?.length ?? 0;
  const approved = events?.filter((e) => e.status === "approved").length ?? 0;
  const pending = events?.filter((e) => e.status === "pending").length ?? 0;
  const sold = events?.reduce((s, e) => s + (e.tickets_sold ?? 0), 0) ?? 0;

  const onDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await delEvent({ data: { id } });
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["seller", "events"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <DashboardShell
      title={<>Welcome, <span className="text-gradient-gold">{name}</span></>}
      subtitle={`${org} · Manage your concerts and payouts.`}
      badge={<span className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase tracking-wide">✦ Organizer</span>}
      nav={NAV}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">Ready to sell out your next show?</div>
        <Link to="/sell/new" className="h-11 px-6 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center">
          + Create new event
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <StatCard label="Total events" value={totalEvents} tone="gold" />
        <StatCard label="Approved" value={approved} tone="success" />
        <StatCard label="Pending review" value={pending} tone="warn" />
        <StatCard label="Tickets sold" value={sold} tone="gold" />
      </div>

      <div className="mt-6">
        <SectionCard title="📅 My events">
          <div className="space-y-3">
            {events && events.length === 0 && <div className="text-sm text-muted-foreground">No events yet. Create your first listing.</div>}
            {events?.map((e) => (
              <div key={e.id} className="rounded-xl border border-border/60 p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{e.title}</span>
                    <StatusBadge status={e.status} />
                    {e.trust_level && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-border uppercase">AI: {e.trust_level.replace("_", " ")}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {e.artist} · {e.venue} · {new Date(e.event_date).toLocaleDateString()} · {e.tickets_sold}/{e.ticket_count} sold
                  </div>
                  {e.rejection_reason && <div className="text-xs text-destructive mt-1">Rejected: {e.rejection_reason}</div>}
                </div>
                <div className="flex gap-2">
                  <Link to="/events/$id" params={{ id: e.id }} className="h-8 px-3 rounded-full border border-border text-xs hover:bg-muted flex items-center">View</Link>
                  <button onClick={() => onDelete(e.id)} className="h-8 px-3 rounded-full bg-destructive/15 text-destructive border border-destructive/30 text-xs">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
