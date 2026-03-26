import { db } from "@/server/db/client";
import Link from "next/link";
import {
  Swords,
  Trophy,
  MessageSquare,
  Users,
  Shield,
  ArrowRight,
  ChevronRight,
  Globe,
  Zap,
  Target,
  GraduationCap,
} from "lucide-react";

export const metadata = {
  title: "PilkaSport — Platforma dla klubów i zawodników piłkarskich",
  description:
    "Łączymy kluby piłkarskie i zawodników. Znajdź sparingi, wydarzenia, treningi otwarte i nabory w swoim regionie.",
  openGraph: {
    title: "PilkaSport — Platforma dla klubów i zawodników piłkarskich",
    description:
      "Łączymy kluby piłkarskie i zawodników. Znajdź sparingi, wydarzenia, treningi otwarte i nabory w swoim regionie.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: Swords,
    title: "Sparingi",
    description: "Dodaj ogłoszenie, odbieraj zgłoszenia, wybierz rywala. Cały proces w jednym miejscu.",
    accent: "emerald",
  },
  {
    icon: Target,
    title: "Nabory i rekrutacja",
    description: "Pipeline rekrutacyjny, zaproszenia na testy, ocena kandydatów — jak w profesjonalnym klubie.",
    accent: "amber",
  },
  {
    icon: GraduationCap,
    title: "Treningi",
    description: "Katalog trenerów i treningów indywidualnych. Rozwijaj się z najlepszymi w regionie.",
    accent: "violet",
  },
  {
    icon: MessageSquare,
    title: "Komunikacja",
    description: "Bezpośredni czat między klubami, zawodnikami i trenerami. Zero maili.",
    accent: "blue",
  },
];

const ACCENT_STYLES: Record<string, { dot: string; icon: string; border: string }> = {
  emerald: { dot: "bg-emerald-400", icon: "text-emerald-400", border: "group-hover:border-emerald-500/30" },
  amber: { dot: "bg-amber-400", icon: "text-amber-400", border: "group-hover:border-amber-500/30" },
  violet: { dot: "bg-violet-400", icon: "text-violet-400", border: "group-hover:border-violet-500/30" },
  blue: { dot: "bg-blue-400", icon: "text-blue-400", border: "group-hover:border-blue-500/30" },
};

export default async function LandingPage() {
  const [clubs, sparings, events] = await Promise.all([
    db.club.count(),
    db.sparingOffer.count(),
    db.event.count(),
  ]).catch(() => [0, 0, 0]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-white">
      {/* Dot grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-xs font-black text-black">
              PS
            </div>
            <span className="text-[15px] font-semibold tracking-tight">PilkaSport</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3.5 py-1.5 text-[13px] font-medium text-white/60 transition hover:text-white"
            >
              Zaloguj się
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition hover:bg-white/90"
            >
              Dołącz za darmo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient orb */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />

        <div className="mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-32 lg:pt-40">
          <div className="mx-auto max-w-[680px] text-center">
            {/* Pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[13px] text-white/50 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Platforma dla polskiego futbolu
            </div>

            <h1 className="mb-6 text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.08] tracking-tight">
              Umów sparing{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                w 2 minuty
              </span>
            </h1>

            <p className="mb-10 text-[15px] leading-relaxed text-white/40 sm:text-base md:text-lg md:leading-relaxed">
              Darmowa platforma dla klubów piłkarskich i zawodników.
              <br className="hidden sm:block" />
              Sparingi, nabory, treningi — bez telefonów i maili.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group flex items-center gap-2.5 rounded-lg bg-emerald-500 px-7 py-3 text-[14px] font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(34,197,94,0.3)]"
              >
                Zarejestruj się za darmo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg border border-white/10 px-7 py-3 text-[14px] font-medium text-white/60 transition hover:border-white/20 hover:text-white"
              >
                Zaloguj się
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-12 px-5 py-8 sm:gap-20 sm:px-8">
          {[
            { value: String(clubs || "0"), label: "klubów" },
            { value: String(sparings || "0"), label: "sparingów" },
            { value: String(events || "0"), label: "wydarzeń" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[13px] font-medium uppercase tracking-widest text-white/30">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="mb-16 max-w-md">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-emerald-400">
            Funkcje
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Wszystko czego potrzebuje Twój klub
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const styles = ACCENT_STYLES[feature.accent];
            return (
              <div
                key={feature.title}
                className={`group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04] ${styles.border}`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${styles.dot}`} />
                  <feature.icon className={`h-[18px] w-[18px] ${styles.icon}`} />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold">{feature.title}</h3>
                <p className="text-[14px] leading-relaxed text-white/40">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="mb-16 text-center">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-emerald-400">
              Jak to działa
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Trzy kroki do sparingu
            </h2>
          </div>

          <div className="mx-auto grid max-w-3xl gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Zarejestruj klub",
                description: "Podaj nazwę, wybierz region i ligę. Trwa minutę.",
              },
              {
                step: "02",
                title: "Dodaj ogłoszenie",
                description: "Ustal termin, miejsce i poziom. Trafi do klubów w regionie.",
              },
              {
                step: "03",
                title: "Wybierz rywala",
                description: "Odbieraj zgłoszenia, porównaj i potwierdź sparing.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-[#050505] p-8">
                <span className="mb-4 block font-mono text-[13px] font-bold text-emerald-400/60">
                  {item.step}
                </span>
                <h3 className="mb-2 text-[15px] font-semibold">{item.title}</h3>
                <p className="text-[14px] leading-relaxed text-white/40">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For whom — asymmetric */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="mb-16 max-w-md">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-emerald-400">
              Dla kogo
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Trzy role, jeden cel
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Klub */}
            <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:bg-white/[0.04] hover:border-emerald-500/20">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-[15px] font-semibold">Dla klubów</h3>
              </div>
              <ul className="space-y-3 text-[14px] text-white/40">
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/50" />
                  Sparingi — rywale z regionu zgłoszą się sami
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/50" />
                  Pipeline rekrutacyjny i nabory online
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/50" />
                  Tablica społeczności i wiadomości
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-400 transition hover:text-emerald-300"
              >
                Zarejestruj klub
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Zawodnik */}
            <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:bg-white/[0.04] hover:border-violet-500/20">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users className="h-4 w-4 text-violet-400" />
                </div>
                <h3 className="text-[15px] font-semibold">Dla zawodników</h3>
              </div>
              <ul className="space-y-3 text-[14px] text-white/40">
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400/50" />
                  Nabory dopasowane do pozycji i regionu
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400/50" />
                  Profil zawodnika z historią kariery
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400/50" />
                  Bezpośredni czat z klubami
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet-400 transition hover:text-violet-300"
              >
                Dołącz jako zawodnik
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Trener */}
            <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:bg-white/[0.04] hover:border-blue-500/20 sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <GraduationCap className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-[15px] font-semibold">Dla trenerów</h3>
              </div>
              <ul className="space-y-3 text-[14px] text-white/40">
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400/50" />
                  Profil z licencją i specjalizacją
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400/50" />
                  Katalog treningów indywidualnych
                </li>
                <li className="flex items-start gap-2.5">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400/50" />
                  Dostęp do naborów i społeczności
                </li>
              </ul>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-400 transition hover:text-blue-300"
              >
                Dołącz jako trener
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-32">
          {/* Glow */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-emerald-500/[0.04] to-transparent" />

          <h2 className="relative mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Szukasz rywala na sparing?
          </h2>
          <p className="relative mb-10 text-[15px] text-white/40">
            Dołącz za darmo. Pierwsze kluby już korzystają.
          </p>
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-2.5 rounded-lg bg-white px-8 py-3.5 text-[14px] font-semibold text-black transition hover:shadow-[0_0_32px_rgba(255,255,255,0.15)]"
          >
            Zacznij teraz
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-[8px] font-black text-black">
              PS
            </div>
            <span className="text-[13px] font-medium text-white/40">PilkaSport</span>
          </div>
          <p className="text-[12px] text-white/20">
            &copy; {new Date().getFullYear()} PilkaSport
          </p>
        </div>
      </footer>
    </div>
  );
}
