import { supabase } from "@/integrations/supabase/client";

export type Campaign = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  note: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type CampaignMember = {
  id: string;
  campaign_id: string;
  saved_influencer_id: string;
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
  completed_at: string | null;
};

export const CAMPAIGN_COLORS = [
  "default",
  "rose",
  "orange",
  "amber",
  "lime",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "fuchsia",
  "pink",
] as const;

export const colorLabel: Record<string, string> = {
  default: "기본",
  rose: "로즈",
  orange: "오렌지",
  amber: "앰버",
  lime: "라임",
  emerald: "에메랄드",
  teal: "틸",
  cyan: "시안",
  sky: "스카이",
  blue: "블루",
  indigo: "인디고",
  violet: "바이올렛",
  fuchsia: "푸시아",
  pink: "핑크",
};

export const colorClass: Record<string, string> = {
  default: "bg-muted text-foreground border-border",
  rose: "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300",
  orange: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300",
  amber: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  lime: "bg-lime-500/15 text-lime-700 border-lime-500/30 dark:text-lime-300",
  emerald: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  teal: "bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-300",
  cyan: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-300",
  sky: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300",
  blue: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
  indigo: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 dark:text-indigo-300",
  violet: "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/30 dark:text-fuchsia-300",
  pink: "bg-pink-500/15 text-pink-700 border-pink-500/30 dark:text-pink-300",
};

export const colorDot: Record<string, string> = {
  default: "bg-muted-foreground/40",
  rose: "bg-rose-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  lime: "bg-lime-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
};

export async function fetchCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Campaign[];
}

export async function fetchCampaignMembers(): Promise<CampaignMember[]> {
  const { data, error } = await supabase.from("campaign_members").select("*");
  if (error) throw error;
  return (data ?? []) as unknown as CampaignMember[];
}

export async function updateCampaignMember(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from("campaign_members")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}


export async function createCampaign(name: string, color: string, userId: string) {
  const { error } = await supabase
    .from("campaigns")
    .insert({ name, color, user_id: userId } as never);
  if (error) throw error;
}

export async function updateCampaign(id: string, patch: { name?: string; color?: string }) {
  const { error } = await supabase.from("campaigns").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function setCampaignCompleted(id: string, completed: boolean) {
  const { error } = await supabase
    .from("campaigns")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function addToCampaign(
  campaignId: string,
  savedInfluencerId: string,
  userId: string,
) {
  const { error } = await supabase.from("campaign_members").insert({
    campaign_id: campaignId,
    saved_influencer_id: savedInfluencerId,
    user_id: userId,
  } as never);
  if (error) throw error;
}

export async function removeFromCampaign(campaignId: string, savedInfluencerId: string) {
  const { error } = await supabase
    .from("campaign_members")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("saved_influencer_id", savedInfluencerId);
  if (error) throw error;
}
