/**
 * Instagram profile scraping through the Apify connector gateway.
 * Server-only: reads LOVABLE_API_KEY / APIFY_API_KEY.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/apify";
const ACTOR_ID = "apify~instagram-profile-scraper";

export type ScrapedProfile = {
  account: string;
  photo_url: string | null;
  profile_url: string;
  bio: string | null;
  followers: number;
  avg_likes: number;
  avg_views: number;
  avg_comments: number;
  last_post_date: string | null;
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

/** 평균 계산에 사용할 최근 게시글 수 */
const RECENT_POSTS = 9;

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function mapItem(item: ApifyItem): ScrapedProfile | null {
  if (!item.username) return null;
  // 최근 게시글 기준으로 평균을 계산 (최신순 정렬 후 상위 9개)
  const posts = [...(item.latestPosts ?? [])]
    .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""))
    .slice(0, RECENT_POSTS);
  const likes = posts.map((p) => p.likesCount ?? 0).filter((n) => n > 0);
  const comments = posts.map((p) => p.commentsCount ?? 0).filter((n) => n >= 0);
  const views = posts
    .map((p) => p.videoPlayCount ?? p.videoViewCount ?? p.playCount ?? p.viewCount ?? 0)
    .filter((n) => n > 0);
  const timestamps = posts
    .map((p) => p.timestamp)
    .filter((t): t is string => !!t)
    .sort();
  const latest = timestamps.at(-1);

  return {
    account: item.username,
    photo_url: item.profilePicUrlHD ?? item.profilePicUrl ?? null,
    profile_url: item.url ?? `https://www.instagram.com/${item.username}`,
    bio: item.biography?.trim() || null,
    followers: item.followersCount ?? 0,
    avg_likes: average(likes),
    avg_views: average(views),
    avg_comments: average(comments),
    last_post_date: latest ? latest.slice(0, 10) : null,
  };
}

export async function scrapeInstagramProfiles(handles: string[]): Promise<ScrapedProfile[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const apifyKey = process.env["APIFY_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY가 설정되어 있지 않습니다.");
  if (!apifyKey) throw new Error("Apify 연결이 필요합니다.");

  const usernames = Array.from(new Set(handles.map(normalizeHandle).filter(Boolean)));
  if (!usernames.length) return [];

  const response = await fetch(
    `${GATEWAY_URL}/acts/${ACTOR_ID}/run-sync-get-dataset-items?timeout=300`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": apifyKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usernames }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error(`Apify request failed [${response.status}]: ${body}`);
    throw new Error(`인스타그램 수집 실패 [${response.status}]: ${body.slice(0, 300)}`);
  }

  const items = (await response.json()) as ApifyItem[];
  return items.map(mapItem).filter((p): p is ScrapedProfile => p !== null);
}
