import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

import { InfluencerAvatar } from "@/components/influencer-avatar";
import { CampaignPicker } from "@/components/campaign-picker";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  CAMPAIGN_COLORS,
  addToCampaign,
  colorClass,
  createCampaign,
  deleteCampaign,
  fetchCampaignMembers,
  fetchCampaigns,
  removeFromCampaign,
} from "@/lib/campaigns";
import {
  CONTACT_STATUS,
  REPLY_STATUS,
  TERMS_STATUS,
  
  fetchSaved,
  nf,
  unsaveInfluencer,
  updateSaved,
} from "@/lib/influencers";

export const Route = createFileRoute("/_authenticated/board")({
  head: () => ({
    meta: [
      { title: "내 캠페인 · 리치보드" },
      {
        name: "description",
        content:
          "저장한 인플루언서의 컨택, 계약, 업로드 성과를 한 화면에서 추적하는 캠페인 관리 보드입니다.",
      },
      { property: "og:title", content: "내 캠페인 · 리치보드" },
      {
        property: "og:description",
        content: "컨택부터 계약, 업로드 성과까지 캠페인 진행 상황을 관리하세요.",
      },
    ],
  }),
  component: BoardPage,
});

/** 반응률 = (좋아요 + 댓글) ÷ 조회수 × 100 */
function resultRate(row: {
  views: number | null;
  result_likes: number | null;
  result_comments: number | null;
}) {
  if (!row.views) return null;
  return (((row.result_likes ?? 0) + (row.result_comments ?? 0)) / row.views) * 100;
}

function BoardPage() {
  const queryClient = useQueryClient();
  const { user } = useSessionUser();
  const saved = useQuery({ queryKey: ["saved"], queryFn: fetchSaved });
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const members = useQuery({ queryKey: ["campaign-members"], queryFn: fetchCampaignMembers });

  const allRows = saved.data ?? [];
  const groups = campaigns.data ?? [];
  const memberRows = members.data ?? [];

  const [active, setActive] = useState<string>("all");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>("default");
  const [open, setOpen] = useState(false);

  const bySaved = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of memberRows) {
      map.set(m.saved_influencer_id, [
        ...(map.get(m.saved_influencer_id) ?? []),
        m.campaign_id,
      ]);
    }
    return map;
  }, [memberRows]);

  const rows = useMemo(() => {
    if (active === "all") return allRows;
    if (active === "none") return allRows.filter((r) => !(bySaved.get(r.id) ?? []).length);
    return allRows.filter((r) => (bySaved.get(r.id) ?? []).includes(active));
  }, [allRows, active, bySaved]);

  async function refreshGroups() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
      queryClient.invalidateQueries({ queryKey: ["campaign-members"] }),
    ]);
  }

  async function addCampaign() {
    if (!user || !newName.trim()) return;
    try {
      await createCampaign(newName.trim(), newColor, user.id);
      setNewName("");
      setNewColor("default");
      setOpen(false);
      await refreshGroups();
      toast.success("캠페인 그룹을 만들었습니다");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "캠페인 생성에 실패했습니다");
    }
  }

  async function removeCampaign(id: string) {
    try {
      await deleteCampaign(id);
      if (active === id) setActive("all");
      await refreshGroups();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다");
    }
  }

  async function toggleMember(savedId: string, campaignId: string, next: boolean) {
    if (!user) return;
    try {
      if (next) await addToCampaign(campaignId, savedId, user.id);
      else await removeFromCampaign(campaignId, savedId);
      await queryClient.invalidateQueries({ queryKey: ["campaign-members"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "그룹 변경에 실패했습니다");
    }
  }

  async function patch(id: string, values: Record<string, unknown>) {
    try {
      await updateSaved(id, values);
      await queryClient.invalidateQueries({ queryKey: ["saved"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다");
    }
  }

  async function remove(influencerId: string) {
    await unsaveInfluencer(influencerId);
    await queryClient.invalidateQueries({ queryKey: ["saved"] });
  }

  const contacted = rows.filter((r) => r.contact_status === "컨택완료").length;
  const replied = rows.filter((r) => r.reply_status === "답변완료").length;
  const uploaded = rows.filter((r) => r.upload_date).length;

  const countFor = (id: string) =>
    id === "all"
      ? allRows.length
      : id === "none"
        ? allRows.filter((r) => !(bySaved.get(r.id) ?? []).length).length
        : allRows.filter((r) => (bySaved.get(r.id) ?? []).includes(id)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">내 캠페인</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          저장한 인플루언서를 캠페인 그룹으로 묶어 관리합니다. 한 명이 여러 캠페인에 동시에 속할 수
          있어요.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", name: "전체", color: "default" },
          { id: "none", name: "미분류", color: "default" },
          ...groups,
        ].map((g) => (
          <div key={g.id} className="group relative">
            <button
              type="button"
              onClick={() => setActive(g.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                active === g.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : (colorClass[g.color] ?? colorClass['default']) + " hover:opacity-80",
              )}
            >
              <span className="max-w-[160px] truncate">{g.name}</span>
              <span className="tabular opacity-70">{countFor(g.id)}</span>
            </button>
            {g.id !== "all" && g.id !== "none" && (
              <button
                type="button"
                aria-label={`${g.name} 그룹 삭제`}
                onClick={() => removeCampaign(g.id)}
                className="absolute -right-1.5 -top-1.5 hidden size-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground group-hover:flex"
              >
                <X className="size-2.5" />
              </button>
            )}
          </div>
        ))}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 rounded-full text-xs">
              <Plus className="size-3.5" /> 캠페인 그룹
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>새 캠페인 그룹</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="예: 3월 신제품 런칭"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] capitalize",
                      colorClass[c],
                      newColor === c && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addCampaign} disabled={!newName.trim()}>
                만들기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "저장한 인플루언서", value: rows.length },
          { label: "컨택 완료", value: contacted },
          { label: "답변 완료", value: replied },
          { label: "업로드 완료", value: uploaded },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="tabular mt-1 text-2xl font-semibold">{nf.format(s.value)}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {allRows.length === 0
            ? "아직 저장한 인플루언서가 없습니다. 탐색 화면에서 북마크를 눌러 추가해 보세요."
            : "이 그룹에 속한 인플루언서가 없습니다."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1280px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {[
                  "인플루언서",
                  "캠페인 그룹",
                  "컨택",
                  "답변",
                  "조건",
                  "계약",
                  "업로드",
                  "성과 (조회수·좋아요·댓글·반응률)",
                  "메모",
                  "",
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <InfluencerAvatar
                        account={row.influencer?.account ?? ""}
                        photoUrl={row.influencer?.photo_url ?? null}
                        className="size-8 text-[11px]"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.influencer?.account}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.influencer?.bio || row.influencer?.platform}
                        </p>
                      </div>

                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <CampaignPicker
                      campaigns={groups}
                      selectedIds={bySaved.get(row.id) ?? []}
                      onToggle={(cid, next) => toggleMember(row.id, cid, next)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Select
                      value={row.contact_status}
                      onValueChange={(v) => patch(row.id, { contact_status: v })}
                    >
                      <SelectTrigger className="h-8 w-[110px]">
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
                  </td>
                  <td className="px-3 py-2.5">
                    <Select
                      value={row.reply_status}
                      onValueChange={(v) => patch(row.id, { reply_status: v })}
                    >
                      <SelectTrigger className="h-8 w-[110px]">
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
                  </td>
                  <td className="px-3 py-2.5">
                    <Select
                      value={row.terms_status}
                      onValueChange={(v) => patch(row.id, { terms_status: v })}
                    >
                      <SelectTrigger className="h-8 w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TERMS_STATUS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1">
                        <Checkbox
                          checked={row.contract_sent}
                          onCheckedChange={(c) => patch(row.id, { contract_sent: !!c })}
                        />
                        발송
                      </label>
                      <label className="flex items-center gap-1">
                        <Checkbox
                          checked={row.contract_returned}
                          onCheckedChange={(c) => patch(row.id, { contract_returned: !!c })}
                        />
                        회수
                      </label>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Input
                      type="date"
                      className="h-8 w-[140px]"
                      value={row.upload_date ?? ""}
                      onChange={(e) =>
                        patch(row.id, { upload_date: e.target.value || null })
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        placeholder="조회수"
                        aria-label="조회수"
                        className="h-8 w-[92px]"
                        defaultValue={row.views ?? ""}
                        onBlur={(e) =>
                          patch(row.id, { views: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="좋아요"
                        aria-label="좋아요"
                        className="h-8 w-[88px]"
                        defaultValue={row.result_likes ?? ""}
                        onBlur={(e) =>
                          patch(row.id, {
                            result_likes: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="댓글"
                        aria-label="댓글"
                        className="h-8 w-[80px]"
                        defaultValue={row.result_comments ?? ""}
                        onBlur={(e) =>
                          patch(row.id, {
                            result_comments: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                      <Badge variant="outline" className="tabular whitespace-nowrap text-[11px]">
                        {resultRate(row) == null ? "–" : `${resultRate(row)!.toFixed(2)}%`}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Input
                      placeholder="메모"
                      className="h-8 w-[160px]"
                      defaultValue={row.memo ?? ""}
                      onBlur={(e) => patch(row.id, { memo: e.target.value || null })}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="리스트에서 제거"
                      onClick={() => remove(row.influencer_id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
