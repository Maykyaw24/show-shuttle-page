import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { scanTicket } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "Scan tickets — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: ScanPage,
});

function ScanPage() {
  const scan = useServerFn(scanTicket);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string; sub?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onScan = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const r = await scan({ data: { qr_code: code.trim() } });
      if (r.ok) {
        const t = (r as { ticket?: { events?: { title?: string } } }).ticket;
        setResult({ ok: true, msg: "✅ Valid — checked in", sub: t?.events?.title });
      } else {
        setResult({ ok: false, msg: `❌ ${r.reason ?? "Invalid"}` });
      }
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
      setCode("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-black text-gradient-gold">LiveBeat</Link>
          <div className="text-xs text-muted-foreground">Check-in scanner</div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-3xl font-black">Scan ticket</h1>
        <p className="text-sm text-muted-foreground">Paste or type the QR code value from the buyer's ticket.</p>

        <div className="mt-6 rounded-2xl border border-border/60 card-premium p-6">
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onScan()}
            placeholder="LB-xxxxxxxx-xxxxxxxxxxxx"
            className="w-full h-12 rounded-full bg-input px-5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
          />
          <button
            onClick={onScan}
            disabled={busy || !code.trim()}
            className="mt-4 w-full h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold disabled:opacity-50"
          >{busy ? "Checking…" : "Check in"}</button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${result.ok ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
              <div className="font-medium">{result.msg}</div>
              {result.sub && <div className="text-xs mt-1 opacity-80">{result.sub}</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
