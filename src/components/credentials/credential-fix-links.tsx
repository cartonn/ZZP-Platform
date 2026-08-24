import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { credentialFixHref, type CredentialFix } from "@/lib/credential-fix";

/**
 * Compacte rij deep-links om een blokkerende certificaateis in één klik op te lossen: ontbrekende
 * types → "Regel …" (nieuw aanleveren), verlopen types → "Vernieuw …". Elke link opent het
 * uploadformulier met het juiste documenttype voorgeselecteerd. Rendert niets zonder oplosbare
 * blokkades, zodat het scherm rustig blijft. Presentatie-alleen — de aanroeper levert de (server-side
 * berekende) fixes en de vertaalfunctie.
 */
export function CredentialFixLinks({
  fixes,
  t,
  className,
}: {
  fixes: CredentialFix[];
  t: (s: string) => string;
  className?: string;
}) {
  if (fixes.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {fixes.map((fix) => (
        <Link
          key={fix.type}
          href={credentialFixHref(fix.type)}
          className="focus-ring inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:border-foreground/40"
        >
          {fix.kind === "missing" ? (
            <Plus className="size-3 shrink-0" aria-hidden />
          ) : (
            <RefreshCw className="size-3 shrink-0" aria-hidden />
          )}
          {fix.kind === "missing" ? t("Regel") : t("Vernieuw")} {t(CREDENTIAL_TYPE_LABEL[fix.type])}
        </Link>
      ))}
    </div>
  );
}
