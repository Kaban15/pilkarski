"use client";

interface StagePillProps {
  label: string;
  count: number;
  color: "blue" | "amber" | "violet" | "cyan" | "emerald" | "red";
  active: boolean;
  onClick: () => void;
}

const PILL_COLORS: Record<string, { base: string; active: string }> = {
  blue: { base: "bg-blue-500/10 border-blue-500/20 text-blue-400", active: "bg-blue-500/20 border-blue-500/40 text-blue-300" },
  amber: { base: "bg-amber-500/10 border-amber-500/20 text-amber-400", active: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  violet: { base: "bg-violet-500/10 border-violet-500/20 text-violet-400", active: "bg-violet-500/20 border-violet-500/40 text-violet-300" },
  cyan: { base: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400", active: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" },
  emerald: { base: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
  red: { base: "bg-red-500/10 border-red-500/20 text-red-400", active: "bg-red-500/20 border-red-500/40 text-red-300" },
};

export function StagePill({ label, count, color, active, onClick }: StagePillProps) {
  const colors = PILL_COLORS[color] || PILL_COLORS.blue;
  return (
    <button
      onClick={onClick}
      className={`border rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${active ? colors.active : colors.base}`}
    >
      {label} · {count}
    </button>
  );
}
