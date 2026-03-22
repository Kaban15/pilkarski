"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-destructive">Ups!</h1>
        <p className="mt-4 text-xl text-foreground">Coś poszło nie tak</p>
        <p className="mt-2 text-muted-foreground">
          Spróbuj odświeżyć stronę lub wróć później.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
