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
import { ScrollReveal } from "@/components/scroll-reveal";

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
    accent: "violet",
  },
  {
    icon: Target,
    title: "Nabory i rekrutacja",
    description: "Pipeline rekrutacyjny, zaproszenia na testy, ocena kandydatów — jak w profesjonalnym klubie.",
    accent: "sky",
  },
  {
    icon: GraduationCap,
    title: "Treningi",
    description: "Katalog trenerów i treningów indywidualnych. Rozwijaj się z najlepszymi w regionie.",
    accent: "emerald",
  },
  {
    icon: MessageSquare,
    title: "Komunikacja",
    description: "Bezpośredni czat między klubami, zawodnikami i trenerami. Zero maili.",
    accent: "amber",
  },
];

const ACCENT_STYLES: Record<string, { dot: string; icon: string; border: string }> = {
  violet: { dot: "bg-violet-400", icon: "text-violet-400", border: "group-hover:border-violet-500/30" },
  sky: { dot: "bg-sky-400", icon: "text-sky-400", border: "group-hover:border-sky-500/30" },
  emerald: { dot: "bg-emerald-400", icon: "text-emerald-400", border: "group-hover:border-emerald-500/30" },
  amber: { dot: "bg-amber-400", icon: "text-amber-400", border: "group-hover:border-amber-500/30" },
};

export default async function LandingPage() {
  const [clubs, sparings, events] = await Promise.all([
    db.club.count(),
    db.sparingOffer.count(),
    db.event.count(),
  ]).catch(() => [0, 0, 0]);

  return (
    <div className="min-h-screen bg-[#0c0a1a] text-white selection:bg-violet-500/30 selection:text-white">
      {/* Dot grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0c0a1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500 text-xs font-black text-black">
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
              className="rounded-md bg-violet-500 px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-violet-600"
            >
              Dołącz za darmo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient orb */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.07] blur-[120px]" />

        {/* Animated blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-500/[0.12] blur-[80px] animate-[blob-1_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-[#06B6D4]/[0.12] blur-[80px] animate-[blob-2_10s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 left-1/3 h-56 w-56 rounded-full bg-[#FACC15]/[0.06] blur-[80px] animate-[blob-3_12s_ease-in-out_infinite]" />
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-32 lg:pt-40">
          <div className="mx-auto max-w-[680px] text-center">
            {/* Pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-violet-500/10 px-4 py-1.5 text-[13px] text-violet-400 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Platforma dla polskiego futbolu
            </div>

            <h1 className="mb-6 text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.08] tracking-tight">
              Umów sparing{" "}
              <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
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
                className="group flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-sky-500 px-7 py-3 text-[14px] font-semibold text-white transition-all hover:from-violet-600 hover:to-sky-600 hover:shadow-[0_0_24px_rgba(6,182,212,0.3)]"
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
      <ScrollReveal>
        <section className="border-y border-white/[0.06]">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-12 px-5 py-8 sm:gap-20 sm:px-8">
            {[
              { value: String(clubs || "0"), label: "klubów" },
              { value: String(sparings || "0"), label: "sparingów" },
              { value: String(events || "0"), label: "wydarzeń" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold tabular-nums tracking-tight text-sport-cyan sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[13px] font-medium uppercase tracking-widest text-white/30">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Features */}
      <ScrollReveal>
        <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="mb-16 max-w-md">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-violet-400">
              Funkcje
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl sport-heading">
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
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal>
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
            <div className="mb-16 text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-violet-400">
                Jak to działa
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl sport-heading">
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
                <div key={item.step} className="bg-[#0c0a1a] p-8">
                  <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 font-mono text-[13px] font-bold text-white">
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
      </ScrollReveal>

      {/* For whom — asymmetric */}
      <ScrollReveal>
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
            <div className="mb-16 max-w-md">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-violet-400">
                Dla kogo
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl sport-heading">
                Trzy role, jeden cel
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {([
                {
                  Icon: Shield, title: "Dla klubów",
                  items: ["Sparingi — rywale z regionu zgłoszą się sami", "Pipeline rekrutacyjny i nabory online", "Tablica społeczności i wiadomości"],
                  cta: "Zarejestruj klub", extraClass: "",
                  hoverBorder: "hover:border-emerald-500/20", iconBg: "bg-emerald-500/10", iconText: "text-emerald-400", bulletText: "text-emerald-400/50", ctaText: "text-emerald-400 hover:text-emerald-300",
                },
                {
                  Icon: Users, title: "Dla zawodników",
                  items: ["Nabory dopasowane do pozycji i regionu", "Profil zawodnika z historią kariery", "Bezpośredni czat z klubami"],
                  cta: "Dołącz jako zawodnik", extraClass: "",
                  hoverBorder: "hover:border-violet-500/20", iconBg: "bg-violet-500/10", iconText: "text-violet-400", bulletText: "text-violet-400/50", ctaText: "text-violet-400 hover:text-violet-300",
                },
                {
                  Icon: GraduationCap, title: "Dla trenerów",
                  items: ["Profil z licencją i specjalizacją", "Katalog treningów indywidualnych", "Dostęp do naborów i społeczności"],
                  cta: "Dołącz jako trener", extraClass: "sm:col-span-2 lg:col-span-1",
                  hoverBorder: "hover:border-sky-500/20", iconBg: "bg-sky-500/10", iconText: "text-sky-400", bulletText: "text-sky-400/50", ctaText: "text-sky-400 hover:text-sky-300",
                },
              ]).map((role) => (
                <div key={role.title} className={`group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:bg-white/[0.04] ${role.hoverBorder} ${role.extraClass}`}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${role.iconBg}`}>
                      <role.Icon className={`h-4 w-4 ${role.iconText}`} />
                    </div>
                    <h3 className="text-[15px] font-semibold">{role.title}</h3>
                  </div>
                  <ul className="space-y-3 text-[14px] text-white/40">
                    {role.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Zap className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${role.bulletText}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold transition ${role.ctaText}`}
                  >
                    {role.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Bottom CTA */}
      <ScrollReveal>
        <section className="border-t border-white/[0.06]">
          <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-32">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06B6D4]/[0.06] to-transparent" />

            <h2 className="relative mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Szukasz rywala na sparing?
            </h2>
            <p className="relative mb-10 text-[15px] text-white/40">
              Dołącz za darmo. Pierwsze kluby już korzystają.
            </p>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-sky-500 px-8 py-3.5 text-[14px] font-semibold text-white transition hover:from-violet-600 hover:to-sky-600 hover:shadow-[0_0_32px_rgba(139,92,246,0.15)]"
            >
              Zacznij teraz
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-500 text-[8px] font-black text-black">
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
