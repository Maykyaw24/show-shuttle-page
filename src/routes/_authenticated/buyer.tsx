import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_authenticated/buyer")({
  head: () => ({ meta: [{ title: "Buyer dashboard — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: BuyerDashboard,
});

function BuyerDashboard() {
  return (
    <DashboardShell title="Welcome, buyer" subtitle="Search concerts, buy verified tickets, and save your favourites.">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Browse concerts" body="Discover upcoming shows curated for you." />
        <Card title="My tickets" body="View QR codes for concerts you've purchased." />
        <Card title="Saved" body="Concerts you're watching for price drops." />
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
