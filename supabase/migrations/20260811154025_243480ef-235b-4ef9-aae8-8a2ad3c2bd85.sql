ALTER TABLE public.campaigns
  ADD COLUMN completed boolean NOT NULL DEFAULT false,
  ADD COLUMN completed_at timestamptz;

ALTER TABLE public.campaign_members
  ADD COLUMN completed boolean NOT NULL DEFAULT false,
  ADD COLUMN completed_at timestamptz;

ALTER TABLE public.saved_influencers
  ADD COLUMN completed boolean NOT NULL DEFAULT false,
  ADD COLUMN completed_at timestamptz;