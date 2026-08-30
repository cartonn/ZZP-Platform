import { BadgeEuro } from "lucide-react";
import { type PaymentTrustChip } from "@/lib/payment-behavior";

/**
 * Subtiele context onder een nog-openstaande reactiekaart: betaalt deze opdrachtgever zijn facturen
 * doorgaans op tijd, of blijft er veel liggen? "Krijg ik straks op tijd betaald?" is het diepste
 * vertrouwenssignaal; het helpt de ZZP'er beslissen om door te wachten of verder te kijken. Toont
 * uitsluitend het geaggregeerde oordeel (`good`/`warning`) — nooit een individuele factuur of bedrag.
 * Zelfde bron en toon-mapping als de chip op de opdrachtenlijst (één betekenis, geen drift).
 */
export function ClientPaymentTrustNote({ chip }: { chip: PaymentTrustChip }) {
  const tone = chip.tone === "good" ? "text-success" : "font-medium text-warning";
  return (
    <p className={`mt-2 flex items-center gap-x-1.5 text-xs ${tone}`}>
      <BadgeEuro className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{chip.label}</span>
    </p>
  );
}
