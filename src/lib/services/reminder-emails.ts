// Pure e-mail templates voor cascade-herinneringen (PLATFORM_OVERHAUL.md §3 punt 5c).
// Zelfde patroon als welcome-email.ts: pure functies → MailMessage; verzenden doet de
// taakrunner via getMailSender(). Geen secrets in de tekst.

import { type MailMessage } from "@/lib/services/mail-sender";

const PLATFORM = process.env.PLATFORM_NAME ?? "ZZP Platform";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Recipient-header: "Naam <email>" of alleen "email" als naam ontbreekt. */
function recipient(name: string, email: string): string {
  return name && name !== email ? `${name} <${email}>` : email;
}

function html(content: string): string {
  return `<!doctype html>
<html lang="nl">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
      <tr><td style="padding:24px;">${content}</td></tr>
    </table>
  </body>
</html>`;
}

function btn(url: string, label: string): string {
  return `<a href="${esc(url)}" style="display:inline-block;padding:10px 16px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${esc(label)}</a>`;
}

// ─── Certificaat verloopt binnenkort ─────────────────────────────────────────

export interface CredentialExpiryWarningInput {
  name: string;
  email: string;
  credentialTitle: string;
  daysLeft: number;
  loginUrl: string;
}

export function buildCredentialExpiryWarningEmail(
  input: CredentialExpiryWarningInput,
): MailMessage {
  const platform = PLATFORM;
  const subject = `Actie vereist: certificaat "${input.credentialTitle}" verloopt over ${input.daysLeft} dag(en)`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Je certificaat "${input.credentialTitle}" verloopt over ${input.daysLeft} dag(en).`,
    "Vernieuw het op tijd om geverifieerd te blijven.",
    "",
    `Certificaten beheren: ${input.loginUrl}/certificaten`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Certificaat verloopt binnenkort</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Je certificaat <strong>${esc(input.credentialTitle)}</strong> verloopt over <strong>${input.daysLeft} dag(en)</strong>. Vernieuw het op tijd om geverifieerd te blijven.</p>
      ${btn(`${input.loginUrl}/certificaten`, "Certificaten beheren")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Certificaat verlopen ─────────────────────────────────────────────────────

export interface CredentialExpiredInput {
  name: string;
  email: string;
  credentialTitle: string;
  loginUrl: string;
}

export function buildCredentialExpiredEmail(input: CredentialExpiredInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Certificaat verlopen: "${input.credentialTitle}"`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Je certificaat "${input.credentialTitle}" is verlopen.`,
    "Vernieuw het en vraag opnieuw verificatie aan om geverifieerd te blijven.",
    "",
    `Certificaten beheren: ${input.loginUrl}/certificaten`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Certificaat verlopen</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Je certificaat <strong>${esc(input.credentialTitle)}</strong> is verlopen. Vernieuw het en vraag opnieuw verificatie aan om geverifieerd te blijven.</p>
      ${btn(`${input.loginUrl}/certificaten`, "Certificaten vernieuwen")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Betaaltermijn nadert ────────────────────────────────────────────────────

export interface PaymentReminderEmailInput {
  name: string;
  email: string;
  invoiceNumber: string;
  daysLeft: number;
  loginUrl: string;
}

export function buildPaymentReminderEmail(input: PaymentReminderEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Betaaltermijn: factuur ${input.invoiceNumber} vervalt over ${input.daysLeft} dag(en)`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Factuur ${input.invoiceNumber} vervalt over ${input.daysLeft} dag(en).`,
    "Betaling verloopt rechtstreeks aan de ZZP'er.",
    "",
    `Facturen bekijken: ${input.loginUrl}/facturen`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Betaaltermijn nadert</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Factuur <strong>${esc(input.invoiceNumber)}</strong> vervalt over <strong>${input.daysLeft} dag(en)</strong>. Betaling verloopt rechtstreeks aan de ZZP'er.</p>
      ${btn(`${input.loginUrl}/facturen`, "Factuur bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Betaling te laat ────────────────────────────────────────────────────────

export interface PaymentOverdueEmailInput {
  role: "freelancer" | "client";
  name: string;
  email: string;
  invoiceNumber: string;
  loginUrl: string;
}

export function buildPaymentOverdueEmail(input: PaymentOverdueEmailInput): MailMessage {
  const platform = PLATFORM;
  const isFreelancer = input.role === "freelancer";
  const body = isFreelancer
    ? `Factuur ${input.invoiceNumber} is over de vervaldag. Je kunt een betalingsherinnering of aanmaning sturen.`
    : `De betaaltermijn van factuur ${input.invoiceNumber} is verstreken. Betaal rechtstreeks aan de ZZP'er en markeer de betaling.`;
  const subject = `Betaling te laat: factuur ${input.invoiceNumber}`;
  const text = [
    `Hallo ${input.name},`,
    "",
    body,
    "",
    `Facturen bekijken: ${input.loginUrl}/facturen`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Betaling te laat</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">${esc(body)}</p>
      ${btn(`${input.loginUrl}/facturen`, "Factuur bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Concept-factuur nog niet ingediend ──────────────────────────────────────

export interface ConceptInvoiceReminderEmailInput {
  name: string;
  email: string;
  invoiceNumber: string;
  daysSince: number;
  loginUrl: string;
}

export function buildConceptInvoiceReminderEmail(
  input: ConceptInvoiceReminderEmailInput,
): MailMessage {
  const platform = PLATFORM;
  const subject = `Herinnering: concept-factuur ${input.invoiceNumber} wacht op indiening`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Je concept-factuur ${input.invoiceNumber} staat al ${input.daysSince} dag(en) klaar.`,
    "Controleer en dien hem in zodat de betaling kan starten.",
    "",
    `Facturen bekijken: ${input.loginUrl}/facturen`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Concept-factuur wacht op indiening</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">Je concept-factuur <strong>${esc(input.invoiceNumber)}</strong> staat al <strong>${input.daysSince} dag(en)</strong> klaar. Controleer en dien hem in zodat de betaling kan starten.</p>
      ${btn(`${input.loginUrl}/facturen`, "Factuur indienen")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── BTW-kwartaal herinnering ────────────────────────────────────────────────

export interface VatReminderEmailInput {
  name: string;
  email: string;
  quarter: number;
  year: number;
  loginUrl: string;
}

export function buildVatReminderEmail(input: VatReminderEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `BTW-aangifte Q${input.quarter} ${input.year}: deadline nadert`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `De deadline voor de BTW-aangifte van Q${input.quarter} ${input.year} nadert.`,
    "Controleer je administratie en dien de aangifte tijdig in bij de Belastingdienst.",
    "",
    `Administratie bekijken: ${input.loginUrl}/administratie`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">BTW-aangifte Q${input.quarter} ${input.year}</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 16px;font-size:14px;">De deadline voor de BTW-aangifte van <strong>Q${input.quarter} ${input.year}</strong> nadert. Controleer je administratie en dien de aangifte tijdig in bij de Belastingdienst.</p>
      ${btn(`${input.loginUrl}/administratie`, "Administratie bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}

// ─── Job-match alert ─────────────────────────────────────────────────────────

export interface JobMatchEmailInput {
  name: string;
  email: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  jobUrl: string;
}

export function buildJobMatchEmail(input: JobMatchEmailInput): MailMessage {
  const platform = PLATFORM;
  const subject = `Nieuwe opdracht die bij je past: "${input.jobTitle}"`;
  const text = [
    `Hallo ${input.name},`,
    "",
    `Er is een nieuwe opdracht geplaatst die goed bij je profiel past:`,
    `"${input.jobTitle}" bij ${input.companyName} (${input.matchScore}% match).`,
    "",
    `Opdracht bekijken: ${input.jobUrl}`,
    "",
    "Met vriendelijke groet,",
    platform,
  ].join("\n");
  return {
    to: recipient(input.name, input.email),
    subject,
    text,
    html: html(`
      <h1 style="margin:0 0 8px;font-size:18px;">Nieuwe opdracht die bij je past</h1>
      <p style="margin:0 0 12px;font-size:14px;color:#52525b;">Hallo ${esc(input.name)},</p>
      <p style="margin:0 0 4px;font-size:14px;">Er is een nieuwe opdracht geplaatst die goed bij je profiel past:</p>
      <p style="margin:0 0 16px;font-size:16px;font-weight:600;">${esc(input.jobTitle)}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#52525b;">${esc(input.companyName)} · ${input.matchScore}% match</p>
      <br/>
      ${btn(input.jobUrl, "Opdracht bekijken")}
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">${esc(platform)}</p>
    `),
  };
}
