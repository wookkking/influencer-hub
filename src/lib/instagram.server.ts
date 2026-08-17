/**
 * Instagram profile scraping through the Apify connector gateway.
 * Server-only: reads LOVABLE_API_KEY / APIFY_API_KEY.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/apify";
const ACTOR_ID = "apify~instagram-profile-scraper";

export type ScrapedProfile = {
  account: string;
  display_name?: string | null;
  photo_url: string | null;
  profile_url: string;
  bio: string | null;
  followers: number;
  avg_likes: number;
  avg_views: number;
  avg_comments: number;
  last_post_date: string | null;
  recent_captions?: string[];
};

type ApifyPost = {
  type?: string;
  productType?: string;
  isPinned?: boolean;
  pinned?: boolean;
  isVideo?: boolean;
  videoUrl?: string;
  videoDuration?: number;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: string;
  videoPlayCount?: number;
  videoViewCount?: number;
  playCount?: number;
  viewCount?: number;
  caption?: string;
};
type ApifyItem = {
  username?: string;
  url?: string;
  biography?: string;
  fullName?: string;
  followersCount?: number;
  profilePicUrl?: string;
  profilePicUrlHD?: string;
  latestPosts?: ApifyPost[];
  error?: string;
};

export function normalizeHandle(raw: string): string {
  let v = raw.trim();
  if (!v) return "";
  const urlMatch = v.match(/instagram\.com\/([^/?#]+)/i);
  if (urlMatch?.[1]) v = urlMatch[1];
  return v.replace(/^@/, "").replace(/\/+$/, "").trim();
}

/** 평균 계산에 사용할 최근 릴스 수 */
const RECENT_POSTS = 9;

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** 고정 게시물 제외 */
function isPinnedPost(p: ApifyPost): boolean {
  return p.isPinned === true || p.pinned === true;
}

/** 릴스(동영상) 게시물만 인정 */
function isReel(p: ApifyPost): boolean {
  const t = (p.type ?? "").toLowerCase();
  const pt = (p.productType ?? "").toLowerCase();
  return (
    pt === "clips" || t === "video" || p.isVideo === true || !!p.videoUrl || (p.videoDuration ?? 0) > 0
  );
}

function mapItem(item: ApifyItem): ScrapedProfile | null {
  if (!item.username) return null;
  // Apify가 error를 반환한 경우(비공개·제한 프로필 등)는 0으로 덮어쓰지 않고 실패로 처리
  if (item.error) {
    console.warn(`Instagram scrape skipped (${item.username}): ${item.error}`);
    return null;
  }
  // 최근 업로드 릴스 기준으로 평균을 계산 (고정 게시물 제외, 최신순 상위 9개)
  const all = [...(item.latestPosts ?? [])].filter((p) => !isPinnedPost(p));
  const reels = all.filter(isReel);
  const posts = reels
    .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""))
    .slice(0, RECENT_POSTS);
  const likes = posts.map((p) => p.likesCount ?? 0).filter((n) => n > 0);
  const comments = posts.map((p) => p.commentsCount ?? 0).filter((n) => n >= 0);
  const views = posts
    .map((p) => p.videoPlayCount ?? p.videoViewCount ?? p.playCount ?? p.viewCount ?? 0)
    .filter((n) => n > 0);
  // 최근 업로드일은 고정 게시물을 제외한 전체 게시물 기준
  const timestamps = all
    .map((p) => p.timestamp)
    .filter((t): t is string => !!t)
    .sort();
  const latest = timestamps.at(-1);


  return {
    account: item.username,
    display_name: item.fullName?.trim() || null,
    photo_url: item.profilePicUrlHD ?? item.profilePicUrl ?? null,
    profile_url: item.url ?? `https://www.instagram.com/${item.username}`,
    bio: item.biography?.trim() || null,
    followers: item.followersCount ?? 0,
    avg_likes: average(likes),
    avg_views: average(views),
    avg_comments: average(comments),
    last_post_date: latest ? latest.slice(0, 10) : null,
    recent_captions: posts.map((p) => p.caption?.trim() ?? "").filter(Boolean),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function scrapeInstagramProfiles(handles: string[]): Promise<ScrapedProfile[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const apifyKey = process.env["APIFY_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY가 설정되어 있지 않습니다.");
  if (!apifyKey) throw new Error("Apify 연결이 필요합니다.");

  const usernames = Array.from(new Set(handles.map(normalizeHandle).filter(Boolean)));
  if (!usernames.length) return [];

  const headers = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": apifyKey,
    "Content-Type": "application/json",
  };

  const fail = async (res: Response, stage: string): Promise<never> => {
    const body = await res.text();
    console.error(`Apify ${stage} failed [${res.status}]: ${body}`);
    throw new Error(`인스타그램 수집 실패 [${res.status}]: ${body.slice(0, 300)}`);
  };

  // 동기 실행(run-sync)은 게이트웨이 타임아웃(502)이 잦아 비동기 실행 후 폴링한다.
  const startRes = await fetch(`${GATEWAY_URL}/acts/${ACTOR_ID}/runs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ usernames }),
  });
  if (!startRes.ok) await fail(startRes, "run start");

  const started = (await startRes.json()) as { data?: { id?: string; defaultDatasetId?: string } };
  const runId = started.data?.id;
  let datasetId = started.data?.defaultDatasetId;
  if (!runId) throw new Error("인스타그램 수집 실패: 실행 ID를 받지 못했습니다.");

  let status = "READY";
  for (let i = 0; i < 90; i++) {
    await sleep(3000);
    const statusRes = await fetch(`${GATEWAY_URL}/actor-runs/${runId}`, { headers });
    if (!statusRes.ok) {
      if (statusRes.status >= 500) continue;
      await fail(statusRes, "run status");
    }
    const info = (await statusRes.json()) as {
      data?: { status?: string; defaultDatasetId?: string };
    };
    status = info.data?.status ?? status;
    datasetId = info.data?.defaultDatasetId ?? datasetId;
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) break;
  }

  if (status !== "SUCCEEDED" && status !== "TIMED-OUT") {
    throw new Error(`인스타그램 수집 실패: 실행 상태 ${status}`);
  }
  if (!datasetId) throw new Error("인스타그램 수집 실패: 데이터셋을 찾을 수 없습니다.");

  const itemsRes = await fetch(`${GATEWAY_URL}/datasets/${datasetId}/items?clean=true&limit=200`, {
    headers,
  });
  if (!itemsRes.ok) await fail(itemsRes, "dataset items");

  const items = (await itemsRes.json()) as ApifyItem[];
  return items.map(mapItem).filter((p): p is ScrapedProfile => p !== null);
}

