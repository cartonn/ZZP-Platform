import { type ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";

/**
 * Gedeelde leeslayout voor de juridische pagina's (/voorwaarden, /privacy, /cookies).
 * Inlogvrij bereikbaar (route-guards): de wet vereist dat deze documenten vóór registratie
 * raadpleegbaar zijn. Leescontext → max-w-2xl (DESIGN.md).
 */

const LEGAL_LINKS = [
  { href: "/voorwaarden", label: "Algemene voorwaarden" },
  { href: "/privacy", label: "Privacyverklaring" },
  { href: "/cookies", label: "Cookieverklaring" },
] as const;

export function LegalPage({
  title,
  version,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  /** Bv. "1.0 (concept)" — concept blijft zichtbaar tot de externe juridische toetsing is afgerond. */
  version: string;
  /** Menselijk leesbare datum, bv. "14 augustus 2026". */
  updatedAt: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="font-display text-base font-semibold">Handslag</span>
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="underline-offset-4 hover:underline">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <article className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          <header className="border-b border-border pb-4">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Versie {version} · laatst bijgewerkt op {updatedAt}
            </p>
            {intro ? (
              <div className="mt-3 space-y-2 text-sm text-foreground/90">{intro}</div>
            ) : null}
          </header>
          <div className="mt-4 space-y-6">{children}</div>
        </article>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Vragen over dit document?{" "}
          <a
            href="mailto:support@zzp-platform.nl"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            support@zzp-platform.nl
          </a>
        </p>
      </div>
    </div>
  );
}

/** Genummerde sectie met kop; de nummering zit in de titel zodat verwijzingen stabiel zijn. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
