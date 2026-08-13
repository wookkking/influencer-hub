import { Instagram, Youtube, Music2, PenLine, type LucideIcon } from "lucide-react";

export type PlatformMeta = {
  label: string;
  icon: LucideIcon;
  /** 배지 색상 (라이트/다크 공통 토큰 기반이 아닌 브랜드 색은 최소한으로 사용) */
  badge: string;
  dot: string;
  ring: string;
};

const DEFAULT: PlatformMeta = {
  label: "기타",
  icon: PenLine,
  badge: "bg-muted text-muted-foreground border-border",
  dot: "bg-muted-foreground",
  ring: "ring-border",
};

export const PLATFORM_META: Record<string, PlatformMeta> = {
  인스타: {
    label: "인스타",
    icon: Instagram,
    badge: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
    dot: "bg-pink-500",
    ring: "ring-pink-500/40",
  },
  유튜브: {
    label: "유튜브",
    icon: Youtube,
    badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    ring: "ring-red-500/40",
  },
  틱톡: {
    label: "틱톡",
    icon: Music2,
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
    dot: "bg-cyan-500",
    ring: "ring-cyan-500/40",
  },
  블로그: {
    label: "블로그",
    icon: PenLine,
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/40",
  },
};

export function platformMeta(platform: string | null | undefined): PlatformMeta {
  if (!platform) return DEFAULT;
  return PLATFORM_META[platform] ?? { ...DEFAULT, label: platform };
}
