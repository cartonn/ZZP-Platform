// Deterministische kennisbank voor de Support-assistent: per intentie één duidelijk,
// zelfbedienend antwoord met de juiste vervolgactie/link. Pure functie, geen externe call.
// Geen "AI" in teksten. Antwoorden verwijzen alleen naar eigen schermen van de gebruiker.

import { type SupportIntent } from "@/lib/support/triage";

const ANSWERS: Record<SupportIntent, string | null> = {
  INVOICE_STATUS:
    "Je vindt de status van al je facturen onder Facturen, en openstaande posten onder Openstaand. " +
    "Een factuur doorloopt: concept → ingediend → goedgekeurd → betaald. Betalingen lopen rechtstreeks " +
    "tussen jou en de opdrachtgever; het platform houdt alleen de status bij. Klopt er iets niet aan een " +
    "specifieke factuur? Beschrijf het factuurnummer, dan kijkt een medewerker mee.",
  CREDENTIAL_STATUS:
    "Je certificaten en hun verificatiestatus staan onder Certificaten. Een certificaat gaat van concept → " +
    "ingediend → geverifieerd of afgewezen. Bij afwijzing zie je altijd de reden en kun je een nieuw " +
    "bewijsstuk uploaden. Een diploma kun je ook direct via DUO laten verifiëren, een BIG-registratie via het " +
    "BIG-register.",
  PASSWORD_RESET:
    "Wachtwoord vergeten of kun je niet inloggen? Gebruik 'Wachtwoord vergeten' op de inlogpagina; je ontvangt " +
    "een herstelkoppeling per e-mail (controleer ook je spam). De koppeling is één uur geldig en eenmalig te " +
    "gebruiken. Lukt het daarna nog niet, dan schakelen we een medewerker in.",
  JOB_HELP:
    "Opdrachten vind je onder Opdrachten; reageren doe je met een motivatie. Je ziet je eigen reacties onder " +
    "Mijn reacties, met de status (nieuw, bekeken, shortlist, geaccepteerd of afgewezen). De match-uitleg laat " +
    "zien waarom een opdracht bij je past.",
  ACCOUNT_HELP:
    "Je accountgegevens en privacy-instellingen beheer je onder Account; je profiel onder Mijn profiel. Je " +
    "abonnement (en wat elke tier ontsluit) staat onder Abonnement.",
  PRIVACY_REQUEST: null, // gevoelig → altijd een mens (escaleren)
  GENERAL: null, //         te algemeen → een mens kijkt mee
};

/** Geeft het kant-en-klare antwoord voor een intentie, of null als een mens nodig is. */
export function knowledgeAnswer(intent: SupportIntent): string | null {
  return ANSWERS[intent] ?? null;
}

/** De weergavenaam van de geautomatiseerde beantwoorder (nooit het woord "AI"). */
export const ASSISTANT_NAME = "Support-assistent";
