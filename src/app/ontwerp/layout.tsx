import { type Metadata } from "next";
import {
  Inter,
  Geist,
  Geist_Mono,
  Fraunces,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Sora,
  Manrope,
  Instrument_Serif,
  Bricolage_Grotesque,
  Newsreader,
  Spline_Sans_Mono,
  Libre_Franklin,
  IBM_Plex_Mono,
} from "next/font/google";

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
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-lab-jakarta",
  display: "swap",
});
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-lab-space", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-lab-sora", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-lab-manrope", display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lab-instrument-serif",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-lab-bricolage",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-lab-newsreader",
  display: "swap",
});
const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-lab-spline-mono",
  display: "swap",
});
const franklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-lab-franklin",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lab-plex-mono",
  display: "swap",
});

const fontVars = [
  inter,
  geist,
  geistMono,
  fraunces,
  mono,
  jakarta,
  space,
  sora,
  manrope,
  instrumentSerif,
  bricolage,
  newsreader,
  splineMono,
  franklin,
  plexMono,
]
  .map((f) => f.variable)
  .join(" ");

export default function OntwerpLabLayout({ children }: { children: React.ReactNode }) {
  return <div className={fontVars}>{children}</div>;
}
