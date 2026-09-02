// Demo-content: realistische NL gespreks- en support-ticket-threads voor de seed. Pure data, geen
// logica. prisma/seed.ts maakt hieruit Conversations/Messages en SupportTickets aan (idempotent op
// id). Inhoud is met de hand nagelezen; bevat bewust geen verwijzing naar automatisering.
//
// De ids zijn bewust stabiel gehouden (ook waar de oude naam nog naar een niet-zorg onderwerp
// verwijst), zodat een bestaande demo-database geen dubbele threads krijgt. Alleen de inhoud,
// de opdrachtgever-sleutel (ck/owner) en de gekoppelde dienst (jobId) zijn zorg geworden.

export interface SeedConvMessage {
  from: "freelancer" | "client";
  daysAgo: number;
  body: string;
}
export interface SeedConversation {
  id: string;
  /** freelancer-key in de uid-map */
  fk: string;
  /** client-key in de clientUserIdByKey-map */
  ck: string;
  jobId: string;
  /** true => laat de tegenpartij van de laatste afzender een ongelezen-badge zien */
  badge: boolean;
  messages: SeedConvMessage[];
}
export interface SeedTicketMessage {
  authorKind: "USER" | "ASSISTANT" | "AGENT";
  daysAgo: number;
  body: string;
}
export interface SeedTicket {
  id: string;
  /** freelancer-key (uid) of client-key (clientUserIdByKey) */
  owner: string;
  role: "freelancer" | "client";
  category: string;
  status: string;
  subject: string;
  messages: SeedTicketMessage[];
}

export const SEED_CONVERSATIONS: SeedConversation[] = [
  {
    id: "c-sanne-react",
    fk: "sanne",
    ck: "jansen",
    jobId: "job-1",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 6,
        body: "Hoi Sanne, bedankt voor je reactie op de dienst Verpleegkundige somatiek! Je profiel sluit goed aan, vooral je ervaring op somatische afdelingen. Heb je deze week even tijd voor een korte kennismaking?",
      },
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Hoi Mark, leuk om te horen! Ja zeker. Donderdag of vrijdag past goed bij mij, het liefst in de ochtend.",
      },
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Mag ook een korte videocall zijn als dat voor jullie makkelijker is.",
      },
      {
        from: "client",
        daysAgo: 5,
        body: "Top, laten we donderdag om 10:00 doen via een videocall. Het gaat om inzet op onze somatische afdeling met dag- en avonddiensten, ongeveer 32 uur per week. Wat hanteer jij als uurtarief?",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Donderdag 10:00 staat genoteerd. Mijn tarief is 58 euro per uur excl. btw, en ik factureer per twee weken met een betaaltermijn van 14 dagen. Een recente VOG en mijn BIG-registratie kan ik desgewenst aanleveren.",
      },
      {
        from: "client",
        daysAgo: 4,
        body: "Helder, dat klinkt prima. Een VOG en je BIG-registratie zijn inderdaad welkom voor we starten. Ik stuur zo de uitnodiging voor donderdag. Tot dan, Sanne!",
      },
    ],
  },
  {
    id: "c-anna-react",
    fk: "anna",
    ck: "ghz",
    jobId: "job-16",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 5,
        body: "Hoi Anna! Leuk dat je op de shortlist staat voor de ambulante jeugdzorgrol. We willen graag door, maar voor de zekerheid: hoe staat het met je VOG-aanvraag?",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Hoi Sandra, dank je! Goed nieuws. Ik heb de VOG vorige week aangevraagd en de status is inmiddels 'in behandeling'.",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Doorgaans duurt het zo'n 1 tot 2 weken. Ik verwacht 'm dus begin volgende week binnen te hebben. Mijn SKJ-registratie is trouwens actueel.",
      },
      {
        from: "client",
        daysAgo: 4,
        body: "Top, dat past mooi. We willen je graag laten starten in de week van maandag de 8e. Lukt het je om de VOG voor die tijd aan te leveren? Zonder goedgekeurde VOG mogen we je niet bij gezinnen inzetten.",
      },
      {
        from: "client",
        daysAgo: 4,
        body: "En zou je het tarief van 55 euro per uur kunnen bevestigen, met een betaaltermijn van 30 dagen?",
      },
      {
        from: "freelancer",
        daysAgo: 2,
        body: "De 8e moet prima lukken, ik houd je op de hoogte zodra de VOG binnen is. En ja, 55 euro per uur en 30 dagen betaaltermijn kloppen helemaal. Ik kijk uit naar de start!",
      },
    ],
  },
  {
    id: "c-lisa-pm",
    fk: "lisa",
    ck: "ziekenhuis",
    jobId: "job-3",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 9,
        body: "Hoi Lisa, ik zag je profiel langskomen voor de spreekuren op onze polikliniek. Lijkt me goed om even kennis te maken. Heb je deze week ergens ruimte?",
      },
      {
        from: "freelancer",
        daysAgo: 9,
        body: "Hi Erik, leuk! Donderdag rond 14:00 zou bij mij passen, of anders vrijdagochtend. Wat komt jou het beste uit?",
      },
      {
        from: "client",
        daysAgo: 8,
        body: "Donderdag 14:00 is top. Ik stuur je zo een belafspraak. Kun je qua tarief en beschikbaarheid alvast een richting geven?",
      },
      {
        from: "freelancer",
        daysAgo: 8,
        body: "Zeker. Ik werk meestal op basis van 72 euro per uur excl. btw, met een betaaltermijn van 14 dagen. Ik ben beschikbaar voor 32 uur per week en kan in principe starten zodra het spreekuurrooster rond is.",
      },
      {
        from: "freelancer",
        daysAgo: 8,
        body: "Mijn VOG is trouwens recent, dus die kan ik meteen aanleveren als jullie dat nodig hebben.",
      },
      {
        from: "client",
        daysAgo: 7,
        body: "Helder, dat tarief en die uren werken prima voor ons. Fijn dat de VOG al rond is. Dan spreken we elkaar donderdag en kijken we of je kunt starten in de week van maandag 8 juni. Tot dan!",
      },
    ],
  },
  {
    id: "c-youssef-node",
    fk: "youssef",
    ck: "ziekenhuis",
    jobId: "job-2",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 9,
        body: "Hi Youssef, leuk dat je aan boord komt op de PAAZ! We willen graag snel starten. Schikt een kennismaking op de afdeling komende dinsdag 10:00?",
      },
      {
        from: "freelancer",
        daysAgo: 9,
        body: "Hi Erik, super! Dinsdag 10:00 komt prima uit. Ik blok het meteen in.",
      },
      {
        from: "freelancer",
        daysAgo: 8,
        body: "Voor de zekerheid: het afgesproken tarief is 68 euro per uur excl. btw en jullie hanteren 14 dagen betaaltermijn, klopt dat?",
      },
      {
        from: "client",
        daysAgo: 8,
        body: "Klopt helemaal, 68 euro en 14 dagen. We roosteren in blokken van twee weken; je eerste blok start meteen na de kennismaking. Kun je je VOG en BIG-registratie aanleveren? Dan zet ik de toegang tot het dossiersysteem en je toegangspas vast klaar.",
      },
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Mijn VOG is geldig en mijn BIG-registratie staat in mijn dossier; ik deel ze vandaag met jullie. Kun jij dan de pas en een inwerkdienst met een vaste collega regelen? Dan kan ik dinsdag direct meedraaien.",
      },
      {
        from: "client",
        daysAgo: 5,
        body: "Top, beide ontvangen, dank! Je pas ligt klaar bij de receptie en je draait dinsdag mee met Marieke van het vaste team. Tot dinsdag!",
      },
      {
        from: "freelancer",
        daysAgo: 4,
        body: "Perfect, alles binnen. Ik heb het afdelingsprotocol en de dienstenroulatie alvast doorgenomen, dus dinsdag kunnen we los. Tot dan, Erik!",
      },
    ],
  },
  {
    id: "c-daan-monteur",
    fk: "daan",
    ck: "ggz",
    jobId: "job-5",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 6,
        body: "Hoi Daan, bedankt voor je reactie op de dienst bij de crisisdienst! Je profiel ziet er goed uit, vooral je ervaring in de acute zorg. We zoeken versterking voor de avond- en nachtdiensten in de regio Zwolle. Heb je momenteel ruimte?",
      },
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Hi Henk, leuk dat je reageert. Ja, ik heb vanaf volgende week ruimte. Wat hebben jullie qua diensten voor ogen?",
      },
      {
        from: "client",
        daysAgo: 5,
        body: "We zoeken iemand voor 3 a 4 diensten per week, voorlopig voor zo'n 2 maanden. Eén ding nog: een geldige VOG is bij ons verplicht voordat je meedraait. Heb jij die op zak?",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Ja hoor, mijn VOG is nog ruim een jaar geldig en staat in mijn dossier. Ik kan hem meteen met jullie delen als dat handig is.",
      },
      {
        from: "freelancer",
        daysAgo: 4,
        body: "Qua tarief zit ik op 68 euro per uur excl. btw, met de gebruikelijke onregelmatigheidstoeslag op de nachtdiensten. Wat mij betreft kan ik maandag al starten.",
      },
      {
        from: "client",
        daysAgo: 3,
        body: "Top, dat tarief is prima. Laten we maandag 09:00 op de locatie afspreken, dan loop ik je mee met de dienstdoend psychiater. Deel je je VOG en KvK-nummer vast? Onze betaaltermijn is 14 dagen. Tot maandag!",
      },
    ],
  },
  {
    id: "c-emma-wijk",
    fk: "emma",
    ck: "zorggroep",
    jobId: "job-8",
    badge: false,
    messages: [
      {
        from: "client",
        daysAgo: 9,
        body: "Hoi Emma, je laatste factuur is vanmorgen goedgekeurd en gaat morgen de deur uit. Betaaltermijn is 14 dagen, dus hij staat ruim binnen die tijd op je rekening.",
      },
      {
        from: "freelancer",
        daysAgo: 9,
        body: "Top, dank je wel Petra! Helemaal duidelijk.",
      },
      {
        from: "freelancer",
        daysAgo: 8,
        body: "Ik heb de overdracht van mijn cliënten in de wijk afgerond en alles in het zorgdossier bijgewerkt. Bij vragen over een specifieke route mogen jullie me altijd bellen.",
      },
      {
        from: "client",
        daysAgo: 6,
        body: "Heel fijn, dat scheelt het team enorm. We hebben echt prettig met je samengewerkt deze maanden. Mocht er weer ruimte komen op de dinsdag- en donderdagdienst, dan weet ik je te vinden.",
      },
      {
        from: "client",
        daysAgo: 5,
        body: "En de betaling is trouwens net binnengekomen, dus daarmee is alles netjes rond.",
      },
      {
        from: "freelancer",
        daysAgo: 4,
        body: "Gezien, klopt helemaal. Dankjewel voor de fijne samenwerking en het vertrouwen, Petra. Die dinsdag en donderdag hou ik zeker in gedachten. Tot een volgende keer!",
      },
    ],
  },
  {
    id: "c-rik-bouw",
    fk: "rik",
    ck: "jansen",
    jobId: "job-11",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 9,
        body: "Hoi Rik, even afstemmen voor de komende weken. Volgende week start het nieuwe behandelblok op de revalidatieafdeling. Kun jij maandag aanwezig zijn voor de start?",
      },
      {
        from: "freelancer",
        daysAgo: 9,
        body: "Hoi Mark, ja maandag werkt prima. Ik kan er om 7:30 zijn voor de overdracht met het behandelteam. Werkt dat?",
      },
      {
        from: "freelancer",
        daysAgo: 9,
        body: "Klein puntje: mijn registratie in het Kwaliteitsregister Fysiotherapie loopt eind volgende maand af. Ik ben de verlenging al aan het regelen, dus dat komt op tijd in orde.",
      },
      {
        from: "client",
        daysAgo: 8,
        body: "Top, 7:30 is prima. En goed dat je het zelf aangeeft van die registratie; deel het nieuwe bewijs even zodra je het binnen hebt, anders loopt je inzetbaarheid vast.",
      },
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Doe ik. Voor de planning: in week 3 kom ik de woensdag erbij voor het multidisciplinair overleg, dan ben ik 4 dagen die week. Tarief blijft de afgesproken 65 per uur.",
      },
      {
        from: "client",
        daysAgo: 5,
        body: "Akkoord met die extra woensdag, prima. Dien je de uren per twee weken in via het platform? Dan houden we de betaaltermijn van 14 dagen aan.",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Helder, per twee weken indienen. Dan zie ik je maandag op de afdeling.",
      },
      {
        from: "client",
        daysAgo: 4,
        body: "Perfect, tot maandag Rik. Fijn weekend alvast.",
      },
    ],
  },
  {
    id: "c-sofie-fullstack",
    fk: "sofie",
    ck: "jansen",
    jobId: "job-14",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 5,
        body: "Hoi Sofie, ik heb je urenstaat van vorige week bekeken maar moet 'm helaas afkeuren. Niks ergs, een paar dingen kloppen niet helemaal.",
      },
      {
        from: "client",
        daysAgo: 5,
        body: "Op donderdag staan er 9 uur, maar volgens het rooster liep je dienst tot 23:00 (dus 7,5 uur). En de uren van dinsdag staan als dagdienst geboekt, terwijl het een nachtdienst was — daar hoort de onregelmatigheidstoeslag bij.",
      },
      {
        from: "freelancer",
        daysAgo: 4,
        body: "Hoi Mark, dank voor het meekijken! Je hebt gelijk over donderdag, ik ben die avond eerder weggegaan. Ik pas 'm aan naar 7,5 uur.",
      },
      {
        from: "freelancer",
        daysAgo: 4,
        body: "De dinsdag zet ik om naar een nachtdienst met ORT. Klopt het dat de woensdag (5,5 uur avonddienst) wel goed stond? Dan dien ik 'm vanmiddag opnieuw in.",
      },
      {
        from: "client",
        daysAgo: 3,
        body: "Top, woensdag was inderdaad prima. Als die twee dingen aangepast zijn keur ik 'm meteen goed, dan loopt de betaling gewoon mee in de termijn van 30 dagen. Thanks Sofie!",
      },
    ],
  },
  {
    id: "c-nadia-scrum",
    fk: "nadia",
    ck: "ggz",
    jobId: "job-5",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 9,
        body: "Hoi Nadia, welkom bij het team! Fijn dat je de crisisdienst komt versterken. Zullen we je eerste dienstenblok en de overdrachten even afstemmen?",
      },
      {
        from: "freelancer",
        daysAgo: 9,
        body: "Hoi Henk, dank je! Helemaal goed. Ik stel blokken van twee weken voor, met de roosterafstemming op maandagochtend en een evaluatie op vrijdagmiddag. Werkt dat ritme voor jullie?",
      },
      {
        from: "client",
        daysAgo: 8,
        body: "Dat klinkt prima. De overdracht met de dienstdoend psychiater is standaard om 9:30, dus die maandagochtend past goed.",
      },
      {
        from: "freelancer",
        daysAgo: 8,
        body: "Top, dan zet ik de roosterafstemming op maandag 9:30 en sluit ik aan bij de dagelijkse overdracht om 9:15. Evaluatie vrijdag om 14:00.",
      },
      {
        from: "freelancer",
        daysAgo: 8,
        body: "Even voor de administratie: mijn tarief is 66 euro per uur excl. btw, betaaltermijn 14 dagen. Mijn VOG loopt binnenkort af; de nieuwe heb ik al aangevraagd en die deel ik zodra hij binnen is.",
      },
      {
        from: "client",
        daysAgo: 7,
        body: "Helder, akkoord met het tarief en de termijn. De nieuwe VOG ontvang ik graag zodra je hem hebt, anders blokkeert het systeem je inzet. Dan zie ik je maandag bij de eerste overdracht!",
      },
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Perfect, ik zet de overdrachten vast in mijn agenda en neem de crisisprotocollen alvast door. Tot maandag!",
      },
    ],
  },
  {
    id: "c-kevin-supply",
    fk: "kevin",
    ck: "ghz",
    jobId: "job-12",
    badge: true,
    messages: [
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Hoi Sandra, ik zag dat je mijn uren van de afgelopen periode hebt goedgekeurd, top! Dank daarvoor.",
      },
      {
        from: "client",
        daysAgo: 6,
        body: "Hi Kevin, graag gedaan. Het team is erg te spreken over hoe je de dagbesteding hebt opgepakt, daar kunnen we echt mee verder.",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Fijn om te horen. Ik ga dan de factuur indienen voor die 38 uur tegen het afgesproken tarief van 46 euro.",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Klopt het dat jullie betaaltermijn 30 dagen is? Dan zet ik dat er goed op.",
      },
      {
        from: "client",
        daysAgo: 4,
        body: "Ja dat klopt, 30 dagen netto. Kun je hem op naam zetten van Stichting De Wingerd en mij in de cc zetten? Dan houdt onze administratie hem ook in de gaten.",
      },
      {
        from: "freelancer",
        daysAgo: 3,
        body: "Helemaal goed, doe ik. Factuur staat op naam van Stichting De Wingerd en je hebt hem net binnengekregen. Ik plan komende dinsdag alvast even in om het rooster van de volgende periode door te nemen.",
      },
    ],
  },
  {
    id: "c-bram-data",
    fk: "bram",
    ck: "zorggroep",
    jobId: "job-17",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 9,
        body: "Hi Bram, de laatste factuur is gisteren betaald, ruim binnen de 14 dagen. Bedankt voor het zorgvuldige werk op de indicatiestellingen!",
      },
      {
        from: "client",
        daysAgo: 9,
        body: "We zijn echt tevreden. Ik wil je graag een beoordeling geven op je profiel als je dat fijn vindt.",
      },
      {
        from: "freelancer",
        daysAgo: 9,
        body: "Top dat de betaling rond is, dank! En ja heel graag, een beoordeling zou ik erg waarderen.",
      },
      {
        from: "freelancer",
        daysAgo: 8,
        body: "Fijn om te horen dat het goed bevallen is. Het was mooi om de wachtlijst voor de herindicaties eindelijk weggewerkt te krijgen.",
      },
      {
        from: "client",
        daysAgo: 6,
        body: "De beoordeling staat erop. We hebben trouwens vanaf volgende maand capaciteit nodig voor de complexe wondzorg in de wijk, ongeveer 2 dagen per week. Zou je daar interesse in hebben?",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Zeker interesse! 2 dagen per week past goed. Mijn tarief is 62 per uur, en ik kan vanaf de week van 9 juni starten. Zullen we volgende week even bellen om de caseload door te nemen?",
      },
      {
        from: "client",
        daysAgo: 4,
        body: "Helemaal goed, tarief is prima. Ik prik donderdag 10:00 voor een belletje, dan loop ik de routes met je door. Tot dan!",
      },
    ],
  },
  {
    id: "c-ahmed-elektro",
    fk: "ahmed",
    ck: "ggz",
    jobId: "job-10",
    badge: false,
    messages: [
      {
        from: "client",
        daysAgo: 6,
        body: "Ahmed, de nachtdiensten van afgelopen weken zijn goed verlopen. Het team is te spreken over je rapportages en de rust die je meebrengt op de locatie. Bedankt voor je inzet!",
      },
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Dank je Henk, fijn om te horen. Was een mooie periode. De overdrachten heb ik allemaal in het cliëntdossier bijgewerkt.",
      },
      {
        from: "client",
        daysAgo: 5,
        body: "Helemaal goed. Je factuur is binnen, die zetten we vandaag klaar.",
      },
      {
        from: "client",
        daysAgo: 2,
        body: "Betaling is verstuurd, ruim binnen de 14 dagen. Staat morgen op je rekening.",
      },
      {
        from: "freelancer",
        daysAgo: 1,
        body: "Top, hij staat erop. Bedankt voor de prettige samenwerking en de duidelijke begeleiding vanuit het team.",
      },
      {
        from: "freelancer",
        daysAgo: 1,
        body: "Mocht er weer een nachtdienstenblok aankomen, hoor ik het graag. Ik dien deze week een nieuwe VOG in, dan is mijn dossier weer compleet.",
      },
    ],
  },
  {
    id: "c-tom-cloud",
    fk: "tom",
    ck: "ziekenhuis",
    jobId: "job-6",
    badge: true,
    messages: [
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Hoi Erik, ik heb net mijn uren van afgelopen periode ingediend. Wilde even kort checken of alles zo duidelijk is voor jullie.",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Stond op 32 uur deze week, voornamelijk instrumenteren bij het orthopedieprogramma op OK 3.",
      },
      {
        from: "client",
        daysAgo: 4,
        body: "Hoi Tom, top dat je het oppakt. Ik zie de uren binnenkomen, ziet er goed uit. De omschrijving is helder genoeg voor de goedkeuring.",
      },
      {
        from: "client",
        daysAgo: 4,
        body: "Eén ding: kun je bij de uren nog kort het OK-nummer erbij zetten? Dan kan de administratie het makkelijker matchen. Betaaltermijn blijft 30 dagen na akkoord.",
      },
      {
        from: "freelancer",
        daysAgo: 3,
        body: "Helemaal goed, ik vul de OK-nummers vanmiddag nog aan. Voor de volgende indiening neem ik ze meteen mee.",
      },
      {
        from: "client",
        daysAgo: 3,
        body: "Perfect, dan keur ik het morgen vroeg goed. Fijne donderdag!",
      },
      {
        from: "freelancer",
        daysAgo: 2,
        body: "Aangevuld, je kunt 'm bekijken. Mocht er nog iets onduidelijk zijn, hoor ik het graag.",
      },
    ],
  },
  {
    id: "c-iris-vvt",
    fk: "iris",
    ck: "zorggroep",
    jobId: "job-9",
    badge: true,
    messages: [
      {
        from: "client",
        daysAgo: 6,
        body: "Hoi Iris, je factuur van afgelopen periode is goedgekeurd en staat klaar voor betaling. Met de termijn van 14 dagen heb je het uiterlijk volgende week vrijdag op je rekening.",
      },
      {
        from: "freelancer",
        daysAgo: 6,
        body: "Fijn, dank je wel Petra! Goed om te horen.",
      },
      {
        from: "freelancer",
        daysAgo: 5,
        body: "Zullen we meteen de diensten voor de komende weken afstemmen? Ik kan in principe dinsdag, woensdag en donderdag dagdienst draaien.",
      },
      {
        from: "client",
        daysAgo: 5,
        body: "Top, dat past goed bij ons rooster. Voor de VVT-locatie hou ik dan dinsdag t/m donderdag aan, 07:30-16:00. Tarief blijft 48 euro per uur, akkoord?",
      },
      {
        from: "freelancer",
        daysAgo: 4,
        body: "Akkoord. Mijn VOG en BIG-registratie zijn nog actueel, dus daar zit niks in de weg.",
      },
      {
        from: "freelancer",
        daysAgo: 4,
        body: "Wil je dat ik dinsdag iets eerder kom voor de overdracht?",
      },
      {
        from: "client",
        daysAgo: 3,
        body: "Graag, kom dinsdag even om 07:15, dan loopt de teamleider de overdracht met je door. Ik zet de drie diensten zo voor je in het rooster. Fijne week alvast!",
      },
    ],
  },
];

export const SEED_TICKETS: SeedTicket[] = [
  {
    id: "t-sanne-job",
    owner: "sanne",
    role: "freelancer",
    category: "JOB",
    status: "NEW",
    subject: "Kan ik mijn reactie op een opdracht nog intrekken?",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 3,
        body: "Hoi,\n\nGisteren heb ik gereageerd op een dienst (avonddienst verzorgende IG bij een zorginstelling). Vlak na het versturen kreeg ik via een andere weg een opdracht aangeboden die qua planning beter uitkomt, dus ik twijfel nu of ik mijn reactie wel had moeten plaatsen.\n\nMijn vraag: kan ik mijn reactie op die eerste opdracht nog intrekken voordat de opdrachtgever hem heeft beoordeeld? En zo ja, waar vind ik die optie precies? Ik wil voorkomen dat ik straks bij twee opdrachten tegelijk vastzit.\n\nDe opdrachtgever heeft voor zover ik kan zien nog niet gereageerd. Alvast bedankt voor het meedenken.\n\nGroet,\nSanne",
      },
    ],
  },
  {
    id: "t-emma-invoice",
    owner: "emma",
    role: "freelancer",
    category: "INVOICE",
    status: "ESCALATED",
    subject: "Goedgekeurde factuur nog niet op betaald",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 6,
        body: "Hoi, ik heb een vraag over mijn factuur (nummer 2026-0148) aan opdrachtgever Sint Elisabeth Ziekenhuis. De factuur is sinds afgelopen vrijdag goedgekeurd, dat zie ik ook netjes met een groen vinkje in mijn overzicht. Maar de status staat nog steeds op 'goedgekeurd' en niet op 'betaald'. Het gaat om 1.815 euro inclusief btw. Kunnen jullie me vertellen wanneer dit als betaald verwerkt wordt? Ik wil graag weten of ik het bedrag al kan verwachten of dat er nog iets van mij nodig is. Alvast bedankt!",
      },
      {
        authorKind: "ASSISTANT",
        daysAgo: 6,
        body: "Hoi Emma, bedankt voor je bericht. Goed om te weten: 'goedgekeurd' betekent dat de opdrachtgever de factuur akkoord heeft bevonden, maar de uitbetaling volgt daarna apart. De status springt automatisch op 'betaald' zodra de betaling in onze administratie is bijgeschreven, doorgaans binnen de afgesproken betaaltermijn. In jouw geval lijkt de bijschrijving nog niet binnen te zijn. Omdat het hier om een concrete betaalvraag gaat, zet de helpdesk je ticket door naar een collega die in jouw dossier kan meekijken. Je hoeft zelf niets te doen of aan te vullen.",
      },
      {
        authorKind: "AGENT",
        daysAgo: 4,
        body: "Hallo Emma, je spreekt met Daan van Support. Ik heb je ticket opgepakt en factuur 2026-0148 erbij gepakt. Ik zie inderdaad dat de factuur op vrijdag 23 mei is goedgekeurd door Sint Elisabeth Ziekenhuis, met een betaaltermijn van 14 dagen. De uitbetaling staat dus nog binnen de termijn gepland en is nog niet bijgeschreven, daarom blijft de status op 'goedgekeurd' staan. Ik ben op dit moment aan het navragen bij ons betaalteam of de overboeking al klaarstaat en wat de verwachte verwerkingsdatum is. Zodra ik daar uitsluitsel over heb, kom ik bij je terug met een concrete datum. Heb je nog even geduld, dan laat ik het je zo snel mogelijk weten.",
      },
    ],
  },
  {
    id: "t-rik-tech",
    owner: "rik",
    role: "freelancer",
    category: "TECHNICAL",
    status: "AUTO_ANSWERED",
    subject: "Urenstaat-PDF opent niet in mijn browser",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 6,
        body: "Hoi,\n\nIk wil mijn urenstaat van deze week downloaden, maar als ik op 'PDF openen' klik gebeurt er niks. Soms zie ik heel even een nieuw tabblad oppoppen dat meteen weer dichtgaat, en soms blijft het scherm gewoon hangen op 'Bezig met genereren'. Op mijn telefoon werkt het wel, maar op mijn laptop (Chrome) krijg ik de PDF niet open.\n\nWat doe ik verkeerd? Ik moet de urenstaat vandaag nog doorsturen naar mijn opdrachtgever.\n\nGroet,\nRik",
      },
      {
        authorKind: "ASSISTANT",
        daysAgo: 5,
        body: "Hallo Rik,\n\nBedankt voor je bericht. Dit is een automatisch antwoord van de helpdesk. Wat je beschrijft komt bijna altijd door de pop-upblokkering van je browser: de urenstaat-PDF wordt in een nieuw tabblad geopend, en Chrome blokkeert dat soms. Loop de onderstaande stappen even door, dan kom je er waarschijnlijk meteen uit.\n\n1. Pop-ups toestaan voor het platform\n   - Klik in Chrome rechtsboven op de drie puntjes en kies 'Instellingen'.\n   - Ga naar 'Privacy en beveiliging', daarna 'Site-instellingen' en vervolgens 'Pop-ups en omleidingen'.\n   - Voeg onze website onder 'Toestemming' toe aan de lijst met toegestane sites.\n   - Klik daarna opnieuw op 'PDF openen'.\n\n2. Snel alternatief: rechtstreeks downloaden\n   - In het urenstaat-scherm zie je naast 'PDF openen' ook de knop 'PDF downloaden' (het pijltje naar beneden).\n   - Hiermee wordt het bestand direct opgeslagen in je map 'Downloads', zonder dat er een tabblad hoeft te openen. Vanuit 'Downloads' kun je het document gewoon openen en doorsturen.\n\n3. Cache verversen als het scherm blijft hangen op 'Bezig met genereren'\n   - Druk op je laptop op Ctrl + Shift + R om de pagina te verversen zonder cache.\n   - Helpt dat niet, ga dan naar 'Instellingen', 'Privacy en beveiliging', 'Browsegegevens wissen' en wis alleen de afbeeldingen en bestanden in de cache.\n\n4. Controleer of een extensie de PDF tegenhoudt\n   - Sommige advertentie- of PDF-extensies blokkeren het openen. Open een incognitovenster (Ctrl + Shift + N) en log daar in. Werkt het daar wel, dan zit het in een extensie en kun je die tijdelijk uitschakelen.\n\nIn de praktijk lost stap 1 of stap 2 het probleem vrijwel altijd op, dus je kunt je urenstaat zo alsnog doorsturen naar je opdrachtgever.\n\nKomt het hiermee niet goed? Beantwoord dan deze e-mail met de naam en versie van je browser, dan kijkt een medewerker van Support persoonlijk met je mee.\n\nMet vriendelijke groet,\nde helpdesk",
      },
    ],
  },
  {
    id: "t-julia-account",
    owner: "julia",
    role: "freelancer",
    category: "ACCOUNT",
    status: "TRIAGED",
    subject: "IBAN voor uitbetalingen wijzigen",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 3,
        body: "Hoi,\n\nIk ben onlangs overgestapt naar een andere bank en wil graag het rekeningnummer voor mijn uitbetalingen aanpassen. Het oude IBAN dat nu in mijn account staat eindigt op 4821 en is binnenkort niet meer geldig.\n\nIn mijn instellingen kan ik wel mijn factuur-IBAN aanpassen, maar het rekeningnummer waarop ik mijn uitbetalingen ontvang lijkt vergrendeld te zijn. Kunnen jullie mij vertellen waar ik dit kan wijzigen, of moeten jullie dit handmatig voor mij doen?\n\nMijn nieuwe IBAN deel ik uiteraard graag op een veilige manier zodra ik weet wat de juiste route is. Ik heb volgende week een uitbetaling staan en wil voorkomen dat die naar het oude rekeningnummer gaat.\n\nAlvast bedankt!\n\nGroet,\nJulia",
      },
    ],
  },
  {
    id: "t-daan-cred",
    owner: "daan",
    role: "freelancer",
    category: "CREDENTIAL",
    status: "REOPENED",
    subject: "VOG opnieuw ingediend na afwijzing, nog geen reactie",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 12,
        body: "Hoi, ik wil mijn VOG uploaden in mijn profiel, maar ik krijg steeds de melding dat het document is afgewezen. Ik snap niet waarom, het is gewoon mijn officiele Verklaring Omtrent het Gedrag als PDF. Kunnen jullie mij vertellen wat er mis is en hoe ik dit oplos?",
      },
      {
        authorKind: "ASSISTANT",
        daysAgo: 12,
        body: "Hallo Daan, bedankt voor je bericht. Een VOG wordt door de helpdesk doorgaans om een van deze redenen afgewezen: het document is ouder dan 12 maanden, de scan is niet volledig leesbaar (bijvoorbeeld door een afgesneden rand), of er is een foto geupload in plaats van de originele PDF. Controleer in je profiel onder 'Documenten > VOG' welke afwijsreden bij je upload staat vermeld. Upload daarna de volledige, originele PDF opnieuw via de knop 'Document vervangen'. Na het opnieuw indienen gaat de verificatie automatisch naar de status 'In behandeling'. Kom je er niet uit, laat het ons dan gerust weten.",
      },
      {
        authorKind: "USER",
        daysAgo: 11,
        body: "Top, dat was het inderdaad. Ik had per ongeluk een foto van de VOG geupload in plaats van de PDF. Ik heb nu de originele PDF opnieuw ingediend en hij staat op 'In behandeling'. Bedankt voor de snelle hulp!",
      },
      {
        authorKind: "USER",
        daysAgo: 3,
        body: "Ik heropen dit ticket toch maar even. Mijn opnieuw ingediende VOG staat nu al ruim een week op 'In behandeling' en ik hoor helemaal niets. Ik heb geen bevestigingsmail gekregen en de status verandert niet. Het vervelende is dat ik hierdoor nog steeds niet kan reageren op opdrachten waarvoor een goedgekeurde VOG verplicht is, dus ik loop nu werk mis. Kan iemand handmatig nakijken wat de status van mijn VOG is en of er nog iets van mij nodig is?",
      },
      {
        authorKind: "AGENT",
        daysAgo: 2,
        body: "Hoi Daan, je hebt gelijk dat dit te lang duurt, mijn excuses daarvoor. Ik heb je dossier er even bij gepakt. Ik zie dat je opnieuw ingediende VOG netjes is binnengekomen, maar dat de verificatie is blijven hangen door een tijdelijke storing in onze controle van vorige week. Daardoor is er ook geen statusmail verstuurd. Ik heb je VOG zojuist handmatig opnieuw door de controle gehaald. De inhoud klopt en het document is geldig, dus je hoeft zelf niets meer aan te leveren. Ik verwacht dat de status binnen 24 uur op 'Goedgekeurd' staat; je krijgt daarvan dan automatisch bericht. Houd je profiel in de gaten en laat het me weten als de status morgen onverhoopt nog niet is bijgewerkt, dan keur ik hem direct handmatig goed.",
      },
    ],
  },
  {
    id: "t-jansen-job",
    owner: "jansen",
    role: "client",
    category: "JOB",
    status: "NEW",
    subject: "Hoe verleng of sluit ik een gepubliceerde opdracht?",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 3,
        body: "Beste Support,\n\nIk heb vorige week een dienst uitgezet voor een wijkverpleegkundige via het platform. De opdracht staat nu live en ik heb al een paar reacties van zelfstandigen binnengekregen, waarvoor dank.\n\nIk loop nu tegen twee dingen aan en kom er in mijn omgeving niet helemaal uit:\n\n1. De reactietermijn loopt over een paar dagen af, maar ik heb nog niet de juiste kandidaat gevonden. Kan ik de looptijd van een gepubliceerde opdracht verlengen, en zo ja, waar doe ik dat precies? Ik zie bij de opdracht wel een knop 'Bewerken', maar het is mij niet duidelijk of ik daarmee ook de einddatum kan aanpassen zonder dat de opdracht opnieuw moet worden goedgekeurd.\n\n2. Stel dat ik wel iemand vind: hoe sluit ik de opdracht dan netjes af, zodat hij niet meer zichtbaar is voor nieuwe reacties? Krijgen de zelfstandigen die al hebben gereageerd dan automatisch bericht dat de opdracht is gesloten, of moet ik dat zelf doen?\n\nAlvast bedankt voor de uitleg.\n\nMet vriendelijke groet,\nMark Jansen",
      },
    ],
  },
  {
    id: "t-zorggroep-invoice",
    owner: "zorggroep",
    role: "client",
    category: "INVOICE",
    status: "ESCALATED",
    subject: "Bezwaar tegen ontvangen factuur: gefactureerde uren kloppen niet",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 9,
        body: "Goedemiddag,\n\nVia het platform heb ik gisteren een factuur ontvangen van een van de zelfstandigen die voor ons heeft gewerkt (factuurnummer 2026-0438, bedrag 2.184 euro incl. btw). Ik wil deze factuur graag betwisten, omdat de gefactureerde uren volgens mij niet kloppen.\n\nOp de factuur staan 28 uur voor de week van 11 tot en met 15 mei. Volgens onze eigen registratie en de afspraken die we hadden gemaakt, ging het om maximaal 20 uur (4 dagen van 5 uur). Er zijn dus 8 uur te veel in rekening gebracht. Ik heb de betreffende zelfstandige hier nog niet over gesproken, omdat ik eerst wil weten hoe ik dit netjes via het platform regel.\n\nKan ik de factuur ergens afkeuren of een correctie aanvragen voordat de betaaltermijn verloopt? Ik wil voorkomen dat er een te hoog bedrag wordt afgeschreven.\n\nMet vriendelijke groet,\nPetra Mulder",
      },
      {
        authorKind: "ASSISTANT",
        daysAgo: 9,
        body: "Hallo Petra,\n\nBedankt voor je bericht. Je kunt een ontvangen factuur betwisten via Facturen > Ontvangen > de betreffende factuur openen > knop 'Factuur betwisten'. Daar vul je de reden in (bijvoorbeeld een afwijking in de uren). De factuur wordt vervolgens in afwachting gezet, zodat er niets wordt afgeschreven zolang het bezwaar loopt.\n\nOmdat het hier om een inhoudelijk geschil over de geregistreerde uren gaat, zet ik je vraag door naar een medewerker van Support. Die kan met je meekijken naar de urenregistratie en het verschil van 8 uur. Je hoeft zelf verder niets te doen; je krijgt snel bericht.\n\nMet vriendelijke groet,\nde helpdesk",
      },
      {
        authorKind: "AGENT",
        daysAgo: 7,
        body: "Beste mevrouw Mulder,\n\nMijn naam is Joost Hendriks, ik werk bij Support en ik pak uw bezwaar over factuur 2026-0438 op.\n\nIk heb de urenregistratie bij deze opdracht erbij gepakt. In het systeem staan inderdaad 28 uur geboekt: 4 dagen van 5 uur, plus een losse boeking van 8 uur op donderdag 14 mei met de omschrijving 'extra werkzaamheden'. Mogelijk gaat het hier om een dubbele invoer of een verkeerde dagboeking.\n\nOm dit goed uit te zoeken heb ik twee dingen van u nodig:\n1. Uw eigen urenoverzicht of de afspraakbevestiging waaruit de 20 uur blijkt.\n2. Of er voor donderdag 14 mei eventueel toch aanvullend werk is afgesproken.\n\nIk heb de factuur in afwachting gezet, dus er wordt op dit moment niets afgeschreven en de betaaltermijn loopt zolang niet door. Zodra ik uw reactie heb, neem ik ook contact op met de zelfstandige om de boeking te verifieren. Ik houd u op de hoogte.\n\nMet vriendelijke groet,\nJoost Hendriks\nSupport",
      },
    ],
  },
  {
    id: "t-bouwpartners-account",
    owner: "ggz",
    role: "client",
    category: "ACCOUNT",
    status: "AUTO_ANSWERED",
    subject: "Extra collega toegang geven tot ons bedrijfsaccount",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 4,
        body: "Goedendag,\n\nWij werken met meerdere mensen op kantoor en ik wil graag een collega van onze administratie toegang geven tot ons bedrijfsaccount. Zij moet straks zelf opdrachten kunnen plaatsen en facturen kunnen inzien, zonder dat ze met mijn eigen inloggegevens hoeft te werken.\n\nHoe regel ik dat? En kan ik daarbij bepalen wat zij wel en niet mag zien?\n\nAlvast bedankt.\n\nMet vriendelijke groet,\nHenk de Wit",
      },
      {
        authorKind: "ASSISTANT",
        daysAgo: 4,
        body: "Beste meneer De Wit,\n\nBedankt voor uw vraag. U kunt zelf eenvoudig een extra collega aan uw bedrijfsaccount toevoegen via Teambeheer. U hoeft hiervoor uw eigen inloggegevens niet te delen; uw collega krijgt een persoonlijk account onder uw bedrijf.\n\nZo voegt u iemand toe:\n\n1. Log in en klik rechtsboven op uw bedrijfsnaam.\n2. Ga naar 'Instellingen' en kies daar 'Teamleden'.\n3. Klik op de knop 'Collega uitnodigen'.\n4. Vul het e-mailadres en de naam van uw collega in.\n5. Kies een rol:\n   - 'Beheerder' (volledige toegang, inclusief instellingen en facturatie);\n   - 'Medewerker' (opdrachten plaatsen en beheren, facturen inzien, maar geen wijzigingen aan instellingen of betaalgegevens).\n6. Klik op 'Uitnodiging versturen'.\n\nUw collega ontvangt direct een e-mail met een link om zelf een wachtwoord in te stellen. Daarna kan zij meteen aan de slag onder haar eigen account.\n\nVoor de situatie die u beschrijft (opdrachten plaatsen en facturen inzien) past de rol 'Medewerker' precies. Wilt u de toegang later aanpassen of intrekken, dan kan dat op dezelfde pagina via het menu achter de naam van het teamlid.\n\nKomt u er niet uit, of wilt u meer instellen dan de standaardrollen toelaten? Laat het ons gerust weten, dan kijken we met u mee.\n\nMet vriendelijke groet,\nde helpdesk",
      },
    ],
  },
  {
    id: "t-logiflow-tech",
    owner: "ghz",
    role: "client",
    category: "TECHNICAL",
    status: "RESOLVED",
    subject: "Kandidatenfilter toont geen resultaten",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 6,
        body: "Hallo,\n\nIk probeer in het kandidatenoverzicht te filteren op beschikbaarheid en regio, maar zodra ik een filter activeer krijg ik een lege lijst te zien. Zonder filters zie ik wel gewoon alle kandidaten, dus de gegevens zijn er wel. Ik heb het geprobeerd in Chrome en in Edge, en ook na opnieuw inloggen blijft het hetzelfde.\n\nKunnen jullie hiernaar kijken? Ik moet deze week een paar opdrachten invullen en kom zo niet verder.\n\nMet vriendelijke groet,\nSandra Vos",
      },
      {
        authorKind: "ASSISTANT",
        daysAgo: 6,
        body: "Hallo Sandra,\n\nBedankt voor je melding. De helpdesk helpt je graag verder.\n\nEen lege resultatenlijst bij actieve filters komt meestal door een van deze oorzaken:\n\n1. Er staan nog filters van een eerdere zoekopdracht actief die elkaar uitsluiten. Klik rechtsboven in het filterpaneel op 'Filters wissen' en stel ze daarna opnieuw in.\n2. Het cachegeheugen van de browser bewaart een oude versie van de filterpagina. Vernieuw de pagina met Ctrl+F5 voor een volledige herlaadbeurt.\n\nWil je deze twee stappen proberen en ons laten weten of het filteren daarna wel resultaten geeft? Werkt het nog niet, geef dan door op welke velden je precies filtert, dan kijkt een collega met je mee.\n\nMet vriendelijke groet,\nSupport",
      },
      {
        authorKind: "USER",
        daysAgo: 5,
        body: "Dank voor de snelle reactie. Ik heb de filters gewist en de pagina volledig herladen, maar het probleem blijft. Ik filter op 'Beschikbaar per direct' in combinatie met regio 'Utrecht'. Met alleen de regio krijg ik wel resultaten, maar zodra ik de beschikbaarheid erbij zet wordt de lijst leeg.\n\nGroet, Sandra",
      },
      {
        authorKind: "AGENT",
        daysAgo: 3,
        body: "Hallo Sandra,\n\nJe spreekt nu met Mark van de helpdesk. Bedankt voor de aanvullende informatie, die heeft ons enorm geholpen.\n\nWe hebben het kunnen reproduceren: de combinatie van de beschikbaarheidsfilter met een regiofilter werd door een fout aan onze kant verkeerd verwerkt, waardoor de lijst onterecht leeg bleef. Onze ontwikkelaars hebben dit vanmorgen verholpen en de oplossing staat inmiddels live.\n\nWil je opnieuw inloggen en de filtercombinatie nogmaals proberen? Je zou nu wel de juiste kandidaten moeten zien. Laat het ons gerust weten als er nog iets niet klopt.\n\nMet vriendelijke groet,\nMark - Support",
      },
      {
        authorKind: "USER",
        daysAgo: 2,
        body: "Top, het werkt nu inderdaad! De combinatie van beschikbaarheid en regio geeft netjes resultaten. Bedankt voor het snelle oplossen, fijne hulp.\n\nGroet, Sandra",
      },
    ],
  },
  {
    id: "t-datic-privacy",
    owner: "ziekenhuis",
    role: "client",
    category: "PRIVACY",
    status: "ESCALATED",
    subject: "Hoe verwerk ik een AVG-inzageverzoek van een kandidaat?",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 6,
        body: "Beste,\n\nEen kandidaat die zich via ons profiel heeft aangemeld voor een opdracht heeft mij gisteren per mail een formeel AVG-inzageverzoek gestuurd. Hij wil weten welke persoonsgegevens wij van hem hebben opgeslagen, met welk doel, en wie er toegang toe heeft gehad.\n\nIk ben opdrachtgever en gebruik het platform om kandidaten te selecteren, maar ik weet eerlijk gezegd niet hoe ik hier netjes mee omga. Welke gegevens vallen onder mij als opdrachtgever en welke onder het platform zelf? En binnen welke termijn moet ik reageren? Ik wil dit correct en volgens de regels afhandelen, dus alle hulp is welkom.\n\nMet vriendelijke groet,\nErik Brand",
      },
      {
        authorKind: "ASSISTANT",
        daysAgo: 6,
        body: "Hallo Erik,\n\nBedankt voor je bericht. Een AVG-inzageverzoek (recht van inzage, artikel 15 AVG) moet binnen een maand na ontvangst worden beantwoord. Die termijn mag bij complexiteit met twee maanden worden verlengd, mits je de kandidaat daar tijdig over informeert.\n\nIn ons systeem kun je via Instellingen > Privacy > Gegevensexport een overzicht opvragen van de gegevens die op het platform zijn vastgelegd. Omdat hier een rolverdeling tussen jou als opdrachtgever en het platform meespeelt, en het om een geescaleerd privacyverzoek gaat, verbind ik je door met een medewerker van de helpdesk die je gericht kan adviseren.\n\nMet vriendelijke groet,\nde helpdesk",
      },
      {
        authorKind: "AGENT",
        daysAgo: 3,
        body: "Beste Erik,\n\nMijn naam is Marleen, ik werk bij het privacyteam van de helpdesk en ik pak je vraag verder op. Goed dat je dit zorgvuldig wilt aanpakken.\n\nDe rolverdeling werkt zo: voor de gegevens die je zelf in jouw omgeving hebt toegevoegd of waarmee je de kandidaat hebt beoordeeld (notities, selectiebeslissingen, onderlinge communicatie) ben jij verwerkingsverantwoordelijke. Voor de basisgegevens van het kandidaatprofiel treedt het platform op als verwerker; dat deel nemen wij voor onze rekening. Jij hoeft dus alleen het deel te beantwoorden dat onder jouw verantwoordelijkheid valt.\n\nOm je goed te kunnen helpen heb ik twee dingen van je nodig: 1) de datum waarop je het verzoek hebt ontvangen, zodat we de reactietermijn samen kunnen bewaken, en 2) bevestiging of de kandidaat ook om verwijdering van zijn gegevens vraagt of alleen om inzage. Zodra ik dat heb, stuur ik je een conceptantwoord en een stappenplan dat je direct kunt gebruiken. Ik houd dit ticket open tot we het samen hebben afgerond.\n\nMet vriendelijke groet,\nMarleen\nPrivacyteam helpdesk",
      },
    ],
  },
  {
    id: "t-youssef-dba",
    owner: "youssef",
    role: "freelancer",
    category: "OTHER",
    status: "RESOLVED",
    subject: "Vraag over modelovereenkomst (Wet DBA) bij nieuwe opdracht",
    messages: [
      {
        authorKind: "USER",
        daysAgo: 9,
        body: "Hoi,\n\nIk start binnenkort een nieuwe samenwerking met een opdrachtgever en zij vragen of we met een modelovereenkomst willen werken in verband met de Wet DBA. Ik heb daar eerlijk gezegd weinig ervaring mee. Mijn vragen: ondersteunt het platform modelovereenkomsten, en zo ja, kan ik die hier opstellen of moet ik zelf iets van de Belastingdienst gebruiken? En waar moet ik op letten zodat er geen sprake is van schijnzelfstandigheid?\n\nAlvast bedankt,\nYoussef",
      },
      {
        authorKind: "ASSISTANT",
        daysAgo: 9,
        body: "Hallo Youssef,\n\nBedankt voor je vraag. Hieronder de belangrijkste punten vanuit de helpdesk:\n\n1. In het platform vind je onder Documenten > Sjablonen een algemene modelovereenkomst die is gebaseerd op de door de Belastingdienst goedgekeurde modellen ('Geen werkgeversgezag' en 'Vrije vervanging'). Je kunt deze invullen met je eigen gegevens en die van de opdrachtgever en daarna als PDF exporteren.\n\n2. Belangrijk: een modelovereenkomst geeft alleen zekerheid als jullie in de praktijk ook echt zo werken. Let daarom vooral op deze punten:\n   - Geen gezagsverhouding: jij bepaalt zelf hoe en wanneer je het werk uitvoert.\n   - Vrije vervanging: je mag je in principe laten vervangen door iemand anders.\n   - Je werkt voor eigen rekening en risico en factureert per opdracht of project, niet als verkapt dienstverband.\n\n3. Twijfel je over jouw specifieke situatie? Dan raden we aan om de overeenkomst kort te laten controleren door een jurist of je boekhouder. De helpdesk mag geen bindend juridisch advies geven.\n\nWil je dat een collega met je meekijkt naar de ingevulde overeenkomst? Laat het gerust weten.\n\nGroet,\nSupport",
      },
      {
        authorKind: "AGENT",
        daysAgo: 7,
        body: "Hoi Youssef, Sanne hier van support. Even aanvullend op het eerdere antwoord: ik zie dat je opdrachtgever met een eigen modelovereenkomst komt. Dat mag prima. Controleer in dat geval of er onderaan een kenmerk- of beoordelingsnummer van de Belastingdienst staat (bijvoorbeeld 'nr. 9015...'). Staat dat erop, dan gaat het om een goedgekeurd model en hoef je ons sjabloon niet te gebruiken. Spreek wel duidelijk de begin- en einddatum en de tarieven af, dan ligt alles netjes vast. Kom je er met de invulling niet uit, dan plan ik graag even een belmoment in.\n\nGroet, Sanne",
      },
      {
        authorKind: "USER",
        daysAgo: 6,
        body: "Top, heel duidelijk! De overeenkomst van de opdrachtgever heeft inderdaad zo'n beoordelingsnummer onderaan staan, dus die gebruiken we. Bedankt voor de heldere uitleg, hiermee kan ik verder. Wat mij betreft is het opgelost. Fijne dag nog!",
      },
    ],
  },
];
