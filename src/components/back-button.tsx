import { useRouter, useRouterState, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Floating back button rendered globally.
 * Hidden on the home page and on the auth screen entry.
 */
export function BackButton() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Don't show on the home page — nowhere sensible to go back to.
  if (pathname === "/" || pathname === "") return null;

  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  const onClick = () => {
    if (canGoBack) router.history.back();
    else router.navigate({ to: "/" });
  };

  return (
    <div className="fixed bottom-6 left-4 z-40">
      {canGoBack ? (
        <button
          type="button"
          onClick={onClick}
          aria-label="Go back"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-background/80 backdrop-blur border border-border/60 text-sm text-foreground shadow-sm hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      ) : (
        <Link
          to="/"
          aria-label="Go home"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-background/80 backdrop-blur border border-border/60 text-sm text-foreground shadow-sm hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      )}
    </div>
  );
}
