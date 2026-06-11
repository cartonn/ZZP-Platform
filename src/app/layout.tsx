import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { HydrationFlag } from "@/components/system/hydration-flag";
import { PwaRegister } from "@/components/system/pwa-register";

// Vakwerk-typografie (DESIGN.md): Inter voor UI, Schibsted Grotesk voor koppen,
// JetBrains Mono voor cijfers. Via next/font zelfgehost — geen runtime-request.
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fontDisplay = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZZP Platform",
  description: "Opdrachten, geverifieerde certificaten en veilig documentbeheer voor ZZP'ers.",
  applicationName: "ZZP Platform",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ZZP Platform" },
  icons: { apple: "/pwa/icon/apple.png" },
};

// themeColor MOET in de viewport-export staan (Next 15); in metadata wordt het genegeerd.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#101117" },
  ],
};

// Zet het thema vóór de eerste paint (geen flits). Leest de keuze uit localStorage,
// valt terug op het systeemvoorkeur. Dark mode = gebruikerskeuze, niet geforceerd.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // CSP-nonce uit de middleware: het inline theme-script mag alleen met nonce draaien onder de
  // productie-policy. Het lezen van headers() maakt de hele app request-gebonden (dynamisch),
  // zodat er geen statisch gebakken HTML zónder nonce meer bestaat — bewuste afweging.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="nl"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <HydrationFlag />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
