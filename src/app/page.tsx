import Link from "next/link";

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

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center md:py-32">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          PilkaSport
        </h1>
        <p className="mb-8 max-w-xl text-lg text-gray-600">
          Platforma łącząca kluby piłkarskie i zawodników. Organizuj sparingi,
          przeglądaj wydarzenia, szukaj talentów — wszystko w jednym miejscu.
        </p>
        <div className="flex gap-3">
          <Link
            href="/register"
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Dołącz za darmo
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium transition hover:bg-gray-50"
          >
            Zaloguj się
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-gray-50 px-4 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-3 text-3xl">&#9917;</div>
            <h3 className="mb-2 font-semibold">Sparingi</h3>
            <p className="text-sm text-gray-600">
              Twórz ogłoszenia i znajdź rywali na mecze sparingowe w swoim
              regionie.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-3 text-3xl">&#128197;</div>
            <h3 className="mb-2 font-semibold">Wydarzenia</h3>
            <p className="text-sm text-gray-600">
              Treningi otwarte i nabory — zarządzaj i zgłaszaj się do wydarzeń
              piłkarskich.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-3 text-3xl">&#128172;</div>
            <h3 className="mb-2 font-semibold">Wiadomości</h3>
            <p className="text-sm text-gray-600">
              Bezpośrednia komunikacja między klubami i zawodnikami — szybko i
              wygodnie.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">Dla klubów i zawodników</h2>
        <p className="mx-auto mb-6 max-w-lg text-gray-600">
          Zarejestruj się jako klub lub zawodnik. Uzupełnij profil, dodaj swój
          region i zacznij korzystać z platformy.
        </p>
        <Link
          href="/register"
          className="inline-block rounded-md bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Zarejestruj się
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-gray-400">
        PilkaSport &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
