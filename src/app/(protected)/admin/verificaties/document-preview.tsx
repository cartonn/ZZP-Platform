"use client";

import { useState } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inline preview van het bewijsstuk voor de verificatie-wachtrij. Hergebruikt exact de bestaande
 * beveiligde document-route (`/api/documents/[id]`) — dezelfde autorisatie (eigenaar of admin),
 * geen nieuw endpoint, geen publiek pad. Afbeeldingen renderen in een <img>, PDF's in een <object>;
 * elk ander type valt terug op alleen de download-knop. De preview is standaard ingeklapt zodat de
 * wachtrij compact blijft.
 */
export function DocumentPreview({
  documentId,
  mimeType,
}: {
  documentId: string;
  mimeType: string | null;
}) {
  const [open, setOpen] = useState(false);
  const href = `/api/documents/${documentId}`;
  const isImage = mimeType?.startsWith("image/") ?? false;
  const isPdf = mimeType === "application/pdf";
  const previewable = isImage || isPdf;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {previewable && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? (
              <>
                <EyeOff className="size-3.5" aria-hidden /> Preview verbergen
              </>
            ) : (
              <>
                <Eye className="size-3.5" aria-hidden /> Bewijsstuk bekijken
              </>
            )}
          </Button>
        )}
        <Button asChild variant={previewable ? "ghost" : "secondary"} size="sm">
          <a href={href} target="_blank" rel="noreferrer">
            <Download className="size-3.5" aria-hidden /> Downloaden
          </a>
        </Button>
      </div>

      {open && previewable && (
        <div className="overflow-hidden rounded-md border border-border bg-muted/30">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- beveiligde privé-route, geen next/image
            <img
              src={href}
              alt="Bewijsstuk"
              className="max-h-[28rem] w-full object-contain"
              loading="lazy"
            />
          ) : (
            <object
              data={href}
              type="application/pdf"
              aria-label="Bewijsstuk (PDF)"
              className="h-[28rem] w-full"
            >
              <p className="p-4 text-sm text-muted-foreground">
                Preview niet beschikbaar in deze browser — gebruik Downloaden.
              </p>
            </object>
          )}
        </div>
      )}
    </div>
  );
}
