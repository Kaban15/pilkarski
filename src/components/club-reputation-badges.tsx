import { Zap, Clock, CheckCircle2 } from "lucide-react";
import { formatRate, formatResponseTime, type ReputationStats } from "@/lib/reputation";

export function ClubReputationBadges({ stats }: { stats: ReputationStats }) {
  const responseRate = formatRate(stats.responseRate);
  const responseTime = formatResponseTime(stats.avgResponseMs);
  const fulfilment = formatRate(stats.fulfilmentRate);

  if (!responseRate && !responseTime && !fulfilment) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {responseRate && (
        <Badge icon={Zap} label="Odpowiada" value={responseRate} tone="violet" />
      )}
      {responseTime && (
        <Badge icon={Clock} label="w" value={responseTime} tone="sky" />
      )}
      {fulfilment && (
        <Badge icon={CheckCircle2} label="Realizuje" value={fulfilment} tone="emerald" />
      )}
    </div>
  );
}

const TONES = {
  violet: "bg-violet-500/15 text-violet-300",
  sky: "bg-sky-500/15 text-sky-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
} as const;

function Badge({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  tone: keyof typeof TONES;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>
      <Icon className="h-3 w-3" />
      <span className="text-white/70">{label}</span>
      <span>{value}</span>
    </span>
  );
}
