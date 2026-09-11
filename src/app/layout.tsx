import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./handslag-workspace.css";
import { getLocale } from "@/lib/i18n/server";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { HydrationFlag } from "@/components/system/hydration-flag";
import { PwaRegister } from "@/components/system/pwa-register";
import { InstallPrompt } from "@/components/system/install-prompt";

// One self-hosted typeface connects the platform to the Handslag V5 landing page.
const fontSans = localFont({
  src: "./fonts/open-sans-latin.woff2",
  weight: "300 800",
  variable: "--font-sans",
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
    { media: "(prefers-color-scheme: light)", color: "#edf5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1e28" },
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
      className={`${fontSans.variable} ${fontMono.variable}`}
    >
      <head>
        {/* suppressHydrationWarning: de browser leegt het nonce-attribuut in de DOM
            (nonce hiding), dus hydratie ziet altijd server-nonce ≠ client-"" — dat is
            browsergedrag, geen bug; het script is bij het parsen al door de CSP gevalideerd. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
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
