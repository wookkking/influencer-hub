import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const discoverInfluencersByHashtag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        platform: z.enum(["인스타", "틱톡", "유튜브"]),
        mode: z.enum(["hashtag", "keyword"]).default("hashtag"),
        hashtags: z.array(z.string().trim().min(1).max(60)).min(1).max(5),
        limit: z.number().int().min(1).max(100).default(30),
        maxFollowers: z.number().int().min(100).max(10_000_000).nullable().default(null),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: adminRow, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!adminRow) throw new Error("관리자만 사용할 수 있습니다.");

    const { discoverHandlesByHashtag, discoverHandlesByKeyword, isKoreanProfile } = await import("./discover.server");
    const { persistProfiles } = await import("./instagram-sync.server");
    const instagram = await import("./instagram.server");
    const social = await import("./social.server");

    const discover = data.mode === "keyword" ? discoverHandlesByKeyword : discoverHandlesByHashtag;
    const candidates = await discover(data.platform, data.hashtags, data.limit);
    const discovered = candidates.length;

    // 이미 등록된 계정은 제외 (중복 제거)
    const { data: existingRows, error: existingError } = await context.supabase
      .from("influencers")
      .select("account, platform");
    if (existingError) throw existingError;
    const existing = new Set(
      (existingRows ?? [])
        .filter((r) => r.platform === data.platform)
        .map((r) => r.account.replace(/^@/, "").trim().toLowerCase()),
    );

    const max = data.maxFollowers;
    const eligible = candidates.filter((c) => !existing.has(c.handle.toLowerCase()));
    const duplicates = discovered - eligible.length;

    // 팔로워 상한이 있으면: 이미 팔로워를 아는 후보 중 조건 충족만, 모르는 후보는 뒤로 미뤄 확인
    const withinRange = max == null ? eligible : eligible.filter((c) => c.followers != null && c.followers <= max);
    const unknown = max == null ? [] : eligible.filter((c) => c.followers == null);
    const overLimit = max == null ? 0 : eligible.length - withinRange.length - unknown.length;

    const ordered = [...withinRange, ...unknown].sort((a, b) => {
      if (a.koreanScore !== b.koreanScore) return b.koreanScore - a.koreanScore;
      return (a.followers ?? Number.MAX_SAFE_INTEGER) - (b.followers ?? Number.MAX_SAFE_INTEGER);
    });
    // 프로필 검증에서 탈락한 후보를 보충할 수 있도록 요청 수보다 넉넉히 확인한다.
    const selectedCandidates = ordered.slice(0, Math.max(data.limit * 5, 100));
    const handles = selectedCandidates.map((c) => c.handle);
    const koreanCandidateHandles = new Set(
      selectedCandidates.filter((candidate) => candidate.koreanScore > 0).map((candidate) => candidate.handle.toLowerCase()),
    );

    if (!handles.length) {
      return {
        discovered,
        duplicates,
        overLimit,
        created: 0,
        updated: 0,
        accounts: [] as string[],
        failed: [] as string[],
        rejectedLanguage: 0,
      };
    }

    const scrape =
      data.platform === "틱톡"
        ? social.scrapeTikTokProfiles
        : data.platform === "유튜브"
          ? social.scrapeYouTubeProfiles
          : instagram.scrapeInstagramProfiles;

    let created = 0;
    let updated = 0;
    let skippedOverLimit = 0;
    let rejectedLanguage = 0;
    const accounts: string[] = [];
    const failed: string[] = [];

    const scrapeWithRetry = async (batch: string[]) => {
      try {
        return await scrape(batch);
      } catch (firstError) {
        console.warn("discover batch retry", firstError);
        return scrape(batch);
      }
    };

    for (let i = 0; i < handles.length && created + updated < data.limit; i += 20) {
      const batch = handles.slice(i, i + 20);
      try {
        const all = await scrapeWithRetry(batch);
        const profiles = all
          .filter((p) => {
            const ok = max == null || (p.followers > 0 && p.followers <= max);
            if (!ok) skippedOverLimit += 1;
            return ok;
          })
          .filter((p) => {
            if (data.platform !== "인스타") return true;
            const korean = isKoreanProfile(p) || koreanCandidateHandles.has(p.account.toLowerCase());
            if (!korean) rejectedLanguage += 1;
            return korean;
          })
          .slice(0, data.limit - created - updated);
        if (profiles.length) {
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
        }
        const got = new Set(all.map((p) => p.account.toLowerCase()));
        failed.push(...batch.filter((h) => !got.has(h.toLowerCase())));
      } catch (e) {
        console.error("hashtag discover batch failed", e);
        failed.push(...batch);
      }
    }

    return {
      discovered,
      duplicates,
      overLimit: overLimit + skippedOverLimit,
      created,
      updated,
      accounts,
      failed,
      rejectedLanguage,
    };
  });
