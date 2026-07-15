import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listEvents } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse concerts — LiveBeat" },
      { name: "description", content: "Search and filter live concerts by artist, city, category and price." },
    ],
  }),
  component: BrowsePage,
});

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "rock", label: "Rock" },
  { id: "pop", label: "Pop" },
  { id: "edm", label: "EDM" },
  { id: "hiphop", label: "Hip-Hop" },
  { id: "jazz", label: "Jazz" },
  { id: "classical", label: "Classical" },
  { id: "indie", label: "Indie" },
  { id: "metal", label: "Metal" },
  { id: "folk", label: "Folk" },
  { id: "other", label: "Other" },
];

function BrowsePage() {
  const fetchEvents = useServerFn(listEvents);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", q, category, city, maxPrice],
    queryFn: () => fetchEvents({ data: { q: q || undefined, category, city: city || undefined, maxPrice } }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <Link to="/" className="font-black text-lg text-gradient-gold">LiveBeat</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/browse" className="text-primary">Browse</Link>
            <Link to="/" className="hover:text-primary">Home</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-black">Find your next concert</h1>
        <p className="text-muted-foreground mt-1">Approved by our team. Every ticket comes with a unique QR code.</p>

        <div className="mt-6 rounded-2xl border border-border/60 card-premium p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search artist, title, venue…"
              className="h-11 rounded-full bg-input px-5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="h-11 rounded-full bg-input px-5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice ?? ""}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="h-11 w-32 rounded-full bg-input px-5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => { setQ(""); setCity(""); setMaxPrice(undefined); setCategory("all"); }}
              className="h-11 px-5 rounded-full border border-border text-sm hover:bg-muted"
            >Clear</button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${
                  category === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                }`}
              >{c.label}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-16">
        {isLoading && <div className="text-muted-foreground">Loading…</div>}
        {!isLoading && events && events.length === 0 && (
          <div className="rounded-2xl border border-border/60 p-10 text-center">
            <div className="text-lg font-medium">No concerts match your filters</div>
            <div className="text-sm text-muted-foreground mt-1">Try clearing filters or checking back soon.</div>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events?.map((e) => {
            const remaining = e.ticket_count - e.tickets_sold;
            const soldOut = remaining <= 0;
            return (
              <Link
                key={e.id}
                to="/events/$id"
                params={{ id: e.id }}
                className="group rounded-2xl overflow-hidden border border-border/60 card-premium hover:border-primary/40 transition"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {e.image_url ? (
                    <img src={e.image_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-6xl">🎤</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{e.artist} · {e.venue}, {e.city}</div>
                    </div>
                    {soldOut && (
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 uppercase">Sold out</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div className="text-lg font-black text-gradient-gold">₹{Number(e.price).toLocaleString()}</div>
                  </div>
                  {!soldOut && (
                    <div className="mt-2 text-[11px] text-muted-foreground">{remaining} of {e.ticket_count} tickets left</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
