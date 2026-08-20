// Pure e-mail templates voor cascade-workflow-events (PLATFORM_OVERHAUL.md §3 punt 5d).
// Zelfde patroon als reminder-emails.ts: pure functies → MailMessage; verzenden doet de
// command-laag via getMailSender() (best-effort, wrapped in try/catch).

import { type MailMessage } from "@/lib/services/mail-sender";
import { formatEmailRecipient } from "@/lib/services/email-address";

const PLATFORM = process.env.PLATFORM_NAME ?? "Handslag";

function fmtEuro(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents) / 100;
  const parts = abs.toFixed(2).split(".");
  const int = (parts[0] ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}€ ${int},${parts[1] ?? "00"}`;
}

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrap(content: string): string {
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

// De weergavenaam wordt van stuurtekens ontdaan zodat een CR/LF in de profielnaam geen
// header-injectie kan opleveren (CWE-93; zie email-address.ts).
function to(name: string, email: string): string {
  return formatEmailRecipient(name, email);
}

export interface UserContact {
  name: string;
  email: string;
}

// ─── Event A — Contract getekend ────────────────────────────────────────────

export interface ContractSignedEmailInput {
  recipient: UserContact;
  jobTitle: string;
  link: string;
}

export function buildContractSignedEmail(input: ContractSignedEmailInput): MailMessage {
  const subject = `Contract getekend: ${input.jobTitle}`;
  const text = [
    `Hallo ${input.recipient.name},`,
    "",
    `Het contract voor "${input.jobTitle}" is getekend. De samenwerking is gestart.`,
    "",
    `Bekijk de samenwerking: ${input.link}`,
    "",
    `Met vriendelijke groet, ${PLATFORM}`,
  ].join("\n");
  return {
    to: to(input.recipient.name, input.recipient.email),
    subject,
    text,
    html: wrap(
      `<p style="margin:0 0 16px">Hallo ${esc(input.recipient.name)},</p>
       <p style="margin:0 0 16px">Het contract voor <strong>${esc(input.jobTitle)}</strong> is getekend. De samenwerking is gestart.</p>
       <p style="margin:0">${btn(input.link, "Samenwerking openen")}</p>`,
    ),
  };
}

// ─── Event B1 — Prestatie ingediend ─────────────────────────────────────────

export interface PerformanceSubmittedEmailInput {
  recipient: UserContact;
  freelancerName: string;
  jobTitle: string;
  link: string;
}

export function buildPerformanceSubmittedEmail(input: PerformanceSubmittedEmailInput): MailMessage {
  const subject = `Urenstaat ingediend: ${input.jobTitle}`;
  const text = [
    `Hallo ${input.recipient.name},`,
    "",
    `${input.freelancerName} heeft een urenstaat/oplevering ingediend voor "${input.jobTitle}".`,
    "Beoordeel en keur goed of af in de samenwerking.",
    "",
    `Bekijk de urenstaat: ${input.link}`,
    "",
    `Met vriendelijke groet, ${PLATFORM}`,
  ].join("\n");
  return {
    to: to(input.recipient.name, input.recipient.email),
    subject,
    text,
    html: wrap(
      `<p style="margin:0 0 16px">Hallo ${esc(input.recipient.name)},</p>
       <p style="margin:0 0 16px"><strong>${esc(input.freelancerName)}</strong> heeft een urenstaat/oplevering ingediend voor <strong>${esc(input.jobTitle)}</strong>. Beoordeel en keur goed of af.</p>
       <p style="margin:0">${btn(input.link, "Urenstaat beoordelen")}</p>`,
    ),
  };
}

// ─── Event B2 — Prestatie goedgekeurd → concept-factuur ─────────────────────

export interface PerformanceApprovedEmailInput {
  recipient: UserContact;
  jobTitle: string;
  link: string;
}

export function buildPerformanceApprovedEmail(input: PerformanceApprovedEmailInput): MailMessage {
  const subject = `Urenstaat goedgekeurd: ${input.jobTitle}`;
  const text = [
    `Hallo ${input.recipient.name},`,
    "",
    `Je urenstaat/oplevering voor "${input.jobTitle}" is goedgekeurd.`,
    "Er is een concept-factuur aangemaakt. Controleer en dien de factuur in via de samenwerking.",
    "",
    `Bekijk de samenwerking: ${input.link}`,
    "",
    `Met vriendelijke groet, ${PLATFORM}`,
  ].join("\n");
  return {
    to: to(input.recipient.name, input.recipient.email),
    subject,
    text,
    html: wrap(
      `<p style="margin:0 0 16px">Hallo ${esc(input.recipient.name)},</p>
       <p style="margin:0 0 16px">Je urenstaat/oplevering voor <strong>${esc(input.jobTitle)}</strong> is goedgekeurd. Er is een concept-factuur aangemaakt.</p>
       <p style="margin:0">${btn(input.link, "Concept-factuur bekijken")}</p>`,
    ),
  };
}

// ─── Event B2′ — Prestatie afgekeurd ────────────────────────────────────────

export interface PerformanceRejectedEmailInput {
  recipient: UserContact;
  jobTitle: string;
  reason: string;
  link: string;
}

export function buildPerformanceRejectedEmail(input: PerformanceRejectedEmailInput): MailMessage {
  const subject = `Urenstaat afgekeurd: ${input.jobTitle}`;
  const text = [
    `Hallo ${input.recipient.name},`,
    "",
    `Je urenstaat/oplevering voor "${input.jobTitle}" is afgekeurd.`,
    "",
    `Reden: ${input.reason}`,
    "",
    "Pas de urenstaat aan en dien opnieuw in via de samenwerking.",
    "",
    `Bekijk de samenwerking: ${input.link}`,
    "",
    `Met vriendelijke groet, ${PLATFORM}`,
  ].join("\n");
  return {
    to: to(input.recipient.name, input.recipient.email),
    subject,
    text,
    html: wrap(
      `<p style="margin:0 0 16px">Hallo ${esc(input.recipient.name)},</p>
       <p style="margin:0 0 16px">Je urenstaat/oplevering voor <strong>${esc(input.jobTitle)}</strong> is afgekeurd.</p>
       <blockquote style="margin:0 0 16px;padding:12px 16px;background:#f4f4f5;border-left:3px solid #e4e4e7;border-radius:4px"><strong>Reden:</strong> ${esc(input.reason)}</blockquote>
       <p style="margin:0 0 16px">Pas de urenstaat aan en dien opnieuw in.</p>
       <p style="margin:0">${btn(input.link, "Samenwerking openen")}</p>`,
    ),
  };
}

// ─── Event C — Factuur ingediend ─────────────────────────────────────────────

export interface InvoiceSubmittedEmailInput {
  recipient: UserContact;
  freelancerName: string;
  jobTitle: string;
  totalCents: number;
  link: string;
}

export function buildInvoiceSubmittedEmail(input: InvoiceSubmittedEmailInput): MailMessage {
  const amount = fmtEuro(input.totalCents);
  const subject = `Factuur ontvangen: ${input.jobTitle}`;
  const text = [
    `Hallo ${input.recipient.name},`,
    "",
    `${input.freelancerName} heeft een factuur van ${amount} ingediend voor "${input.jobTitle}".`,
    "Keur goed of af in de samenwerking.",
    "",
    `Bekijk de factuur: ${input.link}`,
    "",
    `Met vriendelijke groet, ${PLATFORM}`,
  ].join("\n");
  return {
    to: to(input.recipient.name, input.recipient.email),
    subject,
    text,
    html: wrap(
      `<p style="margin:0 0 16px">Hallo ${esc(input.recipient.name)},</p>
       <p style="margin:0 0 16px"><strong>${esc(input.freelancerName)}</strong> heeft een factuur van <strong>${esc(amount)}</strong> ingediend voor <strong>${esc(input.jobTitle)}</strong>. Keur goed of af.</p>
       <p style="margin:0">${btn(input.link, "Factuur beoordelen")}</p>`,
    ),
  };
}

// ─── Event D — Factuur goedgekeurd ───────────────────────────────────────────

export interface InvoiceApprovedEmailInput {
  recipient: UserContact;
  jobTitle: string;
  totalCents: number;
  dueAt?: Date | null;
  link: string;
}

export function buildInvoiceApprovedEmail(input: InvoiceApprovedEmailInput): MailMessage {
  const amount = fmtEuro(input.totalCents);
  const dueStr = input.dueAt ? fmtDate(input.dueAt) : null;
  const subject = `Factuur goedgekeurd: ${input.jobTitle}`;
  const text = [
    `Hallo ${input.recipient.name},`,
    "",
    `Je factuur van ${amount} voor "${input.jobTitle}" is goedgekeurd.`,
    ...(dueStr ? [`Betaaldatum: ${dueStr}.`] : []),
    "",
    `Bekijk de samenwerking: ${input.link}`,
    "",
    `Met vriendelijke groet, ${PLATFORM}`,
  ].join("\n");
  return {
    to: to(input.recipient.name, input.recipient.email),
    subject,
    text,
    html: wrap(
      `<p style="margin:0 0 16px">Hallo ${esc(input.recipient.name)},</p>
       <p style="margin:0 0 16px">Je factuur van <strong>${esc(amount)}</strong> voor <strong>${esc(input.jobTitle)}</strong> is goedgekeurd.${dueStr ? ` Betaaldatum: <strong>${esc(dueStr)}</strong>.` : ""}</p>
       <p style="margin:0">${btn(input.link, "Samenwerking openen")}</p>`,
    ),
  };
}

// ─── Event D′ — Factuur afgekeurd ────────────────────────────────────────────

export interface InvoiceRejectedEmailInput {
  recipient: UserContact;
  jobTitle: string;
  reason: string;
  link: string;
}

export function buildInvoiceRejectedEmail(input: InvoiceRejectedEmailInput): MailMessage {
  const subject = `Factuur afgekeurd: ${input.jobTitle}`;
  const text = [
    `Hallo ${input.recipient.name},`,
    "",
    `Je factuur voor "${input.jobTitle}" is afgekeurd.`,
    "",
    `Reden: ${input.reason}`,
    "",
    "Pas de factuur aan en dien opnieuw in.",
    "",
    `Bekijk de samenwerking: ${input.link}`,
    "",
    `Met vriendelijke groet, ${PLATFORM}`,
  ].join("\n");
  return {
    to: to(input.recipient.name, input.recipient.email),
    subject,
    text,
    html: wrap(
      `<p style="margin:0 0 16px">Hallo ${esc(input.recipient.name)},</p>
       <p style="margin:0 0 16px">Je factuur voor <strong>${esc(input.jobTitle)}</strong> is afgekeurd.</p>
       <blockquote style="margin:0 0 16px;padding:12px 16px;background:#f4f4f5;border-left:3px solid #e4e4e7;border-radius:4px"><strong>Reden:</strong> ${esc(input.reason)}</blockquote>
       <p style="margin:0 0 16px">Pas de factuur aan en dien opnieuw in.</p>
       <p style="margin:0">${btn(input.link, "Samenwerking openen")}</p>`,
    ),
  };
}

// ─── Event E — Betaling bevestigd ────────────────────────────────────────────

export interface PaymentConfirmedEmailInput {
  recipient: UserContact;
  jobTitle: string;
  totalCents: number;
  link: string;
}

export function buildPaymentConfirmedEmail(input: PaymentConfirmedEmailInput): MailMessage {
  const amount = fmtEuro(input.totalCents);
  const subject = `Betaling bevestigd: ${input.jobTitle}`;
  const text = [
    `Hallo ${input.recipient.name},`,
    "",
    `De betaling van ${amount} voor "${input.jobTitle}" is bevestigd.`,
    "",
    `Bekijk de samenwerking: ${input.link}`,
    "",
    `Met vriendelijke groet, ${PLATFORM}`,
  ].join("\n");
  return {
    to: to(input.recipient.name, input.recipient.email),
    subject,
    text,
    html: wrap(
      `<p style="margin:0 0 16px">Hallo ${esc(input.recipient.name)},</p>
       <p style="margin:0 0 16px">De betaling van <strong>${esc(amount)}</strong> voor <strong>${esc(input.jobTitle)}</strong> is bevestigd.</p>
       <p style="margin:0">${btn(input.link, "Samenwerking openen")}</p>`,
    ),
  };
}
