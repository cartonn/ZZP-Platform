# Expliciete demo-instelling voor gebruikersflow-QA

Claim vóór implementatie, 15 september 2026. Vervolg op eigenaaropdracht en #1495.
Basis `cf6874284feb4bc73cc4f99fba3b6a4c24c19f97`.

QA-run 34961111239 faalt reproduceerbaar in twee abonnementsgerelateerde proeven:
de workflow seedt demo-accounts maar zet DEPLOYMENT_STAGE niet op demo. De nieuwe
serverguard weigert daarom terecht betaalde demo-upgrades zonder echte provider.
De reguliere CI heeft deze expliciete demo-instelling al wel. Daarnaast verwacht de
QA-tekstcontrole nog de oude formulering over het omzetpercentage.

Herstel alleen de QA-configuratie en verwachtingen; geen productieguard versoepelen,
geen skip toevoegen, geen provider of echte omgeving wijzigen. Controleer de volledige
QA-suite op de herstelbranch vóór samenvoegen, naast de gewone mergepoorten.
