import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";

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

  /** "all" | "none" | 캠페인 id 배열(여러 캠페인 모아보기) */
  const [active, setActive] = useState<"all" | "none">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<"detail" | "compact">("detail");
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

  const term = q.trim().toLowerCase();
  const matches = (row: SavedWithInfluencer, record: TrackRecord) =>
    !term ||
    [row.influencer?.account, row.influencer?.bio, record.memo, record.contact_note, record.terms_note]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term));

  type Entry = {
    row: SavedWithInfluencer;
    record: TrackRecord;
    memberId: string | null;
    key: string;
    groupName: string | null;
  };

  /** 선택 상태에 따라 (캠페인 × 인플루언서) 단위의 표시 목록을 만든다 */
  const sections = useMemo(() => {
    const build = (rowsIn: SavedWithInfluencer[], group: (typeof groups)[number] | null) => {
      const entries: Entry[] = [];
      for (const row of rowsIn) {
        const member = group ? memberOf.get(`${group.id}:${row.id}`) : undefined;
        const record = toRecord(member ?? row);
        if (!matches(row, record)) continue;
        entries.push({
          row,
          record,
          memberId: member?.id ?? null,
          key: member?.id ?? row.id,
          groupName: group?.name ?? null,
        });
      }
      return entries;
    };

    if (selectedIds.length > 0) {
      return groups
        .filter((g) => selectedIds.includes(g.id))
        .map((g) => ({
          id: g.id,
          title: g.name,
          color: g.color,
          entries: build(
            allRows.filter((r) => (bySaved.get(r.id) ?? []).includes(g.id)),
            g,
          ),
        }));
    }

    const scoped =
      active === "none" ? allRows.filter((r) => !(bySaved.get(r.id) ?? []).length) : allRows;
    return [
      {
        id: active,
        title: active === "none" ? "미분류" : "전체",
        color: "default",
        entries: build(scoped, null),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, groups, memberOf, bySaved, active, selectedIds, term]);

  const entries = useMemo(() => sections.flatMap((s) => s.entries), [sections]);
  const multi = selectedIds.length > 1;


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
    for (const { row, record, groupName } of entries) {
      if (!record.upload_date || !record.views) continue;
      list.push({
        label: `${record.upload_date.slice(5)} ${row.influencer?.account ?? ""}${groupName && multi ? ` · ${groupName}` : ""}`,
        date: record.upload_date,
        views: record.views,
        reactions: (record.result_likes ?? 0) + (record.result_comments ?? 0),
        viewRate: viewReactionRate(record),
        followerRate: followerReactionRate(record, row.influencer?.followers ?? 0),
      });
    }
    return list;
  }, [entries, multi]);

  const totals = useMemo(() => {
    let views = 0;
    let reactions = 0;
    let followers = 0;
    let contacted = 0;
    for (const { row, record } of entries) {
      views += record.views ?? 0;
      reactions += (record.result_likes ?? 0) + (record.result_comments ?? 0);
      followers += row.influencer?.followers ?? 0;
      if (record.contact_status === "컨택완료") contacted += 1;
    }
    return { views, reactions, followers, contacted };
  }, [entries]);

  const countFor = (id: string) =>
    id === "all"
      ? allRows.length
      : id === "none"
        ? allRows.filter((r) => !(bySaved.get(r.id) ?? []).length).length
        : allRows.filter((r) => (bySaved.get(r.id) ?? []).includes(id)).length;

  const summary = [
    { label: "인플루언서", value: nf.format(entries.length) },
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

  function toggleGroupTab(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">내 캠페인</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            캠페인 그룹을 여러 개 선택하면 A·B·C 캠페인을 한 화면에 모아볼 수 있어요. 그룹별로
            컨택·답변·조건과 성과는 따로 기록됩니다.
          </p>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          {(
            [
              { id: "detail", label: "상세보기", icon: Rows3 },
              { id: "compact", label: "간략히", icon: List },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors",
                view === v.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <v.icon className="size-3.5" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", name: "전체", color: "default" },
          { id: "none", name: "미분류", color: "default" },
        ].map((g) => {
          const on = selectedIds.length === 0 && active === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setSelectedIds([]);
                setActive(g.id as "all" | "none");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : (colorClass['default'] ?? "") + " hover:opacity-80",
              )}
            >
              <span>{g.name}</span>
              <span className="tabular opacity-70">{countFor(g.id)}</span>
            </button>
          );
        })}

        <span className="mx-1 h-5 w-px bg-border" />

        {groups.map((g) => (
          <div key={g.id} className="group relative">
            <button
              type="button"
              onClick={() => toggleGroupTab(g.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                selectedIds.includes(g.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : (colorClass[g.color] ?? colorClass['default']) + " hover:opacity-80",
              )}
            >
              <span className="max-w-[160px] truncate">{g.name}</span>
              <span className="tabular opacity-70">{countFor(g.id)}</span>
            </button>
            <button
              type="button"
              aria-label={`${g.name} 그룹 삭제`}
              onClick={() => removeCampaign(g.id)}
              className="absolute -right-1.5 -top-1.5 hidden size-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground group-hover:flex"
            >
              <X className="size-2.5" />
            </button>
          </div>
        ))}

        {selectedIds.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full text-xs"
            onClick={() => setSelectedIds([])}
          >
            선택 해제
          </Button>
        )}

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

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {allRows.length === 0
            ? "아직 저장한 인플루언서가 없습니다. 탐색 화면에서 북마크를 눌러 추가해 보세요."
            : "이 조건에 해당하는 인플루언서가 없습니다."}
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.id} className="space-y-3">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      colorClass[section.color] ?? colorClass['default'],
                    )}
                  >
                    {section.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {section.entries.length}명
                  </span>
                </div>
              )}

              {section.entries.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  이 그룹에 속한 인플루언서가 없습니다.
                </p>
              ) : view === "compact" ? (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="grid grid-cols-[minmax(180px,1.6fr)_repeat(3,minmax(88px,0.8fr))_repeat(3,minmax(72px,0.7fr))] gap-2 border-b border-border bg-muted/50 px-3 py-2 text-[11px] font-medium text-muted-foreground">
                    <span>인플루언서</span>
                    <span>컨택</span>
                    <span>답변</span>
                    <span>조회수</span>
                    <span>좋아요</span>
                    <span>댓글</span>
                    <span className="text-right">반응/도달/팔로워</span>
                  </div>
                  {section.entries.map((e) => (
                    <CampaignInfluencerRow
                      key={`${section.id}-${e.row.id}`}
                      recordKey={e.key}
                      influencer={e.row.influencer ?? null}
                      record={e.record}
                      scopeLabel={multi ? e.groupName : null}
                      onPatch={(values) => patch(e.row, e.memberId, values)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {section.entries.map((e) => (
                    <CampaignInfluencerCard
                      key={`${section.id}-${e.row.id}`}
                      recordKey={e.key}
                      influencer={e.row.influencer ?? null}
                      record={e.record}
                      scopeLabel={e.groupName ? `${e.groupName} 기록` : "기본 기록"}
                      campaigns={groups}
                      selectedCampaignIds={bySaved.get(e.row.id) ?? []}
                      onToggleCampaign={(cid, next) => toggleMember(e.row.id, cid, next)}
                      onPatch={(values) => patch(e.row, e.memberId, values)}
                      onRemove={() => remove(e.row.influencer_id)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

