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
import { importInstagramProfiles } from "@/lib/instagram.functions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
};

export function InstagramImportDialog({ open, onOpenChange, onDone }: Props) {
  const [raw, setRaw] = useState("");
  const runImport = useServerFn(importInstagramProfiles);

  const mutation = useMutation({
    mutationFn: async (handles: string[]) => runImport({ data: { handles } }),
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
          <DialogTitle>인스타그램에서 가져오기</DialogTitle>
          <DialogDescription>
            계정 ID나 프로필 링크를 줄바꿈 또는 쉼표로 구분해 입력하세요. 최대 20개까지 한 번에
            수집합니다. (팔로워·평균 좋아요·댓글·프로필 사진·소개글 자동 저장)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="ig-handles">계정 목록</Label>
          <Textarea
            id="ig-handles"
            rows={6}
            placeholder={"nasa\n@natgeo\nhttps://www.instagram.com/lovable"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            disabled={mutation.isPending}
          />
          <p className="text-xs text-muted-foreground">{handles.length}개 계정 인식됨</p>
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
