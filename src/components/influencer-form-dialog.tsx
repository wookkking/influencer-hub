import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTACT_STATUS,
  PLATFORMS,
  REPLY_STATUS,
  TERMS_STATUS,
  influencerSchema,
  toFormValues,
  type Influencer,
  type InfluencerFormValues,
} from "@/lib/influencers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Influencer | null;
  onSubmit: (values: InfluencerFormValues) => Promise<void>;
  saving: boolean;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function InfluencerFormDialog({ open, onOpenChange, editing, onSubmit, saving }: Props) {
  const form = useForm<InfluencerFormValues>({
    resolver: zodResolver(influencerSchema),
    defaultValues: toFormValues(editing),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(editing));
  }, [open, editing, form]);

  const { register, handleSubmit, setValue, watch, formState } = form;
  const v = watch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "인플루언서 수정" : "인플루언서 추가"}</DialogTitle>
          <DialogDescription>
            기본 정보와 진행 상태, 성과 지표를 입력하세요. 참여율은 자동으로 계산됩니다.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
        >
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">리스트</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="브랜드">
                <Input {...register("brand")} placeholder="셀팅청담" />
              </Field>
              <Field label="플랫폼">
                <Select
                  value={v.platform}
                  onValueChange={(val) =>
                    setValue("platform", val as InfluencerFormValues["platform"])
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
              </Field>
              <Field label="계정 *">
                <Input {...register("account")} placeholder="hee.ya____" />
                {formState.errors.account && (
                  <p className="text-xs text-destructive">{formState.errors.account.message}</p>
                )}
              </Field>
              <Field label="프로필 URL">
                <Input {...register("profile_url")} placeholder="https://www.instagram.com/..." />
                {formState.errors.profile_url && (
                  <p className="text-xs text-destructive">{formState.errors.profile_url.message}</p>
                )}
              </Field>
              <Field label="사진 URL">
                <Input {...register("photo_url")} placeholder="https://..." />
              </Field>
              <Field label="팔로워 수">
                <Input type="number" {...register("followers")} />
              </Field>
              <Field label="평균 좋아요">
                <Input type="number" {...register("avg_likes")} />
              </Field>
              <Field label="평균 댓글">
                <Input type="number" {...register("avg_comments")} />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">관리</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="컨택 여부">
                <Select
                  value={v.contact_status}
                  onValueChange={(val) =>
                    setValue("contact_status", val as InfluencerFormValues["contact_status"])
                  }
                >
                  <SelectTrigger>
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
              </Field>
              <Field label="컨택 날짜">
                <Input type="date" {...register("contact_date")} />
              </Field>
              <Field label="답변 여부">
                <Select
                  value={v.reply_status}
                  onValueChange={(val) =>
                    setValue("reply_status", val as InfluencerFormValues["reply_status"])
                  }
                >
                  <SelectTrigger>
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
              </Field>
              <Field label="답변 날짜">
                <Input type="date" {...register("reply_date")} />
              </Field>
              <Field label="조건 협의">
                <Select
                  value={v.terms_status}
                  onValueChange={(val) =>
                    setValue("terms_status", val as InfluencerFormValues["terms_status"])
                  }
                >
                  <SelectTrigger>
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
              </Field>
              <Field label="업로드 날짜">
                <Input type="date" {...register("upload_date")} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6 rounded-md border border-border bg-muted/40 p-3">
              {(
                [
                  ["contract_sent", "계약서 발송"],
                  ["contract_returned", "계약서 회신"],
                  ["content_draft", "컨텐츠 초안"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={v[key]}
                    onCheckedChange={(checked) => setValue(key, checked === true)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">성과</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="업로드 링크">
                <Input {...register("upload_link")} placeholder="https://..." />
              </Field>
              <Field label="조회 수">
                <Input type="number" {...register("views")} />
              </Field>
              <Field label="좋아요 수">
                <Input type="number" {...register("result_likes")} />
              </Field>
              <Field label="댓글 수">
                <Input type="number" {...register("result_comments")} />
              </Field>
            </div>
            <Field label="메모">
              <Textarea rows={2} {...register("memo")} />
            </Field>
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
