import { Bookmark, BookmarkCheck, ExternalLink, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfluencerAvatar } from "@/components/influencer-avatar";
import { CategoryPicker } from "@/components/category-picker";
import { CampaignPicker } from "@/components/campaign-picker";
import { platformMeta } from "@/lib/platform";
import { engagement, nf, type Influencer } from "@/lib/influencers";
import type { Campaign } from "@/lib/campaigns";
import { cn } from "@/lib/utils";

type Props = {
  row: Influencer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaved: boolean;
  onToggleSave: () => void;
  canEdit: boolean;
  onEdit: () => void;
  onCategoriesChange: (next: string[]) => void;
  campaigns: Campaign[];
  campaignIds: string[];
  onToggleCampaign: (campaignId: string, next: boolean) => void;
  onOpenCampaign: (campaignId: string) => void;
};

export function InfluencerDetailDialog({
  row,
  open,
  onOpenChange,
  isSaved,
  onToggleSave,
  canEdit,
  onEdit,
  onCategoriesChange,
  campaigns,
  campaignIds,
  onToggleCampaign,
  onOpenCampaign,
}: Props) {
  if (!row) return null;
  const meta = platformMeta(row.platform);
  const Icon = meta.icon;
  const er = engagement(row);

  const stats = [
    { label: "팔로워", value: nf.format(row.followers) },
    { label: "평균 조회수", value: row.avg_views ? nf.format(row.avg_views) : "–" },
    { label: "평균 좋아요", value: nf.format(row.avg_likes) },
    { label: "평균 댓글", value: nf.format(row.avg_comments) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {row.account}
            <span
              className={cn(
                "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                meta.badge,
              )}
            >
              <Icon className="size-3" />
              {meta.label}
            </span>
          </DialogTitle>
          <DialogDescription>인플루언서 상세 정보와 카테고리를 확인·수정합니다.</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3">
          <InfluencerAvatar
            account={row.account}
            photoUrl={row.photo_url}
            className={cn("size-14 text-sm ring-2", meta.ring)}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {row.bio || "소개글이 없습니다."}
            </p>
            {row.profile_url && (
              <a
                href={row.profile_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" /> 프로필 열기
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-xl border border-border bg-muted/30 p-3 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="tabular text-sm font-semibold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="-mt-1 text-center text-[11px] text-muted-foreground">
          참여율(자동) <span className={cn("font-semibold", er >= 3 && "text-accent")}>{er.toFixed(2)}%</span> · 최근 게시글 9개 기준
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">카테고리</p>
            {canEdit && <CategoryPicker value={row.categories} onChange={onCategoriesChange} />}
          </div>
          <div className="flex flex-wrap gap-1">
            {row.categories.length ? (
              row.categories.map((c) => (
                <Badge key={c} variant="outline" className="text-[11px] font-normal">
                  {c}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">지정된 카테고리가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="space-y-2 border-t border-border/70 pt-3">
          <CampaignPicker
            campaigns={campaigns}
            selectedIds={campaignIds}
            onToggle={onToggleCampaign}
            onOpenCampaign={onOpenCampaign}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant={isSaved ? "default" : "outline"} onClick={onToggleSave}>
              {isSaved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
              {isSaved ? "저장됨" : "저장"}
            </Button>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="size-3.5" /> 수정
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
