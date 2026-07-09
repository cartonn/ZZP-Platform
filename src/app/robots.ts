import type { MetadataRoute } from "next";
import { buildRobotsRules } from "@/lib/indexing";

// /robots.txt — server-gerenderd uit de indexering-posture (src/lib/indexing.ts). Standaard
// afgeschermd (besloten pilot); ALLOW_INDEXING=true zet het bij go-live open. Nooit gecachet zodat
// een gewijzigde flag na een redeploy meteen doorwerkt.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return { rules: buildRobotsRules(process.env.ALLOW_INDEXING) };
}
