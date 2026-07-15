import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Public listing with search/filter */
export const listEvents = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().optional(),
        category: z.string().optional(),
        city: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        limit: z.number().min(1).max(60).default(24),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb.from("events").select("*").eq("status", "approved").order("event_date", { ascending: true }).limit(data.limit);
    if (data.q) q = q.or(`title.ilike.%${data.q}%,artist.ilike.%${data.q}%,venue.ilike.%${data.q}%,city.ilike.%${data.q}%`);
    if (data.category && data.category !== "all") q = q.eq("category", data.category as never);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (typeof data.minPrice === "number") q = q.gte("price", data.minPrice);
    if (typeof data.maxPrice === "number") q = q.lte("price", data.maxPrice);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Featured events (approved, upcoming, capped) */
export const featuredEvents = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("events")
    .select("*")
    .eq("status", "approved")
    .order("event_date", { ascending: true })
    .limit(6);
  if (error) throw new Error(error.message);
  return data ?? [];
});

/** Public event detail */
export const getEvent = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb.from("events").select("*").eq("id", data.id).eq("status", "approved").maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

/* ---------------- SELLER ---------------- */

const createEventSchema = z.object({
  title: z.string().trim().min(2).max(160),
  artist: z.string().trim().min(1).max(120),
  venue: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(120),
  category: z.enum(["rock", "pop", "edm", "hiphop", "jazz", "classical", "indie", "metal", "folk", "other"]),
  event_date: z.string(),
  price: z.number().nonnegative(),
  ticket_count: z.number().int().positive(),
  description: z.string().trim().max(4000).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => createEventSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("events")
      .insert({
        seller_id: context.userId,
        title: data.title,
        artist: data.artist,
        venue: data.venue,
        city: data.city,
        category: data.category,
        event_date: data.event_date,
        price: data.price,
        ticket_count: data.ticket_count,
        description: data.description ?? null,
        image_url: data.image_url ?? null,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });


export const listMyEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("events")
      .select("*")
      .eq("seller_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteMyEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("events").delete().eq("id", data.id).eq("seller_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- BUYER ---------------- */

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ event_id: z.string().uuid(), quantity: z.number().int().min(1).max(10) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: ev, error: evErr } = await context.supabase
      .from("events")
      .select("id, price, ticket_count, tickets_sold, status")
      .eq("id", data.event_id)
      .maybeSingle();
    if (evErr) throw new Error(evErr.message);
    if (!ev || ev.status !== "approved") throw new Error("Event unavailable");
    const remaining = ev.ticket_count - ev.tickets_sold;
    if (remaining < data.quantity) throw new Error(`Only ${remaining} tickets left`);

    const total = Number(ev.price) * data.quantity;
    const { data: order, error: oErr } = await context.supabase
      .from("orders")
      .insert({
        buyer_id: context.userId,
        event_id: data.event_id,
        quantity: data.quantity,
        total_price: total,
        status: "pending",
      })
      .select()
      .single();
    if (oErr) throw new Error(oErr.message);
    return order;
  });

export const submitPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ order_id: z.string().uuid(), proof_data_url: z.string().min(1).max(2_000_000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    // Store as data URL directly (demo). For production, upload to storage.
    const { error } = await context.supabase
      .from("orders")
      .update({ payment_proof_url: data.proof_data_url, status: "awaiting_review" })
      .eq("id", data.order_id)
      .eq("buyer_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const myOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, events(title, artist, venue, city, event_date, image_url)")
      .eq("buyer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const myTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tickets")
      .select("*, events(title, artist, venue, city, event_date, image_url)")
      .eq("buyer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ---------------- FAVORITES ---------------- */

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ event_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("favorites")
      .select("event_id")
      .eq("user_id", context.userId)
      .eq("event_id", data.event_id)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("favorites").delete().eq("user_id", context.userId).eq("event_id", data.event_id);
      return { favorited: false };
    }
    await context.supabase.from("favorites").insert({ user_id: context.userId, event_id: data.event_id });
    return { favorited: true };
  });

export const myFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("event_id, events(*)")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ---------------- ADMIN ---------------- */

async function requireAdmin(ctx: { supabase: ReturnType<typeof publicClient>; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminListPendingEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as never);
    const { data, error } = await context.supabase
      .from("events")
      .select("*")
      .in("status", ["pending", "approved", "rejected"])
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCheckEventTrust = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { data: ev, error: evErr } = await context.supabase
      .from("events")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (evErr) throw new Error(evErr.message);
    if (!ev) throw new Error("Event not found");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured (missing LOVABLE_API_KEY).");

    const prompt = `You are a fraud analyst reviewing a concert ticket listing on a marketplace. Return STRICT JSON: {"level":"trusted|needs_review|suspicious","reason":"one short sentence explaining why"}.
Consider: unrealistic pricing, vague or copy-pasted descriptions, mismatched artist/venue, past dates, missing image, suspicious ticket counts.
Listing:
Title: ${ev.title}
Artist: ${ev.artist}
Venue: ${ev.venue}, ${ev.city}
Category: ${ev.category}
Date: ${ev.event_date}
Price: ${ev.price}
Tickets: ${ev.ticket_count}
Description: ${ev.description ?? "(none)"}
Image: ${ev.image_url ? "provided" : "missing"}`;

    const userContent: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
    if (ev.image_url) userContent.push({ type: "image_url", image_url: { url: ev.image_url } });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: "Return only strict JSON with keys level and reason." },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (r.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
    if (r.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!r.ok) throw new Error(`AI check failed (${r.status})`);

    const j: { choices?: { message?: { content?: string } }[] } = await r.json();
    const txt = j.choices?.[0]?.message?.content ?? "";
    const m = txt.match(/\{[\s\S]*\}/);
    let level: "trusted" | "needs_review" | "suspicious" = "needs_review";
    let reason = "Model returned no verdict.";
    if (m) {
      try {
        const parsed = JSON.parse(m[0]);
        if (["trusted", "needs_review", "suspicious"].includes(parsed.level)) {
          level = parsed.level;
          reason = String(parsed.reason ?? "").slice(0, 500);
        }
      } catch { /* keep defaults */ }
    }

    const { error: upErr } = await context.supabase
      .from("events")
      .update({ trust_level: level, trust_reason: reason })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    return { level, reason };
  });


export const adminSetEventStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected", "cancelled", "pending"]),
        reason: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const patch = { status: data.status, rejection_reason: data.status === "rejected" ? data.reason ?? "Rejected by admin" : null };
    const { error } = await context.supabase.from("events").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as never);
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, events(title, artist, event_date, price)")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Admin confirms payment -> creates tickets w/ QR + notifies buyer */
export const adminConfirmOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ order_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);

    const { data: order, error: oErr } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.order_id)
      .maybeSingle();
    if (oErr || !order) throw new Error(oErr?.message ?? "Order not found");
    if (order.status === "confirmed" || order.status === "paid") return { ok: true, already: true };

    // Generate ticket rows w/ unique QR codes
    const tickets = Array.from({ length: order.quantity }).map(() => ({
      order_id: order.id,
      event_id: order.event_id,
      buyer_id: order.buyer_id,
      qr_code: `LB-${order.id.slice(0, 8)}-${crypto.randomUUID().slice(0, 12)}`,
      status: "valid" as const,
    }));
    const { error: tErr } = await context.supabase.from("tickets").insert(tickets);
    if (tErr) throw new Error(tErr.message);

    const { error: orderUpdateErr } = await context.supabase.from("orders").update({ status: "confirmed" }).eq("id", order.id);
    if (orderUpdateErr) throw new Error(orderUpdateErr.message);

    // Increment tickets_sold on event
    const { data: currentEv, error: eventFetchErr } = await context.supabase.from("events").select("tickets_sold").eq("id", order.event_id).single();
    if (eventFetchErr) throw new Error(eventFetchErr.message);
    if (currentEv) {
      const { error: eventUpdateErr } = await context.supabase
        .from("events")
        .update({ tickets_sold: currentEv.tickets_sold + order.quantity })
        .eq("id", order.event_id);
      if (eventUpdateErr) throw new Error(eventUpdateErr.message);
    }

    const { error: notificationErr } = await context.supabase.from("notifications").insert({
      user_id: order.buyer_id,
      title: "Tickets confirmed 🎫",
      body: `Your order is confirmed. ${order.quantity} ticket(s) issued with QR codes.`,
    });
    if (notificationErr) throw new Error(notificationErr.message);

    return { ok: true };
  });

export const adminRejectOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ order_id: z.string().uuid(), note: z.string().max(400).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { error } = await context.supabase
      .from("orders")
      .update({ status: "cancelled", admin_note: data.note ?? "Rejected by admin" })
      .eq("id", data.order_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- SCAN ---------------- */

export const lookupTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ qr_code: z.string().min(4).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    const isAdmin = !!(await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" })).data;
    const { data: ticket, error } = await context.supabase
      .from("tickets")
      .select("*, events(title, artist, venue, city, event_date, image_url, seller_id)")
      .eq("qr_code", data.qr_code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) return { ok: false, isAdmin, canManage: false, reason: "Invalid QR code — no ticket found." };
    const ev = (ticket as { events?: { seller_id?: string } }).events;
    const canManage = isAdmin || ev?.seller_id === context.userId;
    return { ok: true, isAdmin, canManage, ticket };
  });

export const markTicketUsed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ qr_code: z.string().min(4).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    const isAdmin = !!(await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" })).data;
    const { data: ticket, error } = await context.supabase
      .from("tickets")
      .select("*, events(title, artist, venue, city, event_date, image_url, seller_id)")
      .eq("qr_code", data.qr_code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) return { ok: false, reason: "Invalid QR code" };
    const canScan = isAdmin || (ticket as { events?: { seller_id: string } }).events?.seller_id === context.userId;
    if (!canScan) return { ok: false, reason: "Not authorized to mark this ticket", ticket };
    if (ticket.status === "used") return { ok: false, reason: "Ticket already used", ticket };
    if (ticket.status !== "valid") return { ok: false, reason: `Ticket status: ${ticket.status}`, ticket };

    const nowIso = new Date().toISOString();
    const { error: updateErr } = await context.supabase
      .from("tickets")
      .update({ status: "used", used_at: nowIso })
      .eq("id", ticket.id);
    if (updateErr) throw new Error(updateErr.message);
    return { ok: true, ticket: { ...ticket, status: "used", used_at: nowIso } };
  });

// Legacy alias (kept for existing callers)
export const scanTicket = markTicketUsed;
