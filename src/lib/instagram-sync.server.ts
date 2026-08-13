import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScrapedProfile } from "./instagram.server";

type AnyClient = SupabaseClient<any, any, any>;

export type SyncResult = { account: string; action: "created" | "updated" };

/** Insert or update directory rows from scraped profiles. */
export async function persistProfiles(
  client: AnyClient,
  profiles: ScrapedProfile[],
  createdBy: string | null,
  platform: string = "인스타",
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  const { cacheProfilePhoto } = await import("./instagram-photos.server");

  for (const p of profiles) {
    // 값이 0인 항목(영상이 없는 계정 등)은 기존 값을 덮어쓰지 않는다.
    const patch: Record<string, unknown> = {
      profile_url: p.profile_url,
      last_synced_at: new Date().toISOString(),
    };
    // CDN 링크는 만료되므로 이미지를 스토리지에 캐시해 둔다.
    const cached = await cacheProfilePhoto(`${platform}_${p.account}`, p.photo_url);

    if (cached) patch["photo_url"] = cached;
    else if (p.photo_url) patch["photo_url"] = p.photo_url;
    if (p.display_name) patch["display_name"] = p.display_name;
    if (p.bio) patch["bio"] = p.bio;
    if (p.followers > 0) patch["followers"] = p.followers;
    if (p.avg_likes > 0) patch["avg_likes"] = p.avg_likes;
    if (p.avg_views > 0) patch["avg_views"] = p.avg_views;
    if (p.avg_comments > 0) patch["avg_comments"] = p.avg_comments;
    if (p.last_post_date) patch["last_post_date"] = p.last_post_date;



    const { data: existing, error: findError } = await client
      .from("influencers")
      .select("id")
      .eq("platform", platform)
      .ilike("account", p.account)
      .maybeSingle();
    if (findError) throw findError;

    if (existing?.id) {
      const { error } = await client.from("influencers").update(patch).eq("id", existing.id);
      if (error) throw error;
      results.push({ account: p.account, action: "updated" });
    } else {
      const { error } = await client.from("influencers").insert({
        ...patch,
        platform,
        account: p.account,
        categories: [],
        created_by: createdBy,
      });
      if (error) throw error;
      results.push({ account: p.account, action: "created" });
    }
  }

  return results;
}
