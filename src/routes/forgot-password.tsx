import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — LiveBeat" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Reset email sent");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border/60 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-display mb-2">Reset your password</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email and we'll send you a link to reset it.
        </p>
        {sent ? (
          <p className="text-sm">Check your inbox — the reset link will bring you back here.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 rounded-lg bg-background border border-border"
            />
            <button
              disabled={busy}
              className="w-full py-3 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="mt-4 text-sm text-center">
          <Link to="/auth" className="underline underline-offset-4">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
