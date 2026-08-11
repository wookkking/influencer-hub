import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { useSessionUser } from "@/hooks/use-session-user";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  acceptRequiredTerms,
  fetchMyProfile,
  logConsent,
  updateMyProfile,
} from "@/lib/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "계정 설정 · 리치보드" },
      {
        name: "description",
        content: "리치보드 계정의 표시 이름, 약관 동의 상태와 마케팅 수신 설정을 관리하세요.",
      },
      { property: "og:title", content: "계정 설정 · 리치보드" },
      { property: "og:description", content: "계정 정보와 동의 내역을 관리합니다." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useSessionUser();
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: () => fetchMyProfile(user!.id),
  });

  useEffect(() => {
    if (profile?.display_name != null) setName(profile.display_name);
  }, [profile?.display_name]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["my-profile", user?.id] });

  const saveName = useMutation({
    mutationFn: () => updateMyProfile(user!.id, { display_name: name.trim() || null }),
    onSuccess: () => {
      toast.success("저장했습니다");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMarketing = useMutation({
    mutationFn: async (value: boolean) => {
      await updateMyProfile(user!.id, { marketing_opt_in: value });
      await logConsent(user!.id, "marketing", value);
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: () => acceptRequiredTerms(user!.id),
    onSuccess: () => {
      toast.success("동의가 기록되었습니다");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const agreed = !!profile?.terms_accepted_at && !!profile?.privacy_accepted_at;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">계정 설정</h1>
        <p className="text-sm text-muted-foreground">
          계정 정보와 동의 내역을 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
          <CardDescription>표시 이름은 팀 내에서 나를 구분하는 데 사용됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>이메일</Label>
            <Input value={profile?.email ?? user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="display-name">표시 이름</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="이름 또는 닉네임"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => saveName.mutate()} disabled={saveName.isPending}>
              저장
            </Button>
            <Badge variant={isAdmin ? "default" : "secondary"} className="gap-1">
              <ShieldCheck className="size-3" />
              {isAdmin ? "관리자" : "일반 사용자"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">약관 및 개인정보 동의</CardTitle>
          <CardDescription>
            서비스 이용을 위해 필수 약관에 동의해야 하며, 동의 이력은 증빙을 위해 기록됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-medium">필수 약관 (이용약관 · 개인정보 처리방침)</p>
              <p className="text-muted-foreground">
                {agreed
                  ? `동의 완료 · ${new Date(profile!.terms_accepted_at!).toLocaleString("ko-KR")}`
                  : "아직 동의 기록이 없습니다."}
              </p>
            </div>
            {agreed ? (
              <Badge variant="secondary">동의됨</Badge>
            ) : (
              <Button size="sm" onClick={() => accept.mutate()} disabled={accept.isPending}>
                동의하기
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-medium">마케팅 정보 수신 (선택)</p>
              <p className="text-muted-foreground">신규 기능·이벤트 소식을 이메일로 받습니다.</p>
            </div>
            <Switch
              checked={!!profile?.marketing_opt_in}
              onCheckedChange={(v) => toggleMarketing.mutate(v)}
            />
          </div>

          <Separator />

          <div className="flex flex-wrap gap-4 text-xs">
            <Link to="/terms" className="text-primary underline underline-offset-4">
              이용약관
            </Link>
            <Link to="/privacy" className="text-primary underline underline-offset-4">
              개인정보 처리방침
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">데이터 수집 안내</CardTitle>
          <CardDescription>
            본 서비스는 공개된 인스타그램 프로필 정보만 수집합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            비공개 계정과 개인 연락처는 수집하지 않으며, 수집된 정보는 광고·협업 제안 검토 목적으로만
            사용할 수 있습니다. 인플루언서 본인의 삭제 요청 시 지체 없이 삭제합니다.
          </p>
          <p>
            회원은 데이터를 재판매하거나 스팸 발송에 사용할 수 없습니다. 자세한 내용은{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-4">
              개인정보 처리방침
            </Link>
            을 확인하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
