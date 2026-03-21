"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500">Ups!</h1>
        <p className="mt-4 text-xl text-gray-700">Coś poszło nie tak</p>
        <p className="mt-2 text-gray-500">
          Spróbuj odświeżyć stronę lub wróć później.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
