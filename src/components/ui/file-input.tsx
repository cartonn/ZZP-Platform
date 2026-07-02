"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  id?: string;
  name: string;
  accept?: string;
  required?: boolean;
  /**
   * Toon naast "Bestand kiezen" ook een "Scan met camera"-knop op toestellen met een camera (mobiel).
   * Handig om een VOG/diploma direct te fotograferen i.p.v. eerst zelf een bestand te maken. Beide
   * knoppen bedienen dezelfde named input, zodat de keuze gewoon meeverstuurt met het formulier.
   */
  capture?: boolean;
  /** Optionele callback met het gekozen bestand (of null) — voor formulieren met eigen state. */
  onChange?: (file: File | null) => void;
}

/**
 * Nederlandse bestand-kiezer: verbergt de kale `<input type="file">` (die de browser-Engelse teksten
 * "Choose File / No file chosen" toont) achter een eigen knop + bestandsnaam. De input blijft in het
 * formulier zodat hij gewoon meeverstuurt. DESIGN.md: UI-taal = Nederlands.
 */
export function FileInput({ id, name, accept, required, capture, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [canScan, setCanScan] = useState(false);

  // De cameraknop alleen op toestellen met een grove aanwijzer (telefoon/tablet); op desktop negeert
  // de browser `capture` en zou de knop simpelweg een tweede bestandskiezer openen (verwarrend).
  // Post-mount gezet → geen hydratie-mismatch (server rendert 'm niet, de client voegt 'm toe).
  useEffect(() => {
    if (!capture) return;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches || "ontouchstart" in window;
    setCanScan(Boolean(coarse));
  }, [capture]);

  // Eén named input, twee triggers: voor de camera zet de input tijdelijk op `capture=environment` +
  // `image/*` (foto); voor "Bestand kiezen" herstellen we de volledige accept (pdf óf afbeelding).
  const open = (asCamera: boolean) => {
    const el = ref.current;
    if (!el) return;
    if (asCamera) {
      el.setAttribute("capture", "environment");
      el.accept = "image/*";
    } else {
      el.removeAttribute("capture");
      el.accept = accept ?? "";
    }
    el.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={ref}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setFileName(file?.name ?? null);
          onChange?.(file);
        }}
      />
      <Button type="button" variant="secondary" size="sm" onClick={() => open(false)}>
        Bestand kiezen
      </Button>
      {canScan && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => open(true)}
        >
          <Camera className="size-4" aria-hidden />
          Scan met camera
        </Button>
      )}
      {/* min-w-0 + flex-1: zonder deze kan truncate niet clippen in een wrappende flex-rij en
          duwt een lange bestandsnaam de rij kapot i.p.v. af te korten (DESIGN.md: tekst valt
          nooit buiten knoppen/cards). basis-full laat de naam op smalle schermen netjes onder
          de knoppen vallen. */}
      <span className="min-w-0 flex-1 basis-full truncate text-sm text-muted-foreground sm:basis-auto">
        {fileName ?? "Geen bestand gekozen"}
      </span>
    </div>
  );
}
