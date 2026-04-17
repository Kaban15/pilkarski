import { Bell, Calendar, Swords, Target, Users, Trophy } from "lucide-react";

export function LandingHeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl px-4 sm:mt-20 sm:px-8">
      {/* Glow behind */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 -top-10 bottom-10 rounded-[2rem] bg-gradient-to-r from-violet-500/20 via-violet-500/10 to-orange-500/20 blur-3xl"
      />

      {/* Browser frame */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0b10] shadow-[0_40px_100px_-20px_rgba(139,92,246,0.25)]">
        {/* Top chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white/[0.04] px-3 py-1 text-[11px] text-white/40">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            pilkarski.vercel.app/feed
          </div>
        </div>

        {/* App layout: sidebar + main + right panel */}
        <div className="grid grid-cols-[56px_1fr] gap-0 lg:grid-cols-[56px_1fr_240px]">
          {/* Sidebar */}
          <aside className="border-r border-white/[0.06] bg-[#09090d] p-2">
            <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-orange-500 text-[10px] font-black text-white">
              PS
            </div>
            {[Calendar, Swords, Target, Users, Bell, Trophy].map((Icon, i) => (
              <div
                key={i}
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-md ${
                  i === 1 ? "bg-orange-500/15 text-orange-400" : "text-white/30"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </aside>

          {/* Main */}
          <main className="space-y-3 p-4 sm:p-5">
            {/* Digest card */}
            <div className="rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] to-orange-500/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-white">Twój status</p>
                <p className="text-[10px] text-white/30">Dziś</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: "4", l: "nowe zgłoszenia", c: "text-orange-400" },
                  { v: "2", l: "zaproszenia", c: "text-violet-400" },
                  { v: "12", l: "do potwierdzenia", c: "text-sky-400" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                    <p className="mt-0.5 text-[10px] text-white/40">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero match card */}
            <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  Sparing — sobota 15:00
                </span>
                <span className="text-[10px] text-white/30">za 2 dni</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-[11px] font-bold text-violet-300">
                    KS
                  </div>
                  <p className="text-[11px] font-semibold">KS Wisła</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-lg font-bold text-white/70">VS</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-widest text-white/30">
                    Orlik Poznań
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20 text-[11px] font-bold text-orange-300">
                    LP
                  </div>
                  <p className="text-[11px] font-semibold">LKS Polonia</p>
                </div>
              </div>
            </div>

            {/* Feed items */}
            {[
              { t: "Nowe zgłoszenie na sparing", by: "LKS Polonia · 4 minuty temu", dot: "bg-orange-400" },
              { t: "Zaproszenie na nabór U-17", by: "KS Wisła · 12 minut temu", dot: "bg-violet-400" },
              { t: "Turniej regionalny — zapisy otwarte", by: "Wielkopolski ZPN", dot: "bg-emerald-400" },
            ].map((f) => (
              <div
                key={f.t}
                className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] p-3"
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${f.dot}`} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium">{f.t}</p>
                  <p className="truncate text-[10px] text-white/30">{f.by}</p>
                </div>
              </div>
            ))}
          </main>

          {/* Right panel (desktop only) */}
          <aside className="hidden border-l border-white/[0.06] bg-[#09090d] p-4 lg:block">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Nadchodzące
            </p>
            {["pon 17:30 · trening", "śr 19:00 · sparing", "sob 11:00 · mecz ligowy"].map(
              (t) => (
                <div
                  key={t}
                  className="mb-2 rounded-md border border-white/[0.04] p-2.5 text-[11px] text-white/60"
                >
                  {t}
                </div>
              ),
            )}
            <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Ranking
            </p>
            <div className="space-y-1.5 text-[11px]">
              {["1. KS Wisła", "2. Orlik Poznań", "3. LKS Polonia"].map((r, i) => (
                <div key={r} className="flex justify-between">
                  <span className="text-white/60">{r}</span>
                  <span className={i === 0 ? "text-orange-400" : "text-white/30"}>
                    {1820 - i * 40}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-4 text-center text-[12px] text-white/30">
        Podgląd pulpitu klubu — feed, digest statusu, nadchodzące mecze
      </p>
    </div>
  );
}
