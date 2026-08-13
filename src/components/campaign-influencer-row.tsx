import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Circle, ExternalLink } from "lucide-react";

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
  /** 카드처럼 눌러 상세 정보를 여는 핸들러 */
  onOpenDetail?: () => void;
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
  onOpenDetail,
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
  const done = record.completed;
  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <div
      className={
        "border-b border-border px-3 py-2 text-xs transition-colors last:border-b-0 hover:bg-muted/40 " +
        (done ? "bg-emerald-500/[0.06]" : "")
      }
    >
      {/* 상단: 상태 + 인플루언서 + 컨택/답변 + 날짜 */}
      <div className="grid grid-cols-[28px_minmax(170px,1.6fr)_repeat(2,minmax(100px,0.8fr))_repeat(2,minmax(120px,1fr))_32px] items-center gap-2">
        <button
          type="button"
          aria-label={done ? "완료 해제" : "완료로 표시"}
          title={done ? "완료 해제" : "완료로 표시"}
          onClick={() =>
            onPatch({ completed: !done, completed_at: !done ? new Date().toISOString() : null })
          }
          className={
            "flex size-6 items-center justify-center rounded-md transition-colors " +
            (done
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <InfluencerAvatar
            photoUrl={influencer?.photo_url ?? null}
            account={influencer?.account ?? ""}
            className="size-8"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenDetail}
                className={
                  "truncate font-medium hover:underline " +
                  (done ? "text-muted-foreground line-through decoration-1" : "")
                }
              >
                @{influencer?.account}
              </button>
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
              {done && (
                <Badge className="h-4 border-emerald-500/30 bg-emerald-500/15 px-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                  완료
                </Badge>
              )}
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
          type="date"
          aria-label="컨택일"
          className="h-8 text-xs"
          value={record.contact_date ?? ""}
          onChange={(e) => onPatch({ contact_date: e.target.value || null })}
        />
        <Input
          type="date"
          aria-label="업로드일"
          className="h-8 text-xs"
          value={record.upload_date ?? ""}
          onChange={(e) => onPatch({ upload_date: e.target.value || null })}
        />

        {onOpenDetail ? (
          <button
            type="button"
            onClick={onOpenDetail}
            aria-label={`@${influencer?.account} 상세 보기`}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <span />
        )}
      </div>

      {/* 하단: 성과 입력 + 지표 */}
      <div className="mt-1.5 grid grid-cols-[28px_minmax(170px,1.6fr)_repeat(3,minmax(100px,0.8fr))_minmax(240px,1fr)_32px] items-center gap-2">
        <span aria-hidden />
        <span className="text-[11px] font-medium text-muted-foreground">성과</span>
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
        <div className="flex items-center justify-end gap-3 text-[11px]">
          <div className="text-right">
            <p className="text-muted-foreground">반응률</p>
            <p className="tabular font-medium">{pct(viewReactionRate(live))}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">도달률</p>
            <p className="tabular font-medium">{pct(reachRate(live.views, followers))}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">팔로워반응</p>
            <p className="tabular font-medium">{pct(followerReactionRate(live, followers))}</p>
          </div>
        </div>
        <span aria-hidden />
      </div>
    </div>
  );
}

