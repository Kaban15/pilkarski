"use client";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
  progress: number;
}

export function PullToRefreshIndicator({ pullDistance, refreshing, progress }: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !refreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200 md:hidden"
      style={{ height: refreshing ? 48 : pullDistance }}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border bg-background ${
          refreshing ? "animate-spin" : ""
        }`}
        style={{
          transform: `rotate(${progress * 360}deg)`,
          opacity: Math.max(0.3, progress),
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-sport-cyan" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 2v6m0 0L9 5m3 3l3-3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12a8 8 0 11-3-6.3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
