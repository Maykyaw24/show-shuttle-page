import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { DashboardShell, SectionCard, StatusBadge } from "@/components/dashboard-shell";
import { listMyEvents, deleteMyEvent } from "@/lib/marketplace.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/seller/events")({
  head: () => ({ meta: [{ title: "My events — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: SellerEvents,
});

const NAV = [
  { label: "Home", to: "/seller" },
  { label: "My Events", to: "/seller/events" },
];

type EventStatus = "approved" | "pending" | "rejected";

const GROUPS: { key: EventStatus; title: string; empty: string }[] = [
  { key: "approved", title: "Approved", empty: "No approved events yet." },
  { key: "pending", title: "Pending", empty: "No pending events." },
  { key: "rejected", title: "Rejected", empty: "No rejected events." },
];

function SellerEvents() {
  const fetchEvents = useServerFn(listMyEvents);
  const delEvent = useServerFn(deleteMyEvent);
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: events } = useQuery({ queryKey: ["seller", "events"], queryFn: () => fetchEvents() });

  const grouped = useMemo(() => {
    const buckets: Record<EventStatus, NonNullable<typeof events>> = { approved: [], pending: [], rejected: [] };
    (events ?? []).forEach((event) => {
      if (event.status === "approved" || event.status === "pending" || event.status === "rejected") {
        buckets[event.status].push(event);
      }
    });
    return buckets;
  }, [events]);

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
      title={<>My <span className="text-gradient-gold">Events</span></>}
      subtitle="All your listings in one place."
      nav={NAV}
    >
      <div className="flex justify-end mb-4">
        <Link to="/sell/new" className="h-11 px-6 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold inline-flex items-center">
          + Create new event
        </Link>
      </div>
      <div className="space-y-5">
        {GROUPS.map((group) => {
          const rows = grouped[group.key] ?? [];
          return (
            <SectionCard key={group.key} title={`${group.title} events (${rows.length})`}>
              <div className="space-y-3">
                {events && events.length === 0 && group.key === "approved" && <div className="text-sm text-muted-foreground">No events yet. Create your first listing.</div>}
                {events && events.length > 0 && rows.length === 0 && <div className="text-sm text-muted-foreground">{group.empty}</div>}
                {rows.map((e) => {
                  const isOpen = openId === e.id;
                  return (
                    <div key={e.id} className="rounded-xl border border-border/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : e.id)}
                        className="w-full p-4 text-left flex flex-col md:flex-row md:items-center gap-3 hover:bg-muted/40 transition"
                      >
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
                        <span className="text-xs text-muted-foreground shrink-0">{isOpen ? "Hide details" : "See details"} ▾</span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-border/60 p-4 bg-muted/20 space-y-4">
                          {e.image_url && (
                            <img src={e.image_url} alt={e.title} className="w-full max-h-64 object-cover rounded-lg border border-border/60" />
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <Field label="Artist" value={e.artist} />
                            <Field label="Category" value={e.category} />
                            <Field label="Venue" value={`${e.venue}, ${e.city}`} />
                            <Field label="Date" value={new Date(e.event_date).toLocaleString()} />
                            <Field label="Price" value={`MMK ${Number(e.price).toLocaleString()}`} />
                            <Field label="Tickets" value={`${e.tickets_sold}/${e.ticket_count} sold`} />
                            <Field label="Status" value={e.status} />
                            {e.trust_level && <Field label="AI verdict" value={e.trust_level.replace("_", " ")} />}
                          </div>
                          {e.description && (
                            <div>
                              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Description</div>
                              <p className="text-sm whitespace-pre-line">{e.description}</p>
                            </div>
                          )}
                          {e.trust_reason && <div className="text-xs text-muted-foreground italic">🤖 {e.trust_reason}</div>}
                          {e.rejection_reason && <div className="text-xs text-destructive">Rejection reason: {e.rejection_reason}</div>}
                          <div className="flex justify-end">
                            <button onClick={() => onDelete(e.id)} className="h-8 px-3 rounded-full bg-destructive/15 text-destructive border border-destructive/30 text-xs">Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          );
        })}
      </div>
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate">{value}</div>
    </div>
  );
}
