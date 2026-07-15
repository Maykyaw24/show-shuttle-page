import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell, SectionCard, StatCard, StatusBadge } from "@/components/dashboard-shell";
import { getMyProfile } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({
    meta: [
      { title: "Seller home — LiveBeat" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SellerHome,
});

const NAV = [
  { label: "Home", to: "/seller" },
  { label: "My Events", to: "/seller" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Orders", to: "/seller" },
  { label: "Profile", to: "/seller" },
];

const EVENTS = [
  { id: "EVT-2201", title: "Midnight Groove — Live Session", date: "Aug 18, 2026", venue: "Bandra Base, Mumbai", sold: 320, capacity: 500, status: "Approved" },
  { id: "EVT-2202", title: "Indie Fest Vol. 3", date: "Sep 09, 2026", venue: "Antisocial, Delhi", sold: 210, capacity: 400, status: "Pending review" },
  { id: "EVT-2203", title: "Acoustic Nights", date: "Jul 22, 2026", venue: "The Piano Man, Delhi", sold: 180, capacity: 180, status: "Sold out" },
  { id: "EVT-2204", title: "Bass Reload", date: "Oct 14, 2026", venue: "Kitty Su, Chandigarh", sold: 45, capacity: 300, status: "Pending review" },
];

function SellerHome() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const name = data?.profile?.full_name?.split(" ")[0] ?? "there";
  const org = data?.profile?.organization ?? "Independent Organizer";

  return (
    <DashboardShell
      title={<>Welcome, <span className="text-gradient-gold">{name}</span></> as unknown as string}
      subtitle={`${org} · Manage your concerts, sales, and payouts.`}
      badge={
        <span className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase tracking-wide">
          ✦ Verified Organizer
        </span>
      }
      nav={NAV}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Ready to sell out your next show?
        </div>
        <button className="h-11 px-6 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold">
          + Create new event
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <StatCard label="Total events" value={12} hint="4 this quarter" tone="gold" />
        <StatCard label="Tickets sold" value="3,845" hint="+186 this week" tone="success" />
        <StatCard label="Pending approvals" value={2} hint="Avg review 24h" tone="warn" />
        <StatCard label="Revenue (₹)" value="12.4L" hint="Payout on Aug 30" tone="gold" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <QuickLink icon="📅" title="My Events" hint="All your listings" />
        <QuickLink icon="🧾" title="Orders" hint="Buyer purchase log" />
        <QuickLink icon="🔲" title="QR Tickets" hint="Check-in codes" />
        <QuickLink icon="👤" title="Edit Profile" hint="Update org details" />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mt-6">
        <div className="md:col-span-2">
          <SectionCard title="📅 Recent events" action={<a className="text-sm text-primary hover:underline">Manage all</a>}>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-2 py-2">Event</th>
                    <th className="text-left px-2 py-2 hidden md:table-cell">Date</th>
                    <th className="text-left px-2 py-2">Sold</th>
                    <th className="text-left px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {EVENTS.map((e) => (
                    <tr key={e.id}>
                      <td className="px-2 py-3">
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-muted-foreground">{e.venue}</div>
                      </td>
                      <td className="px-2 py-3 hidden md:table-cell text-muted-foreground">{e.date}</td>
                      <td className="px-2 py-3">
                        <div className="text-xs">{e.sold}/{e.capacity}</div>
                        <div className="mt-1 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-gradient-gold" style={{ width: `${(e.sold / e.capacity) * 100}%` }} />
                        </div>
                      </td>
                      <td className="px-2 py-3"><StatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/5 p-4 flex gap-3 items-start">
            <div className="text-xl">🛡️</div>
            <div className="text-sm">
              <div className="font-medium">Events require admin approval before going public.</div>
              <div className="text-muted-foreground text-xs mt-1">
                We review each listing for authenticity and safety — typical turnaround is under 24 hours.
              </div>
            </div>
          </div>
        </div>

        <SectionCard title="🤖 AI copy helper">
          <p className="text-sm text-muted-foreground">
            Let AI draft catchy event titles, descriptions, and social captions in seconds.
          </p>
          <div className="mt-4 space-y-2">
            <button className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition">
              ✍️ Write an event description
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition">
              💡 Suggest 5 event titles
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition">
              📣 Draft an Instagram caption
            </button>
          </div>
          <button className="mt-4 w-full h-10 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium">
            Open AI helper
          </button>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

function QuickLink({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <button className="text-left rounded-2xl border border-border/60 card-premium p-4 hover:border-primary/40 transition">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
    </button>
  );
}
