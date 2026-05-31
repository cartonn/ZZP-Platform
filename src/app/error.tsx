"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 px-4 text-center">
      <p className="text-2xl font-semibold tracking-tight">Er ging iets mis</p>
      <p className="text-sm text-muted-foreground">
        Probeer het opnieuw. Blijft het misgaan, neem dan contact op.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Opnieuw proberen
      </button>
    </div>
  );
}
