import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_CODE = "trio123";

const buyerSchema = z.object({
  role: z.literal("buyer"),
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(3).max(40),
  city: z.string().trim().min(1).max(120),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

const sellerSchema = z.object({
  role: z.literal("seller"),
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(3).max(40),
  organization: z.string().trim().min(1).max(160),
  seller_type: z.enum(["artist", "organizer", "promoter", "venue", "agency"]),
  city: z.string().trim().min(1).max(120),
  event_category: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(1000).optional().nullable(),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

const adminSchema = z.object({
  role: z.literal("admin"),
  full_name: z.string().trim().min(1).max(120),
  admin_code: z.string().min(1).max(80),
});

const signupSchema = z.discriminatedUnion("role", [buyerSchema, sellerSchema, adminSchema]);

export type SignupProfileInput = z.infer<typeof signupSchema>;

/**
 * Called immediately after supabase.auth.signUp() succeeds on the client.
 * Validates fields server-side, verifies the admin code when role=admin,
 * writes the profile and inserts the user_roles row via service role.
 */
export const completeSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => signupSchema.parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    if (data.role === "admin" && data.admin_code !== ADMIN_CODE) {
      throw new Error("Invalid admin code");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Build profile row
    const profile =
      data.role === "buyer"
        ? {
            id: userId,
            full_name: data.full_name,
            phone: data.phone,
            city: data.city,
            avatar_url: data.avatar_url ?? null,
          }
        : data.role === "seller"
        ? {
            id: userId,
            full_name: data.full_name,
            phone: data.phone,
            city: data.city,
            avatar_url: data.avatar_url ?? null,
            organization: data.organization,
            seller_type: data.seller_type,
            event_category: data.event_category,
            bio: data.bio ?? null,
          }
        : { id: userId, full_name: data.full_name };

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(profile as never, { onConflict: "id" });
    if (profileErr) throw new Error(profileErr.message);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      throw new Error(roleErr.message);
    }

    return { ok: true, role: data.role };
  });

/** Returns the signed-in user's role (or null). */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { role: (data?.role as "buyer" | "seller" | "admin" | undefined) ?? null };
  });

/** Returns the signed-in user's profile + role. */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId).maybeSingle(),
    ]);
    return {
      profile: profile ?? null,
      role: (roleRow?.role as "buyer" | "seller" | "admin" | undefined) ?? null,
    };
  });

/**
 * If the user has no role row yet, read the pending signup payload from
 * auth.user_metadata.pending_signup and materialize the profile + role.
 * Called from the dashboard router on first authenticated visit after
 * email confirmation (when the signUp() call returned no session).
 */
export const ensureRoleFromMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;

    const { data: existing } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing?.role) return { role: existing.role as "buyer" | "seller" | "admin" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userErr || !userRes?.user) return { role: null };

    const pending = (userRes.user.user_metadata ?? {}).pending_signup;
    const parsed = signupSchema.safeParse(pending);
    if (!parsed.success) return { role: null };
    const data = parsed.data;

    if (data.role === "admin" && data.admin_code !== ADMIN_CODE) {
      return { role: null };
    }

    const profile =
      data.role === "buyer"
        ? { id: userId, full_name: data.full_name, phone: data.phone, city: data.city, avatar_url: data.avatar_url ?? null }
        : data.role === "seller"
        ? {
            id: userId,
            full_name: data.full_name,
            phone: data.phone,
            city: data.city,
            avatar_url: data.avatar_url ?? null,
            organization: data.organization,
            seller_type: data.seller_type,
            event_category: data.event_category,
            bio: data.bio ?? null,
          }
        : { id: userId, full_name: data.full_name };

    await supabaseAdmin.from("profiles").upsert(profile as never, { onConflict: "id" });
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });

    // Clear the pending payload so we don't re-run this.
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { ...userRes.user.user_metadata, pending_signup: null },
    });

    return { role: data.role };
  });
