/**
 * 해시태그 기반 인플루언서 자동 탐색.
 * 해시태그 게시물을 수집해 작성자 계정만 뽑아낸다. (팔로워 수 조건 없음)
 */
import { runApifyActor } from "./apify.server";

const IG_HASHTAG_ACTOR = "khadinakbar~instagram-hashtag-scraper";
const TIKTOK_ACTOR = "clockworks~tiktok-scraper";
const YOUTUBE_ACTOR = "streamers~youtube-scraper";

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#/, "").replace(/\s+/g, "");
}

type IgPost = {
  author_username?: string;
  ownerUsername?: string;
  owner?: { username?: string };
  author_follower_count?: number;
};
type TtPost = { authorMeta?: { name?: string; fans?: number } };
type YtItem = { channelUsername?: string; channelName?: string; numberOfSubscribers?: number };

export type DiscoveredCandidate = { handle: string; followers: number | null };

/** 해시태그로 게시물을 훑어 고유 계정 후보를 돌려준다. (팔로워 정보 있으면 함께) */
export async function discoverHandlesByHashtag(
  platform: "인스타" | "틱톡" | "유튜브",
  tags: string[],
  limit: number,
): Promise<DiscoveredCandidate[]> {
  const hashtags = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
  if (!hashtags.length) return [];

  // 중복·기존 계정·팔로워 필터로 많이 걸러지므로 넉넉히 훑는다.
  const perTag = Math.min(400, Math.max(60, limit * 8));
  const found = new Map<string, number | null>();

  const add = (raw: string | undefined, followers?: number | null) => {
    const handle = (raw ?? "").replace(/^@/, "").trim();
    if (!handle) return;
    const key = handle.toLowerCase();
    const prev = found.get(key);
    if (prev === undefined || (prev == null && followers != null)) {
      found.set(key, followers ?? null);
    }
  };

  if (platform === "인스타") {
    const items = await runApifyActor<IgPost>(
      IG_HASHTAG_ACTOR,
      {
        hashtags,
        resultsLimit: perTag,
        mediaType: "all",
        datePosted: "last-month",
      },
      perTag * hashtags.length,
    );
    for (const it of items) {
      add(
        it.author_username ?? it.ownerUsername ?? it.owner?.username,
        typeof it.author_follower_count === "number" ? it.author_follower_count : null,
      );
    }
  } else if (platform === "틱톡") {
    const items = await runApifyActor<TtPost>(
      TIKTOK_ACTOR,
      {
        hashtags,
        resultsPerPage: perTag,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
      },
      perTag * hashtags.length,
    );
    for (const it of items) {
      add(it.authorMeta?.name, typeof it.authorMeta?.fans === "number" ? it.authorMeta.fans : null);
    }
  } else {
    const items = await runApifyActor<YtItem>(
      YOUTUBE_ACTOR,
      {
        searchQueries: hashtags.map((t) => `#${t}`),
        maxResults: perTag,
        maxResultsShorts: perTag,
        downloadSubtitles: false,
      },
      perTag * hashtags.length,
    );
    for (const it of items) {
      add(
        it.channelUsername ?? it.channelName,
        typeof it.numberOfSubscribers === "number" ? it.numberOfSubscribers : null,
      );
    }
  }

  return Array.from(found.entries()).map(([handle, followers]) => ({ handle, followers }));
}

const IG_SEARCH_ACTOR = "apify~instagram-search-scraper";

type IgSearchUser = { username?: string; followersCount?: number };

/** 검색 키워드(예: "광고")로 계정을 훑어 후보를 돌려준다. 해시태그가 아닌 일반 검색어 기준. */
export async function discoverHandlesByKeyword(
  platform: "인스타" | "틱톡" | "유튜브",
  keywords: string[],
  limit: number,
): Promise<DiscoveredCandidate[]> {
  const terms = Array.from(new Set(keywords.map((k) => k.trim().replace(/^#/, "")).filter(Boolean)));
  if (!terms.length) return [];

  const perTerm = Math.min(200, Math.max(40, limit * 4));
  const found = new Map<string, number | null>();

  const add = (raw: string | undefined, followers?: number | null) => {
    const handle = (raw ?? "").replace(/^@/, "").trim();
    if (!handle) return;
    const key = handle.toLowerCase();
    const prev = found.get(key);
    if (prev === undefined || (prev == null && followers != null)) {
      found.set(key, followers ?? null);
    }
  };

  if (platform === "인스타") {
    for (const term of terms) {
      const items = await runApifyActor<IgSearchUser>(
        IG_SEARCH_ACTOR,
        { search: term, searchType: "user", searchLimit: perTerm },
        perTerm,
      );
      for (const it of items) {
        add(it.username, typeof it.followersCount === "number" ? it.followersCount : null);
      }
    }
  } else if (platform === "틱톡") {
    const items = await runApifyActor<TtPost>(
      TIKTOK_ACTOR,
      {
        searchQueries: terms,
        resultsPerPage: perTerm,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
      },
      perTerm * terms.length,
    );
    for (const it of items) {
      add(it.authorMeta?.name, typeof it.authorMeta?.fans === "number" ? it.authorMeta.fans : null);
    }
  } else {
    const items = await runApifyActor<YtItem>(
      YOUTUBE_ACTOR,
      {
        searchQueries: terms,
        maxResults: perTerm,
        maxResultsShorts: perTerm,
        downloadSubtitles: false,
      },
      perTerm * terms.length,
    );
    for (const it of items) {
      add(
        it.channelUsername ?? it.channelName,
        typeof it.numberOfSubscribers === "number" ? it.numberOfSubscribers : null,
      );
    }
  }

  return Array.from(found.entries()).map(([handle, followers]) => ({ handle, followers }));
}

