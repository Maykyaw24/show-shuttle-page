import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DashboardShell, SectionCard, StatCard, StatusBadge } from "@/components/dashboard-shell";
import {
  adminListPendingEvents, adminSetEventStatus,
  adminListOrders, adminConfirmOrder, adminRejectOrder,
  adminCheckEventTrust,
} from "@/lib/marketplace.functions";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin console — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: AdminHome,
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

const trustColor = (l?: string | null) =>
  l === "trusted" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
  : l === "suspicious" ? "text-destructive border-destructive/30 bg-destructive/10"
  : "text-amber-300 border-amber-500/30 bg-amber-500/10";

function AdminHome() {
  const [tab, setTab] = useState<"queue" | "orders">("queue");
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const listEvents = useServerFn(adminListPendingEvents);
  const setStatus = useServerFn(adminSetEventStatus);
  const listOrders = useServerFn(adminListOrders);
  const confirmOrder = useServerFn(adminConfirmOrder);
  const rejectOrder = useServerFn(adminRejectOrder);
  const checkTrust = useServerFn(adminCheckEventTrust);
  const qc = useQueryClient();


  const { data: events } = useQuery({ queryKey: ["admin", "events"], queryFn: () => listEvents() });
  const { data: orders } = useQuery({ queryKey: ["admin", "orders"], queryFn: () => listOrders() });

  const pending = events?.filter((e) => e.status === "pending").length ?? 0;
  const approved = events?.filter((e) => e.status === "approved").length ?? 0;
  const awaiting = orders?.filter((o) => o.status === "awaiting_review").length ?? 0;
  const confirmed = orders?.filter((o) => o.status === "confirmed").length ?? 0;

  const act = async (id: string, status: "approved" | "rejected") => {
    try {
      await setStatus({ data: { id, status } });
      toast.success(`Event ${status}`);
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const doConfirm = async (id: string) => {
    try {
      await confirmOrder({ data: { order_id: id } });
      toast.success("Order confirmed. Tickets issued.");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const doReject = async (id: string) => {
    try {
      await rejectOrder({ data: { order_id: id } });
      toast.success("Order rejected");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
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
      title="Admin console"
      subtitle="Moderate events, approve payments, and issue tickets."
      nav={NAV}
      userBadge={ADMIN_BADGE}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pending events" value={pending} hint="Needs review" tone="warn" />
        <StatCard label="Approved events" value={approved} tone="success" />
        <StatCard label="Payments awaiting review" value={awaiting} tone="warn" />
        <StatCard label="Confirmed orders" value={confirmed} tone="gold" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <TabBtn active={tab === "queue"} onClick={() => setTab("queue")}>Event moderation</TabBtn>
        <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>Order review</TabBtn>
        <Link to="/scan" className="px-4 py-2 rounded-full text-sm border border-border hover:bg-muted">Open scanner →</Link>
      </div>

      <div className="mt-4">
        {tab === "queue" && (
          <SectionCard title="🛡️ Moderation queue">
            <div className="space-y-3">
              {events && events.length === 0 && <div className="text-sm text-muted-foreground">No events yet.</div>}
              {events?.map((e) => (
                <div key={e.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{e.title}</span>
                        <StatusBadge status={e.status} />
                        {e.trust_level && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${trustColor(e.trust_level)}`}>
                            AI: {e.trust_level.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {e.artist} · {e.venue}, {e.city} · {new Date(e.event_date).toLocaleDateString()} · ₹{Number(e.price).toLocaleString()} × {e.ticket_count}
                      </div>
                      {e.trust_reason && <div className="text-xs text-muted-foreground mt-1 italic">🤖 {e.trust_reason}</div>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => runTrust(e.id)}
                        disabled={checkingId === e.id}
                        className="h-9 px-4 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs disabled:opacity-50"
                      >
                        {checkingId === e.id ? "Checking…" : e.trust_level ? "Re-check with AI" : "Check with AI"}
                      </button>
                      {e.status === "pending" && (
                        <>
                          <button onClick={() => act(e.id, "approved")} className="h-9 px-4 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs">Approve</button>
                          <button onClick={() => act(e.id, "rejected")} className="h-9 px-4 rounded-full bg-destructive/15 text-destructive border border-destructive/30 text-xs">Reject</button>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {tab === "orders" && (
          <SectionCard title="💳 Order review">
            <div className="space-y-3">
              {orders && orders.length === 0 && <div className="text-sm text-muted-foreground">No orders yet.</div>}
              {orders?.map((o) => (
                <div key={o.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{(o as { events?: { title?: string } }).events?.title ?? "Event"}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Order #{o.id.slice(0, 8)} · {o.quantity} ticket(s) · ₹{Number(o.total_price).toLocaleString()}
                      </div>
                      {o.payment_proof_url && (
                        <a href={o.payment_proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                          <img src={o.payment_proof_url} alt="proof" className="max-h-24 rounded-lg border border-border/60" />
                        </a>
                      )}
                    </div>
                    {o.status === "awaiting_review" && (
                      <div className="flex gap-2">
                        <button onClick={() => doConfirm(o.id)} className="h-9 px-4 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs">Mark paid & issue tickets</button>
                        <button onClick={() => doReject(o.id)} className="h-9 px-4 rounded-full bg-destructive/15 text-destructive border border-destructive/30 text-xs">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </DashboardShell>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm border transition ${active ? "bg-primary text-primary-foreground border-primary shadow-gold" : "border-border hover:bg-muted"}`}>
      {children}
    </button>
  );
}
