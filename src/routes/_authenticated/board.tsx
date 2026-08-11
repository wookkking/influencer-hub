import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import { CampaignInfluencerCard } from "@/components/campaign-influencer-card";
import { PerformanceChart, type PerfPoint } from "@/components/performance-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  updateCampaignMember,
  type CampaignMember,
} from "@/lib/campaigns";
import {
  fetchSaved,
  followerReactionRate,
  nf,
  unsaveInfluencer,
  updateSaved,
  viewReactionRate,
  type SavedWithInfluencer,
  type TrackRecord,
} from "@/lib/influencers";

export const Route = createFileRoute("/_authenticated/board")({
  head: () => ({
    meta: [
      { title: "내 캠페인 · 리치보드" },
      {
        name: "description",
        content:
          "캠페인(프로젝트)별로 컨택·답변·조건을 직접 기록하고 조회수·반응률 성과 추이를 확인하는 관리 보드입니다.",
      },
      { property: "og:title", content: "내 캠페인 · 리치보드" },
      {
        property: "og:description",
        content: "프로젝트별 컨택·조건 기록과 팔로워 대비 성과 추이를 한 화면에서 관리하세요.",
      },
    ],
  }),
  component: BoardPage,
});

function toRecord(source: SavedWithInfluencer | CampaignMember): TrackRecord {
  return {
    contact_status: source.contact_status,
    contact_date: source.contact_date,
    contact_note: source.contact_note,
    reply_status: source.reply_status,
    reply_date: source.reply_date,
    reply_note: source.reply_note,
    terms_note: source.terms_note,
    contract_sent: source.contract_sent,
    contract_returned: source.contract_returned,
    upload_date: source.upload_date,
    upload_link: source.upload_link,
    views: source.views,
    result_likes: source.result_likes,
    result_comments: source.result_comments,
    memo: source.memo,
  };
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
  const [q, setQ] = useState("");

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>("default");
  const [open, setOpen] = useState(false);

  const bySaved = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of memberRows) {
      map.set(m.saved_influencer_id, [...(map.get(m.saved_influencer_id) ?? []), m.campaign_id]);
    }
    return map;
  }, [memberRows]);

  const memberOf = useMemo(() => {
    const map = new Map<string, CampaignMember>();
    for (const m of memberRows) map.set(`${m.campaign_id}:${m.saved_influencer_id}`, m);
    return map;
  }, [memberRows]);

  const rows = useMemo(() => {
    const scoped =
      active === "all"
        ? allRows
        : active === "none"
          ? allRows.filter((r) => !(bySaved.get(r.id) ?? []).length)
          : allRows.filter((r) => (bySaved.get(r.id) ?? []).includes(active));
    const term = q.trim().toLowerCase();
    if (!term) return scoped;
    return scoped.filter((r) =>
      [r.influencer?.account, r.influencer?.bio, r.memo, r.contact_note, r.terms_note]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [allRows, active, bySaved, q]);


  const activeGroup = groups.find((g) => g.id === active) ?? null;
  const scopeLabel = activeGroup ? `${activeGroup.name} 기록` : "기본 기록";

  /** 활성 캠페인이면 캠페인별 기록, 아니면 내 리스트 기본 기록 */
  function recordFor(row: SavedWithInfluencer) {
    const member = activeGroup ? memberOf.get(`${activeGroup.id}:${row.id}`) : undefined;
    if (member) return { key: member.id, record: toRecord(member), memberId: member.id };
    return { key: row.id, record: toRecord(row), memberId: null as string | null };
  }

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

  async function patch(
    row: SavedWithInfluencer,
    memberId: string | null,
    values: Record<string, unknown>,
  ) {
    // 상단 요약/차트가 즉시 반영되도록 캐시를 먼저 갱신
    if (memberId) {
      queryClient.setQueryData<CampaignMember[]>(["campaign-members"], (prev) =>
        (prev ?? []).map((m) => (m.id === memberId ? { ...m, ...values } : m)),
      );
    } else {
      queryClient.setQueryData<SavedWithInfluencer[]>(["saved"], (prev) =>
        (prev ?? []).map((s) => (s.id === row.id ? { ...s, ...values } : s)),
      );
    }
    try {
      if (memberId) {
        await updateCampaignMember(memberId, values);
        await queryClient.invalidateQueries({ queryKey: ["campaign-members"] });
      } else {
        await updateSaved(row.id, values);
        await queryClient.invalidateQueries({ queryKey: ["saved"] });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다");
      throw e;
    }
  }


  async function remove(influencerId: string) {
    await unsaveInfluencer(influencerId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["saved"] }),
      queryClient.invalidateQueries({ queryKey: ["campaign-members"] }),
    ]);
  }

  const points: PerfPoint[] = useMemo(() => {
    const list: PerfPoint[] = [];
    for (const row of rows) {
      const { record } = recordFor(row);
      if (!record.upload_date || !record.views) continue;
      list.push({
        label: `${record.upload_date.slice(5)} ${row.influencer?.account ?? ""}`,
        date: record.upload_date,
        views: record.views,
        reactions: (record.result_likes ?? 0) + (record.result_comments ?? 0),
        viewRate: viewReactionRate(record),
        followerRate: followerReactionRate(record, row.influencer?.followers ?? 0),
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, memberOf, activeGroup]);

  const totals = useMemo(() => {
    let views = 0;
    let reactions = 0;
    let followers = 0;
    let contacted = 0;
    for (const row of rows) {
      const { record } = recordFor(row);
      views += record.views ?? 0;
      reactions += (record.result_likes ?? 0) + (record.result_comments ?? 0);
      followers += row.influencer?.followers ?? 0;
      if (record.contact_status === "컨택완료") contacted += 1;
    }
    return { views, reactions, followers, contacted };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, memberOf, activeGroup]);

  const countFor = (id: string) =>
    id === "all"
      ? allRows.length
      : id === "none"
        ? allRows.filter((r) => !(bySaved.get(r.id) ?? []).length).length
        : allRows.filter((r) => (bySaved.get(r.id) ?? []).includes(id)).length;

  const summary = [
    { label: "인플루언서", value: nf.format(rows.length) },
    { label: "총 조회수", value: nf.format(totals.views) },
    {
      label: "평균 반응률",
      value: totals.views ? `${((totals.reactions / totals.views) * 100).toFixed(2)}%` : "–",
    },
    {
      label: "팔로워 대비 도달률",
      value: totals.followers ? `${((totals.views / totals.followers) * 100).toFixed(1)}%` : "–",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">내 캠페인</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          캠페인 그룹을 고르면 그 프로젝트 기준으로 컨택·답변·조건과 성과를 따로 기록합니다. 한
          명이 여러 캠페인에 동시에 속할 수 있어요.
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="내 캠페인 검색 (계정, 소개, 메모, 조건)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>



      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="tabular mt-1 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <PerformanceChart points={points} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {allRows.length === 0
            ? "아직 저장한 인플루언서가 없습니다. 탐색 화면에서 북마크를 눌러 추가해 보세요."
            : "이 그룹에 속한 인플루언서가 없습니다."}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const { key, record, memberId } = recordFor(row);
            return (
              <CampaignInfluencerCard
                key={`${active}-${row.id}`}
                recordKey={key}
                influencer={row.influencer ?? null}
                record={record}
                scopeLabel={scopeLabel}
                campaigns={groups}
                selectedCampaignIds={bySaved.get(row.id) ?? []}
                onToggleCampaign={(cid, next) => toggleMember(row.id, cid, next)}
                onPatch={(values) => patch(row, memberId, values)}
                onRemove={() => remove(row.influencer_id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
