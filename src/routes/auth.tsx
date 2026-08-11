import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const next = typeof s['next'] === "string" ? s['next'] : "";
    return next.startsWith("/") && !next.startsWith("//") ? { next } : {};
  },
  head: () => ({
    meta: [
      { title: "로그인 · 리치보드 인플루언서 검색" },
      {
        name: "description",
        content:
          "리치보드에 로그인하고 인스타그램 인플루언서를 검색해 나만의 캠페인 리스트를 관리하세요.",
      },
      { property: "og:title", content: "로그인 · 리치보드" },
      {
        property: "og:description",
        content: "인플루언서 검색부터 캠페인 관리까지, 리치보드에서 시작하세요.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const returnTo = next
    ? new URL(next, window.location.origin).toString()
    : window.location.origin;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        if (next) window.location.replace(next);
        else navigate({ to: "/search", replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        if (next) window.location.replace(next);
        else navigate({ to: "/search", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("로그인 실패: 이메일 또는 비밀번호를 확인하세요");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: returnTo },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else setSent(true);
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: returnTo,
    });
    if (result.error) toast.error("구글 로그인에 실패했습니다");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Sparkles className="size-4" />
          </span>
          <span className="text-base font-semibold">리치보드</span>
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            브랜드에 맞는 인플루언서를
            <br />
            찾고, 저장하고, 관리하세요
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/75">
            팔로워·참여율·카테고리로 검색하고, 마음에 드는 계정을 내 캠페인 리스트에 담아 컨택부터
            업로드 성과까지 한 곳에서 추적할 수 있어요.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© 리치보드</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">시작하기</h2>
            <p className="text-sm text-muted-foreground">
              이메일 또는 구글 계정으로 로그인하세요.
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={google}>
            구글로 계속하기
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            또는
            <span className="h-px flex-1 bg-border" />
          </div>

          {sent ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">{email}</strong> 으로 확인 메일을 보냈어요.
              메일의 링크를 눌러 가입을 완료해 주세요.
            </div>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">로그인</TabsTrigger>
                <TabsTrigger value="signup">회원가입</TabsTrigger>
              </TabsList>

              {(["signin", "signup"] as const).map((mode) => (
                <TabsContent key={mode} value={mode} className="pt-4">
                  <form
                    onSubmit={mode === "signin" ? signIn : signUp}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`${mode}-email`}>이메일</Label>
                      <Input
                        id={`${mode}-email`}
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${mode}-password`}>비밀번호</Label>
                      <Input
                        id={`${mode}-password`}
                        type="password"
                        required
                        minLength={6}
                        autoComplete={
                          mode === "signin" ? "current-password" : "new-password"
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {mode === "signin" ? "로그인" : "가입하기"}
                    </Button>
                  </form>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
