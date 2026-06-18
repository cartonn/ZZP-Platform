import { ShieldCheck } from "lucide-react";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { cn } from "@/lib/utils";

interface VMCred {
  type: string;
  status: string;
  expiresAt: Date | null;
}

// Volgorde van prominentie voor de keurmerk-rij (zorg: VOG + bevoegdheid + diploma eerst).
const ORDER: CredentialType[] = ["VOG", "LICENSE", "DIPLOMA", "INSURANCE", "CERTIFICATE", "OTHER"];

/**
 * Compacte rij van GEVERIFIEERDE (geldige, niet-verlopen) certificaten — etaleert de grootste moat
 * (geverifieerde bevoegdheid) in één oogopslag. Server-component; toont niets als er niets verified is.
 */
export function VerificationMarks({
  credentials,
  chipClassName,
}: {
  credentials: readonly VMCred[];
  /** Override voor de chip-stijl (bv. een crisp witte pil op een gekleurde hero). */
  chipClassName?: string;
}) {
  const now = Date.now();
  const verified = new Set(
    credentials
      .filter((c) => c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt.getTime() > now))
      .map((c) => c.type),
  );
  const shown = ORDER.filter((t) => verified.has(t));
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((t) => (
        <span
          key={t}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success",
            chipClassName,
          )}
          title={`${CREDENTIAL_TYPE_LABEL[t]} geverifieerd`}
        >
          <ShieldCheck className="size-3" aria-hidden />
          {CREDENTIAL_TYPE_LABEL[t]}
        </span>
      ))}
    </div>
  );
}
