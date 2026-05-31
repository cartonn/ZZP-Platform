// Env-validatie. Draait bij server-boot (zie src/instrumentation.ts) zodat een ontbrekende
// of zwakke configuratie meteen en duidelijk faalt in plaats van later mysterieus.

import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is verplicht."),
    AUTH_SECRET: z.string().min(16, "AUTH_SECRET moet minstens 16 tekens zijn."),
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    STORAGE_S3_BUCKET: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Beveiligt POST /api/tasks/expiry (verloopdetectie + herinneringen). Optioneel;
    // zonder waarde is het endpoint uitgeschakeld (503).
    CRON_SECRET: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.STORAGE_DRIVER === "s3" && !v.STORAGE_S3_BUCKET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STORAGE_S3_BUCKET"],
        message: "Verplicht bij STORAGE_DRIVER=s3.",
      });
    }
  });

export type Env = z.infer<typeof schema>;

/** Valideert process.env; werpt een leesbare fout als er iets ontbreekt/zwak is. */
export function validateEnv(): Env {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Ongeldige omgevingsvariabelen:\n${details}`);
  }
  return result.data;
}
