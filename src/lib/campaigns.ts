import { supabase } from "@/integrations/supabase/client";

export type Campaign = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  note: string | null;
  created_at: string;
};

export type CampaignMember = {
  id: string;
  campaign_id: string;
  saved_influencer_id: string;
};

export const CAMPAIGN_COLORS = [
  "default",
  "amber",
  "teal",
  "rose",
  "violet",
  "sky",
] as const;

export const colorClass: Record<string, string> = {
  default: "bg-muted text-foreground border-border",
  amber: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  teal: "bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-300",
  rose: "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300",
  violet: "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300",
  sky: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300",
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
  const { data, error } = await supabase
    .from("campaign_members")
    .select("id, campaign_id, saved_influencer_id");
  if (error) throw error;
  return (data ?? []) as unknown as CampaignMember[];
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
