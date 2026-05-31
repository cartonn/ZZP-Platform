"use client";

import { useState, useTransition } from "react";
import { Upload, CheckCircle2, AlertTriangle, XCircle, Copy, Check, RotateCcw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  previewImport,
  commitImport,
  type ServerImportPreview,
  type ServerImportRow,
  type ImportCommitResult,
} from "./actions";

type RowStatus = { label: string; variant: "success" | "warning" | "danger" | "muted" };

function rowStatus(row: ServerImportRow): RowStatus {
  if (!row.importable) return { label: "Fout", variant: "danger" };
  if (row.existsAlready) return { label: "Bestaat al", variant: "muted" };
  if (row.issues.some((i) => i.level === "warning") || row.unknownSkills.length > 0)
    return { label: "Let op", variant: "warning" };
  return { label: "Aanmaken", variant: "success" };
}

function CopyButton({ text, label = "Kopiëren" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard niet beschikbaar — stil falen */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent focus-ring"
    >
      {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Gekopieerd" : label}
    </button>
  );
}

export function ImportWizard({ emailConfigured }: { emailConfigured: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ServerImportPreview | null>(null);
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(emailConfigured);
  const [pending, start] = useTransition();

  function doPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setResult(null);
    start(async () => {
      const fd = new FormData();
      fd.append("file", file);
      setPreview(await previewImport(null, fd));
    });
  }

  function doCommit() {
    if (!file) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.append("file", file);
      if (emailConfigured && sendEmail) fd.append("sendEmail", "1");
      try {
        const r = await commitImport(fd);
        setResult(r);
        setPreview(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import mislukt.");
      }
    });
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  }

  // --- Resultaat ----------------------------------------------------------
  if (result) {
    // Wachtwoorden die nog gedeeld moeten worden: scherm-modus, of een mislukte mail.
    const needsManualShare = result.created.filter((c) => c.emailSent !== true);
    const emailedCount = result.created.filter((c) => c.emailSent === true).length;
    const credentials = needsManualShare.map((c) => `${c.name};${c.email};${c.tempPassword}`).join("\n");
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">{result.created.length} aangemaakt</Badge>
          {emailedCount > 0 && <Badge variant="success">{emailedCount} gemaild</Badge>}
          {result.emailFailures > 0 && <Badge variant="warning">{result.emailFailures} mail mislukt</Badge>}
          {result.skippedExisting.length > 0 && <Badge variant="muted">{result.skippedExisting.length} bestond al</Badge>}
          {result.failed.length > 0 && <Badge variant="danger">{result.failed.length} mislukt</Badge>}
        </div>

        {result.emailRequested && emailedCount > 0 && (
          <p className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
            {emailedCount} welkomstmail(s) verstuurd met inloggegevens.
          </p>
        )}

        {needsManualShare.length > 0 && (
          <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Tijdelijke inloggegevens</p>
                <p className="text-xs text-muted-foreground">
                  {result.emailRequested
                    ? "Deze konden niet gemaild worden — deel ze veilig. Ze worden hierna niet meer getoond."
                    : "Deel deze veilig met de gebruikers. Ze worden hierna niet meer getoond; laat gebruikers hun wachtwoord wijzigen."}
                </p>
              </div>
              <CopyButton text={`naam;email;wachtwoord\n${credentials}`} label="Alles kopiëren" />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-normal">Naam</th>
                  <th className="px-4 py-2 font-normal">E-mail</th>
                  <th className="px-4 py-2 font-normal">Tijdelijk wachtwoord</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {needsManualShare.map((c) => (
                  <tr key={c.email} className="border-t border-border/60">
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-2 font-mono text-xs">{c.tempPassword}</td>
                    <td className="px-4 py-2 text-right">
                      <CopyButton text={c.tempPassword} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.failed.length > 0 && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">Niet aangemaakt</p>
            <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {result.failed.map((f, i) => (
                <li key={i}>
                  Rij {f.rowNumber} ({f.email}): {f.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button variant="secondary" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden /> Nieuwe import
        </Button>
      </div>
    );
  }

  // --- Preview ------------------------------------------------------------
  if (preview && !preview.fileError) {
    const { summary } = preview;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{summary.total} rijen</Badge>
          <Badge variant="success">{summary.importable - summary.existing} aanmaken</Badge>
          {summary.existing > 0 && <Badge variant="muted">{summary.existing} bestaat al</Badge>}
          {summary.warnings > 0 && <Badge variant="warning">{summary.warnings} waarschuwing(en)</Badge>}
          {summary.errors > 0 && <Badge variant="danger">{summary.errors} fout(en)</Badge>}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-normal">Rij</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal">Naam</th>
                <th className="px-3 py-2 font-normal">E-mail</th>
                <th className="px-3 py-2 font-normal">Rol</th>
                <th className="px-3 py-2 font-normal">Opmerkingen</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => {
                const st = rowStatus(row);
                const notes = [
                  ...row.issues.map((i) => i.message),
                  ...(row.existsAlready ? ["E-mail bestaat al — overgeslagen."] : []),
                  ...(row.unknownSkills.length > 0 ? [`Onbekende vaardigheden: ${row.unknownSkills.join(", ")}.`] : []),
                ];
                return (
                  <tr key={row.rowNumber} className="border-t border-border/60 align-top">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{row.rowNumber}</td>
                    <td className="px-3 py-2">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="px-3 py-2">{row.name || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.email || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.role === "FREELANCER" ? "ZZP'er" : row.role === "CLIENT" ? "Opdrachtgever" : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {notes.length > 0 ? notes.join(" ") : <span className="text-success">OK</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        {emailConfigured ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <Mail className="size-4 text-muted-foreground" aria-hidden />
            Welkomstmail met inloggegevens versturen naar elke nieuwe gebruiker
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">
            E-mailverzending is niet geconfigureerd; je krijgt de tijdelijke wachtwoorden op het scherm te zien.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={doCommit} disabled={pending || summary.importable - summary.existing === 0}>
            {pending ? "Bezig…" : `Bevestig import (${summary.importable - summary.existing} aanmaken)`}
          </Button>
          <Button variant="secondary" onClick={reset} disabled={pending}>
            Ander bestand
          </Button>
          {summary.importable - summary.existing === 0 && (
            <span className="text-xs text-muted-foreground">Geen nieuwe accounts om aan te maken.</span>
          )}
        </div>
      </div>
    );
  }

  // --- Upload -------------------------------------------------------------
  return (
    <form onSubmit={doPreview} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <label htmlFor="csv" className="mb-1 block text-sm font-medium">
          CSV-bestand
        </label>
        <input
          id="csv"
          name="file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setError(null);
          }}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
        />
      </div>

      {(preview?.fileError || error) && (
        <p className="flex items-start gap-2 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {preview?.fileError ?? error}
        </p>
      )}

      <Button type="submit" disabled={!file || pending}>
        <Upload className="size-4" aria-hidden /> {pending ? "Controleren…" : "Controleer bestand"}
      </Button>

      <p className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="size-3.5 text-success" aria-hidden /> Geldig
        </span>
        <span className="inline-flex items-center gap-1">
          <AlertTriangle className="size-3.5 text-warning" aria-hidden /> Waarschuwing (wordt aangemaakt)
        </span>
        <span className="inline-flex items-center gap-1">
          <XCircle className="size-3.5 text-danger" aria-hidden /> Fout (overgeslagen)
        </span>
      </p>
    </form>
  );
}
