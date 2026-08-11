ALTER TABLE public.campaign_members
  ADD COLUMN IF NOT EXISTS contact_status text NOT NULL DEFAULT '미컨택',
  ADD COLUMN IF NOT EXISTS contact_date date,
  ADD COLUMN IF NOT EXISTS contact_note text,
  ADD COLUMN IF NOT EXISTS reply_status text NOT NULL DEFAULT '대기',
  ADD COLUMN IF NOT EXISTS reply_date date,
  ADD COLUMN IF NOT EXISTS reply_note text,
  ADD COLUMN IF NOT EXISTS terms_note text,
  ADD COLUMN IF NOT EXISTS contract_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_returned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upload_date date,
  ADD COLUMN IF NOT EXISTS upload_link text,
  ADD COLUMN IF NOT EXISTS views integer,
  ADD COLUMN IF NOT EXISTS result_likes integer,
  ADD COLUMN IF NOT EXISTS result_comments integer,
  ADD COLUMN IF NOT EXISTS memo text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

ALTER TABLE public.saved_influencers
  ADD COLUMN IF NOT EXISTS contact_note text,
  ADD COLUMN IF NOT EXISTS reply_note text,
  ADD COLUMN IF NOT EXISTS terms_note text;

DROP TRIGGER IF EXISTS update_campaign_members_updated_at ON public.campaign_members;
CREATE TRIGGER update_campaign_members_updated_at
BEFORE UPDATE ON public.campaign_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();