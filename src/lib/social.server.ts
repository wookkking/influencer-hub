/**
 * TikTok / YouTube 프로필 수집. 인스타와 동일한 ScrapedProfile 형태로 반환한다.
 * 평균 지표는 고정 게시물을 제외한 최근 업로드 9개(유튜브는 쇼츠) 기준.
 */
import { runApifyActor } from "./apify.server";
import type { ScrapedProfile } from "./instagram.server";

const RECENT = 9;

const TIKTOK_ACTOR = "clockworks~tiktok-scraper";
const YOUTUBE_ACTOR = "streamers~youtube-scraper";

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function normalizeTikTokHandle(raw: string): string {
  let v = raw.trim();
  if (!v) return "";
  const m = v.match(/tiktok\.com\/@([^/?#]+)/i);
  if (m?.[1]) v = m[1];
  return v.replace(/^@/, "").replace(/\/+$/, "").trim();
}

export function normalizeYouTubeHandle(raw: string): string {
  let v = raw.trim();
  if (!v) return "";
  const at = v.match(/youtube\.com\/@([^/?#]+)/i);
  if (at?.[1]) return at[1].trim();
  const channel = v.match(/youtube\.com\/(?:c|channel|user)\/([^/?#]+)/i);
  if (channel?.[1]) return channel[1].trim();
  return v.replace(/^@/, "").replace(/\/+$/, "").trim();
}

/* ---------------- TikTok ---------------- */

type TikTokItem = {
  authorMeta?: {
    name?: string;
    nickName?: string;
    fans?: number;
    avatar?: string;
    avatarLarger?: string;
    signature?: string;
    profileUrl?: string;
  };
  playCount?: number;
  diggCount?: number;
  commentCount?: number;
  createTimeISO?: string;
  isPinned?: boolean;
  isAd?: boolean;
};

export async function scrapeTikTokProfiles(handles: string[]): Promise<ScrapedProfile[]> {
  const profiles = Array.from(new Set(handles.map(normalizeTikTokHandle).filter(Boolean)));
  if (!profiles.length) return [];

  const items = await runApifyActor<TikTokItem>(TIKTOK_ACTOR, {
    profiles,
    resultsPerPage: 20,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSlideshowImages: false,
    profileScrapeSections: ["videos"],
    profileSorting: "latest",
    excludePinnedPosts: true,
  });

  const byAccount = new Map<string, TikTokItem[]>();
  for (const item of items) {
    const name = item.authorMeta?.name;
    if (!name) continue;
    const list = byAccount.get(name.toLowerCase()) ?? [];
    list.push(item);
    byAccount.set(name.toLowerCase(), list);
  }

  const out: ScrapedProfile[] = [];
  for (const list of byAccount.values()) {
    const meta = list.find((i) => i.authorMeta)?.authorMeta;
    if (!meta?.name) continue;
    const videos = list
      .filter((i) => !i.isPinned && !i.isAd)
      .sort((a, b) => (b.createTimeISO ?? "").localeCompare(a.createTimeISO ?? ""))
      .slice(0, RECENT);
    const latest = videos[0]?.createTimeISO ?? null;

    out.push({
      account: meta.name,
      photo_url: meta.avatarLarger ?? meta.avatar ?? null,
      profile_url: meta.profileUrl ?? `https://www.tiktok.com/@${meta.name}`,
      bio: meta.signature?.trim() || null,
      followers: meta.fans ?? 0,
      avg_likes: average(videos.map((v) => v.diggCount ?? 0).filter((n) => n > 0)),
      avg_views: average(videos.map((v) => v.playCount ?? 0).filter((n) => n > 0)),
      avg_comments: average(videos.map((v) => v.commentCount ?? 0).filter((n) => n >= 0)),
      last_post_date: latest ? latest.slice(0, 10) : null,
    });
  }
  return out;
}

/* ---------------- YouTube (쇼츠 기준) ---------------- */

type YouTubeItem = {
  channelName?: string;
  channelUsername?: string;
  channelUrl?: string;
  channelAvatarUrl?: string;
  channelDescription?: string;
  numberOfSubscribers?: number;
  viewCount?: number;
  likes?: number;
  commentsCount?: number;
  date?: string;
  url?: string;
  duration?: string;
  type?: string;
  isShort?: boolean;
};

function isShort(item: YouTubeItem): boolean {
  if (item.isShort === true) return true;
  if ((item.type ?? "").toLowerCase() === "shorts") return true;
  if ((item.url ?? "").includes("/shorts/")) return true;
  const d = item.duration ?? "";
  const parts = d.split(":").map((n) => Number(n));
  if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0) <= 60;
  }
  return false;
}

export async function scrapeYouTubeProfiles(handles: string[]): Promise<ScrapedProfile[]> {
  const names = Array.from(new Set(handles.map(normalizeYouTubeHandle).filter(Boolean)));
  if (!names.length) return [];

  const items = await runApifyActor<YouTubeItem>(YOUTUBE_ACTOR, {
    startUrls: names.map((n) => ({ url: `https://www.youtube.com/@${n}/shorts` })),
    maxResults: 20,
    maxResultsShorts: 20,
    sortVideosBy: "NEWEST",
    downloadSubtitles: false,
  });

  const byChannel = new Map<string, YouTubeItem[]>();
  for (const item of items) {
    const key = (item.channelUsername ?? item.channelName ?? "").replace(/^@/, "");
    if (!key) continue;
    const list = byChannel.get(key.toLowerCase()) ?? [];
    list.push(item);
    byChannel.set(key.toLowerCase(), list);
  }

  const out: ScrapedProfile[] = [];
  for (const list of byChannel.values()) {
    const meta = list[0];
    if (!meta) continue;
    const account = (meta.channelUsername ?? meta.channelName ?? "").replace(/^@/, "");
    if (!account) continue;
    const shorts = list
      .filter(isShort)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .slice(0, RECENT);
    const source = shorts.length ? shorts : [];
    const latest = source[0]?.date ?? null;

    out.push({
      account,
      photo_url: meta.channelAvatarUrl ?? null,
      profile_url: meta.channelUrl ?? `https://www.youtube.com/@${account}`,
      bio: meta.channelDescription?.trim().slice(0, 300) || null,
      followers: meta.numberOfSubscribers ?? 0,
      avg_likes: average(source.map((v) => v.likes ?? 0).filter((n) => n > 0)),
      avg_views: average(source.map((v) => v.viewCount ?? 0).filter((n) => n > 0)),
      avg_comments: average(source.map((v) => v.commentsCount ?? 0).filter((n) => n >= 0)),
      last_post_date: latest ? latest.slice(0, 10) : null,
    });
  }
  return out;
}
