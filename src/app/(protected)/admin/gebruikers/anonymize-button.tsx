"use client";

import { Button } from "@/components/ui/button";

/** Bevestigde, onomkeerbare actie. De server-actie (`anonymizeUser`, gebonden aan de userId)
 *  wordt als prop doorgegeven; de bevestiging voorkomt een misklik. */
export function AnonymizeButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Dit account wordt onomkeerbaar geanonimiseerd: naam, e-mail, profiel, " +
              "certificaten en documenten worden verwijderd. Facturen blijven bewaard vanwege " +
              "de fiscale bewaarplicht. Doorgaan?",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        Verzoek afhandelen
      </Button>
    </form>
  );
}
