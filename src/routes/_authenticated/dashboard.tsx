import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ensureRoleFromMetadata, getMyRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LiveBeat" }, { name: "robots", content: "noindex" }] }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();
  const fetchRole = useServerFn(getMyRole);
  const ensureRole = useServerFn(ensureRoleFromMetadata);

  useEffect(() => {
    (async () => {
      try {
        let { role } = await fetchRole();
        if (!role) {
          const res = await ensureRole();
          role = res.role ?? null;
        }
        if (role === "admin") navigate({ to: "/admin" });
        else if (role === "seller") navigate({ to: "/seller" });
        else navigate({ to: "/buyer" });
      } catch {
        navigate({ to: "/buyer" });
      }
    })();
  }, [fetchRole, ensureRole, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Loading your dashboard…
    </div>
  );
}

