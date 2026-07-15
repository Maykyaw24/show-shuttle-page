import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { DashboardShell, SectionCard, StatusBadge } from "@/components/dashboard-shell";
import { adminListPendingEvents, adminSetEventStatus, adminCheckEventTrust } from "@/lib/marketplace.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => ({ meta: [{ title: "Events — Admin — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: AdminEventsPage,
});

const NAV = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Events", to: "/admin/events" },
  { label: "Scan", to: "/scan" },
];

const ADMIN_BADGE = (
  <span className="text-xs px-3 py-1 rounded-full bg-destructive/15 text-destructive border border-destructive/30 uppercase tracking-wide">
    Admin
  </span>
);

type EventStatus = "pending" | "approved" | "rejected";

const TABS: { key: EventStatus; label: string; tone: string }[] = [
  { key: "pending",  label: "Pending",  tone: "bg-accent/15 text-accent border-accent/30" },
  { key: "approved", label: "Approved", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { key: "rejected", label: "Rejected", tone: "bg-destructive/15 text-destructive border-destructive/30" },
];

function AdminEventsPage() {
  const listEvents = useServerFn(adminListPendingEvents);
  const setStatus = useServerFn(adminSetEventStatus);
  const checkTrust = useServerFn(adminCheckEventTrust);
  const qc = useQueryClient();

  const [tab, setTab] = useState<EventStatus>("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => listEvents(),
  });

  const grouped = useMemo(() => {
    const g: Record<EventStatus, typeof events> = { pending: [], approved: [], rejected: [] } as never;
    (events ?? []).forEach((e) => {
      if (e.status === "pending" || e.status === "approved" || e.status === "rejected") {
        (g[e.status as EventStatus] as never[]).push(e as never);
      }
    });
    return g;
  }, [events]);

  const rows = grouped[tab] ?? [];

  const act = async (id: string, status: "approved" | "rejected") => {
    try {
      await setStatus({ data: { id, status } });
      toast.success(`Event ${status}`);
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const runTrust = async (id: string) => {
    setCheckingId(id);
    try {
      const res = await checkTrust({ data: { id } });
      toast.success(`AI verdict: ${res.level.replace("_", " ")}`);
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "AI check failed"); }
    finally { setCheckingId(null); }
  };

  return (
    <DashboardShell
      title="Events"
      subtitle="Browse all events by moderation status. Expand any card to see full details."
      nav={NAV}
      userBadge={ADMIN_BADGE}
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => {
          const count = grouped[t.key]?.length ?? 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm border transition inline-flex items-center gap-2 ${
                active ? "bg-primary text-primary-foreground border-primary shadow-gold" : "border-border hover:bg-muted"
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${active ? "bg-primary-foreground/15 border-primary-foreground/30" : t.tone}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <SectionCard title={`${TABS.find((t) => t.key === tab)?.label} events`}>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No {tab} events.</div>
        )}
        <div className="space-y-3">
          {rows.map((e) => {
            const isOpen = openId === e.id;
            return (
              <div key={e.id} className="rounded-xl border border-border/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : e.id)}
                  className="w-full text-left p-4 hover:bg-muted/40 transition flex items-center gap-3"
                >
                  {e.image_url && (
                    <img src={e.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-border/60 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{e.title}</span>
                      <StatusBadge status={e.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {e.artist} · {e.venue}, {e.city} · {new Date(e.event_date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{isOpen ? "Hide" : "Details"} ▾</span>
                </button>

                {isOpen && (
                  <div className="border-t border-border/60 p-4 space-y-3 bg-muted/20">
                    {e.image_url && (
                      <img src={e.image_url} alt={e.title} className="w-full max-h-64 object-cover rounded-lg border border-border/60" />
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Field label="Artist" value={e.artist} />
                      <Field label="Category" value={e.category} />
                      <Field label="Venue" value={`${e.venue}, ${e.city}`} />
                      <Field label="Date" value={new Date(e.event_date).toLocaleString()} />
                      <Field label="Price" value={`₹${Number(e.price).toLocaleString()}`} />
                      <Field label="Tickets" value={String(e.ticket_count)} />
                      {e.trust_level && <Field label="AI verdict" value={String(e.trust_level).replace("_", " ")} />}
                      <Field label="Status" value={e.status} />
                    </div>
                    {e.description && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Description</div>
                        <p className="text-sm whitespace-pre-line">{e.description}</p>
                      </div>
                    )}
                    {e.trust_reason && (
                      <div className="text-xs text-muted-foreground italic">🤖 {e.trust_reason}</div>
                    )}
                    {e.rejection_reason && (
                      <div className="text-xs text-destructive">Rejection reason: {e.rejection_reason}</div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => runTrust(e.id)}
                        disabled={checkingId === e.id}
                        className="h-9 px-4 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs disabled:opacity-50"
                      >
                        {checkingId === e.id ? "Checking…" : e.trust_level ? "Re-check with AI" : "Check with AI"}
                      </button>
                      {e.status !== "approved" && (
                        <button onClick={() => act(e.id, "approved")} className="h-9 px-4 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs">
                          Approve
                        </button>
                      )}
                      {e.status !== "rejected" && (
                        <button onClick={() => act(e.id, "rejected")} className="h-9 px-4 rounded-full bg-destructive/15 text-destructive border border-destructive/30 text-xs">
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
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
