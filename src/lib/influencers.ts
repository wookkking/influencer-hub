import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export type Influencer = {
  id: string;
  seq: number | null;
  brand: string | null;
  platform: string;
  account: string;
  photo_url: string | null;
  profile_url: string | null;
  followers: number;
  avg_likes: number;
  avg_comments: number;
  engagement_rate: number | null;
  categories: string[];
  bio: string | null;
  last_post_date: string | null;
  created_by: string | null;
  created_at: string;
};

export type SavedInfluencer = {
  id: string;
  user_id: string;
  influencer_id: string;
  contact_status: string;
  contact_date: string | null;
  contact_note: string | null;
  reply_status: string;
  reply_date: string | null;
  reply_note: string | null;
  terms_status: string;
  terms_note: string | null;
  contract_sent: boolean;
  contract_returned: boolean;
  content_draft: boolean;
  upload_date: string | null;
  upload_link: string | null;
  views: number | null;
  result_likes: number | null;
  result_comments: number | null;
  memo: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

/** 진행 상황 기록 단위 — 내 리스트 기본값 또는 캠페인(프로젝트)별 기록 */
export type TrackRecord = {
  contact_status: string;
  contact_date: string | null;
  contact_note: string | null;
  reply_status: string;
  reply_date: string | null;
  reply_note: string | null;
  terms_note: string | null;
  contract_sent: boolean;
  contract_returned: boolean;
  upload_date: string | null;
  upload_link: string | null;
  views: number | null;
  result_likes: number | null;
  result_comments: number | null;
  memo: string | null;
  completed: boolean;
};

/** 조회수 ÷ 팔로워 (도달률) */
export function reachRate(views: number | null, followers: number) {
  if (!followers || !views) return null;
  return (views / followers) * 100;
}

/** (좋아요 + 댓글) ÷ 조회수 (반응률) */
export function viewReactionRate(r: Pick<TrackRecord, "views" | "result_likes" | "result_comments">) {
  if (!r.views) return null;
  return (((r.result_likes ?? 0) + (r.result_comments ?? 0)) / r.views) * 100;
}

/** (좋아요 + 댓글) ÷ 팔로워 (팔로워 대비 반응률) */
export function followerReactionRate(
  r: Pick<TrackRecord, "result_likes" | "result_comments">,
  followers: number,
) {
  if (!followers) return null;
  const sum = (r.result_likes ?? 0) + (r.result_comments ?? 0);
  if (!sum) return null;
  return (sum / followers) * 100;
}

export type SavedWithInfluencer = SavedInfluencer & { influencer: Influencer };

export const CONTACT_STATUS = ["미컨택", "컨택완료", "보류"] as const;
export const REPLY_STATUS = ["대기", "답변완료", "거절"] as const;
export const TERMS_STATUS = ["미정", "협의중", "협의완료"] as const;
export const PLATFORMS = ["인스타", "유튜브", "틱톡", "블로그"] as const;
export const CATEGORIES = [
  "뷰티",
  "패션",
  "일상",
  "푸드",
  "홈/리빙",
  "건강/다이어트",
  "육아/키즈",
  "여행",
  "테크",
  "펫",
] as const;

export const nf = new Intl.NumberFormat("ko-KR");

export function engagement(row: Pick<Influencer, "followers" | "avg_likes" | "avg_comments">) {
  if (!row.followers) return 0;
  return ((row.avg_likes + row.avg_comments) / row.followers) * 100;
}

/* ---------------- directory entry form ---------------- */

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .url({ message: "올바른 URL을 입력하세요" })
  .optional()
  .or(z.literal(""));

export const influencerSchema = z.object({
  platform: z.enum(PLATFORMS),
  account: z.string().trim().min(1, "계정을 입력하세요").max(80),
  photo_url: optionalUrl,
  profile_url: optionalUrl,
  bio: z.string().trim().max(300).optional().or(z.literal("")),
  categories: z.array(z.string()).max(10),
  followers: z.coerce.number().int().min(0).max(1_000_000_000),
  avg_likes: z.coerce.number().int().min(0).max(1_000_000_000),
  avg_comments: z.coerce.number().int().min(0).max(1_000_000_000),
  last_post_date: z.string().optional().or(z.literal("")),
});

export type InfluencerFormValues = z.infer<typeof influencerSchema>;

const nullIfEmpty = (v: string | undefined) => (v && v.length > 0 ? v : null);
const numOrNull = (v: string | undefined) =>
  v && v.length > 0 && !Number.isNaN(Number(v)) ? Number(v) : null;

export function toInfluencerRow(values: InfluencerFormValues) {
  return {
    platform: values.platform,
    account: values.account,
    photo_url: nullIfEmpty(values.photo_url),
    profile_url: nullIfEmpty(values.profile_url),
    bio: nullIfEmpty(values.bio),
    categories: values.categories,
    followers: values.followers,
    avg_likes: values.avg_likes,
    avg_comments: values.avg_comments,
    last_post_date: nullIfEmpty(values.last_post_date),
  };
}

export function toInfluencerForm(row?: Influencer | null): InfluencerFormValues {
  return {
    platform: (row?.platform as InfluencerFormValues["platform"]) ?? "인스타",
    account: row?.account ?? "",
    photo_url: row?.photo_url ?? "",
    profile_url: row?.profile_url ?? "",
    bio: row?.bio ?? "",
    categories: row?.categories ?? [],
    followers: row?.followers ?? 0,
    avg_likes: row?.avg_likes ?? 0,
    avg_comments: row?.avg_comments ?? 0,
    last_post_date: row?.last_post_date ?? "",
  };
}

/* ---------------- campaign (saved) form ---------------- */

export const campaignSchema = z.object({
  contact_status: z.enum(CONTACT_STATUS),
  contact_date: z.string().optional().or(z.literal("")),
  reply_status: z.enum(REPLY_STATUS),
  reply_date: z.string().optional().or(z.literal("")),
  terms_status: z.enum(TERMS_STATUS),
  contract_sent: z.boolean(),
  contract_returned: z.boolean(),
  content_draft: z.boolean(),
  upload_date: z.string().optional().or(z.literal("")),
  upload_link: optionalUrl,
  views: z.string().optional().or(z.literal("")),
  result_likes: z.string().optional().or(z.literal("")),
  result_comments: z.string().optional().or(z.literal("")),
  memo: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;

export function toCampaignRow(values: CampaignFormValues) {
  return {
    contact_status: values.contact_status,
    contact_date: nullIfEmpty(values.contact_date),
    reply_status: values.reply_status,
    reply_date: nullIfEmpty(values.reply_date),
    terms_status: values.terms_status,
    contract_sent: values.contract_sent,
    contract_returned: values.contract_returned,
    content_draft: values.content_draft,
    upload_date: nullIfEmpty(values.upload_date),
    upload_link: nullIfEmpty(values.upload_link),
    views: numOrNull(values.views),
    result_likes: numOrNull(values.result_likes),
    result_comments: numOrNull(values.result_comments),
    memo: nullIfEmpty(values.memo),
  };
}

export function toCampaignForm(row?: SavedInfluencer | null): CampaignFormValues {
  return {
    contact_status: (row?.contact_status as CampaignFormValues["contact_status"]) ?? "미컨택",
    contact_date: row?.contact_date ?? "",
    reply_status: (row?.reply_status as CampaignFormValues["reply_status"]) ?? "대기",
    reply_date: row?.reply_date ?? "",
    terms_status: (row?.terms_status as CampaignFormValues["terms_status"]) ?? "미정",
    contract_sent: row?.contract_sent ?? false,
    contract_returned: row?.contract_returned ?? false,
    content_draft: row?.content_draft ?? false,
    upload_date: row?.upload_date ?? "",
    upload_link: row?.upload_link ?? "",
    views: row?.views != null ? String(row.views) : "",
    result_likes: row?.result_likes != null ? String(row.result_likes) : "",
    result_comments: row?.result_comments != null ? String(row.result_comments) : "",
    memo: row?.memo ?? "",
  };
}

/* ---------------- queries ---------------- */

export type DirectoryFilters = {
  q: string;
  platform: string;
  categories: string[];
  minFollowers: number | null;
  maxFollowers: number | null;
  sort: "followers" | "engagement" | "recent";
};

export async function fetchDirectory(filters: DirectoryFilters): Promise<Influencer[]> {
  let query = supabase.from("influencers").select("*").limit(300);

  if (filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`account.ilike.${term},bio.ilike.${term}`);
  }
  if (filters.platform !== "전체") query = query.eq("platform", filters.platform);
  if (filters.categories.length) query = query.overlaps("categories", filters.categories);
  if (filters.minFollowers != null) query = query.gte("followers", filters.minFollowers);
  if (filters.maxFollowers != null) query = query.lte("followers", filters.maxFollowers);

  if (filters.sort === "recent") query = query.order("created_at", { ascending: false });
  else query = query.order("followers", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as Influencer[];
  if (filters.sort === "engagement") {
    return [...rows].sort((a, b) => engagement(b) - engagement(a));
  }
  return rows;
}

export async function createInfluencer(values: InfluencerFormValues, userId: string) {
  const { error } = await supabase
    .from("influencers")
    .insert({ ...toInfluencerRow(values), created_by: userId } as never);
  if (error) throw error;
}

export async function updateInfluencer(id: string, values: InfluencerFormValues) {
  const { error } = await supabase
    .from("influencers")
    .update(toInfluencerRow(values) as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteInfluencer(id: string) {
  const { error } = await supabase.from("influencers").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSaved(): Promise<SavedWithInfluencer[]> {
  const { data, error } = await supabase
    .from("saved_influencers")
    .select("*, influencer:influencers(*)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as SavedWithInfluencer[];
}

export async function saveInfluencer(influencerId: string, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("saved_influencers")
    .insert({ influencer_id: influencerId, user_id: userId } as never)
    .select("id")
    .single();
  if (error) throw error;
  return (data as unknown as { id: string }).id;
}

export async function unsaveInfluencer(influencerId: string) {
  const { error } = await supabase
    .from("saved_influencers")
    .delete()
    .eq("influencer_id", influencerId);
  if (error) throw error;
}

export async function updateSaved(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from("saved_influencers")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}
