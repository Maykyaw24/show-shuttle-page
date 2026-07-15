import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { DashboardShell } from "@/components/dashboard-shell";
import { chatWithBot } from "@/lib/chatbot.functions";
import { getMyRole } from "@/lib/auth.functions";
import { toast } from "sonner";
import { Sparkles, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Assistant — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: ChatPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "livebeat.chat.v1";

const SUGGESTIONS_BY_ROLE: Record<string, string[]> = {
  buyer: [
    "Show my tickets and check-in instructions",
    "What's the status of my recent orders?",
    "Recommend an energetic concert this month",
  ],
  seller: [
    "How are my events doing?",
    "Which of my events are still pending approval?",
    "Show sales for my approved events",
  ],
  admin: [
    "What events are pending moderation?",
    "Any suspicious listings?",
    "Show orders awaiting review",
  ],
};

function ChatPage() {
  const send = useServerFn(chatWithBot);
  const fetchRole = useServerFn(getMyRole);
  const { data: roleData } = useQuery({ queryKey: ["me", "role"], queryFn: () => fetchRole() });
  const role = roleData?.role ?? "buyer";

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const NAV = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Assistant", to: "/chat" },
  ];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch { /* ignore */ }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* ignore */ }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await send({ data: { messages: next.slice(-20) } });
      setMessages((m) => [...m, { role: "assistant", content: res.text }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assistant is unavailable");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    inputRef.current?.focus();
  };

  const suggestions = SUGGESTIONS_BY_ROLE[role] ?? SUGGESTIONS_BY_ROLE.buyer;

  return (
    <DashboardShell
      title={<>LiveBeat <span className="text-gradient-gold">Assistant</span></>}
      subtitle="Ask about your tickets, events, orders — or get event recommendations. Answers come from live database data only."
      nav={NAV}
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-border/60 card-premium overflow-hidden flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex w-12 h-12 rounded-full bg-gradient-gold items-center justify-center shadow-gold mb-3">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Signed in as <span className="text-foreground font-medium">{role}</span>. Try one of these:
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/70 hover:bg-muted transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground text-sm whitespace-pre-wrap">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[90%] text-sm prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="text-sm text-muted-foreground animate-pulse">Thinking…</div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border/60 p-3 bg-background/50">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              placeholder="Ask about your tickets, events, or get recommendations…"
              rows={1}
              disabled={busy}
              className="flex-1 resize-none rounded-2xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring max-h-40 disabled:opacity-60"
            />
            <button
              onClick={submit}
              disabled={busy || !input.trim()}
              className="h-10 w-10 shrink-0 rounded-full bg-gradient-gold text-primary-foreground shadow-gold inline-flex items-center justify-center disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {messages.length > 0 && (
            <div className="flex justify-end mt-2">
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">
                Clear conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
