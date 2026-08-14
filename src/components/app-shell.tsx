import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Compass, ClipboardList, LogOut, Settings, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/use-session-user";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useHydrated } from "@/hooks/use-hydrated";
import { acceptRequiredTerms, fetchMyProfile } from "@/lib/accounts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/search", label: "인플루언서 탐색", icon: Compass },
  { to: "/board", label: "내 캠페인", icon: ClipboardList },
  { to: "/settings", label: "계정 설정", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useSessionUser();
  const { isAdmin } = useIsAdmin();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: () => fetchMyProfile(user!.id),
  });

  const accept = useMutation({
    mutationFn: () => acceptRequiredTerms(user!.id),
    onSuccess: () => {
      toast.success("동의가 기록되었습니다");
      void queryClient.invalidateQueries({ queryKey: ["my-profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const needsConsent = !!profile && (!profile.terms_accepted_at || !profile.privacy_accepted_at);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link to="/search" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">리치보드</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin/users"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Shield className="size-4" />
                <span className="hidden sm:inline">사용자 관리</span>
              </Link>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground md:inline">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>

      {needsConsent && hydrated && (
        <div className="border-b border-border bg-muted/50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 text-sm sm:px-6">
            <p className="text-muted-foreground">
              서비스 이용을 위해{" "}
              <Link to="/terms" className="text-primary underline underline-offset-4">
                이용약관
              </Link>
              과{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-4">
                개인정보 처리방침
              </Link>
              에 동의해 주세요.
            </p>
            <Button size="sm" className="ml-auto" onClick={() => accept.mutate()} disabled={accept.isPending}>
              동의하기
            </Button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
