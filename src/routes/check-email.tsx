import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/check-email")({
  validateSearch: z.object({ email: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Check your email — LiveBeat" },
      { name: "description", content: "Confirm your LiveBeat email address to activate your account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const { email } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-5 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
            <span className="text-primary-foreground font-bold">L</span>
          </div>
          <span className="font-display text-xl">Live<span className="text-gradient-gold">Beat</span></span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-card border border-border/60 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-gold mx-auto mb-5 flex items-center justify-center shadow-gold text-2xl">
            ✉️
          </div>
          <h1 className="font-display text-2xl mb-2">Confirm your email</h1>
          <p className="text-muted-foreground mb-6">
            We sent a confirmation link{email ? <> to <span className="text-foreground font-medium">{email}</span></> : null}.
            Click the link in that email to activate your LiveBeat account, then come back to sign in.
          </p>
          <div className="text-sm text-muted-foreground space-y-2 mb-6 text-left bg-muted/40 rounded-lg p-4">
            <p>• Check your spam or promotions folder if you don't see it.</p>
            <p>• The email is sent by our provider on behalf of LiveBeat.</p>
            <p>• Links expire — if it doesn't work, sign up again.</p>
          </div>
          <Link
            to="/auth"
            className="inline-block px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
