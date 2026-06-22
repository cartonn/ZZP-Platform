import { Check, FileCheck, FolderCheck, ScrollText, ShieldCheck, Target } from "lucide-react";
import { type PublicTrustStats, trustHighlights } from "@/lib/public-trust";
import { getTranslator } from "@/lib/i18n/server";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Certificaten geverifieerd",
    desc: "VOG, diploma's en BIG-registratie worden handmatig gecontroleerd.",
  },
  {
    icon: ScrollText,
    title: "Wet-DBA-proof",
    desc: "Bij elke opdracht een modelovereenkomst — geen schijnzelfstandigheid.",
  },
  {
    icon: Target,
    title: "Verklaarbare match",
    desc: "Je ziet bij elke opdracht waaróm die bij je past.",
  },
  {
    icon: FolderCheck,
    title: "Geverifieerd dossier is je startkapitaal",
    desc: "Je hebt geen reviews nodig om te beginnen — een volledig dossier spreekt voor zich.",
  },
  {
    icon: FileCheck,
    title: "Gatenvrije factuurnummering",
    desc: "Facturen krijgen een eigen, doorlopende nummering per partij — jouw boekhouding sluit altijd aan.",
  },
] as const;

// De documenttypes die het platform vóór plaatsing controleert — de keurmerk-rij.
const KEURMERK = ["VOG", "Diploma", "BIG", "Verzekering"] as const;

/**
 * Compacte vertrouwens-strip onder het inlog-/registratieformulier: kwalitatieve garanties die
 * altijd waar zijn over hoe het platform werkt, een verificatie-keurmerk-rij, en — alleen wanneer
 * betekenisvol — echte platformcijfers. Etaleert de bestaande sterktes vroeg in de funnel.
 */
export async function TrustStrip({ stats }: { stats: PublicTrustStats }) {
  const highlights = trustHighlights(stats);
  const { locale, t } = await getTranslator();

  return (
    <section
      aria-label={t("Waarom ZZP Platform")}
      className="mt-4 space-y-3 rounded-lg border border-border bg-card/60 p-4"
    >
      <ul className="space-y-3">
        {PILLARS.map((p) => (
          <li key={p.title} className="flex gap-2.5">
            <p.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{t(p.title)}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t(p.desc)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3">
        {KEURMERK.map((k) => (
          <span key={k} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3 text-success" aria-hidden />
            {t(k)}
          </span>
        ))}
      </div>

      {highlights.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {highlights
            .map(
              (h) => `${h.value.toLocaleString(locale === "en" ? "en-US" : "nl-NL")} ${t(h.label)}`,
            )
            .join(" · ")}
        </p>
      )}
    </section>
  );
}
