"use client";

interface StatsCellProps {
  value: string | number;
  label: string;
  color?: "violet" | "amber" | "sky" | "emerald" | "red" | "default";
}

const COLOR_MAP: Record<string, string> = {
  violet: "text-violet-400",
  amber: "text-amber-400",
  sky: "text-sky-400",
  emerald: "text-emerald-400",
  red: "text-red-400",
  default: "text-foreground",
};

export function StatsCell({ value, label, color = "default" }: StatsCellProps) {
  return (
    <div className="bg-card rounded-xl p-3 text-center">
      <div className={`text-2xl font-extrabold ${COLOR_MAP[color] || COLOR_MAP.default}`}>
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}
