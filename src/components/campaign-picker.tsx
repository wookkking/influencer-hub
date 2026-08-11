import { Check, FolderPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { colorClass, type Campaign } from "@/lib/campaigns";

type Props = {
  campaigns: Campaign[];
  selectedIds: string[];
  onToggle: (campaignId: string, next: boolean) => void;
};

export function CampaignPicker({ campaigns, selectedIds, onToggle }: Props) {
  const selected = campaigns.filter((c) => selectedIds.includes(c.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-8 w-[170px] flex-wrap items-center gap-1 rounded-md border border-input px-2 py-1 text-left text-xs hover:bg-accent"
          aria-label="캠페인 그룹 선택"
        >
          {selected.length === 0 ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <FolderPlus className="size-3.5" /> 그룹 지정
            </span>
          ) : (
            selected.map((c) => (
              <Badge
                key={c.id}
                variant="outline"
                className={cn("text-[11px] font-normal", colorClass[c.color] ?? colorClass['default'])}
              >
                {c.name}
              </Badge>
            ))
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {campaigns.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">
            먼저 위에서 캠페인을 만들어 주세요.
          </p>
        ) : (
          campaigns.map((c) => {
            const active = selectedIds.includes(c.id);
            return (
              <Button
                key={c.id}
                variant="ghost"
                className="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
                onClick={() => onToggle(c.id, !active)}
              >
                <Check className={cn("size-3.5", active ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{c.name}</span>
              </Button>
            );
          })
        )}
      </PopoverContent>
    </Popover>
  );
}
