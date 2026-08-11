import { ExternalLink, Trash2 } from "lucide-react";

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
  onPatch: (values: Record<string, unknown>) => void;
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
  const metrics = [
    { label: "도달률 (조회수÷팔로워)", value: pct(reachRate(record.views, followers)) },
    { label: "반응률 (좋아요+댓글÷조회수)", value: pct(viewReactionRate(record)) },
    {
      label: "팔로워 대비 반응률",
      value: pct(followerReactionRate(record, followers)),
    },
  ];

  const num = (v: string) => (v ? Number(v) : null);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <InfluencerAvatar
            account={influencer?.account ?? ""}
            photoUrl={influencer?.photo_url ?? null}
            className="size-11 text-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-semibold">{influencer?.account}</p>
              {influencer?.profile_url && (
                <a
                  href={influencer.profile_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="프로필 열기"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {influencer?.platform} · 팔로워 {nf.format(followers)}
              {influencer?.bio ? ` · ${influencer.bio}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[11px] font-normal">
            {scopeLabel}
          </Badge>
          <CampaignPicker
            campaigns={campaigns}
            selectedIds={selectedCampaignIds}
            onToggle={onToggleCampaign}
          />
          <Button size="icon" variant="ghost" aria-label="리스트에서 제거" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      <div className="grid gap-5 pt-4 lg:grid-cols-2">
        {/* 컨택 */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-xs text-muted-foreground">컨택</Label>
            <Select
              value={record.contact_status}
              onValueChange={(v) => onPatch({ contact_status: v })}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="h-9 flex-1"
              value={record.contact_date ?? ""}
              onChange={(e) => onPatch({ contact_date: e.target.value || null })}
            />
          </div>
          <Textarea
            key={`${recordKey}-contact_note`}
            rows={3}
            placeholder="컨택 내용을 자유롭게 적어주세요 (보낸 제안, 채널, 담당자 등)"
            defaultValue={record.contact_note ?? ""}
            onBlur={(e) => onPatch({ contact_note: e.target.value || null })}
          />
        </section>

        {/* 답변 */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-xs text-muted-foreground">답변</Label>
            <Select
              value={record.reply_status}
              onValueChange={(v) => onPatch({ reply_status: v })}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPLY_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="h-9 flex-1"
              value={record.reply_date ?? ""}
              onChange={(e) => onPatch({ reply_date: e.target.value || null })}
            />
          </div>
          <Textarea
            key={`${recordKey}-reply_note`}
            rows={3}
            placeholder="답변 내용 (회신 요약, 요청 사항 등)"
            defaultValue={record.reply_note ?? ""}
            onBlur={(e) => onPatch({ reply_note: e.target.value || null })}
          />
        </section>

        {/* 조건 */}
        <section className="space-y-2">
          <Label className="text-xs text-muted-foreground">조건 (직접 입력)</Label>
          <Textarea
            key={`${recordKey}-terms_note`}
            rows={4}
            placeholder="예: 릴스 1편 + 스토리 2회, 원고료 150만원(VAT 별도), 2차 활용 3개월, 업로드 후 30일 유지"
            defaultValue={record.terms_note ?? ""}
            onBlur={(e) => onPatch({ terms_note: e.target.value || null })}
          />
        </section>

        {/* 계약 / 업로드 */}
        <section className="space-y-2">
          <Label className="text-xs text-muted-foreground">계약 · 업로드</Label>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={record.contract_sent}
                onCheckedChange={(c) => onPatch({ contract_sent: !!c })}
              />
              계약서 발송
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={record.contract_returned}
                onCheckedChange={(c) => onPatch({ contract_returned: !!c })}
              />
              계약서 회수
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="업로드일"
              className="h-9 w-[160px]"
              value={record.upload_date ?? ""}
              onChange={(e) => onPatch({ upload_date: e.target.value || null })}
            />
            <Input
              key={`${recordKey}-upload_link`}
              placeholder="업로드 링크"
              className="h-9 flex-1"
              defaultValue={record.upload_link ?? ""}
              onBlur={(e) => onPatch({ upload_link: e.target.value || null })}
            />
          </div>
        </section>

        {/* 성과 */}
        <section className="space-y-2 lg:col-span-2">
          <Label className="text-xs text-muted-foreground">성과</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              key={`${recordKey}-views`}
              type="number"
              placeholder="조회수"
              aria-label="조회수"
              className="h-9"
              defaultValue={record.views ?? ""}
              onBlur={(e) => onPatch({ views: num(e.target.value) })}
            />
            <Input
              key={`${recordKey}-likes`}
              type="number"
              placeholder="좋아요"
              aria-label="좋아요"
              className="h-9"
              defaultValue={record.result_likes ?? ""}
              onBlur={(e) => onPatch({ result_likes: num(e.target.value) })}
            />
            <Input
              key={`${recordKey}-comments`}
              type="number"
              placeholder="댓글"
              aria-label="댓글"
              className="h-9"
              defaultValue={record.result_comments ?? ""}
              onBlur={(e) => onPatch({ result_comments: num(e.target.value) })}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
                <p className="tabular text-lg font-semibold">{m.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 메모 */}
        <section className="space-y-2 lg:col-span-2">
          <Label className="text-xs text-muted-foreground">메모</Label>
          <Textarea
            key={`${recordKey}-memo`}
            rows={5}
            placeholder="진행하며 남길 내용을 자유롭게 기록하세요."
            defaultValue={record.memo ?? ""}
            onBlur={(e) => onPatch({ memo: e.target.value || null })}
          />
        </section>
      </div>
    </article>
  );
}
