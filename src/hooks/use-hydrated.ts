import { useEffect, useState } from "react";

/** 클라이언트 하이드레이션 완료 후 true를 반환 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
