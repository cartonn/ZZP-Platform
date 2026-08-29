import { type SepaQr } from "@/lib/payments/epc-qr";

/** Vaste quiet zone (4 modules) rond de code — vereist door de QR-standaard voor betrouwbaar scannen. */
const QUIET_ZONE = 4;

/**
 * Render een SEPA-betaal-QR als inline SVG. Bewust hard zwart-op-wit (geen thema-tokens): een
 * scanner heeft contrast nodig, dus de code blijft leesbaar in zowel de lichte als de donkere modus.
 */
export function SepaQrCode({ qr, className }: { qr: SepaQr; className?: string }) {
  const total = qr.size + QUIET_ZONE * 2;
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={132}
      height={132}
      role="img"
      aria-label="SEPA-betaal-QR-code"
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={qr.darkPath} fill="#000000" transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`} />
    </svg>
  );
}
