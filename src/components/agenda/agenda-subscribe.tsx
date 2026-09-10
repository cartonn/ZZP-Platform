"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CalendarPlus, Check, Copy, Download } from "lucide-react";

/** Standaard-copy: het eigen werkrooster (samenwerkingen/rooster). */
const DEFAULT_DESCRIPTION =
  "Voeg deze link één keer toe aan Google of Apple Agenda. Je geplande diensten blijven daarna " +
  "automatisch bijgewerkt — nieuwe of gewijzigde samenwerkingen verschijnen vanzelf.";
const DEFAULT_PRIVACY_NOTE = "Houd deze link privé — wie hem heeft, kan je rooster inzien.";
const DEFAULT_DOWNLOAD_NAME = "rooster.ics";

export interface AgendaSubscribeProps {
  /** Server-side afgeleid feed-pad (feed-token.ts), of `null` als de feed uitstaat (geen secret). */
  feedPath: string | null;
  /** Toelichting in het abonneer-paneel; standaard de rooster-copy. */
  description?: string;
  /** Privacy-regel onder in het paneel; standaard de rooster-copy. */
  privacyNote?: string;
  /** Bestandsnaam van de eenmalige download; standaard `rooster.ics`. */
  downloadName?: string;
}

/**
 * Agenda-affordances: een eenmalige .ics-download (`/api/agenda`) én — als er een feed-pad is —
 * een abonneerlink (webcal) die de externe agenda-app automatisch bijgewerkt houdt. Presentationeel;
 * het feed-pad wordt server-side afgeleid (feed-token.ts). De feed bevat het werkrooster én de
 * administratieve deadlines (certificaat-verval, factuur-/BTW-/IB-datums), dus de copy is per
 * context instelbaar terwijl de onderliggende feed dezelfde blijft.
 *
 * De absolute webcal/https-URL's worden pas na mount opgebouwd (window.location), zodat er geen
 * hydratie-mismatch ontstaat. Zonder feed-pad (geen secret geconfigureerd) valt de knop terug op
 * enkel de download.
 */
export function AgendaSubscribe({
  feedPath,
  description = DEFAULT_DESCRIPTION,
  privacyNote = DEFAULT_PRIVACY_NOTE,
  downloadName = DEFAULT_DOWNLOAD_NAME,
}: AgendaSubscribeProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const httpsUrl = feedPath && origin ? origin + feedPath : "";
  const webcalUrl = httpsUrl ? httpsUrl.replace(/^https?:\/\//, "webcal://") : "";

  async function handleCopy() {
    if (!httpsUrl) return;
    try {
      await navigator.clipboard.writeText(httpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Klembord niet beschikbaar (bv. onveilige context) — stil falen; de link staat zichtbaar.
    }
  }

  const downloadLink = (
    <a
      href="/api/agenda"
      download={downloadName}
      className="focus-ring inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Download className="size-4" aria-hidden />
      Exporteren (.ics)
    </a>
  );

  if (!feedPath) return downloadLink;

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <CalendarPlus className="size-4" aria-hidden />
        Abonneren
      </button>
      {downloadLink}

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 space-y-3 rounded-lg border border-border bg-card p-4 text-left shadow-lg">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>

          <a
            href={webcalUrl || undefined}
            className="focus-ring inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CalendarPlus className="size-4" aria-hidden />
            In agenda-app openen
          </a>

          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Of kopieer de link handmatig</p>
            <div className="flex items-center gap-1.5">
              <input
                readOnly
                value={httpsUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="focus-ring min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-2 py-1.5 font-mono text-xs text-muted-foreground"
                aria-label="Abonneerlink"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-success" aria-hidden />
                    Gekopieerd
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden />
                    Kopieer
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">{privacyNote}</p>
        </div>
      )}
    </div>
  );
}
