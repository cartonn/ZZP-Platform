"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Seal } from "@/components/ui/seal";
import { Select } from "@/components/ui/select";
import {
  credentialReviewMethods,
  credentialReviewMethodLabel,
  type CredentialReviewMethod,
} from "@/lib/credential-review";
import {
  verifyCredentialState,
  rejectCredentialState,
} from "@/app/(protected)/admin/verificaties/actions";

const methodHelp: Record<
  CredentialReviewMethod,
  { text: string; url?: string; link?: string; authenticity: string }
> = {
  DIGITAL_VOG: {
    text: "Controleer de originele digitale VOG. Een foto, scan of afdruk is onvoldoende. Open zelf de overheidsvoorziening en beoordeel de uitslag; Handslag verstuurt geen bestand naar deze website.",
    url: "https://www.validatie.nl/",
    link: "Open validatie.nl",
    authenticity:
      "Ik heb dit originele PDF-bestand op validatie.nl gecontroleerd: uitgegeven door Justis en ongewijzigd.",
  },
  ORIGINAL_PAPER: {
    text: "Controleer het fysieke origineel persoonlijk, inclusief de echtheidskenmerken onder UV-licht. De geüploade afbeelding is alleen een dossierstuk en vervangt het origineel niet.",
    url: "https://www.justis.nl/producten/verklaring-omtrent-het-gedrag/informatie-over-de-vog-voor-werkgevers-en-organisaties/controleren-van-de-vog",
    link: "Bekijk de Justis-controle",
    authenticity:
      "Ik heb de echtheidskenmerken van het papieren origineel persoonlijk gecontroleerd, ook onder UV-licht.",
  },
  DUO_EXTRACT: {
    text: "Vraag een recent origineel PDF-uittreksel uit Mijn diploma’s. Controleer het zelf via DUO; een foto of scan is geen digitaal uittreksel. Niet ieder geldig diploma staat bij DUO: kies dan de uitgevende instantie.",
    url: "https://duo.nl/zakelijk/diploma/diplomas/digitaal-diploma-controleren.jsp",
    link: "Open DUO-diplomacontrole",
    authenticity:
      "Ik heb dit originele PDF-uittreksel met de DUO-controle gecontroleerd en de positieve uitslag gelezen.",
  },
  ISSUER: {
    text: "Controleer bij de uitgevende instantie of in het officiële register of dit bewijsstuk echt is en bij deze persoon hoort. Gebruik contactgegevens uit een onafhankelijke bron.",
    authenticity:
      "Ik heb de uitgevende instantie of het officiële register gecontroleerd; het bewijsstuk is bevestigd.",
  },
};

export function CredentialReviewForm({
  credentialId,
  type,
  updatedAt,
  documentId,
  onResolved,
}: {
  credentialId: string;
  type: string;
  updatedAt: string;
  documentId: string | null;
  onResolved?: () => void;
}) {
  const id = useId();
  const methods = credentialReviewMethods(type);
  const [method, setMethod] = useState<CredentialReviewMethod>(methods[0] ?? "ISSUER");
  const [rejecting, setRejecting] = useState(false);
  const [approved, approve, approving] = useActionState(
    verifyCredentialState.bind(null, credentialId),
    undefined,
  );
  const [rejected, reject, rejectPending] = useActionState(
    rejectCredentialState.bind(null, credentialId),
    undefined,
  );
  const done = (approved && "ok" in approved) || (rejected && "ok" in rejected);
  useEffect(() => {
    if (done) onResolved?.();
  }, [done, onResolved]);
  if (done)
    return (
      <p role="status" className="flex items-center gap-2 text-sm">
        <Seal tone={approved && "ok" in approved ? "verified" : "pending"} />
        Beoordeling opgeslagen.
      </p>
    );
  const help = methodHelp[method];
  const hidden = (
    <>
      <input type="hidden" name="updatedAt" value={updatedAt} />
      <input type="hidden" name="documentId" value={documentId ?? ""} />
    </>
  );
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-start gap-3">
        <Seal tone="pending" size="lg" />
        <div>
          <h3 className="font-semibold">Van bewijsstuk naar vertrouwen</h3>
          <p className="text-sm text-muted-foreground">
            Leg vast wat je daadwerkelijk hebt gecontroleerd. Alleen na je beoordeling verschijnt
            het oranje zegel.
          </p>
        </div>
      </div>
      <form action={approve} className="space-y-4">
        {hidden}
        <div className="space-y-2">
          <label htmlFor={`${id}-method`} className="text-sm font-medium">
            Controlemethode
          </label>
          <Select
            id={`${id}-method`}
            name="reviewMethod"
            value={method}
            onChange={(e) => setMethod(e.target.value as CredentialReviewMethod)}
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {credentialReviewMethodLabel(m)}
              </option>
            ))}
          </Select>
          <p className="text-sm text-muted-foreground">{help.text}</p>
          {help.url && (
            <a
              className="focus-ring inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
              href={help.url}
              target="_blank"
              rel="noreferrer"
            >
              {help.link} ↗
            </a>
          )}
        </div>
        <fieldset key={method} className="divide-y divide-border rounded-lg border border-border">
          <legend className="px-2 text-sm font-medium">Vier controles, één besluit</legend>
          {[
            [
              "original",
              method === "ORIGINAL_PAPER"
                ? "Ik heb het fysieke origineel persoonlijk gezien."
                : "Ik heb het originele bewijsstuk geopend en gelezen.",
            ],
            ["person", "De persoon op het bewijsstuk komt overeen met de indiener."],
            ["authenticity", help.authenticity],
            [
              "scope",
              type === "VOG"
                ? "Functie, organisatie en screeningsprofiel kloppen voor het beoogde gebruik; de herbeoordelingsdatum is passend."
                : "Titel, uitgever en datums kloppen en de bevoegdheid of dekking past bij het beoogde gebruik.",
            ],
          ].map(([name, label]) => (
            <label
              key={name}
              className="flex min-h-11 cursor-pointer items-start gap-3 px-3 py-3 text-sm"
            >
              <input
                type="checkbox"
                name={name}
                required
                className="focus-ring mt-0.5 size-5 shrink-0 accent-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <div className="space-y-1">
          <label htmlFor={`${id}-note`} className="text-sm font-medium">
            Controletoelichting (optioneel)
          </label>
          <textarea
            id={`${id}-note`}
            name="reviewNote"
            rows={2}
            maxLength={300}
            className="focus-ring w-full rounded-lg border border-input bg-background p-3 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Alleen methode en uitkomst. Geen BSN, documentnummers of inhoud uit de VOG overnemen.
          </p>
        </div>
        {type === "VOG" && (
          <p className="text-xs text-muted-foreground">
            Een VOG heeft geen algemene vervaldatum. De gekozen herbeoordelingsdatum is een
            beleidsafspraak. Het bestaande bewaarbeleid verwijdert het bestand na beoordeling,
            tenzij daarvoor bewust een uitzondering is ingesteld.
          </p>
        )}
        {!documentId && (
          <p role="alert" className="text-sm text-danger">
            Een bewijsstuk ontbreekt. Vraag eerst een nieuw document.
          </p>
        )}
        {approved && "error" in approved && (
          <p role="alert" className="text-sm text-danger">
            {approved.error}
          </p>
        )}
        <Button
          type="submit"
          disabled={approving || rejectPending || !documentId}
          className="w-full sm:w-auto"
        >
          {approving ? "Beoordeling opslaan…" : "Goedkeuren"}
        </Button>
      </form>
      <Button
        type="button"
        variant="destructive"
        onClick={() => setRejecting(!rejecting)}
        aria-expanded={rejecting}
      >
        Afwijzen…
      </Button>
      {rejecting && (
        <form action={reject} className="space-y-2">
          {hidden}
          <label htmlFor={`${id}-reason`} className="text-sm font-medium">
            Reden van afwijzing
          </label>
          <textarea
            id={`${id}-reason`}
            name="reason"
            required
            minLength={3}
            maxLength={500}
            rows={3}
            className="focus-ring w-full rounded-lg border border-input bg-background p-3 text-sm"
          />
          {rejected && "error" in rejected && (
            <p role="alert" className="text-sm text-danger">
              {rejected.error}
            </p>
          )}
          <Button type="submit" variant="danger" disabled={rejectPending || approving}>
            {rejectPending ? "Opslaan…" : "Bevestig afwijzing"}
          </Button>
        </form>
      )}
    </div>
  );
}
