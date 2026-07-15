import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { completeSignup } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LiveBeat" },
      { name: "description", content: "Sign in or create a LiveBeat account to buy or sell concert tickets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup";
type Role = "buyer" | "seller" | "admin";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");

  // Redirect away if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

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
        <div className="w-full max-w-xl bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex bg-muted rounded-full p-1 mb-6">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm rounded-full transition ${
                  mode === m ? "bg-background shadow font-semibold" : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {mode === "login" ? <LoginForm /> : <SignupForm />}

          {mode === "login" && (
            <p className="mt-4 text-sm text-center text-muted-foreground">
              <Link to="/forgot-password" className="hover:text-foreground underline underline-offset-4">
                Forgot your password?
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("confirm") || msg.includes("not confirmed")) {
        toast.message("Please confirm your email to continue.");
        navigate({ to: "/check-email", search: { email } });
        return;
      }
      return toast.error(error.message);
    }
    toast.success("Welcome back!");
    if (email.trim().toLowerCase() === "pachi55447@gmail.com") {
      navigate({ to: "/seller" });
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" type="email" value={email} onChange={setEmail} required />
      <Field label="Password" type="password" value={password} onChange={setPassword} required />
      <button
        disabled={busy}
        className="w-full py-3 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function SignupForm() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("buyer");
  const [busy, setBusy] = useState(false);

  // shared
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // buyer/seller
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // seller only
  const [organization, setOrganization] = useState("");
  const [sellerType, setSellerType] = useState<"artist" | "organizer" | "promoter" | "venue" | "agency">("artist");
  const [eventCategory, setEventCategory] = useState("");
  const [bio, setBio] = useState("");

  // admin only
  const [adminCode, setAdminCode] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Client-side pre-check for admin so users get instant feedback
      if (role === "admin" && adminCode.trim() !== "trio123") {
        throw new Error("Invalid admin code");
      }

      // Build the full signup payload so we can persist it whether or not
      // signUp() returns an immediate session (email confirmation on/off).
      const payload =
        role === "buyer"
          ? { role, full_name: fullName, phone, city, avatar_url: avatarUrl || null }
          : role === "seller"
          ? {
              role,
              full_name: fullName,
              phone,
              city,
              organization,
              seller_type: sellerType,
              event_category: eventCategory,
              bio: bio || null,
              avatar_url: avatarUrl || null,
            }
          : { role, full_name: fullName, admin_code: adminCode };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          // Stash the payload in user_metadata so the server can materialize
          // the role + profile on first login even without an initial session.
          data: { full_name: fullName, pending_signup: payload },
        },
      });
      if (error) throw error;
      if (!data.session) {
        toast.success("Check your email to confirm your account.");
        navigate({ to: "/check-email", search: { email } });
        return;
      }

      await completeSignup({ data: payload as never });
      toast.success("Account created!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">I want to join as</label>
        <div className="grid grid-cols-3 gap-2">
          {(["buyer", "seller", "admin"] as Role[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`py-2 rounded-lg border text-sm capitalize transition ${
                role === r
                  ? "border-primary bg-primary/10 text-foreground font-semibold"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Field label="Full name" value={fullName} onChange={setFullName} required />
      <Field label="Email" type="email" value={email} onChange={setEmail} required />
      <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />

      {role !== "admin" && (
        <>
          <Field label="Phone number" value={phone} onChange={setPhone} required />
          <Field label="City or location" value={city} onChange={setCity} required />
        </>
      )}

      {role === "seller" && (
        <>
          <Field label="Organization or stage name" value={organization} onChange={setOrganization} required />
          <div>
            <label className="block text-sm font-medium mb-1">Seller type</label>
            <select
              value={sellerType}
              onChange={(e) => setSellerType(e.target.value as typeof sellerType)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border"
            >
              <option value="artist">Artist</option>
              <option value="organizer">Organizer</option>
              <option value="promoter">Promoter</option>
              <option value="venue">Venue</option>
              <option value="agency">Agency</option>
            </select>
          </div>
          <Field label="Event category (e.g. Pop, Rock, EDM)" value={eventCategory} onChange={setEventCategory} required />
          <div>
            <label className="block text-sm font-medium mb-1">Short bio or description</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border"
            />
          </div>
        </>
      )}

      {role !== "admin" && (
        <Field label="Profile photo URL (optional)" value={avatarUrl} onChange={setAvatarUrl} />
      )}

      {role === "admin" && (
        <Field label="Admin code" type="password" value={adminCode} onChange={setAdminCode} required />
      )}

      <button
        disabled={busy}
        className="w-full py-3 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold disabled:opacity-60"
      >
        {busy ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}
