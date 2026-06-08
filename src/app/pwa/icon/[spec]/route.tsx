import { ImageResponse } from "next/og";

// Genereert de PWA-iconen (manifest + apple-touch) als echte PNG's via Next's ImageResponse — geen
// extra dependency, geen binaire assets in de repo. Het merk-icoon: de letter "Z" op #18181b, gelijk
// aan src/app/icon.svg. Paden eindigen op `.png` zodat de middleware ze als publiek bestand doorlaat.
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
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b",
        color: "#fafafa",
        fontWeight: 700,
        fontSize: Math.round(cfg.size * cfg.scale),
      }}
    >
      Z
    </div>,
    {
      width: cfg.size,
      height: cfg.size,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
