import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { refreshAllInstagramProfiles } from "@/lib/instagram-refresh.functions";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  Download,
  RefreshCw,

  Users,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useSessionUser } from "@/hooks/use-session-user";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfluencerFormDialog } from "@/components/influencer-form-dialog";
import { InfluencerAvatar } from "@/components/influencer-avatar";
import { InstagramImportDialog } from "@/components/instagram-import-dialog";
import { CampaignPicker } from "@/components/campaign-picker";
import {
  addToCampaign,
  fetchCampaignMembers,
  fetchCampaigns,
  removeFromCampaign,
} from "@/lib/campaigns";

import {
  CATEGORIES,
  PLATFORMS,
  createInfluencer,
  deleteInfluencer,
  engagement,
  fetchDirectory,
  fetchSaved,
  nf,
  saveInfluencer,
  unsaveInfluencer,
  updateInfluencer,
  type DirectoryFilters,
  type Influencer,
  type InfluencerFormValues,
} from "@/lib/influencers";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "인플루언서 탐색 · 리치보드" },
      {
        name: "description",
        content:
          "팔로워 수, 참여율, 카테고리로 인스타그램 인플루언서를 검색하고 캠페인 리스트에 저장하세요.",
      },
      { property: "og:title", content: "인플루언서 탐색 · 리치보드" },
      {
        property: "og:description",
        content: "팔로워·참여율·카테고리 필터로 딱 맞는 인플루언서를 찾아보세요.",
      },
    ],
  }),
  component: SearchPage,
});

const FOLLOWER_RANGES = [
  { label: "전체", min: null, max: null },
  { label: "1만 미만", min: null, max: 10000 },
  { label: "1만~5만", min: 10000, max: 50000 },
  { label: "5만~10만", min: 50000, max: 100000 },
  { label: "10만 이상", min: 100000, max: null },
];

function SearchPage() {
  const { user } = useSessionUser();
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("전체");
  const [cats, setCats] = useState<string[]>([]);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [sort, setSort] = useState<DirectoryFilters["sort"]>("followers");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Influencer | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const range = FOLLOWER_RANGES[rangeIdx]!;
  const filters: DirectoryFilters = {
    q,
    platform,
    categories: cats,
    minFollowers: range.min,
    maxFollowers: range.max,
    sort,
  };

  const directory = useQuery({
    queryKey: ["directory", filters],
    queryFn: () => fetchDirectory(filters),
  });
  const saved = useQuery({ queryKey: ["saved"], queryFn: fetchSaved });
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const members = useQuery({ queryKey: ["campaign-members"], queryFn: fetchCampaignMembers });

  const savedIds = useMemo(
    () => new Set((saved.data ?? []).map((s) => s.influencer_id)),
    [saved.data],
  );

  /** influencer_id → saved_influencers.id */
  const savedRowId = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of saved.data ?? []) map.set(s.influencer_id, s.id);
    return map;
  }, [saved.data]);

  /** influencer_id → 속한 캠페인 그룹 id 목록 */
  const groupsOf = useMemo(() => {
    const bySavedId = new Map<string, string[]>();
    for (const m of members.data ?? []) {
      bySavedId.set(m.saved_influencer_id, [
        ...(bySavedId.get(m.saved_influencer_id) ?? []),
        m.campaign_id,
      ]);
    }
    const map = new Map<string, string[]>();
    for (const [infId, sid] of Array.from(savedRowId.entries()))
      map.set(infId, bySavedId.get(sid) ?? []);
    return map;
  }, [members.data, savedRowId]);

  async function toggleGroup(influencerId: string, campaignId: string, next: boolean) {
    if (!user) return;
    try {
      let sid = savedRowId.get(influencerId);
      if (!sid) sid = await saveInfluencer(influencerId, user.id);
      if (next) await addToCampaign(campaignId, sid, user.id);
      else await removeFromCampaign(campaignId, sid);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["saved"] }),
        queryClient.invalidateQueries({ queryKey: ["campaign-members"] }),
      ]);
      toast.success(next ? "캠페인 그룹에 담았습니다" : "그룹에서 제외했습니다");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "그룹 변경에 실패했습니다");
    }
  }

  const toggleSave = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (savedIds.has(id)) await unsaveInfluencer(id);
      else await saveInfluencer(id, user.id);
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["saved"] }),
        queryClient.invalidateQueries({ queryKey: ["campaign-members"] }),
      ]),
    onError: (e) => toast.error(e instanceof Error ? e.message : "저장에 실패했습니다"),
  });


  const remove = useMutation({
    mutationFn: (id: string) => deleteInfluencer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["directory"] });
      await queryClient.invalidateQueries({ queryKey: ["saved"] });
      toast.success("삭제했습니다");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다"),
  });

  async function handleSubmit(values: InfluencerFormValues) {
    if (!user) return;
    if (editing) {
      await updateInfluencer(editing.id, values);
      toast.success("수정했습니다");
    } else {
      await createInfluencer(values, user.id);
      toast.success("디렉터리에 등록했습니다");
    }
    await queryClient.invalidateQueries({ queryKey: ["directory"] });
    await queryClient.invalidateQueries({ queryKey: ["saved"] });
  }

  const rows = directory.data ?? [];

  const activeFilters = [
    q.trim() ? { key: "q", label: `"${q.trim()}"`, clear: () => setQ("") } : null,
    platform !== "전체" ? { key: "p", label: platform, clear: () => setPlatform("전체") } : null,
    rangeIdx !== 0
      ? { key: "r", label: `팔로워 ${range.label}`, clear: () => setRangeIdx(0) }
      : null,
    ...cats.map((c) => ({
      key: `c-${c}`,
      label: c,
      clear: () => setCats((prev) => prev.filter((x) => x !== c)),
    })),
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const runRefreshAll = useServerFn(refreshAllInstagramProfiles);
  const refreshAll = useMutation({
    mutationFn: () =>
      runRefreshAll({} as never) as Promise<{ updated: number; failed: string[] }>,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["directory"] });
      toast.success(
        `${res.updated}개 계정 지표를 갱신했습니다.${res.failed.length ? ` (실패 ${res.failed.length}개)` : ""}`,
      );
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "갱신에 실패했습니다."),
  });

  const resetAll = () => {
    setQ("");
    setPlatform("전체");
    setCats([]);
    setRangeIdx(0);
  };

  const totalReach = rows.reduce((a, r) => a + r.followers, 0);
  const avgEngagement = rows.length
    ? rows.reduce((a, r) => a + engagement(r), 0) / rows.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">인플루언서 탐색</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            조건에 맞는 계정을 찾아 내 캠페인 리스트에 담아보세요.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={refreshAll.isPending}
              onClick={() => refreshAll.mutate()}
            >
              <RefreshCw className={cn("size-4", refreshAll.isPending && "animate-spin")} />
              {refreshAll.isPending ? "갱신 중…" : "전체 지표 갱신"}
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Download className="size-4" /> 인스타 가져오기
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> 인플루언서 등록
            </Button>
          </div>
        )}

      </div>

      {/* 전체 지표 갱신 결과 요약 */}
      {isAdmin && (refreshAll.isPending || refreshAll.data || refreshAll.error) && (
        <div
          className={cn(
            "rounded-2xl border p-4 text-sm",
            refreshAll.error
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-card",
          )}
        >
          {refreshAll.isPending ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" /> 인스타 계정 지표를 갱신하는 중입니다…
            </p>
          ) : refreshAll.error ? (
            <p>
              갱신 실패:{" "}
              {refreshAll.error instanceof Error
                ? refreshAll.error.message
                : "알 수 없는 오류가 발생했습니다."}
            </p>
          ) : refreshAll.data ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-medium">갱신 완료</span>
                <span className="text-emerald-600">
                  성공 {refreshAll.data.updated}개
                </span>
                <span
                  className={
                    refreshAll.data.failed.length ? "text-destructive" : "text-muted-foreground"
                  }
                >
                  실패 {refreshAll.data.failed.length}개
                </span>
                <button
                  type="button"
                  className="ml-auto text-xs text-muted-foreground underline"
                  onClick={() => refreshAll.reset()}
                >
                  닫기
                </button>
              </div>
              {refreshAll.data.failed.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  실패 계정: {refreshAll.data.failed.join(", ")}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 필터 바 — 스크롤해도 상단에 고정되어 조건 변경이 쉽다 */}
      <div className="sticky top-2 z-20 space-y-3 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="계정, 소개 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => setQ("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="h-10 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체 플랫폼</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(rangeIdx)} onValueChange={(v) => setRangeIdx(Number(v))}>
            <SelectTrigger className="h-10 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOLLOWER_RANGES.map((r, i) => (
                <SelectItem key={r.label} value={String(i)}>
                  {i === 0 ? "전체 팔로워" : r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as DirectoryFilters["sort"])}>
            <SelectTrigger className="h-10 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="followers">팔로워순</SelectItem>
              <SelectItem value="engagement">참여율순</SelectItem>
              <SelectItem value="recent">최신 등록순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = cats.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setCats((prev) =>
                    prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
                  )
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/70 pt-3">
            <span className="text-[11px] font-medium text-muted-foreground">적용된 조건</span>
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={f.clear}
                className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground hover:opacity-80"
              >
                {f.label}
                <X className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={resetAll}
              className="ml-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              전체 초기화
            </button>
          </div>
        )}
      </div>

      {/* 결과 요약 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Users className="size-4 text-muted-foreground" />
          {directory.isLoading ? "불러오는 중…" : `${nf.format(rows.length)}명`}
        </span>
        {!directory.isLoading && rows.length > 0 && (
          <>
            <span className="text-muted-foreground">
              총 도달 <span className="tabular font-medium text-foreground">{nf.format(totalReach)}</span>
            </span>
            <span className="text-muted-foreground">
              평균 참여율{" "}
              <span className="tabular font-medium text-accent">{avgEngagement.toFixed(2)}%</span>
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              저장됨 {savedIds.size}명
            </span>
          </>
        )}
      </div>

      {directory.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const isSaved = savedIds.has(row.id);
            const er = engagement(row);
            const tier = er >= 3 ? "high" : er >= 1 ? "mid" : "low";
            return (
              <article
                key={row.id}
                className={cn(
                  "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                  isSaved ? "border-primary/40 ring-1 ring-primary/15" : "border-border",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-0.5 transition-opacity",
                    isSaved ? "bg-primary opacity-100" : "bg-primary/50 opacity-0 group-hover:opacity-100",
                  )}
                />
                <div className="flex items-start gap-3">
                  <InfluencerAvatar
                    account={row.account}
                    photoUrl={row.photo_url}
                    className="size-12 text-sm ring-2 ring-background"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{row.account}</p>
                      {row.profile_url && (
                        <a
                          href={row.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${row.account} 프로필 열기`}
                          className="text-muted-foreground transition-colors hover:text-primary"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    {row.bio ? (
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {row.bio}
                      </p>
                    ) : (
                      <p className="truncate text-xs text-muted-foreground/70">{row.platform}</p>
                    )}
                  </div>

                  <Button
                    size="icon"
                    variant={isSaved ? "default" : "ghost"}
                    className="shrink-0"
                    aria-label={isSaved ? "리스트에서 제거" : "내 리스트에 저장"}
                    title={isSaved ? "리스트에서 제거" : "내 리스트에 저장"}
                    onClick={() => toggleSave.mutate(row.id)}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="size-4" />
                    ) : (
                      <Bookmark className="size-4" />
                    )}
                  </Button>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/40 py-2.5 text-center">
                  <div className="grid grid-cols-3 divide-x divide-border">
                    <div>
                      <p className="tabular text-sm font-semibold">{nf.format(row.followers)}</p>
                      <p className="text-[11px] text-muted-foreground">팔로워</p>
                    </div>
                    <div>
                      <p className="tabular text-sm font-semibold">
                        {row.avg_views ? nf.format(row.avg_views) : "–"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">평균 조회수</p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "tabular flex items-center justify-center gap-1 text-sm font-semibold",
                          tier === "high"
                            ? "text-accent"
                            : tier === "mid"
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {tier === "high" && <Sparkles className="size-3" />}
                        {er.toFixed(2)}%
                      </p>
                      <p className="text-[11px] text-muted-foreground">참여율(자동)</p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 divide-x divide-border border-t border-border/70 pt-2">
                    <div>
                      <p className="tabular text-sm font-semibold">{nf.format(row.avg_likes)}</p>
                      <p className="text-[11px] text-muted-foreground">평균 좋아요</p>
                    </div>
                    <div>
                      <p className="tabular text-sm font-semibold">{nf.format(row.avg_comments)}</p>
                      <p className="text-[11px] text-muted-foreground">평균 댓글</p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground/80">최근 게시글 9개 기준</p>
                </div>

                {row.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {row.categories.map((c) => (
                      <Badge key={c} variant="outline" className="text-[11px] font-normal">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-auto space-y-2 border-t border-border/70 pt-3">
                  <CampaignPicker
                    campaigns={campaigns.data ?? []}
                    selectedIds={groupsOf.get(row.id) ?? []}
                    onToggle={(cid, next) => toggleGroup(row.id, cid, next)}
                  />

                  {isAdmin && (
                    <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditing(row);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" /> 수정
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`${row.account} 계정을 삭제할까요?`)) remove.mutate(row.id);
                        }}
                      >
                        <Trash2 className="size-3.5" /> 삭제
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!directory.isLoading && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
          <Search className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">조건에 맞는 인플루언서가 없습니다.</p>
          {activeFilters.length > 0 && (
            <Button variant="outline" size="sm" onClick={resetAll}>
              조건 초기화
            </Button>
          )}
        </div>
      )}

      <InfluencerFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        row={editing}
        onSubmit={handleSubmit}
      />

      <InstagramImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onDone={() => queryClient.invalidateQueries({ queryKey: ["directory"] })}
      />

    </div>
  );
}
