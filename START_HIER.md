# START_HIER.md — Hoe je dit pakket gebruikt in Claude Code

Dit pakket houdt Claude Code op koers over een groot project zonder dat het verzandt
in context-overflow. Het is hetzelfde patroon dat bij ReOS werkte (CLAUDE.md /
CURRENT_TASK.md), nu toegespitst op ZZP Platform.

## De bestanden

| Bestand           | Rol                                                                      |
| ----------------- | ------------------------------------------------------------------------ |
| `CLAUDE.md`       | Persistente context + regels. Wordt elke sessie gelezen. Wijzigt zelden. |
| `BUILD_ORDER.md`  | De volledige bouwvolgorde in 11 sessies (0 t/m 10).                      |
| `CURRENT_TASK.md` | Wat je NU doet. Schuift door naar de volgende sessie als een blok af is. |
| `PROGRESS.md`     | Logboek van wat af is. Bijwerken aan het eind van elke sessie.           |

## Eenmalige setup

1. Maak een lege map voor het project (of gebruik je bestaande `zzp-platform`).
2. Leg deze vier `.md`-bestanden in de root.
3. Open de map in Claude Code.

## Elke sessie — vaste routine

**Begin** door dit te plakken in Claude Code:

```
Lees CLAUDE.md, CURRENT_TASK.md en PROGRESS.md. Vat in 3 zinnen samen wat we
nu gaan doen en waar we staan. Begin daarna met de taak in CURRENT_TASK.md.
Volg de architectuurregels strikt. Schrijf tests naast de code. Draai
typecheck/lint/test voordat je iets als af beschouwt. Niet vooruitlopen op
latere sessies.
```

**Tijdens** de sessie: laat Claude Code de QUALITY_CHECKLIST (onderaan CURRENT_TASK.md)
draaien voordat het iets afvinkt. Als een check faalt, laat het de oorzaak fixen,
niet omzeilen.

**Einde** sessie, plak dit:

```
Werk PROGRESS.md bij met wat af is (bestanden, tests, checks). Schuif
CURRENT_TASK.md door naar het volgende blok uit BUILD_ORDER.md. Commit met een
duidelijke message. Vat in 3 bullets samen wat er nog open staat.
```

## Waarom dit werkt

- **Eén taak per sessie** houdt de diff behapbaar en de context klein.
- **PROGRESS.md** is het geheugen tussen sessies — Claude Code hoeft niet de hele
  codebase opnieuw in te lezen om te weten waar je staat.
- **De regels in CLAUDE.md** voorkomen drift: server-side waarheid, auth-keten,
  transitie-map, privé documenten. Dit zijn precies de dingen die bij een platform
  met gevoelige documenten fout mogen gaan.

## Wat dit pakket NIET regelt (bewust)

Deployen, infra (Postgres/S3/mail/domein), secrets, en de security-review vóór
livegang met echte klanten. Dat is mensenwerk. Zie het laatste blok van BUILD_ORDER.md.
Bouw eerst de applicatie lokaal werkend en getest; pak daarna de productie-stap op.

## Tip voor je pilot

Na **Sessie 5** heb je de volledige kerndifferentiatie werkend: opdracht → reactie →
admin verifieert certificaat → opdrachtgever ziet compliance. Dat is je demo voor
Idris en Edwin — een werkende flow die je verhaal draagt, niet dertig halve schermen.
Overweeg daar een tussenstop te maken en te tonen vóór je doorbouwt.
