import { ImageResponse } from "next/og";

// Genereert de PWA-iconen (manifest + apple-touch) als echte PNG's via Next's ImageResponse — geen
// extra dependency, geen binaire assets in de repo. De originele oranje Handslag-handen op wit,
// gelijk aan de landing, BrandMark en src/app/icon.svg.
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
  const mark = Math.round(cfg.size * cfg.scale);
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <svg width={mark} height={mark} viewBox="6 7 36 34">
        <g fill="none" stroke="#d97757" strokeLinecap="round" strokeWidth={4}>
          <path d="M10.6 13h7a10 10 0 0 1 10 10v4" />
          <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4" />
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
