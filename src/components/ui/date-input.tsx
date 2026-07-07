"use client";

import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Tekst-eerst datumveld. Een native `<input type="date">` toont zijn placeholder en
 * segment-volgorde volgens de BROWSER-locale, niet de pagina. Op een en-US-browser
 * verschijnt "mm/dd/yyyy" — tegenstrijdig met onze NL-verwachting dd-mm-jjjj. Daarom
 * tonen we een gewoon tekstveld met vaste placeholder "dd-mm-jjjj" en parsen we de
 * invoer server-onafhankelijk naar ISO (yyyy-mm-dd) in een verborgen veld met de
 * oorspronkelijke `name`. Zo krijgen alle server actions / Zod-schema's exact dezelfde
 * waarde als voorheen, zonder wijziging.
 *
 * Als secundaire affordance blijft een native date-picker beschikbaar via een
 * kalenderknop (feature-detected via `showPicker`), die de keuze terugschrijft als
 * dd-mm-jjjj in het tekstveld.
 *
 * Component-API is compatibel met de vorige versie: dezelfde props (`id`, `name`,
 * `defaultValue`, `required`, `className`, `onChange`, …) werken ongewijzigd.
 */

/** Zet een ISO-datum (yyyy-mm-dd) om naar het NL-weergaveformaat dd-mm-jjjj. */
export function isoToDisplay(iso: string | undefined | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * Parse een NL-datumtekst naar ISO (yyyy-mm-dd). Accepteert dd-mm-jjjj, d-m-jjjj en
 * dd/mm/jjjj (scheidingsteken `-`, `/` of `.`). Retourneert `null` bij onparseerbare of
 * ongeldige datums (bv. 31-02-2026). Lege invoer geeft een lege string terug (leeg blijft leeg).
 */
export function displayToIso(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === "") return "";
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(trimmed);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  // Valideer via een echte datum (vangt bv. 31-02 en 30-02 af).
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export const DateInput = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(
  (
    {
      className,
      "aria-describedby": describedBy,
      id,
      name,
      defaultValue,
      value,
      onChange,
      onBlur,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const errorId = useId();
    const textRef = useRef<HTMLInputElement>(null);
    const nativeRef = useRef<HTMLInputElement>(null);
    // Laat de forwarded ref naar het zichtbare tekstveld wijzen (zodat `id`-focus/labels werken).
    useImperativeHandle(ref, () => textRef.current as HTMLInputElement, []);

    const initialIso = (value ?? defaultValue ?? "")?.toString() ?? "";
    const [display, setDisplay] = useState<string>(isoToDisplay(initialIso));
    const [iso, setIso] = useState<string>(
      displayToIso(isoToDisplay(initialIso)) || initialIso || "",
    );
    const [error, setError] = useState<string | null>(null);

    const supportsPicker =
      typeof HTMLInputElement !== "undefined" &&
      typeof HTMLInputElement.prototype.showPicker === "function";

    const mergedDescribedBy =
      [describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined;

    function commit(text: string) {
      const parsed = displayToIso(text);
      if (parsed === null) {
        setIso("");
        setError("Ongeldige datum — gebruik dd-mm-jjjj");
      } else {
        setIso(parsed);
        setError(null);
      }
    }

    function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
      const text = e.target.value;
      setDisplay(text);
      const parsed = displayToIso(text);
      // Fout tijdens typen weghalen zodra het weer parseert; niet direct hard afkeuren.
      if (parsed !== null) {
        setIso(parsed);
        if (error) setError(null);
      }
      onChange?.(e);
    }

    function handleTextBlur(e: React.FocusEvent<HTMLInputElement>) {
      commit(e.target.value);
      onBlur?.(e);
    }

    function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
      const nativeIso = e.target.value; // altijd yyyy-mm-dd of leeg
      const disp = isoToDisplay(nativeIso);
      setDisplay(disp);
      setIso(nativeIso);
      setError(null);
    }

    function openPicker() {
      const el = nativeRef.current;
      if (!el) return;
      // Spiegel de huidige tekstwaarde naar het native veld zodat de picker daar opent.
      const parsed = displayToIso(display);
      el.value = parsed && parsed.length ? parsed : "";
      if (typeof el.showPicker === "function") {
        try {
          el.showPicker();
          return;
        } catch {
          // valt door naar focus/click hieronder
        }
      }
      el.focus();
      el.click();
    }

    return (
      <div className="space-y-1">
        <div className="relative">
          <Input
            ref={textRef}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="dd-mm-jjjj"
            value={display}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            required={required}
            disabled={disabled}
            aria-describedby={mergedDescribedBy}
            aria-invalid={error ? true : undefined}
            className={cn(supportsPicker && "pr-10", className)}
            {...props}
          />
          {supportsPicker && (
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled}
              tabIndex={-1}
              aria-label="Kies datum via kalender"
              className="focus-ring absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {/* Verborgen native date-input, uitsluitend voor de picker-affordance. */}
          <input
            ref={nativeRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleNativeChange}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />
        </div>
        {/* De werkelijke waarde die naar de server gaat: ISO (yyyy-mm-dd) onder de oorspronkelijke name. */}
        <input type="hidden" name={name} value={iso} />
        {error && (
          <p id={errorId} className="text-destructive text-xs" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
DateInput.displayName = "DateInput";
