import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, SectionCard, StatCard, StatusBadge } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — LiveBeat" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHome,
});

const NAV = [
  { label: "Home", to: "/admin" },
  { label: "Moderation", to: "/admin" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Users", to: "/admin" },
  { label: "Profile", to: "/admin" },
];

const QUEUE = [
  { id: "EVT-3391", title: "Underground Techno Night", seller: "Nocturne Events", city: "Bengaluru", date: "Aug 25, 2026", status: "Pending review" },
  { id: "EVT-3388", title: "Sufi Soul Sessions", seller: "Rooh Productions", city: "Jaipur", date: "Sep 02, 2026", status: "Pending review" },
  { id: "EVT-3382", title: "Metal Mayhem Vol. 5", seller: "Loudwire Live", city: "Pune", date: "Sep 14, 2026", status: "Pending review" },
];

const CHECKINS = [
  { id: "CHK-441", event: "Coldplay — Music of the Spheres", scanned: 42130, capacity: 55000, gate: "Gate 4", status: "Active" },
  { id: "CHK-440", event: "Divine Live", scanned: 3820, capacity: 4000, gate: "Main", status: "Closed" },
];

const USERS = [
  { name: "Aisha Khan", email: "aisha@buyer.com", role: "buyer", joined: "Jul 12, 2026", status: "Active" },
  { name: "Rooh Productions", email: "hi@rooh.in", role: "seller", joined: "Jun 04, 2026", status: "Active" },
  { name: "Kabir Mehra", email: "kabir@x.com", role: "buyer", joined: "Aug 01, 2026", status: "Suspicious" },
  { name: "Loudwire Live", email: "book@loudwire.in", role: "seller", joined: "Mar 22, 2026", status: "Active" },
];

const RISKS = [
  { id: "RSK-9001", label: "Unverified seller with 3 pending listings", severity: "High" },
  { id: "RSK-9002", label: "Duplicate event title flagged by system", severity: "Medium" },
  { id: "RSK-9003", label: "Ticket price 5× market average", severity: "Medium" },
];

function AdminHome() {
  const [tab, setTab] = useState<"queue" | "checkin" | "users">("queue");

  return (
    <DashboardShell
      title="Admin console"
      subtitle="Moderate events, manage check-ins, and keep LiveBeat trusted."
      badge={
        <span className="text-xs px-3 py-1 rounded-full bg-destructive/15 text-destructive border border-destructive/30 uppercase tracking-wide">
          Admin
        </span>
      }
      nav={NAV}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pending events" value={14} hint="Needs review" tone="warn" />
        <StatCard label="Approved events" value={287} hint="+9 this week" tone="success" />
        <StatCard label="Reported listings" value={3} hint="Awaiting action" tone="danger" />
        <StatCard label="Active users" value="12,480" hint="+412 this month" tone="gold" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <TabBtn active={tab === "queue"} onClick={() => setTab("queue")}>Moderation queue</TabBtn>
        <TabBtn active={tab === "checkin"} onClick={() => setTab("checkin")}>QR check-ins</TabBtn>
        <TabBtn active={tab === "users"} onClick={() => setTab("users")}>User management</TabBtn>
      </div>

      <div className="mt-4">
        {tab === "queue" && (
          <SectionCard
            title="🛡️ Moderation queue"
            action={
              <div className="flex gap-2">
                <select className="h-9 rounded-full bg-input px-3 text-xs">
                  <option>All cities</option><option>Mumbai</option><option>Delhi</option><option>Pune</option>
                </select>
                <select className="h-9 rounded-full bg-input px-3 text-xs">
                  <option>Newest first</option><option>Oldest first</option>
                </select>
              </div>
            }
          >
            <div className="space-y-3">
              {QUEUE.map((q) => (
                <div key={q.id} className="rounded-xl border border-border/60 p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{q.title}</span>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {q.id} · {q.seller} · {q.city} · {q.date}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="h-9 px-4 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs">Approve</button>
                    <button className="h-9 px-4 rounded-full bg-accent/15 text-accent border border-accent/30 text-xs">Request changes</button>
                    <button className="h-9 px-4 rounded-full bg-destructive/15 text-destructive border border-destructive/30 text-xs">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {tab === "checkin" && (
          <SectionCard title="🔲 QR check-in management">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-2 py-2">Event</th>
                    <th className="text-left px-2 py-2">Gate</th>
                    <th className="text-left px-2 py-2">Scanned</th>
                    <th className="text-left px-2 py-2">Status</th>
                    <th className="text-left px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {CHECKINS.map((c) => (
                    <tr key={c.id}>
                      <td className="px-2 py-3 font-medium">{c.event}</td>
                      <td className="px-2 py-3 text-muted-foreground">{c.gate}</td>
                      <td className="px-2 py-3">{c.scanned.toLocaleString()} / {c.capacity.toLocaleString()}</td>
                      <td className="px-2 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-2 py-3 text-right">
                        <button className="h-8 px-3 rounded-full border border-border text-xs hover:bg-muted">Open</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {tab === "users" && (
          <SectionCard
            title="👥 User management"
            action={
              <input placeholder="Search users…" className="h-9 rounded-full bg-input px-4 text-xs w-56" />
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-2 py-2">Name</th>
                    <th className="text-left px-2 py-2 hidden md:table-cell">Email</th>
                    <th className="text-left px-2 py-2">Role</th>
                    <th className="text-left px-2 py-2 hidden md:table-cell">Joined</th>
                    <th className="text-left px-2 py-2">Status</th>
                    <th className="text-left px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {USERS.map((u) => (
                    <tr key={u.email}>
                      <td className="px-2 py-3 font-medium">{u.name}</td>
                      <td className="px-2 py-3 hidden md:table-cell text-muted-foreground">{u.email}</td>
                      <td className="px-2 py-3 capitalize">{u.role}</td>
                      <td className="px-2 py-3 hidden md:table-cell text-muted-foreground">{u.joined}</td>
                      <td className="px-2 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-2 py-3 text-right">
                        <button className="h-8 px-3 rounded-full border border-border text-xs hover:bg-muted">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>

      <div className="mt-6">
        <SectionCard title="⚠️ Trust & safety">
          <div className="grid gap-3 md:grid-cols-3">
            {RISKS.map((r) => (
              <div key={r.id} className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="text-xs uppercase text-destructive">{r.severity} risk</div>
                <div className="mt-1 text-sm">{r.label}</div>
                <div className="text-[11px] text-muted-foreground mt-2">{r.id}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-gold"
          : "border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
