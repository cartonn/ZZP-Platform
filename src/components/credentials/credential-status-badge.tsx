import { Badge } from "@/components/ui/badge";
import { isExpired } from "@/lib/credentials";
import { type CredentialStatus } from "@/lib/enums";

const MAP: Record<
  CredentialStatus,
  { label: string; variant: "muted" | "default" | "success" | "warning" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "In beoordeling", variant: "warning" },
  VERIFIED: { label: "Geverifieerd", variant: "success" },
  REJECTED: { label: "Afgewezen", variant: "danger" },
  EXPIRED: { label: "Verlopen", variant: "warning" },
};

/**
 * Statusbadge voor een certificaat. Toont server-side de waarheid (CLAUDE.md regel 1): een
 * VERIFIED-certificaat waarvan `expiresAt` is gepasseerd is verlopen — óók vóór de expiry-cron
 * (`runExpiryTask`) de status naar EXPIRED flipt. Zonder deze afleiding toont de badge nog
 * "Geverifieerd" terwijl compliance, de verval-danger-band en /acties hetzelfde certificaat al
 * als verlopen behandelen: een cross-surface tegenspraak op precies het vertrouwenssignaal dat
 * het platform onderscheidt. Geef `expiresAt` mee zodat de badge door dezelfde `isExpired`-regel
 * loopt als de rest van de app.
 */
export function CredentialStatusBadge({
  status,
  expiresAt,
}: {
  status: CredentialStatus;
  expiresAt?: Date | null;
}) {
  const effective: CredentialStatus = isExpired({ status, expiresAt }) ? "EXPIRED" : status;
  const s = MAP[effective];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
