import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  platform: z.enum(["인스타", "틱톡", "유튜브"]),
  hashtags: z.array(z.string().trim().min(1).max(60)).min(1).max(5),
  limit: z.number().int().min(1).max(100).default(30),
});

export const discoverInfluencersByHashtag = createServerFn({ method: "POST" })
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

    const { discoverHandlesByHashtag } = await import("./discover.server");
    const { persistProfiles } = await import("./instagram-sync.server");
    const instagram = await import("./instagram.server");
    const social = await import("./social.server");

    const handles = await discoverHandlesByHashtag(data.platform, data.hashtags, data.limit);
    if (!handles.length) {
      return { discovered: 0, created: 0, updated: 0, accounts: [] as string[], failed: [] as string[] };
    }

    const scrape =
      data.platform === "틱톡"
        ? social.scrapeTikTokProfiles
        : data.platform === "유튜브"
          ? social.scrapeYouTubeProfiles
          : instagram.scrapeInstagramProfiles;

    let created = 0;
    let updated = 0;
    const accounts: string[] = [];
    const failed: string[] = [];

    for (let i = 0; i < handles.length; i += 20) {
      const batch = handles.slice(i, i + 20);
      try {
        const profiles = await scrape(batch);
        const results = await persistProfiles(
          context.supabase,
          profiles,
          context.userId,
          data.platform,
        );
        for (const r of results) {
          if (r.action === "created") created += 1;
          else updated += 1;
          accounts.push(r.account);
        }
        const got = new Set(profiles.map((p) => p.account.toLowerCase()));
        failed.push(...batch.filter((h) => !got.has(h.toLowerCase())));
      } catch (e) {
        console.error("hashtag discover batch failed", e);
        failed.push(...batch);
      }
    }

    return { discovered: handles.length, created, updated, accounts, failed };
  });
