import { type Metadata } from "next";
import { Inter, Geist, Geist_Mono, Fraunces, JetBrains_Mono } from "next/font/google";

// Het ontwerp-lab is een PUBLIEK, inlogvrij design-lab (geen (protected)-groep) zodat de eigenaar
// het via de URL kan openen. noindex zodat zoekmachines de concept-pagina's nooit indexeren.
export const metadata: Metadata = {
  title: "Ontwerp-lab",
  robots: { index: false, follow: false },
};

// Kandidaat-fonts voor de concepten, zelfgehost via next/font. Elk concept koppelt de CSS-variabelen
// die het nodig heeft aan zijn eigen typografie (binnen de scope van de concept-component).
const inter = Inter({ subsets: ["latin"], variable: "--font-lab-inter", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-lab-geist", display: "swap" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-lab-geist-mono",
  display: "swap",
});
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-lab-fraunces", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-lab-mono", display: "swap" });

const fontVars = [inter, geist, geistMono, fraunces, mono].map((f) => f.variable).join(" ");

export default function OntwerpLabLayout({ children }: { children: React.ReactNode }) {
  return <div className={fontVars}>{children}</div>;
}
