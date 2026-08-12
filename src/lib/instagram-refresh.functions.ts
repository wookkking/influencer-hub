import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** 디렉터리에 등록된 모든 인스타 계정의 최근 게시글 지표를 다시 수집한다. */
export const refreshAllInstagramProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminRow, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!adminRow) throw new Error("관리자만 사용할 수 있습니다.");

    const { data: rows, error } = await context.supabase
      .from("influencers")
      .select("account")
      .eq("platform", "인스타");
    if (error) throw error;

    const handles = (rows ?? []).map((r) => r.account).filter(Boolean);
    if (!handles.length) return { updated: 0, failed: [] as string[] };

    const { scrapeInstagramProfiles } = await import("./instagram.server");
    const { persistProfiles } = await import("./instagram-sync.server");

    let updated = 0;
    const failed: string[] = [];
    for (let i = 0; i < handles.length; i += 20) {
      const batch = handles.slice(i, i + 20);
      try {
        const profiles = await scrapeInstagramProfiles(batch);
        const results = await persistProfiles(context.supabase, profiles, context.userId);
        updated += results.length;
        const found = new Set(profiles.map((p) => p.account.toLowerCase()));
        failed.push(...batch.filter((h) => !found.has(h.toLowerCase())));
      } catch (e) {
        console.error("refresh batch failed", e);
        failed.push(...batch);
      }
    }

    return { updated, failed };
  });
