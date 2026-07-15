import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DashboardShell, SectionCard, StatCard, StatusBadge } from "@/components/dashboard-shell";
import { getMyProfile } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/buyer")({
  head: () => ({
    meta: [
      { title: "Buyer home — LiveBeat" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuyerHome,
});

const NAV = [
  { label: "Home", to: "/buyer" },
  { label: "Browse", to: "/buyer" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "My Tickets", to: "/buyer" },
  { label: "Profile", to: "/buyer" },
];

const FEATURED = [
  { id: 1, title: "Arctic Monkeys — Live in Mumbai", venue: "NSCI Dome, Mumbai", date: "Aug 12, 2026", price: "₹4,500", tag: "Featured", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format" },
  { id: 2, title: "Sunburn Reload — EDM Fest", venue: "Vagator Beach, Goa", date: "Sep 20, 2026", price: "₹3,200", tag: "Hot", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format" },
  { id: 3, title: "AR Rahman Symphony", venue: "JLN Stadium, Delhi", date: "Oct 05, 2026", price: "₹5,800", tag: "New", img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format" },
];

const RECOMMENDED = [
  { id: 4, title: "Coldplay Music of the Spheres", venue: "DY Patil Stadium, Mumbai", date: "Nov 15, 2026", price: "₹8,500", category: "Rock" },
  { id: 5, title: "Divine Live — Gully Gang", venue: "Phoenix Marketcity, Pune", date: "Aug 28, 2026", price: "₹2,200", category: "Hip-Hop" },
  { id: 6, title: "Prateek Kuhad Unplugged", venue: "The Piano Man, Delhi", date: "Sep 02, 2026", price: "₹1,800", category: "Indie" },
  { id: 7, title: "NH7 Weekender", venue: "Mahalaxmi Lawns, Pune", date: "Dec 05, 2026", price: "₹3,900", category: "Festival" },
];

const TICKETS = [
  { id: "TKT-8821", event: "Sunburn Reload — EDM Fest", date: "Sep 20, 2026", status: "Upcoming" },
  { id: "TKT-8756", event: "AR Rahman Symphony", date: "Oct 05, 2026", status: "Pending" },
  { id: "TKT-8410", event: "Local Train Live", date: "Jun 12, 2026", status: "Used" },
];

const CATEGORIES = ["All", "Rock", "EDM", "Hip-Hop", "Indie", "Classical", "Festival"];

function BuyerHome() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const name = data?.profile?.full_name?.split(" ")[0] ?? "there";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  return (
    <DashboardShell
      title={<>Welcome back, <span className="text-gradient-gold">{name}</span></>}
      subtitle="Find your next concert, manage your tickets, and let our AI help you decide."
      nav={NAV}
    >
      {/* Search + filters */}
      <div className="rounded-2xl border border-border/60 card-premium p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artists, venues, or cities…"
            className="flex-1 h-11 rounded-full bg-input px-5 outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          <select className="h-11 rounded-full bg-input px-4 text-sm">
            <option>Any date</option><option>This weekend</option><option>This month</option>
          </select>
          <select className="h-11 rounded-full bg-input px-4 text-sm">
            <option>Any price</option><option>Under ₹2,000</option><option>₹2,000 – ₹5,000</option><option>₹5,000+</option>
          </select>
          <select className="h-11 rounded-full bg-input px-4 text-sm">
            <option>Any venue</option><option>Stadium</option><option>Arena</option><option>Club</option>
          </select>
          <button className="h-11 px-6 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold">
            Search
          </button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-xs border whitespace-nowrap transition ${
                cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <StatCard label="Upcoming" value={2} hint="Next: Sep 20" tone="gold" />
        <StatCard label="Pending" value={1} hint="Awaiting confirmation" tone="warn" />
        <StatCard label="Used" value={7} hint="Lifetime attended" />
        <StatCard label="Saved" value={12} hint="Watchlisted events" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        <QuickLink icon="🎫" title="My Tickets" hint="View all your QR passes" />
        <QuickLink icon="❤️" title="Saved Events" hint="Your watchlist" />
        <QuickLink icon="🤖" title="Chatbot Help" hint="Ask our AI anything" />
      </div>

      {/* Featured */}
      <div className="mt-8">
        <SectionCard title="🔥 Featured concerts" action={<a className="text-sm text-primary hover:underline">See all</a>}>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURED.map((e) => (
              <article key={e.id} className="rounded-xl overflow-hidden border border-border/60 bg-card group">
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img src={e.img} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground font-medium">{e.tag}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-1">{e.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{e.venue}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">{e.date}</span>
                    <span className="text-sm font-semibold text-gradient-gold">{e.price}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Recommended */}
      <div className="mt-6">
        <SectionCard title="✨ Recommended for you">
          <div className="grid gap-3 md:grid-cols-2">
            {RECOMMENDED.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition">
                <div className="w-14 h-14 rounded-lg bg-gradient-gold flex items-center justify-center shrink-0 text-xl">🎵</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{e.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{e.venue} · {e.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{e.price}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{e.category}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mt-6">
        <div className="md:col-span-2">
          <SectionCard title="🎫 My tickets">
            <div className="divide-y divide-border/60">
              {TICKETS.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{t.event}</div>
                    <div className="text-xs text-muted-foreground">{t.id} · {t.date}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="🤖 AI Assistant">
          <p className="text-sm text-muted-foreground">
            Ask me to find concerts, compare prices, or explain how QR check-in works.
          </p>
          <div className="mt-4 space-y-2">
            <button className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition">
              "Find rock concerts under ₹3,000 near me"
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition">
              "How does check-in work at the venue?"
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition">
              "Suggest weekend events in Mumbai"
            </button>
          </div>
          <button className="mt-4 w-full h-10 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium">
            Open chatbot
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
