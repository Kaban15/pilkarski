import Link from "next/link";
import {
  Swords,
  Trophy,
  MessageSquare,
  Users,
  Shield,
  ArrowRight,
  ChevronRight,
  Zap,
  Target,
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
      "Twórz ogłoszenia i znajdź rywali na mecze sparingowe w swoim regionie. Zarządzaj aplikacjami i umów sparing w kilka kliknięć.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Trophy,
    title: "Wydarzenia",
    description:
      "Organizuj treningi otwarte i nabory. Zawodnicy zgłaszają się online — Ty wybierasz najlepszych.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: MessageSquare,
    title: "Wiadomości",
    description:
      "Bezpośrednia komunikacja między klubami i zawodnikami. Czat w czasie rzeczywistym.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Globe,
    title: "Regiony i ligi",
    description:
      "16 województw, 80 szczebli ligowych, 272 grupy. Pełna mapa polskiego futbolu.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Target,
    title: "Powiadomienia",
    description:
      "Bądź na bieżąco z nowymi sparingami, wydarzeniami i wiadomościami w Twoim regionie.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Zap,
    title: "Szybki start",
    description:
      "Zarejestruj się, uzupełnij profil i zacznij korzystać z platformy w mniej niż 2 minuty.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

const STATS = [
  { label: "Województw", value: "16" },
  { label: "Szczebli ligowych", value: "80" },
  { label: "Grup ligowych", value: "272" },
  { label: "Darmowa platforma", value: "100%" },
];

export default function LandingPage() {
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
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Platforma dla polskiego futbolu
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Umów sparing
              <span className="text-primary"> w 2 minuty</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              PilkaSport to darmowa platforma, na której kluby piłkarskie umawiają
              mecze sparingowe i organizują nabory. Wybierz region, dodaj ogłoszenie
              — reszta dzieje się sama.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                <Users className="h-5 w-5" />
                Zarejestruj się za darmo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition hover:bg-accent hover:shadow-md"
              >
                Zaloguj się
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border px-4 sm:grid-cols-4 sm:px-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-8 text-center sm:px-8">
              <p className="text-3xl font-extrabold text-primary sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Wszystko, czego potrzebujesz
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Kompleksowa platforma dla klubów i zawodników piłkarskich w Polsce.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30 hover:shadow-lg"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Jak to działa?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Trzy kroki dzielą Cię od pierwszego sparingu.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Zarejestruj klub",
                description: "Podaj nazwę, wybierz region i ligę. Zajmie Ci to 30 sekund.",
                color: "bg-emerald-500",
              },
              {
                step: "2",
                title: "Dodaj sparing lub nabór",
                description: "Ustal termin, miejsce i poziom. Ogłoszenie trafi do klubów w Twoim regionie.",
                color: "bg-violet-500",
              },
              {
                step: "3",
                title: "Odbieraj zgłoszenia",
                description: "Kluby aplikują na Twój sparing — Ty wybierasz rywala. Powiadomienia przychodzą na bieżąco.",
                color: "bg-blue-500",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} text-xl font-bold text-white`}>
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-xl"
            >
              Zarejestruj klub za darmo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 sm:grid-cols-2 sm:px-6 sm:py-28">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-background p-8 dark:border-emerald-800/50 dark:from-emerald-950/30">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="mb-3 text-2xl font-bold">Dla klubów</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Dodaj ogłoszenie sparingowe — rywale z regionu zgłoszą się sami
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Organizuj nabory i treningi otwarte z limitem miejsc
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Profil klubu widoczny publicznie — z logo, ligą i kontaktem
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Powiadomienia push o nowych zgłoszeniach i wiadomościach
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
            >
              Zarejestruj klub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-background p-8 dark:border-violet-800/50 dark:from-violet-950/30">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <Users className="h-6 w-6 text-violet-500" />
            </div>
            <h3 className="mb-3 text-2xl font-bold">Dla zawodników</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Przeglądaj nabory i treningi otwarte w regionie
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Stwórz profesjonalny profil zawodnika
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Zapisuj się na wydarzenia jednym kliknięciem
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                Kontaktuj się z klubami przez wiadomości
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition hover:text-violet-500 dark:text-violet-400"
            >
              Dołącz jako zawodnik
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Szukasz rywala na sparing?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            Zarejestruj klub, dodaj ogłoszenie i czekaj na zgłoszenia.
            Pierwsze kluby już korzystają — dołącz za darmo.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-xl"
          >
            Zacznij teraz
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
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
