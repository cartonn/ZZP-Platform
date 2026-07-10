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
  Anton,
  Architects_Daughter,
  Special_Elite,
  Cormorant_Garamond,
  Shippori_Mincho,
  Silkscreen,
  Baloo_2,
  Space_Mono,
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
// Extra display-fonts voor de nieuwste concept-reeks (231–240): expressieve, kenmerkende koppen.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lab-anton",
  display: "swap",
});
const architects = Architects_Daughter({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lab-architects",
  display: "swap",
});
const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lab-special-elite",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lab-cormorant",
  display: "swap",
});
const shippori = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-lab-shippori",
  display: "swap",
});
const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lab-silkscreen",
  display: "swap",
});
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-lab-baloo", display: "swap" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lab-space-mono",
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
  anton,
  architects,
  specialElite,
  cormorant,
  shippori,
  silkscreen,
  baloo,
  spaceMono,
]
  .map((f) => f.variable)
  .join(" ");

export default function OntwerpLabLayout({ children }: { children: React.ReactNode }) {
  return <div className={fontVars}>{children}</div>;
}
