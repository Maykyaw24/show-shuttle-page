import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  artist: z.string().max(200).optional().default(""),
  venue: z.string().max(200).optional().default(""),
  city: z.string().max(200).optional().default(""),
  event_date: z.string().max(100).optional().default(""),
  price: z.string().max(50).optional().default(""),
  category: z.string().max(50).optional().default(""),
  vibe: z.string().max(500).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
});

export const generateEventCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => inputSchema.parse(i))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured (missing LOVABLE_API_KEY).");

    const system = `You are an expert event copywriter for a live-music ticket marketplace.
Given the seller's raw event details, produce polished, professional, attractive marketing copy.
Return STRICT JSON with these fields only:
- title: a catchy event page title (max 70 chars)
- summary: one-sentence hook (max 140 chars)
- description: 2-3 paragraphs, vivid but honest, no emojis, no false claims, no invented lineup
- promo: short social-post promo text (max 220 chars, may include 1-2 tasteful emojis and up to 3 hashtags)
Only invent atmosphere and phrasing — never invent facts (dates, artists, venues, prices) not provided.`;

    const user = `Event details:
Artist: ${data.artist || "(not provided)"}
Venue: ${data.venue || "(not provided)"}
City: ${data.city || "(not provided)"}
Date/time: ${data.event_date || "(not provided)"}
Price: ${data.price || "(not provided)"}
Genre/category: ${data.category || "(not provided)"}
Vibe/mood: ${data.vibe || "(not provided)"}
Extra notes: ${data.notes || "(none)"}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (r.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
    if (r.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`AI request failed (${r.status}): ${txt.slice(0, 200)}`);
    }
    const j: { choices?: { message?: { content?: string } }[] } = await r.json();
    const raw = j.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed: { title?: string; summary?: string; description?: string; promo?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // fall back to putting the whole thing into description
      parsed = { description: raw };
    }
    return {
      title: parsed.title?.trim() || "",
      summary: parsed.summary?.trim() || "",
      description: parsed.description?.trim() || "",
      promo: parsed.promo?.trim() || "",
    };
  });
