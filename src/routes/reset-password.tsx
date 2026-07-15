import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — LiveBeat" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-card border border-border/60 rounded-2xl p-8 shadow-xl space-y-4"
      >
        <h1 className="text-2xl font-display">Set a new password</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
          minLength={6}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border"
        />
        <button
          disabled={busy}
          className="w-full py-3 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
