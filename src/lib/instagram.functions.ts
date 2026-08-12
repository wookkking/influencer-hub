import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  handles: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
});

export const importInstagramProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminRow, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!adminRow) throw new Error("관리자만 사용할 수 있습니다.");

    const { scrapeInstagramProfiles } = await import("./instagram.server");
    const { persistProfiles } = await import("./instagram-sync.server");

    const profiles = await scrapeInstagramProfiles(data.handles);
    if (!profiles.length) {
      return { results: [], notFound: data.handles };
    }
    const results = await persistProfiles(context.supabase, profiles, context.userId);
    const found = new Set(profiles.map((p) => p.account.toLowerCase()));
    const { normalizeHandle } = await import("./instagram.server");
    const notFound = data.handles
      .map(normalizeHandle)
      .filter((h) => h && !found.has(h.toLowerCase()));

    return { results, notFound };
  });
