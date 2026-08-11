import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "이용약관 · 리치보드" },
      {
        name: "description",
        content:
          "리치보드 서비스 이용 조건, 회원 계정과 관리자 권한, 인플루언서 데이터 이용 시 준수사항을 안내합니다.",
      },
      { property: "og:title", content: "이용약관 · 리치보드" },
      {
        property: "og:description",
        content: "리치보드 서비스 이용 조건과 데이터 이용 시 준수사항.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">이용약관</h1>
        <p className="text-sm text-muted-foreground">최종 개정일: 2026-08-11 (버전 v1)</p>
      </header>

      <Section title="제1조 (목적)">
        <p>
          본 약관은 리치보드(이하 &quot;서비스&quot;)가 제공하는 인플루언서 검색 및 캠페인 관리
          기능의 이용 조건과 절차, 회원과 운영자의 권리·의무를 규정합니다.
        </p>
      </Section>

      <Section title="제2조 (계정과 권한)">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원은 정확한 정보로 가입해야 하며, 계정을 타인과 공유할 수 없습니다.</li>
          <li>
            계정은 <strong>일반</strong>과 <strong>관리자</strong> 권한으로 구분됩니다. 관리자는
            인플루언서 디렉터리 등록·수정·삭제, 회원 목록 확인, 권한 부여·회수를 할 수 있습니다.
          </li>
          <li>운영자는 약관 위반 시 계정 이용을 정지하거나 해지할 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="제3조 (인플루언서 데이터 이용 시 준수사항)">
        <p>회원은 서비스에서 열람한 공개 프로필 정보를 이용할 때 다음을 준수해야 합니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>광고·협업 제안 등 정당한 마케팅 목적 외 이용 금지</li>
          <li>데이터의 재판매, 대량 배포, 외부 데이터베이스 구축 금지</li>
          <li>수신 거부 의사를 밝힌 인플루언서에 대한 반복 연락 금지</li>
          <li>스팸 발송, 사칭, 허위 제안 등 불법·부정 행위 금지</li>
          <li>협업 진행 시 광고 표시 등 관련 법령(표시광고법·심사지침) 준수</li>
        </ul>
        <p>
          위반으로 발생한 법적 책임은 해당 회원에게 있으며, 운영자는 위반 계정의 이용을 제한할 수
          있습니다.
        </p>
      </Section>

      <Section title="제4조 (서비스 제공과 면책)">
        <p>
          서비스가 표시하는 팔로워 수·반응률 등 수치는 공개 데이터를 기반으로 한 참고 정보이며
          정확성을 보증하지 않습니다. 운영자는 데이터의 오류나 플랫폼 정책 변경으로 인한 손해에 대해
          고의·중과실이 없는 한 책임지지 않습니다.
        </p>
      </Section>

      <Section title="제5조 (개인정보)">
        <p>
          개인정보의 수집·이용에 관한 사항은{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-4">
            개인정보 처리방침
          </Link>
          을 따릅니다.
        </p>
      </Section>
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
