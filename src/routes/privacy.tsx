import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "개인정보 처리방침 · 리치보드" },
      {
        name: "description",
        content:
          "리치보드가 수집하는 회원 정보와 공개된 인스타그램 프로필 정보의 처리 목적, 보관 기간, 이용자 권리를 안내합니다.",
      },
      { property: "og:title", content: "개인정보 처리방침 · 리치보드" },
      {
        property: "og:description",
        content: "리치보드의 개인정보 수집·이용·보관 및 이용자 권리 안내.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">개인정보 처리방침</h1>
        <p className="text-sm text-muted-foreground">최종 개정일: 2026-08-11 (버전 v1)</p>
      </header>

      <Section title="1. 수집하는 개인정보 항목">
        <p>리치보드(이하 &quot;서비스&quot;)는 아래 정보를 수집합니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>회원 정보(필수)</strong>: 이메일 주소, 표시 이름, 소셜 로그인 시 제공되는 계정
            식별자, 가입·접속 일시
          </li>
          <li>
            <strong>선택 정보</strong>: 마케팅 정보 수신 동의 여부
          </li>
          <li>
            <strong>서비스 이용 기록</strong>: 저장한 인플루언서 목록, 캠페인 메모, 성과 입력값
          </li>
          <li>
            <strong>인플루언서 공개 정보</strong>: 인스타그램 등에서 <em>공개된</em> 계정명,
            프로필 사진, 소개글, 팔로워 수, 게시물 반응 수치
          </li>
        </ul>
      </Section>

      <Section title="2. 인플루언서 공개 정보 수집의 법적 근거">
        <p>
          서비스는 인스타그램 등 공개 플랫폼에서 <strong>누구나 열람 가능한 공개 프로필 정보</strong>
          만을, 마케팅 파트너 발굴이라는 정당한 이익(개인정보 보호법 제15조 제1항 제6호)에 근거해
          수집·이용합니다. 다음 원칙을 지킵니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>비공개 계정, 로그인해야 볼 수 있는 정보, 개인 연락처(휴대전화·주소)는 수집하지 않습니다.</li>
          <li>민감정보(사상·건강·성생활 등)와 고유식별정보는 수집하지 않습니다.</li>
          <li>수집 목적은 광고·협업 제안 검토에 한정하며, 제3자에게 판매하지 않습니다.</li>
          <li>
            해당 인플루언서가 삭제·비공개를 요청하면 지체 없이(영업일 기준 7일 이내) 삭제하고,
            재수집되지 않도록 처리합니다. 요청 창구는 아래 &quot;문의&quot;를 참고하세요.
          </li>
          <li>각 플랫폼의 이용약관 및 robots 정책을 준수하며, 과도한 자동 수집을 하지 않습니다.</li>
        </ul>
      </Section>

      <Section title="3. 이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 식별, 로그인, 권한(관리자/일반) 관리</li>
          <li>인플루언서 검색·저장·캠페인 성과 관리 기능 제공</li>
          <li>서비스 개선 및 부정 이용 방지</li>
          <li>동의한 경우에 한한 마케팅 정보 발송</li>
        </ul>
      </Section>

      <Section title="4. 보관 및 파기">
        <p>
          회원 정보는 회원 탈퇴 시 즉시 파기합니다. 관계 법령에 따라 보존이 필요한 기록(전자상거래법
          등)은 해당 기간 동안만 분리 보관합니다. 동의 이력은 증빙을 위해 탈퇴 후 3년간 보관 후
          파기합니다. 인플루언서 공개 정보는 삭제 요청 시 또는 최종 갱신일로부터 2년이 지나면
          파기합니다.
        </p>
      </Section>

      <Section title="5. 접근 권한">
        <p>
          일반 회원은 본인이 저장한 데이터만 조회·수정할 수 있습니다. 관리자 권한 계정은 회원 목록과
          이메일, 가입일, 동의 이력을 확인하고 권한을 부여·회수할 수 있으며, 다른 회원의 캠페인
          내용·메모는 열람할 수 없습니다. 관리자 권한은 최소한의 인원에게만 부여합니다.
        </p>
      </Section>

      <Section title="6. 이용자 권리">
        <p>
          이용자는 언제든지 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 계정 설정 화면에서
          직접 정보를 수정하거나 탈퇴를 요청할 수 있습니다. 인플루언서 본인 역시 자신의 정보 삭제를
          요청할 수 있습니다.
        </p>
      </Section>

      <Section title="7. 문의">
        <p>
          개인정보 관련 문의 및 삭제 요청은 서비스 운영자 이메일로 접수합니다. 운영자는 요청 접수 후
          지체 없이 처리 결과를 회신합니다.
        </p>
      </Section>

      <p className="text-sm">
        <Link to="/terms" className="text-primary underline underline-offset-4">
          이용약관 보기
        </Link>
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
