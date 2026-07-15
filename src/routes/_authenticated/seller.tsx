import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({ meta: [{ title: "Seller dashboard — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: SellerDashboard,
});

function SellerDashboard() {
  return (
    <DashboardShell title="Seller dashboard" subtitle="Create events, manage listings, and track sales.">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Create event" body="Add a new concert with pricing and inventory." />
        <Card title="My listings" body="Edit or pause your active concerts." />
        <Card title="Sales & payouts" body="Track ticket sales and upcoming payouts." />
      </div>
    </DashboardShell>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
