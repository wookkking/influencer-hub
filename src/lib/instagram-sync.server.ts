import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScrapedProfile } from "./instagram.server";

type AnyClient = SupabaseClient<any, any, any>;

export type SyncResult = { account: string; action: "created" | "updated" };

/** Insert or update directory rows from scraped Instagram profiles. */
export async function persistProfiles(
  client: AnyClient,
  profiles: ScrapedProfile[],
  createdBy: string | null,
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const p of profiles) {
    const patch = {
      photo_url: p.photo_url,
      profile_url: p.profile_url,
      bio: p.bio,
      followers: p.followers,
      avg_likes: p.avg_likes,
      avg_comments: p.avg_comments,
      last_post_date: p.last_post_date,
      last_synced_at: new Date().toISOString(),
    };

    const { data: existing, error: findError } = await client
      .from("influencers")
      .select("id")
      .eq("platform", "인스타")
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
        platform: "인스타",
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
