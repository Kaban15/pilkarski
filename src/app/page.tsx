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
    description:
      "Dodaj ogłoszenie, odbieraj zgłoszenia, wybierz rywala. Cały proces w jednym miejscu.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Trophy,
    title: "Nabory i treningi",
    description:
      "Organizuj treningi otwarte i nabory. Zawodnicy zapisują się online — Ty wybierasz.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: MessageSquare,
    title: "Wiadomości",
    description:
      "Bezpośredni czat między klubami i zawodnikami. Bez maili, bez telefonów.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Globe,
    title: "Cała Polska",
    description:
      "16 województw, pełna hierarchia ligowa. Feed dopasowany do Twojego regionu.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export default async function LandingPage() {
  const [clubs, sparings, events] = await Promise.all([
    db.club.count(),
    db.sparingOffer.count(),
    db.event.count(),
  ]).catch(() => [0, 0, 0]);
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              PS
            </div>
            <span className="text-lg font-bold tracking-tight">PilkaSport</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Zaloguj się
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Dołącz za darmo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] to-background" />

        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Platforma dla polskiego futbolu
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Umów sparing
              <br className="hidden sm:block" />
              <span className="text-primary">w 2 minuty</span>
            </h1>
            <p className="mb-10 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Darmowa platforma dla klubów piłkarskich. Dodaj ogłoszenie, odbieraj
              zgłoszenia, wybierz rywala — bez telefonów i maili.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Zarejestruj się za darmo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg border border-border px-7 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground hover:border-foreground/20"
              >
                Zaloguj się
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-8 px-4 py-6 sm:gap-16 sm:px-6">
          {[
            { value: String(clubs || "0"), label: "klubów" },
            { value: String(sparings || "0"), label: "sparingów" },
            { value: String(events || "0"), label: "wydarzeń" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Wszystko w jednym miejscu
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            Platforma dla klubów i zawodników piłkarskich w Polsce.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border p-5 transition hover:border-primary/30"
            >
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${feature.bg}`}
              >
                <feature.icon className={`h-4 w-4 ${feature.color}`} />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Jak to działa?
            </h2>
            <p className="text-sm text-muted-foreground">
              Trzy kroki do pierwszego sparingu.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Zarejestruj klub",
                description: "Podaj nazwę, wybierz region i ligę.",
              },
              {
                step: "2",
                title: "Dodaj ogłoszenie",
                description: "Ustal termin, miejsce i poziom. Trafi do klubów w regionie.",
              },
              {
                step: "3",
                title: "Wybierz rywala",
                description: "Odbieraj zgłoszenia i potwierdź sparing.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border text-sm font-bold text-foreground">
                  {item.step}
                </div>
                <h3 className="mb-1 text-sm font-semibold">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="border-t border-border/50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-20 sm:grid-cols-2 sm:px-6 sm:py-24">
          <div className="rounded-xl border border-border p-6">
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="mb-3 text-lg font-semibold">Dla klubów</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Dodaj sparing — rywale z regionu zgłoszą się sami
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Organizuj nabory i treningi otwarte
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Publiczny profil z logo, ligą i kontaktem
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Powiadomienia o zgłoszeniach i wiadomościach
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition hover:text-primary"
            >
              Zarejestruj klub
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-border p-6">
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Users className="h-4 w-4 text-violet-500" />
            </div>
            <h3 className="mb-3 text-lg font-semibold">Dla zawodników</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Przeglądaj nabory i treningi w regionie
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Profesjonalny profil zawodnika
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Zapisz się na wydarzenie jednym kliknięciem
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Bezpośredni czat z klubami
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition hover:text-primary"
            >
              Dołącz jako zawodnik
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Szukasz rywala na sparing?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
            Dołącz za darmo. Pierwsze kluby już korzystają.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Zacznij teraz
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              PS
            </div>
            <span className="text-sm font-semibold">PilkaSport</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PilkaSport. Wszystkie prawa
            zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  );
}
