import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, X, Sparkles, Trash2 } from "lucide-react";
import { chatWithBot } from "@/lib/chatbot.functions";
import { getMyRole } from "@/lib/auth.functions";
import { toast } from "sonner";

type ChatMsg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "livebeat.chat.v1";

const SUGGESTIONS_BY_ROLE: Record<string, string[]> = {
  buyer: [
    "Show my tickets",
    "Status of my orders?",
    "Recommend an energetic concert",
  ],
  seller: [
    "How are my events doing?",
    "Which events are pending approval?",
    "Show my sales",
  ],
  admin: [
    "Events pending moderation?",
    "Any suspicious listings?",
    "Orders awaiting review",
  ],
};

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = useServerFn(chatWithBot);
  const fetchRole = useServerFn(getMyRole);
  const { data: roleData } = useQuery({
    queryKey: ["me", "role"],
    queryFn: () => fetchRole(),
    staleTime: 60_000,
  });
  const role = roleData?.role ?? "buyer";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages, busy]);

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
    }
  };

  const reset = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const suggestions = SUGGESTIONS_BY_ROLE[role] ?? SUGGESTIONS_BY_ROLE.buyer;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-gold text-primary-foreground shadow-gold inline-flex items-center justify-center hover:scale-105 transition"
          aria-label="Open LiveBeat Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[380px] h-[70vh] max-h-[600px] rounded-2xl border border-border/60 bg-background shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-gold text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-background/20 inline-flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">LiveBeat Assistant</div>
                <div className="text-[11px] opacity-80 capitalize">Signed in as {role}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="h-8 w-8 rounded-full hover:bg-background/20 inline-flex items-center justify-center"
                  aria-label="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-background/20 inline-flex items-center justify-center"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
            {messages.length === 0 && (
              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-3">
                  Hey! 👋 Ask about your tickets, events, orders, or say "recommend a concert".
                </div>
                <div className="flex flex-wrap gap-2">
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
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 bg-primary text-primary-foreground text-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[90%] rounded-2xl rounded-bl-sm px-3 py-2 bg-muted text-foreground text-sm prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm px-3 py-2 bg-muted text-muted-foreground text-sm animate-pulse">
                  Typing…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border/60 p-2.5 bg-background">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                }}
                placeholder="Type a message…"
                rows={1}
                disabled={busy}
                className="flex-1 resize-none rounded-2xl bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring max-h-32 disabled:opacity-60"
              />
              <button
                onClick={submit}
                disabled={busy || !input.trim()}
                className="h-9 w-9 shrink-0 rounded-full bg-gradient-gold text-primary-foreground shadow-gold inline-flex items-center justify-center disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
