import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type NavItem = { label: string; to: string };

export function DashboardShell({
  title,
  subtitle,
  badge,
  nav,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  nav?: NavItem[];
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="font-display text-lg hidden sm:inline">
              Live<span className="text-gradient-gold">Beat</span>
            </span>
          </Link>
          {nav && nav.length > 0 && (
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  activeProps={{ className: "px-3 py-1.5 rounded-full bg-muted text-foreground" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
          <button
            onClick={signOut}
            className="text-sm px-4 py-2 rounded-full border border-border hover:bg-muted transition"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display flex items-center gap-3 flex-wrap">
              {title}
              {badge}
            </h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "gold" | "warn" | "danger" | "success";
}) {
  const toneCls =
    tone === "gold"
      ? "border-primary/40"
      : tone === "warn"
        ? "border-accent/40"
        : tone === "danger"
          ? "border-destructive/40"
          : tone === "success"
            ? "border-emerald-500/40"
            : "border-border/60";
  return (
    <div className={`rounded-2xl border ${toneCls} card-premium p-5`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-display">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const s = status.toLowerCase();
  const cls =
    s.includes("approved") || s.includes("upcoming") || s.includes("active") || s.includes("paid")
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : s.includes("pending") || s.includes("review")
        ? "bg-accent/15 text-accent border-accent/30"
        : s.includes("sold") || s.includes("used") || s.includes("closed")
          ? "bg-muted text-muted-foreground border-border"
          : s.includes("reject") || s.includes("suspicious") || s.includes("flag")
            ? "bg-destructive/15 text-destructive border-destructive/30"
            : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${cls}`}>
      {status}
    </span>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 card-premium p-5 md:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-display text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
