import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";

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

  const savedIds = useMemo(
    () => new Set((saved.data ?? []).map((s) => s.influencer_id)),
    [saved.data],
  );

  const toggleSave = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (savedIds.has(id)) await unsaveInfluencer(id);
      else await saveInfluencer(id, user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved"] }),
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
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> 인플루언서 등록
          </Button>
        )}
      </div>


      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="계정, 브랜드, 소개 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[120px]">
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
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOLLOWER_RANGES.map((r, i) => (
                <SelectItem key={r.label} value={String(i)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as DirectoryFilters["sort"])}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="followers">팔로워순</SelectItem>
              <SelectItem value="engagement">참여율순</SelectItem>
              <SelectItem value="recent">최신 등록순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = cats.includes(cat);
            return (
              <Badge
                key={cat}
                variant={active ? "default" : "outline"}
                className="cursor-pointer select-none px-2.5 py-1 text-xs font-medium"
                onClick={() =>
                  setCats((prev) =>
                    prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
                  )
                }
              >
                {cat}
              </Badge>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {directory.isLoading ? "불러오는 중…" : `${nf.format(rows.length)}명의 인플루언서`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const isSaved = savedIds.has(row.id);
          return (
            <article
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                {row.photo_url ? (
                  <img
                    src={row.photo_url}
                    alt={`${row.account} 프로필 사진`}
                    loading="lazy"
                    className="size-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {row.account.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{row.account}</p>
                    {row.profile_url && (
                      <a
                        href={row.profile_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${row.account} 프로필 열기`}
                      >
                        <ExternalLink className="size-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.bio || row.platform}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant={isSaved ? "secondary" : "ghost"}
                  aria-label={isSaved ? "리스트에서 제거" : "내 리스트에 저장"}
                  onClick={() => toggleSave.mutate(row.id)}
                >
                  {isSaved ? (
                    <BookmarkCheck className="size-4" />
                  ) : (
                    <Bookmark className="size-4" />
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-center">
                <div>
                  <p className="tabular text-sm font-semibold">{nf.format(row.followers)}</p>
                  <p className="text-[11px] text-muted-foreground">팔로워</p>
                </div>
                <div>
                  <p className="tabular text-sm font-semibold">{nf.format(row.avg_likes)}</p>
                  <p className="text-[11px] text-muted-foreground">평균 좋아요</p>
                </div>
                <div>
                  <p className="tabular text-sm font-semibold text-accent">
                    {engagement(row).toFixed(2)}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">참여율</p>
                </div>
              </div>

              {row.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {row.categories.map((c) => (
                    <Badge key={c} variant="outline" className="text-[11px]">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="flex justify-end gap-1 border-t border-border pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
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
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`${row.account} 계정을 삭제할까요?`)) remove.mutate(row.id);
                    }}
                  >
                    <Trash2 className="size-3.5" /> 삭제
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!directory.isLoading && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          조건에 맞는 인플루언서가 없습니다.
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

    </div>
  );
}
