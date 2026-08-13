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
};
type TtPost = { authorMeta?: { name?: string } };
type YtItem = { channelUsername?: string; channelName?: string };


/** 해시태그로 게시물을 훑어 고유 계정 목록을 돌려준다. */
export async function discoverHandlesByHashtag(
  platform: "인스타" | "틱톡" | "유튜브",
  tags: string[],
  limit: number,
): Promise<string[]> {
  const hashtags = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
  if (!hashtags.length) return [];

  const perTag = Math.max(20, Math.ceil(limit / hashtags.length) * 3);
  const found = new Set<string>();

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
      const u = it.author_username ?? it.ownerUsername ?? it.owner?.username;
      if (u) found.add(u.replace(/^@/, "").trim());
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
      const u = it.authorMeta?.name;
      if (u) found.add(u);
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
      const u = (it.channelUsername ?? it.channelName ?? "").replace(/^@/, "").trim();
      if (u) found.add(u);
    }
  }

  return Array.from(found).slice(0, limit);
}
