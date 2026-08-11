import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";

import { useSessionUser } from "@/hooks/use-session-user";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { fetchManagedUsers, setAdmin, setSuspended } from "@/lib/accounts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "사용자 관리 · 리치보드" },
      {
        name: "description",
        content: "관리자 권한 부여·회수와 회원 계정 상태를 관리하는 리치보드 관리자 화면입니다.",
      },
      { property: "og:title", content: "사용자 관리 · 리치보드" },
      { property: "og:description", content: "회원 계정과 관리자 권한을 관리합니다." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user } = useSessionUser();
  const { isAdmin, loading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["managed-users"],
    enabled: isAdmin,
    queryFn: fetchManagedUsers,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["managed-users"] });

  const roleMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setAdmin(id, value),
    onSuccess: () => {
      toast.success("권한을 변경했습니다");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setSuspended(id, value),
    onSuccess: () => {
      toast.success("계정 상태를 변경했습니다");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(term) ||
        (u.display_name ?? "").toLowerCase().includes(term),
    );
  }, [users, q]);

  if (loading) return null;

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">접근 권한이 없습니다</CardTitle>
          <CardDescription>관리자 권한이 있는 계정만 이 화면을 볼 수 있습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">사용자 관리</h1>
        <p className="text-sm text-muted-foreground">
          관리자 권한을 부여·회수하고 계정 이용을 제한할 수 있습니다. 회원의 캠페인 내용과 메모는
          열람할 수 없습니다.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="이메일 또는 이름 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>약관 동의</TableHead>
                <TableHead>마케팅</TableHead>
                <TableHead>관리자</TableHead>
                <TableHead className="text-right">계정</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    불러오는 중…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    사용자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id} className={u.suspended ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {u.display_name || "이름 없음"}
                          {u.id === user?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(나)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      {u.terms_accepted_at ? (
                        <Badge variant="secondary">동의</Badge>
                      ) : (
                        <Badge variant="outline">미동의</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.marketing_opt_in ? "수신" : "미수신"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.isAdmin}
                          disabled={roleMutation.isPending}
                          onCheckedChange={(v) => roleMutation.mutate({ id: u.id, value: v })}
                        />
                        {u.isAdmin ? (
                          <ShieldCheck className="size-4 text-primary" />
                        ) : (
                          <ShieldOff className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={u.suspended ? "outline" : "ghost"}
                        size="sm"
                        disabled={u.id === user?.id || suspendMutation.isPending}
                        onClick={() =>
                          suspendMutation.mutate({ id: u.id, value: !u.suspended })
                        }
                      >
                        {u.suspended ? "정지 해제" : "이용 정지"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        관리자는 회원의 이메일·가입일·동의 이력 등 계정 관리에 필요한 최소한의 정보만 열람합니다.
        열람한 정보를 관리 목적 외로 이용하거나 외부에 제공하는 것은 개인정보 보호법 위반입니다.
      </p>
    </div>
  );
}
