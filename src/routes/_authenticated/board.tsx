import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  TERMS_STATUS,
  engagement,
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

function BoardPage() {
  const queryClient = useQueryClient();
  const saved = useQuery({ queryKey: ["saved"], queryFn: fetchSaved });
  const rows = saved.data ?? [];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">내 캠페인</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          저장한 인플루언서의 진행 상황을 관리합니다. 변경 사항은 즉시 저장돼요.
        </p>
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
          아직 저장한 인플루언서가 없습니다. 탐색 화면에서 북마크를 눌러 추가해 보세요.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {[
                  "인플루언서",
                  "팔로워/참여율",
                  "컨택",
                  "답변",
                  "조건",
                  "계약",
                  "업로드",
                  "성과",
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
                      {row.influencer?.photo_url ? (
                        <img
                          src={row.influencer.photo_url}
                          alt={`${row.influencer.account} 프로필 사진`}
                          loading="lazy"
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold">
                          {row.influencer?.account.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.influencer?.account}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.influencer?.brand ?? row.influencer?.platform}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <p className="tabular">{nf.format(row.influencer?.followers ?? 0)}</p>
                    <Badge variant="outline" className="mt-0.5 text-[11px]">
                      {row.influencer ? engagement(row.influencer).toFixed(2) : "0.00"}%
                    </Badge>
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
                    <Input
                      type="number"
                      placeholder="조회수"
                      className="h-8 w-[100px]"
                      defaultValue={row.views ?? ""}
                      onBlur={(e) =>
                        patch(row.id, {
                          views: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
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
