import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getEvent, toggleFavorite } from "@/lib/marketplace.functions";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Concert — LiveBeat` },
      { name: "description", content: `Concert details on LiveBeat (${params.id.slice(0, 8)}).` },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const fetchEvent = useServerFn(getEvent);
  const favFn = useServerFn(toggleFavorite);
  const { user } = useSession();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent({ data: { id } }),
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!event) return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <div className="text-2xl font-bold">Event not found</div>
        <Link to="/browse" className="text-primary text-sm mt-2 inline-block">Browse concerts</Link>
      </div>
    </div>
  );

  const remaining = event.ticket_count - event.tickets_sold;
  const soldOut = remaining <= 0;

  const onBuy = () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    navigate({ to: "/checkout/$eventId", params: { eventId: event.id }, search: { qty } });
  };

  const onFav = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    const r = await favFn({ data: { event_id: event.id } });
    setFav(r.favorited);
    toast(r.favorited ? "Saved to favorites" : "Removed from favorites");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <Link to="/" className="font-black text-lg text-gradient-gold">LiveBeat</Link>
          <Link to="/browse" className="text-sm hover:text-primary">← Browse</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl overflow-hidden border border-border/60 aspect-[16/10] bg-muted">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-8xl">🎤</div>
          )}
        </div>

        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{event.category}</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-black">{event.title}</h1>
          <div className="mt-2 text-lg">{event.artist}</div>
          <div className="mt-1 text-sm text-muted-foreground">{event.venue}, {event.city}</div>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-muted">{new Date(event.event_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
            {soldOut ? (
              <span className="px-3 py-1 rounded-full bg-destructive/15 text-destructive border border-destructive/30 uppercase text-[11px]">Sold out</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px]">{remaining} tickets left</span>
            )}
          </div>

          <div className="mt-6 flex items-baseline gap-2">
            <div className="text-4xl font-black text-gradient-gold">MMK {Number(event.price).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">per ticket</div>
          </div>

          {!soldOut && (
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Quantity</label>
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="h-10 rounded-full bg-input px-4 text-sm"
              >
                {Array.from({ length: Math.min(10, remaining) }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={onBuy}
              disabled={soldOut}
              className="flex-1 h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold disabled:opacity-50"
            >{soldOut ? "Sold out" : "Buy tickets"}</button>
            <button onClick={onFav} className="h-12 px-5 rounded-full border border-border hover:bg-muted">
              {fav ? "♥" : "♡"}
            </button>
          </div>

          {event.description && (
            <div className="mt-8">
              <div className="text-sm font-semibold mb-1">About this concert</div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{event.description}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
