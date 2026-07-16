import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { DashboardShell, SectionCard, StatusBadge } from "@/components/dashboard-shell";
import { lookupTicket, markTicketUsed } from "@/lib/marketplace.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "Scan tickets — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: ScanPage,
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

type TicketResult = {
  ok: boolean;
  reason?: string;
  ticket?: {
    id: string;
    status: string;
    qr_code: string;
    used_at?: string | null;
    events?: {
      title?: string;
      artist?: string;
      venue?: string;
      city?: string;
      event_date?: string;
    };
  };
};

function ScanPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TicketResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const lookup = useServerFn(lookupTicket);
  const markUsed = useServerFn(markTicketUsed);

  const runLookup = async (qr: string) => {
    setBusy(true);
    try {
      const r = (await lookup({ data: { qr_code: qr } })) as TicketResult;
      setResult(r);
      if (!r.ok) toast.error(r.reason ?? "Not found");
      else toast.success("Ticket found");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  };

  const onScan = (codes: IDetectedBarcode[]) => {
    const v = codes[0]?.rawValue?.trim();
    if (!v) return;
    const now = Date.now();
    if (lastScanRef.current.code === v && now - lastScanRef.current.at < 3000) return;
    lastScanRef.current = { code: v, at: now };
    setCode(v);
    setCameraOn(false);
    void runLookup(v);
  };

  const doLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    await runLookup(code.trim());
  };

  const doMark = async () => {
    if (!result?.ticket) return;
    setBusy(true);
    try {
      const r = (await markUsed({ data: { qr_code: result.ticket.qr_code } })) as TicketResult;
      setResult(r);
      if (r.ok) toast.success("Ticket marked as used");
      else toast.error(r.reason ?? "Failed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const t = result?.ticket;

  return (
    <DashboardShell
      title="Scan tickets"
      subtitle="Enter or paste a ticket QR code to verify and check-in."
      nav={NAV}
      userBadge={ADMIN_BADGE}
    >
      <div className="max-w-2xl">
        <SectionCard title="🎫 Lookup ticket">
          <form onSubmit={doLookup} className="flex flex-col sm:flex-row gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste QR code…"
              className="flex-1 h-11 px-4 rounded-full bg-muted/40 border border-border/60 focus:outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="h-11 px-6 rounded-full bg-primary text-primary-foreground shadow-gold disabled:opacity-50"
            >
              {busy ? "Checking…" : "Look up"}
            </button>
          </form>

          {t && (
            <div className="mt-6 rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{t.events?.title ?? "Event"}</span>
                <StatusBadge status={t.status} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t.events?.artist} · {t.events?.venue}, {t.events?.city}
                {t.events?.event_date && ` · ${new Date(t.events.event_date).toLocaleDateString()}`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Ticket #{t.id.slice(0, 8)}</div>
              {t.used_at && (
                <div className="text-xs text-muted-foreground mt-1">
                  Used at {new Date(t.used_at).toLocaleString()}
                </div>
              )}
              {t.status === "valid" && (
                <button
                  onClick={doMark}
                  disabled={busy}
                  className="mt-4 h-10 px-5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-sm disabled:opacity-50"
                >
                  {busy ? "Working…" : "Mark as used"}
                </button>
              )}
            </div>
          )}

          {result && !result.ok && !t && (
            <div className="mt-4 text-sm text-destructive">{result.reason ?? "Not found"}</div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
