import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Pencil, ExternalLink, Users, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InfluencerFormDialog } from "@/components/influencer-form-dialog";
import {
  CONTACT_STATUS,
  REPLY_STATUS,
  createInfluencer,
  deleteInfluencer,
  fetchInfluencers,
  nf,
  updateInfluencer,
  type Influencer,
  type InfluencerFormValues,
} from "@/lib/influencers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "인플루언서 관리 보드 | 캠페인 컨택·성과 트래커" },
      {
        name: "description",
        content:
          "인스타그램 인플루언서의 팔로워, 참여율, 컨택 현황과 캠페인 성과를 한 화면에서 관리하는 보드입니다.",
      },
      { property: "og:title", content: "인플루언서 관리 보드" },
      {
        property: "og:description",
        content: "팔로워·참여율·컨택 현황·성과를 한 화면에서 관리하세요.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const statusTone: Record<string, string> = {
  컨택완료: "bg-primary/10 text-primary border-primary/20",
  미컨택: "bg-muted text-muted-foreground border-border",
  보류: "bg-accent/15 text-accent border-accent/30",
  답변완료: "bg-primary/10 text-primary border-primary/20",
  대기: "bg-muted text-muted-foreground border-border",
  거절: "bg-destructive/10 text-destructive border-destructive/20",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      <p className="tabular mt-3 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Index() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [contactFilter, setContactFilter] = useState("전체");
  const [replyFilter, setReplyFilter] = useState("전체");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Influencer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Influencer | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["influencers"],
    queryFn: fetchInfluencers,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["influencers"] });

  const saveMutation = useMutation({
    mutationFn: async (values: InfluencerFormValues) =>
      editing ? updateInfluencer(editing.id, values) : createInfluencer(values),
    onSuccess: () => {
      toast.success(editing ? "수정되었습니다" : "추가되었습니다");
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ row, key, value }: { row: Influencer; key: string; value: boolean }) => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("influencers")
        .update({ [key]: value } as never)
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInfluencer(id),
    onSuccess: () => {
      toast.success("삭제되었습니다");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      const matchQ =
        !q ||
        r.account.toLowerCase().includes(q) ||
        (r.brand ?? "").toLowerCase().includes(q) ||
        r.platform.toLowerCase().includes(q);
      const matchContact = contactFilter === "전체" || r.contact_status === contactFilter;
      const matchReply = replyFilter === "전체" || r.reply_status === replyFilter;
      return matchQ && matchContact && matchReply;
    });
  }, [data, query, contactFilter, replyFilter]);

  const stats = useMemo(() => {
    const totalFollowers = data.reduce((s, r) => s + r.followers, 0);
    const avgEngagement = data.length
      ? data.reduce((s, r) => s + Number(r.engagement_rate ?? 0), 0) / data.length
      : 0;
    const contacted = data.filter((r) => r.contact_status === "컨택완료").length;
    return { totalFollowers, avgEngagement, contacted };
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">인플루언서 관리 보드</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              컨택부터 계약, 업로드 성과까지 한 곳에서 관리하세요.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> 인플루언서 추가
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="총 인플루언서"
            value={nf.format(data.length)}
            sub={`컨택 완료 ${stats.contacted}명`}
          />
          <StatCard
            icon={Heart}
            label="총 팔로워"
            value={nf.format(stats.totalFollowers)}
            sub="전체 리치 합계"
          />
          <StatCard
            icon={TrendingUp}
            label="평균 참여율"
            value={`${stats.avgEngagement.toFixed(2)}%`}
            sub="(좋아요+댓글) / 팔로워"
          />
          <StatCard
            icon={Search}
            label="필터 결과"
            value={nf.format(filtered.length)}
            sub="현재 조건에 맞는 인원"
          />
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="계정, 브랜드, 플랫폼 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={contactFilter} onValueChange={setContactFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="컨택 여부" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">컨택 전체</SelectItem>
              {CONTACT_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={replyFilter} onValueChange={setReplyFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="답변 여부" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">답변 전체</SelectItem>
              {REPLY_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-[240px]">계정</TableHead>
                <TableHead>브랜드</TableHead>
                <TableHead>플랫폼</TableHead>
                <TableHead className="text-right">팔로워</TableHead>
                <TableHead className="text-right">평균 좋아요</TableHead>
                <TableHead className="text-right">평균 댓글</TableHead>
                <TableHead className="text-right">참여율</TableHead>
                <TableHead>컨택</TableHead>
                <TableHead>답변</TableHead>
                <TableHead>조건</TableHead>
                <TableHead className="text-center">계약서</TableHead>
                <TableHead className="text-center">회신</TableHead>
                <TableHead className="text-center">초안</TableHead>
                <TableHead className="text-right">조회 수</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={15} className="py-12 text-center text-muted-foreground">
                    불러오는 중...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={15} className="py-12 text-center text-muted-foreground">
                    조건에 맞는 인플루언서가 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {r.photo_url && <AvatarImage src={r.photo_url} alt={r.account} />}
                        <AvatarFallback>{r.account.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.account}</p>
                        {r.profile_url && (
                          <a
                            href={r.profile_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                          >
                            프로필 <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.brand ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.platform}</Badge>
                  </TableCell>
                  <TableCell className="tabular text-right">{nf.format(r.followers)}</TableCell>
                  <TableCell className="tabular text-right">{nf.format(r.avg_likes)}</TableCell>
                  <TableCell className="tabular text-right">{nf.format(r.avg_comments)}</TableCell>
                  <TableCell className="tabular text-right font-medium">
                    {Number(r.engagement_rate ?? 0).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusTone[r.contact_status] ?? ""}`}
                    >
                      {r.contact_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusTone[r.reply_status] ?? ""}`}
                    >
                      {r.reply_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{r.terms_status}</TableCell>
                  {(
                    [
                      ["contract_sent", r.contract_sent],
                      ["contract_returned", r.contract_returned],
                      ["content_draft", r.content_draft],
                    ] as const
                  ).map(([key, value]) => (
                    <TableCell key={key} className="text-center">
                      <Checkbox
                        checked={value}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ row: r, key, value: checked === true })
                        }
                      />
                    </TableCell>
                  ))}
                  <TableCell className="tabular text-right">
                    {r.views != null ? nf.format(r.views) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(r);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </main>

      <InfluencerFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        saving={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.account} 정보가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
