import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-green-600">404</h1>
        <p className="mt-4 text-xl text-gray-700">Strona nie została znaleziona</p>
        <p className="mt-2 text-gray-500">
          Sprawdź adres URL lub wróć na stronę główną.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
