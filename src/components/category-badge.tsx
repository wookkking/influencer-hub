import { cn } from "@/lib/utils";
import { categoryStyle } from "@/lib/influencers";

type CategoryBadgeProps = {
  category: string;
  compact?: boolean;
  className?: string;
};

/** 카테고리별 색상이 적용된 시안성 높은 배지 */
export function CategoryBadge({ category, compact, className }: CategoryBadgeProps) {
  return (
    <span
      style={categoryStyle(category)}
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        compact ? "px-1.5 py-0 text-[10px] leading-3" : "px-2 py-0.5 text-[11px] leading-4",
        className,
      )}
    >
      {category}
    </span>
  );
}
