# Expliciete demo-instelling voor gebruikersflow-QA

Claim vóór implementatie, 15 september 2026. Vervolg op eigenaaropdracht en #1495.
Basis `cf6874284feb4bc73cc4f99fba3b6a4c24c19f97`.

QA-run 34961111239 faalt reproduceerbaar in twee abonnementsgerelateerde proeven:
de workflow seedt demo-accounts maar zet DEPLOYMENT_STAGE niet op demo. De nieuwe
serverguard weigert daarom terecht betaalde demo-upgrades zonder echte provider.
De reguliere CI heeft deze expliciete demo-instelling al wel. De bestaande
tekstcontrole over het omzetpercentage blijft behouden.

Herstel alleen de QA-configuratie en verwachtingen; geen productieguard versoepelen,
geen skip toevoegen, geen provider of echte omgeving wijzigen. Controleer de volledige
QA-suite op de herstelbranch vóór samenvoegen, naast de gewone mergepoorten.

De onafhankelijke review van de eerste herstelhead vond een onjuiste wijziging van
de footer-verwachting. Die verwachting is teruggezet naar de werkelijke paginatekst.
De enige uitvoeringswijziging blijft de expliciete demo-instelling; twee extra
bannercontroles bewijzen die testvoorwaarde vóór de demo-upgrade.
