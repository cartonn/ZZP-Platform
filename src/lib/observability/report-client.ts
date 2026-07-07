// Client-side helper: stuurt een gevangen browser-fout naar /api/client-error zodat hij de
// server-side error-reporter (Sentry/gestructureerd loggen) bereikt. Best-effort en NOOIT
// throwen — een mislukte rapportage mag de foutafhandeling in de UI niet verstoren.
//
// Wordt aangeroepen vanuit de React-error-boundaries (error.tsx / global-error.tsx). We sturen
// bewust weinig: naam, bericht, stack, component-stack, digest en de pagina-URL. De server
// normaliseert dat PII-arm; hier houden we het dun.

const ENDPOINT = "/api/client-error";

interface ClientErrorPayload {
  name?: string;
  message?: string;
  stack?: string;
  componentStack?: string;
  digest?: string;
  url?: string;
}

/**
 * Rapporteert een client-fout naar de server. Gebruikt `navigator.sendBeacon` wanneer beschikbaar
 * (overleeft een navigatie/unload), anders `fetch` met `keepalive`. Faalt stil.
 */
export function reportClientError(
  error: unknown,
  extra?: { componentStack?: string; digest?: string },
): void {
  // Alleen in de browser: op de server bestaat er geen navigator/fetch-naar-jezelf-flow.
  if (typeof window === "undefined") return;

  try {
    const payload: ClientErrorPayload = {
      url: typeof location !== "undefined" ? location.href : undefined,
      componentStack: extra?.componentStack,
      digest: extra?.digest,
    };

    if (error instanceof Error) {
      payload.name = error.name;
      payload.message = error.message;
      payload.stack = error.stack;
      // Next.js hangt een `digest` aan server-gemunte fouten; neem 'm mee als die er is.
      const digest = (error as { digest?: unknown }).digest;
      if (!payload.digest && typeof digest === "string") payload.digest = digest;
    } else if (typeof error === "string") {
      payload.message = error;
    } else {
      payload.message = "Onbekende client-fout";
    }

    const body = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }

    // Fallback: keepalive zodat het verzoek ook bij een direct daaropvolgende navigatie doorgaat.
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Rapportage is best-effort; een netwerkfout hier bewust negeren.
    });
  } catch {
    // Nooit throwen vanuit de rapportage — de error-boundary toont sowieso al de fallback-UI.
  }
}
