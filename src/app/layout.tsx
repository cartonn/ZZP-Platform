import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Figtree, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { HydrationFlag } from "@/components/system/hydration-flag";
import { PwaRegister } from "@/components/system/pwa-register";
import { InstallPrompt } from "@/components/system/install-prompt";

// Typografie van het definitieve palet (DESIGN.md §3): Figtree voor UI, Fraunces (serif)
// voor koppen, JetBrains Mono voor cijfers. Via next/font zelfgehost — geen runtime-request.
const fontSans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fontDisplay = Fraunces({
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
  title: "Handslag",
  description: "Opdrachten, geverifieerde certificaten en veilig documentbeheer voor ZZP'ers.",
  applicationName: "Handslag",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Handslag" },
  icons: { apple: "/pwa/icon/apple.png" },
};

// themeColor MOET in de viewport-export staan (Next 15); in metadata wordt het genegeerd.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f4eb" },
    { media: "(prefers-color-scheme: dark)", color: "#171c1a" },
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
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <LocaleProvider locale={locale}>
          <HydrationFlag />
          <PwaRegister />
          <InstallPrompt />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
