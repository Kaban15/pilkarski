"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-destructive">Coś poszło nie tak</p>
      <button
        onClick={reset}
        className="text-sm underline text-muted-foreground hover:text-foreground"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
