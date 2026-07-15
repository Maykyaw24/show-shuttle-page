import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin console — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <DashboardShell title="Admin console" subtitle="Approve sellers, monitor listings, and keep the marketplace safe.">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Seller approvals" body="Review and approve organizer applications." />
        <Card title="Reported listings" body="Investigate flagged events and refunds." />
        <Card title="Platform metrics" body="Revenue, users, and event health." />
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
