import { ImageResponse } from "next/og";

// Genereert de PWA-iconen (manifest + apple-touch) als echte PNG's via Next's ImageResponse — geen
// extra dependency, geen binaire assets in de repo. Het merk-icoon: De Schakel (twee ineengehaakte
// ringen, inkt + terracotta) op warm ivoorpapier, gelijk aan src/app/icon.svg.
const FALLBACK = { size: 512, scale: 0.6 };
const SPECS: Record<string, { size: number; scale: number }> = {
  "192.png": { size: 192, scale: 0.6 },
  "512.png": { size: 512, scale: 0.6 },
  "512-maskable.png": { size: 512, scale: 0.46 }, // kleinere mark = veilige zone voor maskable
  "apple.png": { size: 180, scale: 0.6 },
};

export function generateStaticParams() {
  return Object.keys(SPECS).map((spec) => ({ spec }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ spec: string }> }) {
  const { spec } = await params;
  const cfg = SPECS[spec] ?? FALLBACK;
  const mark = Math.round(cfg.size * cfg.scale * 1.5);
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf5ec",
      }}
    >
      <svg width={mark} height={mark} viewBox="-40 -40 80 80">
        <g fill="none" strokeLinecap="round" strokeWidth={9}>
          <circle cx={-11} cy={0} r={17} stroke="#26221b" />
          <circle cx={11} cy={0} r={17} stroke="#b9603f" />
          <path d="M 3.7 -8.5 A 17 17 0 0 1 -5.2 -16" stroke="#26221b" />
        </g>
      </svg>
    </div>,
    {
      width: cfg.size,
      height: cfg.size,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
