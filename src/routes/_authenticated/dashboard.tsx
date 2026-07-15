import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();
  const fetchRole = useServerFn(getMyRole);

  useEffect(() => {
    fetchRole()
      .then(({ role }) => {
        if (role === "admin") navigate({ to: "/admin" });
        else if (role === "seller") navigate({ to: "/seller" });
        else if (role === "buyer") navigate({ to: "/buyer" });
        else navigate({ to: "/buyer" }); // fallback for legacy accounts
      })
      .catch(() => navigate({ to: "/buyer" }));
  }, [fetchRole, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Loading your dashboard…
    </div>
  );
}
