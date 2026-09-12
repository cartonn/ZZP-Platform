import { type MetadataRoute } from "next";

// Web-app-manifest: maakt het platform installeerbaar (standalone) op mobiel en desktop. Next
// serveert dit op /manifest.webmanifest en injecteert de <link rel="manifest"> automatisch.
// De blauwe themakleur volgt de V5-landing. De iconversie vernieuwt ook oude immutable caches.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Handslag",
    short_name: "Handslag",
    description: "Opdrachten, geverifieerde certificaten en veilig documentbeheer voor ZZP'ers.",
    lang: "nl",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eaf4fa",
    theme_color: "#0076a8",
    icons: [
      {
        src: "/pwa/icon/192.png?v=handslag-v5",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon/512.png?v=handslag-v5",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon/512-maskable.png?v=handslag-v5",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
