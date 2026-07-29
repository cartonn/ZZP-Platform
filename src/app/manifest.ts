import { type MetadataRoute } from "next";

// Web-app-manifest: maakt het platform installeerbaar (standalone) op mobiel en desktop. Next
// serveert dit op /manifest.webmanifest en injecteert de <link rel="manifest"> automatisch.
// Themakleur = het merk-zegelgroen (--primary, hsl(161 70% 28%) ≈ #15795a) — kleurt de chrome/splash
// van de geïnstalleerde PWA in de merkkleur. Houd synchroon met globals.css en layout.tsx viewport.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZZP Platform",
    short_name: "ZZP",
    description: "Opdrachten, geverifieerde certificaten en veilig documentbeheer voor ZZP'ers.",
    lang: "nl",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f9f4eb",
    theme_color: "#15795a",
    icons: [
      { src: "/pwa/icon/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/pwa/icon/512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
