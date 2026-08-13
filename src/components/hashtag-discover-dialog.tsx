import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Radar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { discoverInfluencersByHashtag } from "@/lib/discover.functions";

type Platform = "인스타" | "틱톡" | "유튜브";
type Mode = "hashtag" | "keyword";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
};

export function HashtagDiscoverDialog({ open, onOpenChange, onDone }: Props) {
  const [platform, setPlatform] = useState<Platform>("인스타");
  const [mode, setMode] = useState<Mode>("hashtag");
  const [raw, setRaw] = useState("광고");
  const [limit, setLimit] = useState("30");
  const [maxFollowers, setMaxFollowers] = useState("10000");
  const run = useServerFn(discoverInfluencersByHashtag);

  const hashtags = raw
    .split(/[\s,#\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  const mutation = useMutation({
    mutationFn: () =>
      run({
        data: {
          platform,
          mode,
          hashtags,
          limit: Number(limit),
          maxFollowers: maxFollowers === "all" ? null : Number(maxFollowers),
        },
      }) as Promise<{
        discovered: number;
        duplicates: number;
        overLimit: number;
        created: number;
        updated: number;
        accounts: string[];
        failed: string[];
        rejectedLanguage: number;
      }>,
    onSuccess: (res) => {
      const added = res.created + res.updated;
      if (added > 0) {
        toast.success(
          `자동 탐색 완료 · 발견 ${res.discovered}명, 신규 ${res.created}명, 갱신 ${res.updated}명 (중복 제외 ${res.duplicates}명)`,
        );
      } else {
        toast.warning(
          `추가된 계정이 없습니다 · 중복 ${res.duplicates}명, 팔로워 초과 ${res.overLimit}명, 한국어 확인 불가 ${res.rejectedLanguage}명`,
        );
      }
      onDone();
    },
    onError: (e: Error) => toast.error(e.message || "자동 탐색에 실패했습니다."),
  });


  return (
    <Dialog open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>자동 탐색</DialogTitle>
          <DialogDescription>
            {mode === "hashtag"
              ? "#광고 처럼 해시태그를 입력하면 해당 게시물 작성자를 훑어 계정 정보를 정리합니다."
              : "\u201c광고\u201d 처럼 검색어를 입력하면 해당 키워드로 검색되는 계정을 훑어 정보를 정리합니다."}{" "}
            수집된 계정은 인플루언서 탐색 목록에 자동 추가되며, 중복 계정은 제외됩니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
          <TabsList className="w-full">
            {(["인스타", "틱톡", "유튜브"] as Platform[]).map((p) => (
              <TabsTrigger key={p} value={p} className="flex-1" disabled={mutation.isPending}>
                {p}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="hashtag" className="flex-1" disabled={mutation.isPending}>
              해시태그
            </TabsTrigger>
            <TabsTrigger value="keyword" className="flex-1" disabled={mutation.isPending}>
              검색 키워드
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="tags">
            {mode === "hashtag" ? "해시태그 (최대 5개)" : "검색 키워드 (최대 5개)"}
          </Label>
          <Input
            id="tags"
            value={raw}
            placeholder="광고, 협찬, 내돈내산"
            onChange={(e) => setRaw(e.target.value)}
            disabled={mutation.isPending}
          />
          <p className="text-xs text-muted-foreground">
            인식됨:{" "}
            {hashtags.map((t) => (mode === "hashtag" ? `#${t}` : t)).join(", ") || "없음"}
          </p>
        </div>

        <div className="space-y-2">
          <Label>수집할 계정 수</Label>
          <Select value={limit} onValueChange={setLimit} disabled={mutation.isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["10", "30", "50", "100"].map((n) => (
                <SelectItem key={n} value={n}>
                  {n}명
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            계정 수가 많을수록 수집에 몇 분까지 걸릴 수 있습니다.
          </p>
        </div>

        <div className="space-y-2">
          <Label>팔로워 상한</Label>
          <Select
            value={maxFollowers}
            onValueChange={setMaxFollowers}
            disabled={mutation.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5000">5천명 이하 (나노)</SelectItem>
              <SelectItem value="10000">1만명 이하 (마이크로)</SelectItem>
              <SelectItem value="50000">5만명 이하</SelectItem>
              <SelectItem value="100000">10만명 이하</SelectItem>
              <SelectItem value="all">제한 없음</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            상한을 두면 팔로워가 적은 계정부터 우선 수집합니다. 이미 등록된 계정은 자동으로
            제외됩니다.
          </p>
        </div>

        {mutation.data && (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
            <p className="font-medium text-foreground">
              발견 {mutation.data.discovered}명 · 신규 {mutation.data.created}명 · 갱신{" "}
              {mutation.data.updated}명 · 중복 제외 {mutation.data.duplicates}명
              {mutation.data.overLimit ? ` · 팔로워 초과 ${mutation.data.overLimit}명` : ""}
              {mutation.data.rejectedLanguage
                ? ` · 한국어 확인 불가 ${mutation.data.rejectedLanguage}명`
                : ""}
              {mutation.data.failed.length ? ` · 실패 ${mutation.data.failed.length}명` : ""}
            </p>
            {mutation.data.accounts.length > 0 && (
              <p className="mt-1 line-clamp-3 text-muted-foreground">
                {mutation.data.accounts.join(", ")}
              </p>
            )}
          </div>
        )}


        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            닫기
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || hashtags.length === 0}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> 탐색 중…
              </>
            ) : (
              <>
                <Radar className="size-4" /> 자동 탐색 시작
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
