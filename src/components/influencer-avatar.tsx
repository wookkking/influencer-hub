import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  account: string;
  photoUrl: string | null;
  className?: string;
};

/**
 * Renders the synced profile photo, falling back to account initials when the
 * URL is missing or the remote image fails to load (Instagram CDN links expire).
 */
export function InfluencerAvatar({ account, photoUrl, className }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  const base = "shrink-0 rounded-full object-cover";

  if (!photoUrl || failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground",
          className,
        )}
        aria-hidden
      >
        {account.replace(/^@/, "").slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={`${account} 프로필 사진`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn(base, className)}
    />
  );
}
