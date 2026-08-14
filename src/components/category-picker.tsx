import { useState } from "react";
import { Check, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CATEGORIES, categoryStyle } from "@/lib/influencers";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** 트리거를 아이콘 버튼으로 표시 */
  compact?: boolean;
  className?: string;
};

/** 카테고리를 배지 클릭만으로 빠르게 지정하는 선택기 */
export function CategoryPicker({ value, onChange, disabled, compact, className }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (cat: string) =>
    onChange(value.includes(cat) ? value.filter((c) => c !== cat) : [...value, cat]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size={compact ? "icon" : "sm"}
          variant="outline"
          disabled={disabled}
          aria-label="카테고리 설정"
          className={cn(compact ? "size-8 shrink-0" : "h-7 gap-1 text-xs", className)}
          onClick={(e) => e.stopPropagation()}
        >
          <Tag className={compact ? "size-4" : "size-3.5"} />
          {!compact && (value.length ? `카테고리 ${value.length}` : "카테고리")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground">카테고리 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = value.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                style={active ? categoryStyle(cat) : undefined}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-transparent"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
                onClick={() => toggle(cat)}
              >
                {active && <Check className="size-3" />}
                {cat}
              </button>
            );
          })}
        </div>
        {value.length > 0 && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => onChange([])}
          >
            모두 해제
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
