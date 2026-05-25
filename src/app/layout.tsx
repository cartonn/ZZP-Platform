import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZZP Platform",
  description: "Opdrachten, geverifieerde certificaten en veilig documentbeheer voor ZZP'ers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
