import type { Metadata } from "next";
import HandslagV5 from "@/components/landing/handslag-v5";
import "@/components/landing/handslag-v5.css";
import "@/components/landing/handslag-interactions.css";
import "@/components/landing/handslag-depth.css";
import "@/components/landing/handslag-brand.css";
import "@/components/landing/hero-quote.css";

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

export default function HomePage() {
  return <HandslagV5 />;
}
