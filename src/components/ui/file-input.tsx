"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  id?: string;
  name: string;
  accept?: string;
  required?: boolean;
  /** Optionele callback met het gekozen bestand (of null) — voor formulieren met eigen state. */
  onChange?: (file: File | null) => void;
}

/**
 * Nederlandse bestand-kiezer: verbergt de kale `<input type="file">` (die de browser-Engelse teksten
 * "Choose File / No file chosen" toont) achter een eigen knop + bestandsnaam. De input blijft in het
 * formulier zodat hij gewoon meeverstuurt. DESIGN.md: UI-taal = Nederlands.
 */
export function FileInput({ id, name, accept, required, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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
      <Button type="button" variant="secondary" size="sm" onClick={() => ref.current?.click()}>
        Bestand kiezen
      </Button>
      <span className="truncate text-sm text-muted-foreground">
        {fileName ?? "Geen bestand gekozen"}
      </span>
    </div>
  );
}
