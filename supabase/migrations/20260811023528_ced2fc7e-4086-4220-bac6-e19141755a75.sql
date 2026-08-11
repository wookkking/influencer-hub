CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'default',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own campaigns" ON public.campaigns
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaign_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  saved_influencer_id uuid NOT NULL REFERENCES public.saved_influencers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, saved_influencer_id)
);

CREATE INDEX campaign_members_saved_idx ON public.campaign_members(saved_influencer_id);
CREATE INDEX campaign_members_campaign_idx ON public.campaign_members(campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_members TO authenticated;
GRANT ALL ON public.campaign_members TO service_role;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own campaign members" ON public.campaign_members
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);