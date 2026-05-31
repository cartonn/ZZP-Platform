"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import {
  buildImportPreview,
  mapColumns,
  parseCsvRecords,
  type ImportRole,
  type ImportSummary,
  type ParsedImportRow,
} from "@/lib/onboarding/import";
import { generateTempPassword } from "@/lib/onboarding/password";
import { buildWelcomeEmail } from "@/lib/onboarding/welcome-email";
import { getMailSender } from "@/lib/services/mail-sender";

const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 500; // bovengrens per import (bewaakt looptijd van het hashen)

/** True als het SMTP-mailkanaal is geconfigureerd (welkomstmails kunnen dan verzonden worden). */
export async function isEmailConfigured(): Promise<boolean> {
  await requireRole("ADMIN");
  return process.env.EMAIL_DRIVER === "smtp";
}

/** Bouwt de absolute inlog-URL uit de request-headers (val terug op een relatieve link). */
async function loginUrl(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}/login`;
  } catch {
    /* buiten request-context — val terug */
  }
  return "/login";
}

export interface ServerImportRow extends ParsedImportRow {
  /** E-mailadres bestaat al in de DB → de rij wordt overgeslagen (geen fout). */
  existsAlready: boolean;
  /** Vaardigheden die (nog) niet in de catalogus staan → genegeerd bij aanmaken. */
  unknownSkills: string[];
}

export interface ServerImportPreview {
  /** Reden waarom het bestand niet bruikbaar is (kolommen ontbreken, te groot, leeg). */
  fileError?: string;
  rows: ServerImportRow[];
  summary: ImportSummary & { existing: number };
}

export interface ImportCreatedRow {
  name: string;
  email: string;
  role: ImportRole;
  tempPassword: string;
  /** null = niet per mail verstuurd (admin koos scherm); true/false = verzendresultaat. */
  emailSent: boolean | null;
}

export interface ImportCommitResult {
  created: ImportCreatedRow[];
  skippedExisting: string[];
  failed: { rowNumber: number; email: string; reason: string }[];
  totalRows: number;
  /** Of de admin om welkomstmails heeft gevraagd. */
  emailRequested: boolean;
  /** Aantal mislukte verzendingen (zodat de UI de wachtwoorden alsnog toont). */
  emailFailures: number;
}

/** Leest en valideert het CSV-bestand uit het formulier; geeft de tekst of een leesbare fout. */
async function readCsv(formData: FormData): Promise<{ text: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Kies een CSV-bestand." };
  if (file.size > MAX_CSV_BYTES) return { error: `Bestand te groot (max ${MAX_CSV_BYTES / 1024 / 1024} MB).` };
  // Vereis de .csv-extensie; sommige browsers/Excel geven een afwijkend of leeg MIME-type, dus de
  // extensie is de primaire waarborg (bekende csv-MIME's mogen ook, maar text/plain niet).
  const nameOk = /\.csv$/i.test(file.name);
  const typeOk = ["text/csv", "application/vnd.ms-excel", "application/csv"].includes(file.type);
  if (!nameOk && !typeOk) return { error: "Alleen .csv-bestanden zijn toegestaan." };
  const text = new TextDecoder("utf-8").decode(await file.arrayBuffer());
  return { text };
}

/** Vult de formaat-preview aan met DB-bewuste informatie (bestaande e-mails, onbekende skills). */
async function annotate(rows: ParsedImportRow[]): Promise<{ rows: ServerImportRow[]; existing: number }> {
  const emails = rows.map((r) => r.email).filter(Boolean);
  const existingEmails = new Set(
    (await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } })).map((u) => u.email),
  );

  const allSkillNames = new Set<string>();
  for (const r of rows) for (const s of r.skills) allSkillNames.add(s.toLowerCase());
  const knownSkills = new Set(
    allSkillNames.size > 0
      ? (await prisma.skill.findMany({ select: { name: true } }))
          .map((s) => s.name.toLowerCase())
          .filter((n) => allSkillNames.has(n))
      : [],
  );

  let existing = 0;
  const out: ServerImportRow[] = rows.map((r) => {
    const existsAlready = r.importable && existingEmails.has(r.email);
    if (existsAlready) existing++;
    const unknownSkills = r.skills.filter((s) => !knownSkills.has(s.toLowerCase()));
    return { ...r, existsAlready, unknownSkills };
  });
  return { rows: out, existing };
}

/** Dry-run: parse + valideer + DB-annotaties. Schrijft niets. */
export async function previewImport(_prev: ServerImportPreview | null, formData: FormData): Promise<ServerImportPreview> {
  await requireRole("ADMIN");
  const read = await readCsv(formData);
  const empty = { rows: [], summary: { total: 0, importable: 0, errors: 0, warnings: 0, duplicatesInFile: 0, existing: 0 } };
  if ("error" in read) return { ...empty, fileError: read.error };

  const records = parseCsvRecords(read.text);
  if (records.length < 2) return { ...empty, fileError: "Het bestand bevat geen datarijen onder de kopregel." };
  const cols = mapColumns(records[0] ?? []);
  if (cols.name < 0 || cols.email < 0 || cols.role < 0) {
    return { ...empty, fileError: "Verplichte kolommen ontbreken. Zorg voor minstens 'naam', 'email' en 'rol' — gebruik de voorbeeld-CSV." };
  }
  if (records.length - 1 > MAX_ROWS) {
    return { ...empty, fileError: `Te veel rijen (${records.length - 1}). Splits het bestand in delen van maximaal ${MAX_ROWS}.` };
  }

  const preview = buildImportPreview(read.text);
  const { rows, existing } = await annotate(preview.rows);
  return { rows, summary: { ...preview.summary, existing } };
}

/** Voert de import uit: maakt accounts aan per importeerbare, nog niet bestaande rij. */
export async function commitImport(formData: FormData): Promise<ImportCommitResult> {
  const actor = await requireRole("ADMIN");
  const read = await readCsv(formData);
  if ("error" in read) throw new Error(read.error);

  const preview = buildImportPreview(read.text);
  const rows = preview.rows;
  if (rows.length === 0) throw new Error("Geen rijen om te importeren.");
  if (rows.length > MAX_ROWS) throw new Error(`Te veel rijen (max ${MAX_ROWS}).`);

  const { rows: annotated } = await annotate(rows);

  // Skill-catalogus eenmalig laden (naam → id) voor het koppelen van vaardigheden.
  const skillByName = new Map(
    (await prisma.skill.findMany({ select: { id: true, name: true } })).map((s) => [s.name.toLowerCase(), s.id]),
  );

  // Welkomstmail versturen? Alleen als de admin dit kiest én SMTP is geconfigureerd.
  const sendEmail = formData.get("sendEmail") === "1" && process.env.EMAIL_DRIVER === "smtp";
  const mailer = sendEmail ? getMailSender() : null;
  const url = sendEmail ? await loginUrl() : "/login";

  const meta = await requestMeta();
  const result: ImportCommitResult = {
    created: [],
    skippedExisting: [],
    failed: [],
    totalRows: rows.length,
    emailRequested: sendEmail,
    emailFailures: 0,
  };

  // Verzamel eerst de aan te maken rijen; rijen met fouten of bestaande e-mails apart afhandelen.
  const toCreate: ServerImportRow[] = [];
  for (const row of annotated) {
    if (!row.importable || !row.role) {
      const reason = row.issues.find((i) => i.level === "error")?.message ?? "Onbekende fout.";
      result.failed.push({ rowNumber: row.rowNumber, email: row.email || "(geen e-mail)", reason });
    } else if (row.existsAlready) {
      result.skippedExisting.push(row.email);
    } else {
      toCreate.push(row);
    }
  }

  // Wachtwoorden parallel hashen (bcrypt is duur) i.p.v. sequentieel — schaalt naar MAX_ROWS.
  const tempPasswords = toCreate.map(() => generateTempPassword());
  const hashes = await Promise.all(tempPasswords.map((pw) => bcrypt.hash(pw, 10)));

  for (let idx = 0; idx < toCreate.length; idx++) {
    const row = toCreate[idx]!;
    const tempPassword = tempPasswords[idx]!;
    const passwordHash = hashes[idx]!;
    const role = row.role!;

    const profile =
      role === "FREELANCER"
        ? {
            freelancerProfile: {
              create: {
                headline: row.headline ?? undefined,
                hourlyRate: row.hourlyRate ?? undefined,
                location: row.location ?? undefined,
                kvkNumber: row.kvkNumber ?? undefined,
                btwNumber: row.btwNumber ?? undefined,
                skills: {
                  create: row.skills
                    .map((s) => skillByName.get(s.toLowerCase()))
                    .filter((id): id is string => !!id)
                    .map((skillId) => ({ skillId })),
                },
              },
            },
          }
        : {
            company: {
              create: {
                name: row.companyName!,
                website: row.website ?? undefined,
                location: row.location ?? undefined,
              },
            },
          };

    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { name: row.name, email: row.email, passwordHash, role, status: "ACTIVE", mustChangePassword: true, ...profile },
        });
        await tx.notification.create({
          data: {
            userId: user.id,
            type: "ACCOUNT_STATUS",
            title: "Welkom op het platform",
            body: "Je account is aangemaakt door een beheerder. Stel bij de eerste keer inloggen je eigen wachtwoord in.",
            link: "/account/wachtwoord",
          },
        });
        await tx.auditLog.create({
          data: auditData({
            actorId: actor.id,
            action: "USER_IMPORTED",
            entityType: "User",
            entityId: user.id,
            metadata: { role, email: row.email },
            ...meta,
          }),
        });
      });

      // Welkomstmail versturen (best-effort): een mislukte mail mag het account niet terugdraaien.
      let emailSent: boolean | null = null;
      if (mailer) {
        try {
          await mailer.send(buildWelcomeEmail({ name: row.name, email: row.email, tempPassword, loginUrl: url }));
          emailSent = true;
        } catch (mailErr) {
          console.error("Import: welkomstmail mislukt voor", row.email, mailErr);
          emailSent = false;
          result.emailFailures++;
        }
      }

      result.created.push({ name: row.name, email: row.email, role, tempPassword, emailSent });
    } catch (e) {
      // Geen interne foutdetails (bv. Prisma-melding) naar de client lekken; server-side loggen.
      console.error("Import: aanmaken mislukt voor rij", row.rowNumber, e);
      result.failed.push({ rowNumber: row.rowNumber, email: row.email, reason: "Aanmaken mislukt (technische fout)." });
    }
  }

  // Samenvattende audit van de hele importactie.
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "USERS_IMPORTED",
      entityType: "User",
      entityId: actor.id,
      metadata: { created: result.created.length, skippedExisting: result.skippedExisting.length, failed: result.failed.length },
      ...meta,
    }),
  });

  revalidatePath("/admin/gebruikers");
  return result;
}
