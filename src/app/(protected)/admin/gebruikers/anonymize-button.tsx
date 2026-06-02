"use client";

import { ConfirmButton } from "@/components/ui/confirm-button";

/** Bevestigde, onomkeerbare actie. De server-actie (`anonymizeUser`, gebonden aan de userId)
 *  wordt als prop doorgegeven; de bevestigingsdialoog voorkomt een misklik. */
export function AnonymizeButton({ action }: { action: () => Promise<void> }) {
  return (
    <ConfirmButton
      action={action}
      title="Account onomkeerbaar anonimiseren?"
      description="Naam, e-mail, profiel, certificaten en documenten worden verwijderd. Facturen blijven bewaard vanwege de fiscale bewaarplicht. Dit kan niet ongedaan worden gemaakt."
      confirmLabel="Anonimiseren"
    >
      Verzoek afhandelen
    </ConfirmButton>
  );
}
