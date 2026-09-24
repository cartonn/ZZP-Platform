# VOG opnieuw ter beoordeling: bewijs behouden

Op basis `90143b5f` reproduceren echte acties met tijdelijke SQLite een sequentieel
verlies van bewijs: afwijzen met tijdelijk mislukte blobverwijdering, opnieuw
verificatie aanvragen, daarna de opruimtaak uitvoeren. De nieuwe SUBMITTED-aanvraag
behoudt de oude evidenceSeenAt; de taak verwijdert haar nog benodigde document.
De coördinator heeft de afzonderlijke reproductie opnieuw uitgevoerd.

Claim: bestaande bewijsreset toepassen bij requestVerification en deze werkelijke
actievolgorde bewaken met een regressie. Geen nieuw bewaarbeleid of integraties.
Scope: certificaten/actions.ts, gerichte actietest en voortgangsdocumentatie.
Dit bewijst een sequentiële fout, geen algemene veiligheid tegen gelijktijdige cleanup.
Implementatie, onafhankelijke review en alle releasepoorten volgen afzonderlijk.
