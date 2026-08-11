import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  marketing_opt_in: boolean;
  suspended: boolean;
  created_at: string;
};

export type ManagedUser = Profile & { isAdmin: boolean };

export const CONSENT_VERSION = "v1";

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,email,display_name,terms_accepted_at,privacy_accepted_at,marketing_opt_in,suspended,created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateMyProfile(
  userId: string,
  patch: Partial<Pick<Profile, "display_name" | "marketing_opt_in">>,
) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export async function logConsent(
  userId: string,
  consentType: string,
  granted: boolean,
) {
  const { error } = await supabase.from("user_consents").insert({
    user_id: userId,
    consent_type: consentType,
    granted,
    document_version: CONSENT_VERSION,
  });
  if (error) throw error;
}

export async function acceptRequiredTerms(userId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ terms_accepted_at: now, privacy_accepted_at: now })
    .eq("id", userId);
  if (error) throw error;
  await logConsent(userId, "terms", true);
  await logConsent(userId, "privacy", true);
}

export async function fetchManagedUsers(): Promise<ManagedUser[]> {
  const [{ data: profiles, error }, { data: roles, error: roleError }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id,email,display_name,terms_accepted_at,privacy_accepted_at,marketing_opt_in,suspended,created_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id,role").eq("role", "admin"),
  ]);
  if (error) throw error;
  if (roleError) throw roleError;
  const adminIds = new Set((roles ?? []).map((r) => r.user_id));
  return (profiles ?? []).map((p) => ({ ...(p as Profile), isAdmin: adminIds.has(p.id) }));
}

export async function setAdmin(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error && !error.message.includes("duplicate")) throw error;
  } else {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) throw error;
  }
}

export async function setSuspended(userId: string, suspended: boolean) {
  const { error } = await supabase.from("profiles").update({ suspended }).eq("id", userId);
  if (error) throw error;
}
