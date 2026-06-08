import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HydrationFlag } from "@/components/system/hydration-flag";
import { PwaRegister } from "@/components/system/pwa-register";

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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e11" },
  ],
};

// Zet het thema vóór de eerste paint (geen flits). Leest de keuze uit localStorage,
// valt terug op het systeemvoorkeur. Dark mode = gebruikerskeuze, niet geforceerd.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}var p=localStorage.getItem('palette');if(p==='bloei'||p==='elektrisch-blauw'){document.documentElement.setAttribute('data-theme',p)}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <HydrationFlag />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
