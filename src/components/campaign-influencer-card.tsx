import { useEffect, useState } from "react";
import { Check, CheckCircle2, Circle, ExternalLink, Loader2, Trash2 } from "lucide-react";

import { CategoryBadge } from "@/components/category-badge";
import { InfluencerAvatar } from "@/components/influencer-avatar";
import { CampaignPicker } from "@/components/campaign-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Campaign } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
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
  /** 기록 단위 키 — 캠페인 전환 시 입력값 리셋용 */
  recordKey: string;
  record: TrackRecord;
  scopeLabel: string;
  campaigns: Campaign[];
  selectedCampaignIds: string[];
  onToggleCampaign: (campaignId: string, next: boolean) => void;
  onPatch: (values: Record<string, unknown>) => void | Promise<void>;
  onRemove: () => void;
};

function pct(v: number | null) {
  return v == null ? "–" : `${v.toFixed(2)}%`;
}

export function CampaignInfluencerCard({
  influencer,
  recordKey,
  record,
  scopeLabel,
  campaigns,
  selectedCampaignIds,
  onToggleCampaign,
  onPatch,
  onRemove,
}: Props) {
  const followers = influencer?.followers ?? 0;

  // 성과 입력은 로컬 상태로 두어 타이핑 즉시 지표가 계산되도록 한다 (저장은 onBlur)
  const [perf, setPerf] = useState({
    views: record.views,
    result_likes: record.result_likes,
    result_comments: record.result_comments,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    setPerf({
      views: record.views,
      result_likes: record.result_likes,
      result_comments: record.result_comments,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordKey]);

  async function save(values: Record<string, unknown>) {
    setStatus("saving");
    try {
      await onPatch(values);
      setStatus("saved");
    } catch {
      setStatus("idle");
    }
  }

  const live = { ...record, ...perf };
  const metrics = [
    { label: "도달률 (조회수÷팔로워)", value: pct(reachRate(live.views, followers)) },
    { label: "반응률 (좋아요+댓글÷조회수)", value: pct(viewReactionRate(live)) },
    {
      label: "팔로워 대비 반응률",
      value: pct(followerReactionRate(live, followers)),
    },
  ];

  const num = (v: string) => (v ? Number(v) : null);
  const done = record.completed;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors",
        done ? "border-emerald-500/40 bg-emerald-500/[0.04]" : "border-border"
      )}
    >
      {/* 프로필 헤더 */}
      <header className="flex items-start gap-4 border-b border-border/60 p-5">
        <InfluencerAvatar
          account={influencer?.account ?? ""}
          photoUrl={influencer?.photo_url ?? null}
          className="size-14 shrink-0 text-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-bold">{influencer?.account}</p>
            {influencer?.categories && influencer.categories.length > 0 && (
              <span className="flex shrink-0 flex-wrap items-center gap-1">
                {influencer.categories.map((category) => (
                  <CategoryBadge key={category} category={category} compact />
                ))}
              </span>
            )}
            {influencer?.profile_url && (
              <a
                href={influencer.profile_url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="프로필 열기"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {influencer?.platform} · 팔로워 {nf.format(followers)}
            {influencer?.bio ? ` · ${influencer.bio}` : ""}
          </p>
        </div>
      </header>

      {/* 액션 바 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/30 p-4">
        <Badge variant="secondary" className="h-8 px-3 text-xs font-medium">
          {scopeLabel}
        </Badge>
        <Button
          size="sm"
          variant={done ? "default" : "outline"}
          className={cn(
            "h-8 gap-1.5 text-xs",
            done && "bg-emerald-600 text-white hover:bg-emerald-600/90"
          )}
          onClick={() =>
            save({
              completed: !done,
              completed_at: !done ? new Date().toISOString() : null,
            })
          }
        >
          {done ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
          {done ? "완료됨" : "완료 처리"}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {status !== "idle" && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {status === "saving" ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> 저장 중
                </>
              ) : (
                <>
                  <Check className="size-3" /> 자동 저장됨
                </>
              )}
            </span>
          )}
          <CampaignPicker
            campaigns={campaigns}
            selectedIds={selectedCampaignIds}
            onToggle={onToggleCampaign}
          />
          <Button
            size="icon"
            variant="ghost"
            aria-label="리스트에서 제거"
            onClick={onRemove}
            className="h-8 w-8"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* 섹션 폼 */}
      <div className="space-y-5 p-5">
        {/* 컨택 / 답변 */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold">컨택</Label>
              <Select
                value={record.contact_status}
                onValueChange={(v) => save({ contact_status: v })}
              >
                <SelectTrigger className="h-8 w-[120px] text-xs">
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
            </div>
            <Input
              type="date"
              className="h-9 text-sm"
              value={record.contact_date ?? ""}
              onChange={(e) => save({ contact_date: e.target.value || null })}
            />
            <Textarea
              key={`${recordKey}-contact_note`}
              rows={4}
              placeholder="컨택 내용을 자유롭게 적어주세요 (보낸 제안, 채널, 담당자 등)"
              defaultValue={record.contact_note ?? ""}
              onBlur={(e) => save({ contact_note: e.target.value || null })}
              className="resize-none bg-muted/20"
            />
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold">답변</Label>
              <Select
                value={record.reply_status}
                onValueChange={(v) => save({ reply_status: v })}
              >
                <SelectTrigger className="h-8 w-[120px] text-xs">
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
            </div>
            <Input
              type="date"
              className="h-9 text-sm"
              value={record.reply_date ?? ""}
              onChange={(e) => save({ reply_date: e.target.value || null })}
            />
            <Textarea
              key={`${recordKey}-reply_note`}
              rows={4}
              placeholder="답변 내용 (회신 요약, 요청 사항 등)"
              defaultValue={record.reply_note ?? ""}
              onBlur={(e) => save({ reply_note: e.target.value || null })}
              className="resize-none bg-muted/20"
            />
          </section>
        </div>

        {/* 조건 */}
        <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <Label className="text-sm font-semibold">조건 (직접 입력)</Label>
          <Textarea
            key={`${recordKey}-terms_note`}
            rows={5}
            placeholder="예: 릴스 1편 + 스토리 2회, 원고료 150만원(VAT 별도), 2차 활용 3개월, 업로드 후 30일 유지"
            defaultValue={record.terms_note ?? ""}
            onBlur={(e) => save({ terms_note: e.target.value || null })}
            className="resize-none bg-muted/20"
          />
        </section>

        {/* 계약 / 업로드 */}
        <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <Label className="text-sm font-semibold">계약 · 업로드</Label>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={record.contract_sent}
                onCheckedChange={(c) => save({ contract_sent: !!c })}
              />
              계약서 발송
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={record.contract_returned}
                onCheckedChange={(c) => save({ contract_returned: !!c })}
              />
              계약서 회수
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              type="date"
              aria-label="업로드일"
              className="h-9 text-sm"
              value={record.upload_date ?? ""}
              onChange={(e) => save({ upload_date: e.target.value || null })}
            />
            <Input
              key={`${recordKey}-upload_link`}
              placeholder="업로드 링크"
              className="h-9 text-sm"
              defaultValue={record.upload_link ?? ""}
              onBlur={(e) => save({ upload_link: e.target.value || null })}
            />
          </div>
        </section>

        {/* 성과 */}
        <section className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
          <Label className="text-sm font-semibold">성과</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                { field: "views", label: "조회수" },
                { field: "result_likes", label: "좋아요" },
                { field: "result_comments", label: "댓글" },
              ] as const
            ).map(({ field, label }) => (
              <Input
                key={field}
                type="number"
                placeholder={label}
                aria-label={label}
                className="h-9 text-sm"
                value={perf[field] ?? ""}
                onChange={(e) =>
                  setPerf((p) => ({ ...p, [field]: num(e.target.value) }))
                }
                onBlur={(e) => save({ [field]: num(e.target.value) })}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-border bg-card px-3 py-2 text-center"
              >
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
                <p className="tabular text-lg font-semibold">{m.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 메모 */}
        <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <Label className="text-sm font-semibold">메모</Label>
          <Textarea
            key={`${recordKey}-memo`}
            rows={6}
            placeholder="진행하며 남길 내용을 자유롭게 기록하세요."
            defaultValue={record.memo ?? ""}
            onBlur={(e) => save({ memo: e.target.value || null })}
            className="resize-none bg-muted/20"
          />
        </section>
      </div>
    </article>
  );
}
