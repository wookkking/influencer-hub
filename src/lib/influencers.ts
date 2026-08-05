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
  contact_status: string;
  contact_date: string | null;
  reply_status: string;
  reply_date: string | null;
  terms_status: string;
  contract_sent: boolean;
  contract_returned: boolean;
  content_draft: boolean;
  upload_date: string | null;
  upload_link: string | null;
  views: number | null;
  result_likes: number | null;
  result_comments: number | null;
  memo: string | null;
  created_at: string;
};

export const CONTACT_STATUS = ["미컨택", "컨택완료", "보류"] as const;
export const REPLY_STATUS = ["대기", "답변완료", "거절"] as const;
export const TERMS_STATUS = ["미정", "협의중", "협의완료"] as const;
export const PLATFORMS = ["인스타", "유튜브", "틱톡", "블로그"] as const;

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .url({ message: "올바른 URL을 입력하세요" })
  .optional()
  .or(z.literal(""));

export const influencerSchema = z.object({
  brand: z.string().trim().max(60).optional().or(z.literal("")),
  platform: z.enum(PLATFORMS),
  account: z.string().trim().min(1, "계정을 입력하세요").max(80),
  photo_url: optionalUrl,
  profile_url: optionalUrl,
  followers: z.coerce.number().int().min(0).max(1_000_000_000),
  avg_likes: z.coerce.number().int().min(0).max(1_000_000_000),
  avg_comments: z.coerce.number().int().min(0).max(1_000_000_000),
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

export type InfluencerFormValues = z.infer<typeof influencerSchema>;

const nullIfEmpty = (v: string | undefined) => (v && v.length > 0 ? v : null);
const numOrNull = (v: string | undefined) =>
  v && v.length > 0 && !Number.isNaN(Number(v)) ? Number(v) : null;

export function toRow(values: InfluencerFormValues) {
  return {
    brand: nullIfEmpty(values.brand),
    platform: values.platform,
    account: values.account,
    photo_url: nullIfEmpty(values.photo_url),
    profile_url: nullIfEmpty(values.profile_url),
    followers: values.followers,
    avg_likes: values.avg_likes,
    avg_comments: values.avg_comments,
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

export function toFormValues(row?: Influencer | null): InfluencerFormValues {
  return {
    brand: row?.brand ?? "",
    platform: (row?.platform as InfluencerFormValues["platform"]) ?? "인스타",
    account: row?.account ?? "",
    photo_url: row?.photo_url ?? "",
    profile_url: row?.profile_url ?? "",
    followers: row?.followers ?? 0,
    avg_likes: row?.avg_likes ?? 0,
    avg_comments: row?.avg_comments ?? 0,
    contact_status: (row?.contact_status as InfluencerFormValues["contact_status"]) ?? "미컨택",
    contact_date: row?.contact_date ?? "",
    reply_status: (row?.reply_status as InfluencerFormValues["reply_status"]) ?? "대기",
    reply_date: row?.reply_date ?? "",
    terms_status: (row?.terms_status as InfluencerFormValues["terms_status"]) ?? "미정",
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

export async function fetchInfluencers(): Promise<Influencer[]> {
  const { data, error } = await supabase
    .from("influencers")
    .select("*")
    .order("seq", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Influencer[];
}

export async function createInfluencer(values: InfluencerFormValues) {
  const { error } = await supabase.from("influencers").insert(toRow(values) as never);
  if (error) throw error;
}

export async function updateInfluencer(id: string, values: InfluencerFormValues) {
  const { error } = await supabase
    .from("influencers")
    .update(toRow(values) as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteInfluencer(id: string) {
  const { error } = await supabase.from("influencers").delete().eq("id", id);
  if (error) throw error;
}

export const nf = new Intl.NumberFormat("ko-KR");
