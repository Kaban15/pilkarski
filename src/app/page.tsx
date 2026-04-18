import { db } from "@/server/db/client";
import Link from "next/link";
import {
  Swords,
  MessageSquare,
  Users,
  Shield,
  ArrowRight,
  Zap,
  Target,
  GraduationCap,
} from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { LandingHeroPreview } from "@/components/landing/landing-hero-preview";

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
  },
  {
    icon: Target,
    title: "Nabory i rekrutacja",
    description: "Pipeline rekrutacyjny, zaproszenia na testy, ocena kandydatów — jak w profesjonalnym klubie.",
  },
  {
    icon: GraduationCap,
    title: "Treningi",
    description: "Katalog trenerów i treningów indywidualnych. Rozwijaj się z najlepszymi w regionie.",
  },
  {
    icon: MessageSquare,
    title: "Komunikacja",
    description: "Bezpośredni czat między klubami, zawodnikami i trenerami. Zero maili.",
  },
];

export default async function LandingPage() {
  const [regions, levels, groups] = await Promise.all([
    db.region.count(),
    db.leagueLevel.count(),
    db.leagueGroup.count(),
  ]).catch(() => [0, 0, 0]);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-violet-500/30 selection:text-white">
      {/* Dot grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
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
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-24 sm:px-8 sm:pb-20 sm:pt-32 lg:pt-40">
          <div className="mx-auto max-w-[680px] text-center">
            {/* Pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-violet-500/10 px-4 py-1.5 text-[13px] text-violet-400 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Platforma dla polskiego futbolu
            </div>

            <h1 className="mb-6 text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.08] tracking-tight">
              Sparingi, nabory i rekrutacja —{" "}
              <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
                dla klubów piłkarskich
              </span>
            </h1>

            <p className="mb-10 text-[15px] leading-relaxed text-white/40 sm:text-base md:text-lg md:leading-relaxed">
              Darmowa platforma dla klubów, zawodników i trenerów.
              <br className="hidden sm:block" />
              Znajdź rywala, zorganizuj nabór, prowadź rekrutację — bez telefonów i maili.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-orange-500 px-7 py-3 text-[14px] font-semibold text-white transition-all hover:from-violet-600 hover:to-orange-600 hover:shadow-[0_0_24px_rgba(249,115,22,0.3)]"
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

          <LandingHeroPreview />
        </div>
      </section>

      {/* Stats */}
      <ScrollReveal>
        <section className="border-y border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-12 px-5 py-8 sm:gap-20 sm:px-8">
            {[
              { value: String(regions || "16"), label: "regionów PZPN" },
              { value: String(levels || "69"), label: "szczebli rozgrywek" },
              { value: String(groups || "397"), label: "grup ligowych" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold tabular-nums tracking-tight text-sport-orange sm:text-4xl">
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
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04] group-hover:border-violet-500/30"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-violet-400" />
                  <feature.icon className="h-[18px] w-[18px] text-violet-400" />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold">{feature.title}</h3>
                <p className="text-[14px] leading-relaxed text-white/40">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal>
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
            <div className="mb-16 text-center">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-violet-400">
                Jak to działa
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl sport-heading">
                Trzy kroki do sparingu
              </h2>
            </div>

            <div className="mx-auto grid max-w-3xl gap-px overflow-hidden rounded-xl border border-border bg-white/[0.06] sm:grid-cols-3">
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
                <div key={item.step} className="bg-background p-8">
                  <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-orange-500 font-mono text-[13px] font-bold text-white">
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
        <section className="border-t border-border">
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
                },
                {
                  Icon: Users, title: "Dla zawodników",
                  items: ["Nabory dopasowane do pozycji i regionu", "Profil zawodnika z historią kariery", "Bezpośredni czat z klubami"],
                  cta: "Dołącz jako zawodnik", extraClass: "",
                },
                {
                  Icon: GraduationCap, title: "Dla trenerów",
                  items: ["Profil z licencją i specjalizacją", "Katalog treningów indywidualnych", "Dostęp do naborów i społeczności"],
                  cta: "Dołącz jako trener", extraClass: "sm:col-span-2 lg:col-span-1",
                },
              ]).map((role) => (
                <div key={role.title} className={`group rounded-xl border border-border bg-white/[0.02] p-6 transition hover:bg-white/[0.04] hover:border-violet-500/20 ${role.extraClass}`}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                      <role.Icon className="h-4 w-4 text-violet-400" />
                    </div>
                    <h3 className="text-[15px] font-semibold">{role.title}</h3>
                  </div>
                  <ul className="space-y-3 text-[14px] text-white/40">
                    {role.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet-400 transition hover:text-violet-300"
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
        <section className="border-t border-border">
          <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-32">
            <h2 className="relative mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Szukasz rywala na sparing?
            </h2>
            <p className="relative mb-10 text-[15px] text-white/40">
              Dołącz za darmo. Pierwsze kluby już korzystają.
            </p>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-orange-500 px-8 py-3.5 text-[14px] font-semibold text-white transition hover:from-violet-600 hover:to-orange-600 hover:shadow-[0_0_32px_rgba(249,115,22,0.25)]"
            >
              Zacznij teraz
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-border">
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
