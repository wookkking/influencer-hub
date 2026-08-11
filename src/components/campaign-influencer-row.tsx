import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

import { InfluencerAvatar } from "@/components/influencer-avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTACT_STATUS,
  REPLY_STATUS,
  followerReactionRate,
  nf,
  reachRate,
  viewReactionRate,
  type Influencer,
  type TrackRecord,
} from "@/lib/influencers";

type Props = {
  influencer: Influencer | null;
  recordKey: string;
  record: TrackRecord;
  /** 여러 캠페인을 모아볼 때 어느 캠페인의 기록인지 표시 */
  scopeLabel?: string | null;
  onPatch: (values: Record<string, unknown>) => void | Promise<void>;
};

function pct(v: number | null) {
  return v == null ? "–" : `${v.toFixed(1)}%`;
}

export function CampaignInfluencerRow({
  influencer,
  recordKey,
  record,
  scopeLabel,
  onPatch,
}: Props) {
  const followers = influencer?.followers ?? 0;
  const [perf, setPerf] = useState({
    views: record.views,
    result_likes: record.result_likes,
    result_comments: record.result_comments,
  });

  useEffect(() => {
    setPerf({
      views: record.views,
      result_likes: record.result_likes,
      result_comments: record.result_comments,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordKey]);

  const live = { ...record, ...perf };
  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <div className="grid grid-cols-[minmax(180px,1.6fr)_repeat(3,minmax(88px,0.8fr))_repeat(3,minmax(72px,0.7fr))] items-center gap-2 border-b border-border px-3 py-2 text-xs last:border-b-0 hover:bg-muted/40">
      <div className="flex min-w-0 items-center gap-2">
        <InfluencerAvatar
          photoUrl={influencer?.photo_url ?? null}
          account={influencer?.account ?? ""}
          className="size-8"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium">@{influencer?.account}</span>
            {influencer?.profile_url && (
              <a
                href={influencer.profile_url}
                target="_blank"
                rel="noreferrer"
                aria-label="프로필 열기"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="tabular">팔로워 {nf.format(followers)}</span>
            {scopeLabel && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {scopeLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Select
        value={record.contact_status}
        onValueChange={(v) => onPatch({ contact_status: v })}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONTACT_STATUS.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={record.reply_status} onValueChange={(v) => onPatch({ reply_status: v })}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REPLY_STATUS.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        className="tabular h-8 text-xs"
        inputMode="numeric"
        placeholder="조회수"
        value={perf.views ?? ""}
        onChange={(e) => setPerf((p) => ({ ...p, views: num(e.target.value) }))}
        onBlur={() => onPatch({ views: perf.views })}
      />
      <Input
        className="tabular h-8 text-xs"
        inputMode="numeric"
        placeholder="좋아요"
        value={perf.result_likes ?? ""}
        onChange={(e) => setPerf((p) => ({ ...p, result_likes: num(e.target.value) }))}
        onBlur={() => onPatch({ result_likes: perf.result_likes })}
      />
      <Input
        className="tabular h-8 text-xs"
        inputMode="numeric"
        placeholder="댓글"
        value={perf.result_comments ?? ""}
        onChange={(e) => setPerf((p) => ({ ...p, result_comments: num(e.target.value) }))}
        onBlur={() => onPatch({ result_comments: perf.result_comments })}
      />
      <div className="tabular text-right text-[11px]">
        <div>{pct(viewReactionRate(live))}</div>
        <div className="text-muted-foreground">{pct(reachRate(live.views, followers))}</div>
        <div className="text-muted-foreground">{pct(followerReactionRate(live, followers))}</div>
      </div>
    </div>
  );
}
