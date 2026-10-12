# Uploads weigeren bij een scannerfout

Bron: securityronde 12 oktober 14:00 UTC op main 0b73d06b. Een ClamAV-respons
met verdict `error` registreert een storing maar laat `assertUploadClean` slagen.
De document-, certificaat- en logo-upload kunnen daarna naar opslag doorgaan.
De bestaande synthetische test bevestigt dit; geen productie-incident aangetoond.

Scope: `src/lib/services/upload-scanner.ts`, bijbehorende tests en voortgang/backlog.
Scannerfouten moeten dezelfde expliciete fail-open-keuze volgen als netwerkfouten.
Noop en echte integratieconfiguratie blijven intact. Geen afhankelijkheden of UI.

Status: geïmplementeerd in #1576. Vier regressies falen op de oorspronkelijke code;
56 gerichte tests slagen na herstel. ERROR, lege en onbekende scannerrespons weigeren
standaard; expliciet fail-open laat een scannerfout door, maar nooit een besmet bestand.
Netwerkfouten, noop en schone bestanden behouden hun gedrag. Scannerrespons wordt niet
in de foutmelding of nieuwe logging opgenomen. Volledige validatie en onafhankelijke
review volgen; geen merge of live-verificatie.
