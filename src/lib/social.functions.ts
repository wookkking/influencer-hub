import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  platform: z.enum(["인스타", "틱톡", "유튜브"]),
  handles: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
});

export const importSocialProfiles = createServerFn({ method: "POST" })
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

    const { persistProfiles } = await import("./instagram-sync.server");
    const instagram = await import("./instagram.server");
    const social = await import("./social.server");

    const runner =
      data.platform === "틱톡"
        ? { scrape: social.scrapeTikTokProfiles, normalize: social.normalizeTikTokHandle }
        : data.platform === "유튜브"
          ? { scrape: social.scrapeYouTubeProfiles, normalize: social.normalizeYouTubeHandle }
          : { scrape: instagram.scrapeInstagramProfiles, normalize: instagram.normalizeHandle };

    const profiles = await runner.scrape(data.handles);
    if (!profiles.length) {
      return { results: [] as { account: string; action: "created" | "updated" }[], notFound: data.handles };
    }

    const results = await persistProfiles(
      context.supabase,
      profiles,
      context.userId,
      data.platform,
    );
    const found = new Set(profiles.map((p) => p.account.toLowerCase()));
    const notFound = data.handles
      .map(runner.normalize)
      .filter((h) => h && !found.has(h.toLowerCase()));

    return { results, notFound };
  });
