-- 1) Directory table upgrades
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS last_post_date date;

ALTER TABLE public.influencers
  DROP COLUMN IF EXISTS contact_status,
  DROP COLUMN IF EXISTS contact_date,
  DROP COLUMN IF EXISTS reply_status,
  DROP COLUMN IF EXISTS reply_date,
  DROP COLUMN IF EXISTS terms_status,
  DROP COLUMN IF EXISTS contract_sent,
  DROP COLUMN IF EXISTS contract_returned,
  DROP COLUMN IF EXISTS content_draft,
  DROP COLUMN IF EXISTS upload_date,
  DROP COLUMN IF EXISTS upload_link,
  DROP COLUMN IF EXISTS views,
  DROP COLUMN IF EXISTS result_likes,
  DROP COLUMN IF EXISTS result_comments,
  DROP COLUMN IF EXISTS memo;

CREATE INDEX IF NOT EXISTS influencers_account_idx ON public.influencers (lower(account));
CREATE INDEX IF NOT EXISTS influencers_followers_idx ON public.influencers (followers DESC);
CREATE INDEX IF NOT EXISTS influencers_categories_idx ON public.influencers USING gin (categories);

-- Replace permissive public policies with authenticated-only rules
DROP POLICY IF EXISTS "Anyone can view influencers" ON public.influencers;
DROP POLICY IF EXISTS "Anyone can add influencers" ON public.influencers;
DROP POLICY IF EXISTS "Anyone can update influencers" ON public.influencers;
DROP POLICY IF EXISTS "Anyone can delete influencers" ON public.influencers;

REVOKE ALL ON public.influencers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.influencers TO authenticated;
GRANT ALL ON public.influencers TO service_role;

CREATE POLICY "Signed-in users can browse the directory"
  ON public.influencers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Signed-in users can add influencers"
  ON public.influencers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Contributors can edit their own entries"
  ON public.influencers FOR UPDATE TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Contributors can delete their own entries"
  ON public.influencers FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- 2) Per-user campaign list
CREATE TABLE public.saved_influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  contact_status text NOT NULL DEFAULT '미컨택',
  contact_date date,
  reply_status text NOT NULL DEFAULT '대기',
  reply_date date,
  terms_status text NOT NULL DEFAULT '미정',
  contract_sent boolean NOT NULL DEFAULT false,
  contract_returned boolean NOT NULL DEFAULT false,
  content_draft boolean NOT NULL DEFAULT false,
  upload_date date,
  upload_link text,
  views integer,
  result_likes integer,
  result_comments integer,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, influencer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_influencers TO authenticated;
GRANT ALL ON public.saved_influencers TO service_role;

ALTER TABLE public.saved_influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved influencers"
  ON public.saved_influencers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_saved_influencers_updated_at
  BEFORE UPDATE ON public.saved_influencers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS saved_influencers_user_idx ON public.saved_influencers (user_id);

-- 3) Give the seeded directory rows some searchable metadata
UPDATE public.influencers SET categories = ARRAY['뷰티','일상'] WHERE categories = '{}';