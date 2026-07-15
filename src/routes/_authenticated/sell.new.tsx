import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createEvent } from "@/lib/marketplace.functions";
import { generateEventCopy } from "@/lib/event-writer.functions";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sell/new")({
  head: () => ({ meta: [{ title: "Create event — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: NewEvent,
});

const CATS = ["rock", "pop", "edm", "hiphop", "jazz", "classical", "indie", "metal", "folk", "other"];

function NewEvent() {
  const create = useServerFn(createEvent);
  const generate = useServerFn(generateEventCopy);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", artist: "", venue: "", city: "", category: "rock",
    event_date: "", price: "", ticket_count: "", description: "", image_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVibe, setAiVibe] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [aiDraft, setAiDraft] = useState<{ title: string; summary: string; description: string; promo: string } | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = (f: File) => {
    if (f.size > 1_500_000) { toast.error("Image must be under 1.5 MB"); return; }
    const r = new FileReader();
    r.onload = () => set("image_url", r.result as string);
    r.readAsDataURL(f);
  };

  const runAi = async () => {
    setAiLoading(true);
    try {
      const res = await generate({
        data: {
          artist: form.artist,
          venue: form.venue,
          city: form.city,
          event_date: form.event_date,
          price: form.price,
          category: form.category,
          vibe: aiVibe,
          notes: aiNotes,
        },
      });
      setAiDraft(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  const applyDraft = () => {
    if (!aiDraft) return;
    setForm((f) => ({
      ...f,
      title: aiDraft.title || f.title,
      description: [aiDraft.summary, aiDraft.description, aiDraft.promo ? `\n— Promo —\n${aiDraft.promo}` : ""]
        .filter(Boolean).join("\n\n").trim(),
    }));
    setAiOpen(false);
    setAiDraft(null);
    toast.success("AI copy applied. Edit freely before submitting.");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await create({
        data: {
          title: form.title,
          artist: form.artist,
          venue: form.venue,
          city: form.city,
          category: form.category as never,
          event_date: new Date(form.event_date).toISOString(),
          price: Number(form.price),
          ticket_count: parseInt(form.ticket_count, 10),
          description: form.description || null,
          image_url: form.image_url || null,
        },
      });
      toast.success(`Event submitted. AI trust: ${res.trust_level ?? "pending"}. Awaiting admin approval.`);
      navigate({ to: "/seller" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-black text-gradient-gold">LiveBeat</Link>
          <Link to="/seller" className="text-sm hover:text-primary">← Seller home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black">Create event</h1>
        <p className="text-sm text-muted-foreground">Our AI trust checker will score your listing before admin review.</p>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-border/60 card-premium p-6 grid gap-4">
          <Field label="Event title"><input required value={form.title} onChange={(e) => set("title", e.target.value)} className="input" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Artist"><input required value={form.artist} onChange={(e) => set("artist", e.target.value)} className="input" /></Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input capitalize">
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Venue"><input required value={form.venue} onChange={(e) => set("venue", e.target.value)} className="input" /></Field>
            <Field label="City"><input required value={form.city} onChange={(e) => set("city", e.target.value)} className="input" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date & time"><input required type="datetime-local" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className="input" /></Field>
            <Field label="Price (₹)"><input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className="input" /></Field>
            <Field label="Ticket count"><input required type="number" min="1" value={form.ticket_count} onChange={(e) => set("ticket_count", e.target.value)} className="input" /></Field>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90"
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate with AI
              </button>
            </div>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className="input min-h-[120px] mt-1" placeholder="Describe your event, or use ✨ Generate with AI" />
          </div>
          <Field label="Event image">
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-sm" />
            {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 rounded-lg max-h-48 border border-border/60" />}
          </Field>
          <button disabled={submitting} className="h-12 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      </main>

      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Event Description Writer</h2>
              <button type="button" onClick={() => { setAiOpen(false); setAiDraft(null); }} className="p-1 hover:opacity-70"><X className="w-5 h-5" /></button>
            </div>

            {!aiDraft ? (
              <div className="grid gap-3">
                <p className="text-sm text-muted-foreground">Using: <b>{form.artist || "?"}</b> · {form.venue || "?"}, {form.city || "?"} · {form.event_date || "?"} · ₹{form.price || "?"} · {form.category}</p>
                <Field label="Vibe / mood (optional)">
                  <input value={aiVibe} onChange={(e) => setAiVibe(e.target.value)} placeholder="e.g. energetic, intimate acoustic, festival-style" className="input" />
                </Field>
                <Field label="Extra notes (optional)">
                  <textarea value={aiNotes} onChange={(e) => setAiNotes(e.target.value)} rows={3} placeholder="Highlights, opening act, dress code, anything special…" className="input min-h-[80px]" />
                </Field>
                <div className="flex gap-2 justify-end mt-2">
                  <button type="button" onClick={() => setAiOpen(false)} className="px-4 h-10 rounded-full border border-border/60 text-sm">Cancel</button>
                  <button
                    type="button"
                    disabled={aiLoading || (!form.artist && !form.venue)}
                    onClick={runAi}
                    className="px-5 h-10 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold text-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> {aiLoading ? "Generating…" : "Generate"}
                  </button>
                </div>
                {!form.artist && !form.venue && (
                  <p className="text-xs text-muted-foreground">Fill in at least artist or venue in the form for best results.</p>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                <p className="text-xs text-muted-foreground">Preview and edit before applying to your form.</p>
                <Field label="Title"><input value={aiDraft.title} onChange={(e) => setAiDraft({ ...aiDraft, title: e.target.value })} className="input" /></Field>
                <Field label="Summary"><textarea value={aiDraft.summary} onChange={(e) => setAiDraft({ ...aiDraft, summary: e.target.value })} rows={2} className="input min-h-[60px]" /></Field>
                <Field label="Full description"><textarea value={aiDraft.description} onChange={(e) => setAiDraft({ ...aiDraft, description: e.target.value })} rows={6} className="input min-h-[140px]" /></Field>
                <Field label="Promo text"><textarea value={aiDraft.promo} onChange={(e) => setAiDraft({ ...aiDraft, promo: e.target.value })} rows={2} className="input min-h-[60px]" /></Field>
                <div className="flex gap-2 justify-between mt-2">
                  <button type="button" onClick={runAi} disabled={aiLoading} className="px-4 h-10 rounded-full border border-border/60 text-sm disabled:opacity-50">
                    {aiLoading ? "Regenerating…" : "↻ Regenerate"}
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setAiOpen(false); setAiDraft(null); }} className="px-4 h-10 rounded-full border border-border/60 text-sm">Discard</button>
                    <button type="button" onClick={applyDraft} className="px-5 h-10 rounded-full bg-gradient-gold text-primary-foreground font-medium shadow-gold text-sm">Apply to form</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`.input{height:44px;border-radius:9999px;background:hsl(var(--input));padding:0 1.25rem;font-size:.875rem;outline:none;width:100%}
      textarea.input{border-radius:1rem;padding:.75rem 1rem;height:auto}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
