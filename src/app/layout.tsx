import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZZP Platform",
  description: "Opdrachten, geverifieerde certificaten en veilig documentbeheer voor ZZP'ers.",
};

// Zet het thema vóór de eerste paint (geen flits). Leest de keuze uit localStorage,
// valt terug op het systeemvoorkeur. Dark mode = gebruikerskeuze, niet geforceerd.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
