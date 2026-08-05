CREATE TABLE public.influencers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seq INTEGER,
  brand TEXT,
  platform TEXT NOT NULL DEFAULT '인스타',
  account TEXT NOT NULL,
  photo_url TEXT,
  profile_url TEXT,
  followers INTEGER NOT NULL DEFAULT 0,
  avg_likes INTEGER NOT NULL DEFAULT 0,
  avg_comments INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN followers > 0 THEN ROUND(((avg_likes + avg_comments)::numeric / followers) * 100, 2) ELSE 0 END
  ) STORED,
  contact_status TEXT NOT NULL DEFAULT '미컨택',
  contact_date DATE,
  reply_status TEXT NOT NULL DEFAULT '대기',
  reply_date DATE,
  terms_status TEXT NOT NULL DEFAULT '미정',
  contract_sent BOOLEAN NOT NULL DEFAULT false,
  contract_returned BOOLEAN NOT NULL DEFAULT false,
  content_draft BOOLEAN NOT NULL DEFAULT false,
  upload_date DATE,
  upload_link TEXT,
  views INTEGER,
  result_likes INTEGER,
  result_comments INTEGER,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.influencers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.influencers TO authenticated;
GRANT ALL ON public.influencers TO service_role;

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view influencers" ON public.influencers FOR SELECT USING (true);
CREATE POLICY "Anyone can add influencers" ON public.influencers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update influencers" ON public.influencers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete influencers" ON public.influencers FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_influencers_updated_at
BEFORE UPDATE ON public.influencers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.influencers (seq, brand, platform, account, profile_url, followers, avg_likes, avg_comments) VALUES
(1, '셀팅청담', '인스타', 'hee.ya____', 'https://www.instagram.com/yxuuzx/', 17919, 1319, 51),
(2, '셀팅청담', '인스타', 'hyun_yy_', 'https://www.instagram.com/hyun_yy_/', 125756, 2921, 24),
(3, '셀팅청담', '인스타', 'simtohl', 'https://www.instagram.com/simtohl/', 36672, 458, 15),
(4, '셀팅청담', '인스타', 'amberoguzofficial', 'https://www.instagram.com/amberoguzofficial/', 23586, 53, 5),
(5, '셀팅청담', '인스타', 'myo_share', 'https://www.instagram.com/myo_share/', 113430, 2521, 232),
(6, '셀팅청담', '인스타', 'dodogomting', 'https://www.instagram.com/dodogomting/', 163543, 1746, 57),
(7, '셀팅청담', '인스타', 'jessica.joo', 'https://www.instagram.com/jessica.joo/', 11060, 89, 32),
(8, '셀팅청담', '인스타', 's1091717', 'https://www.instagram.com/s1091717/', 203562, 2291, 21);