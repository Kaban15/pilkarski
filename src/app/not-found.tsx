import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-4 text-xl text-foreground">Strona nie została znaleziona</p>
        <p className="mt-2 text-muted-foreground">
          Sprawdź adres URL lub wróć na stronę główną.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
