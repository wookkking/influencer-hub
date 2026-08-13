import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { importSocialProfiles } from "@/lib/social.functions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
};

type Platform = "인스타" | "틱톡" | "유튜브";

const HINTS: Record<Platform, { placeholder: string; help: string }> = {
  인스타: {
    placeholder: "nasa\n@natgeo\nhttps://www.instagram.com/lovable",
    help: "최근 릴스 9개(고정 게시물 제외) 기준으로 평균 지표를 계산합니다.",
  },
  틱톡: {
    placeholder: "@charlidamelio\nhttps://www.tiktok.com/@khaby.lame",
    help: "최근 영상 9개(고정 게시물 제외) 기준으로 평균 지표를 계산합니다.",
  },
  유튜브: {
    placeholder: "@MrBeast\nhttps://www.youtube.com/@ChannelName",
    help: "최근 쇼츠 9개 기준으로 평균 지표를 계산합니다.",
  },
};

export function InstagramImportDialog({ open, onOpenChange, onDone }: Props) {
  const [raw, setRaw] = useState("");
  const [platform, setPlatform] = useState<Platform>("인스타");
  const runImport = useServerFn(importSocialProfiles);

  const mutation = useMutation({
    mutationFn: async (handles: string[]) => runImport({ data: { platform, handles } }),
    onSuccess: (res) => {
      const created = res.results.filter((r) => r.action === "created").length;
      const updated = res.results.filter((r) => r.action === "updated").length;
      toast.success(`가져오기 완료 · 신규 ${created}명, 갱신 ${updated}명`);
      if (res.notFound.length) {
        toast.warning(`찾지 못한 계정: ${res.notFound.join(", ")}`);
      }
      setRaw("");
      onOpenChange(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message || "가져오기에 실패했습니다."),
  });

  const handles = raw
    .split(/[\s,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>SNS에서 가져오기</DialogTitle>
          <DialogDescription>
            플랫폼을 고르고 계정 ID나 프로필 링크를 줄바꿈 또는 쉼표로 구분해 입력하세요. 최대
            20개까지 한 번에 수집합니다. (팔로워·평균 조회수·좋아요·댓글·프로필 사진·소개글 자동
            저장)
          </DialogDescription>
        </DialogHeader>

        <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
          <TabsList className="w-full">
            <TabsTrigger value="인스타" className="flex-1" disabled={mutation.isPending}>
              인스타
            </TabsTrigger>
            <TabsTrigger value="틱톡" className="flex-1" disabled={mutation.isPending}>
              틱톡
            </TabsTrigger>
            <TabsTrigger value="유튜브" className="flex-1" disabled={mutation.isPending}>
              유튜브
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="sns-handles">계정 목록</Label>
          <Textarea
            id="sns-handles"
            rows={6}
            placeholder={HINTS[platform].placeholder}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            disabled={mutation.isPending}
          />
          <p className="text-xs text-muted-foreground">
            {handles.length}개 계정 인식됨 · {HINTS[platform].help}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={() => mutation.mutate(handles.slice(0, 20))}
            disabled={mutation.isPending || handles.length === 0}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> 수집 중…
              </>
            ) : (
              <>
                <Download className="size-4" /> 가져오기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
