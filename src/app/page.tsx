import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import HandslagV5 from "@/components/landing/handslag-v5";
import "@/components/landing/handslag-palette.css";
import "@/components/landing/handslag-v5.css";
import "@/components/landing/handslag-interactions.css";
import "@/components/landing/handslag-depth.css";
import "@/components/landing/handslag-brand.css";
import "@/components/landing/hero-quote.css";

const landingFont = localFont({
  src: "./fonts/open-sans-latin.woff2",
  weight: "300 800",
  variable: "--font-handslag-landing",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export const metadata: Metadata = {
  title: "Handslag — Een goede opdracht begint bij handslag",
  description:
    "Bemiddelaars, opdrachtgevers en zzp’ers. Van opdracht tot afronding, samen op één platform.",
  alternates: { canonical: "https://handslag.nl" },
  openGraph: {
    title: "Handslag — Een goede opdracht begint bij handslag",
    description:
      "Bemiddelaars, opdrachtgevers en zzp’ers. Van opdracht tot afronding, samen op één platform.",
    url: "https://handslag.nl",
    locale: "nl_NL",
    type: "website",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string | string[] }>;
}) {
  const { audience: requestedAudience } = await searchParams;
  const audience =
    requestedAudience === "organisation" || requestedAudience === "intermediary"
      ? requestedAudience
      : "professional";
  return (
    <div className={landingFont.variable}>
      <HandslagV5 audience={audience} year={new Date().getFullYear()} />
    </div>
  );
}
