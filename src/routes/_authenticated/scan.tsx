import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { lookupTicket, markTicketUsed } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "Scan tickets — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: ScanPage,
});

type TicketEvent = {
  title?: string;
  artist?: string;
  venue?: string;
  city?: string;
  event_date?: string;
  image_url?: string | null;
};
type Ticket = {
  id: string;
  qr_code: string;
  status: string;
  used_at?: string | null;
  created_at?: string;
  events?: TicketEvent;
};
type LookupResult =
  | { ok: true; isAdmin: boolean; canManage: boolean; ticket: Ticket }
  | { ok: false; isAdmin: boolean; canManage: boolean; reason: string };

function statusBadge(status: string) {
  const map: Record<string, string> = {
    valid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    used: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
    refunded: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return map[status] ?? "bg-muted text-muted-foreground border-border";
}

function statusMessage(status: string) {
  switch (status) {
    case "valid": return "✅ Ticket is valid";
    case "used": return "⚠️ Ticket already used";
    case "cancelled": return "❌ Ticket cancelled";
    case "refunded": return "❌ Ticket refunded";
    default: return `Status: ${status}`;
  }
}

function ScanPage() {
  const lookup = useServerFn(lookupTicket);
  const markUsed = useServerFn(markTicketUsed);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);

  const onLookup = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setActionMsg(null);
    setShowFull(false);
    try {
      const r = (await lookup({ data: { qr_code: code.trim() } })) as LookupResult;
      setResult(r);
    } catch (e) {
      setResult({ ok: false, isAdmin: false, canManage: false, reason: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  };

  const onMarkUsed = async () => {
    if (!result?.ok) return;
    setBusy(true);
    try {
      const r = await markUsed({ data: { qr_code: result.ticket.qr_code } });
      if (r.ok && r.ticket) {
        setResult({ ...result, ticket: r.ticket as Ticket });
        setActionMsg("✅ Checked in — ticket marked as used");
      } else {
        setActionMsg(`❌ ${r.reason ?? "Could not mark as used"}`);
      }
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setActionMsg(null);
    setCode("");
    setShowFull(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-black text-gradient-gold">LiveBeat</Link>
          <div className="text-xs text-muted-foreground">Ticket scanner</div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-3xl font-black">Scan ticket</h1>
        <p className="text-sm text-muted-foreground">Paste or type the QR code from the buyer's ticket.</p>

        {!result && (
          <div className="mt-6 rounded-2xl border border-border/60 card-premium p-6">
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onLookup()}
              placeholder="LB-xxxxxxxx-xxxxxxxxxxxx"
              className="w-full h-12 rounded-full bg-input px-5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            <button
              onClick={onLookup}
              disabled={busy || !code.trim()}
              className="mt-4 w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold disabled:opacity-50"
            >{busy ? "Looking up…" : "Scan QR"}</button>
          </div>
        )}

        {result && !result.ok && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
            <div className="text-destructive font-semibold">❌ {result.reason}</div>
            <button onClick={reset} className="mt-4 h-10 px-5 rounded-full border border-border/60 text-sm">Scan another</button>
          </div>
        )}

        {result?.ok && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 card-premium overflow-hidden">
              {result.ticket.events?.image_url && (
                <img src={result.ticket.events.image_url} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-6 space-y-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Concert</div>
                <div className="text-2xl font-black">{result.ticket.events?.title ?? "Untitled event"}</div>
                <div className="text-sm text-muted-foreground">
                  {result.ticket.events?.artist}
                  {result.ticket.events?.venue && ` • ${result.ticket.events.venue}`}
                  {result.ticket.events?.city && `, ${result.ticket.events.city}`}
                </div>
                {result.ticket.events?.event_date && (
                  <div className="text-sm">{new Date(result.ticket.events.event_date).toLocaleString()}</div>
                )}

                <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs ${statusBadge(result.ticket.status)}`}>
                  {statusMessage(result.ticket.status)}
                </div>
                {result.ticket.status === "used" && result.ticket.used_at && (
                  <div className="text-xs text-muted-foreground">Used at {new Date(result.ticket.used_at).toLocaleString()}</div>
                )}

                {showFull && (
                  <div className="mt-3 pt-3 border-t border-border/60 space-y-1 text-xs text-muted-foreground">
                    <div><span className="text-foreground">Ticket ID:</span> <span className="font-mono">{result.ticket.id}</span></div>
                    <div><span className="text-foreground">QR:</span> <span className="font-mono break-all">{result.ticket.qr_code}</span></div>
                    {result.ticket.created_at && <div><span className="text-foreground">Issued:</span> {new Date(result.ticket.created_at).toLocaleString()}</div>}
                  </div>
                )}
              </div>
            </div>

            {actionMsg && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">{actionMsg}</div>
            )}

            {result.canManage ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowFull((v) => !v)}
                  className="h-11 px-5 rounded-full border border-border/60 text-sm"
                >{showFull ? "Hide ticket summary" : "View ticket summary"}</button>
                <button
                  onClick={onMarkUsed}
                  disabled={busy || result.ticket.status !== "valid"}
                  className="h-11 px-5 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold disabled:opacity-50"
                >{busy ? "Marking…" : "Mark as used"}</button>
                <button onClick={reset} className="h-11 px-5 rounded-full border border-border/60 text-sm">Scan another</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="text-xs text-muted-foreground flex-1 self-center">Read-only view — only admins or the event organiser can check tickets in.</div>
                <button onClick={reset} className="h-11 px-5 rounded-full border border-border/60 text-sm">Scan another</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
