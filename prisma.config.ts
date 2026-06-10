// Prisma-configuratie (vervangt het deprecated `package.json#prisma`-blok; weg in Prisma 7).
// Let op: met een prisma.config.ts laadt de Prisma-CLI .env niet meer automatisch — dotenv
// doet dat hier expliciet, zodat lokale `db:push`/`db:seed` blijven werken. In productie
// (Railway) komen de variabelen uit het proces-environment en is .env afwezig.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
