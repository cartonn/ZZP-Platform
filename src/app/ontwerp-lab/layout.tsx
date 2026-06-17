import {
  Inter,
  Geist,
  Sora,
  Figtree,
  Fraunces,
  Manrope,
  Schibsted_Grotesk,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  IBM_Plex_Sans,
  DM_Sans,
} from "next/font/google";

// Alle kandidaat-fonts voor de 10 design-richtingen, zelfgehost via next/font. Elk levert een
// CSS-variabele die de thema-blokken (themes.css) aan --font-sans/--font-display koppelen.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
});
const dmsans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans" });

const fontVars = [
  inter,
  geist,
  sora,
  figtree,
  fraunces,
  manrope,
  schibsted,
  jakarta,
  space,
  plex,
  dmsans,
]
  .map((f) => f.variable)
  .join(" ");

export default function OntwerpLabLayout({ children }: { children: React.ReactNode }) {
  return <div className={fontVars}>{children}</div>;
}
