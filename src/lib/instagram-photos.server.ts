import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "influencer-photos";

/**
 * 인스타 CDN 프로필 사진은 링크가 만료되므로, 이미지를 내려받아 스토리지에 저장하고
 * 앱에서 계속 접근 가능한 경로를 돌려준다. 실패하면 null.
 */
export async function cacheProfilePhoto(
  account: string,
  remoteUrl: string | null,
): Promise<string | null> {
  if (!remoteUrl) return null;
  const key = `${account.toLowerCase().replace(/[^a-z0-9._-]/g, "_")}.jpg`;

  try {
    const res = await fetch(remoteUrl, { headers: { referer: "https://www.instagram.com/" } });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!bytes.length) return null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = supabaseAdmin as unknown as SupabaseClient<any, any, any>;
    const { error } = await client.storage.from(BUCKET).upload(key, bytes, {
      contentType: res.headers.get("content-type") ?? "image/jpeg",
      upsert: true,
    });
    if (error) {
      console.error("cacheProfilePhoto upload failed", error);
      return null;
    }
    return `/api/public/influencer-photo/${key}`;
  } catch (e) {
    console.error("cacheProfilePhoto failed", e);
    return null;
  }
}
