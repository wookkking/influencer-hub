ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

DELETE FROM public.influencers a
USING public.influencers b
WHERE a.ctid > b.ctid
  AND lower(a.account) = lower(b.account)
  AND a.platform = b.platform;

CREATE UNIQUE INDEX IF NOT EXISTS influencers_platform_account_key
  ON public.influencers (platform, lower(account));

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('refresh-instagram-influencers')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-instagram-influencers');

SELECT cron.schedule(
  'refresh-instagram-influencers',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--3f6993dc-ed64-4d6d-a1ec-4d955b43891d.lovable.app/api/public/refresh-instagram',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_BfdXHJlwXhSeKiM9GsLTuQ_Dy9OmITf"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);