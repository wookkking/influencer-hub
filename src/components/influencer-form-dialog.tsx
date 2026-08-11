import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORIES,
  PLATFORMS,
  influencerSchema,
  toInfluencerForm,
  type Influencer,
  type InfluencerFormValues,
} from "@/lib/influencers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: Influencer | null;
  onSubmit: (values: InfluencerFormValues) => Promise<void>;
};

export function InfluencerFormDialog({ open, onOpenChange, row, onSubmit }: Props) {
  const form = useForm<InfluencerFormValues>({
    resolver: zodResolver(influencerSchema),
    defaultValues: toInfluencerForm(row),
  });

  useEffect(() => {
    if (open) form.reset(toInfluencerForm(row));
  }, [open, row, form]);

  const categories = form.watch("categories");

  function toggleCategory(cat: string) {
    const next = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat];
    form.setValue("categories", next, { shouldDirty: true });
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다");
    }
  });

  const err = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row ? "인플루언서 수정" : "인플루언서 등록"}</DialogTitle>
          <DialogDescription>
            공용 디렉터리에 노출되는 프로필 정보입니다. 캠페인 진행 상황은 내 리스트에서 관리해요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="account">계정 *</Label>
              <Input id="account" placeholder="예: sojuhanjan" {...form.register("account")} />
              {err.account && (
                <p className="text-xs text-destructive">{err.account.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>플랫폼</Label>
              <Select
                value={form.watch("platform")}
                onValueChange={(v) =>
                  form.setValue("platform", v as InfluencerFormValues["platform"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">

              <Label htmlFor="last_post_date">최근 업로드일</Label>
              <Input id="last_post_date" type="date" {...form.register("last_post_date")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bio">한 줄 소개</Label>
              <Textarea id="bio" rows={2} {...form.register("bio")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="photo_url">프로필 이미지 URL</Label>
              <Input id="photo_url" {...form.register("photo_url")} />
              {err.photo_url && (
                <p className="text-xs text-destructive">{err.photo_url.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile_url">프로필 링크</Label>
              <Input id="profile_url" {...form.register("profile_url")} />
              {err.profile_url && (
                <p className="text-xs text-destructive">{err.profile_url.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const active = categories.includes(cat);
                return (
                  <Badge
                    key={cat}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer select-none px-2.5 py-1 text-xs font-medium"
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="followers">팔로워</Label>
              <Input id="followers" type="number" {...form.register("followers")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avg_likes">평균 좋아요</Label>
              <Input id="avg_likes" type="number" {...form.register("avg_likes")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avg_comments">평균 댓글</Label>
              <Input id="avg_comments" type="number" {...form.register("avg_comments")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
