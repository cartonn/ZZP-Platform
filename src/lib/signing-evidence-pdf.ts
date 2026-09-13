import "server-only";
import { PDFDocument } from "pdf-lib";
import { buildModelAgreementPdf } from "@/lib/contract-pdf";
import { buildSigningOriginal, type loadSigningView } from "@/lib/signing-service";
import { hasLegacySigningGap, LegacySigningEvidenceError } from "@/lib/signing-contract";

type View = NonNullable<Awaited<ReturnType<typeof loadSigningView>>>;

export async function buildSigningEvidencePdf(view: View) {
  const { col, document, documentHash } = view;
  if (hasLegacySigningGap(col)) throw new LegacySigningEvidenceError();
  if (!col.signing) return buildSigningOriginal(document, documentHash);
  const record = col.signing;
  const evidence = await buildModelAgreementPdf({
    content: {
      title: "Ondertekenbewijs Handslag",
      type: document.content.type,
      typeLabel: "Gewone elektronische handtekening",
      intro:
        "Deze bijlage vermeldt de elektronische bevestigingen bij de oorspronkelijke overeenkomst op de voorafgaande pagina's. Het oorspronkelijke bestand is afzonderlijk beschikbaar in Handslag.",
      articles: [
        {
          heading: "Documentversie",
          body: [
            `Samenwerking: ${document.collaborationId}`,
            `Inhoudskenmerk (SHA-256 van de vastgelegde tekstgegevens): ${documentHash}`,
            `Oorspronkelijke PDF (SHA-256): ${record.pdfHash}`,
            `Vastgelegd: ${record.createdAt.toISOString()}`,
          ],
        },
        {
          heading: "Bevestiging",
          body: [
            document.consent,
            "De ondertekenaar bevestigde de overeenkomst te hebben gelezen en bevoegd te zijn om namens de vermelde partij te tekenen.",
            `Bevestigingstekst: ${document.consentVersion}`,
          ],
        },
        {
          heading: "Methode en betekenis",
          body: [
            document.signatureMethod,
            "De accountverwijzing, getypte naam en het tijdstip zijn door Handslag vastgelegd na een geslaagde extra wachtwoordcontrole. Wachtwoorden worden niet in dit bewijs bewaard.",
            "Dit PDF-pakket bevat geen gekwalificeerde PDF-handtekening, gekwalificeerd elektronisch zegel of gekwalificeerd tijdstempel. De hashes zijn inhoudskenmerken, geen identiteitcertificaat.",
            "Dit PDF-bestand bevat ook de oorspronkelijke tekstgegevens en handtekeningen als JSON-bijlagen. Bij tekens die het PDF-lettertype niet kan tonen, blijft de oorspronkelijke schrijfwijze daarin bewaard. Dezelfde gegevens zijn afzonderlijk te downloaden in Handslag.",
          ],
        },
        ...record.signatures.map((signature) => ({
          heading: signature.party === "CLIENT" ? "Opdrachtgever" : "Opdrachtnemer",
          body: [
            `Naam ondertekenaar: ${signature.signerName}`,
            `Accountverwijzing: ${signature.actorId}`,
            `Bewijsnummer: ${signature.id}`,
            `Ondertekend op (UTC): ${signature.signedAt.toISOString()}`,
            "Bevestigingsmethode: ingelogde sessie en opnieuw gecontroleerd wachtwoord.",
          ],
        })),
        {
          heading: "Status bij downloaden",
          body: [
            `Vastgelegde handtekeningen: ${record.signatures.length} van 2.`,
            `Samenwerking: ${col.disputedAt ? "betwist; geen nieuwe ondertekening toegestaan" : col.status === "CANCELLED" ? "geannuleerd" : col.status === "COMPLETED" ? "afgerond" : record.signatures.length === 2 ? "door beide partijen ondertekend" : "wacht op de andere partij"}.`,
            "Latere annulering of een geschil verwijdert de vastgelegde ondertekenhistorie niet.",
          ],
        },
      ],
      note: document.content.note,
    },
    reference: `Bijlage bij ${document.jobTitle}`,
    signatories: [],
    generatedAtLabel: new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" }),
  });
  const packet = await PDFDocument.load(record.documentPdf);
  const appendix = await PDFDocument.load(evidence);
  for (const page of await packet.copyPages(appendix, appendix.getPageIndices()))
    packet.addPage(page);
  packet.setTitle(`Overeenkomst en ondertekenbewijs - ${document.jobTitle}`);
  await packet.attach(
    Buffer.from(
      JSON.stringify({ documentHash, pdfHash: record.pdfHash, signatures: record.signatures }),
      "utf8",
    ),
    "handtekeningen.json",
    {
      mimeType: "application/json",
      description: "Vastgelegde handtekeningen bij de overeenkomst",
    },
  );
  return packet.save();
}
