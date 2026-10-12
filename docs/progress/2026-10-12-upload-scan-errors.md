# Uploads weigeren bij een scannerfout

Bron: securityronde 12 oktober 14:00 UTC op main 0b73d06b. Een ClamAV-respons
met verdict `error` registreert een storing maar laat `assertUploadClean` slagen.
De document-, certificaat- en logo-upload kunnen daarna naar opslag doorgaan.
De bestaande synthetische test bevestigt dit; geen productie-incident aangetoond.

Scope: `src/lib/services/upload-scanner.ts`, bijbehorende tests en voortgang/backlog.
Scannerfouten moeten dezelfde expliciete fail-open-keuze volgen als netwerkfouten.
Noop en echte integratieconfiguratie blijven intact. Geen afhankelijkheden of UI.

Status: geclaimd; implementatie, regressie, volledige validatie en onafhankelijke
review volgen. Geen merge of live-verificatie.
