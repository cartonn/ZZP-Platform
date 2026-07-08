"use client";

import dynamic from "next/dynamic";

// Client-side concept-host: hier — in een client component — levert next/dynamic per id een ECHTE
// aparte async-chunk op, zodat de browser bij /ontwerp/<id> alleen de gekozen concept-bundel
// downloadt i.p.v. alle ~150. (In een server component zou Next alle client-modules die vanuit de
// route bereikbaar zijn samen in één page-bundel trekken; daarom staat de map bewust hier.)
const COMPONENTS: Record<string, React.ComponentType> = {
  "01": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-01-veld").then((m) => m.Concept01),
  ),
  "02": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-02-folio").then((m) => m.Concept02),
  ),
  "03": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-03-helder").then((m) => m.Concept03),
  ),
  "04": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-04-tij").then((m) => m.Concept04),
  ),
  "05": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-05-beurs").then((m) => m.Concept05),
  ),
  "06": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-06-klei").then((m) => m.Concept06),
  ),
  "07": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-07-puls").then((m) => m.Concept07),
  ),
  "08": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-08-nebula").then((m) => m.Concept08),
  ),
  "09": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-09-index").then((m) => m.Concept09),
  ),
  "10": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-10-bastion").then((m) => m.Concept10),
  ),
  "11": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-11-terra").then((m) => m.Concept11),
  ),
  "12": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-12-glas").then((m) => m.Concept12),
  ),
  "13": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-13-prisma").then((m) => m.Concept13),
  ),
  "14": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-14-raster").then((m) => m.Concept14),
  ),
  "15": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-15-zenit").then((m) => m.Concept15),
  ),
  "16": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-16-aurora").then((m) => m.Concept16),
  ),
  "17": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-17-kanaal").then((m) => m.Concept17),
  ),
  "18": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-18-kompas").then((m) => m.Concept18),
  ),
  "19": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-19-puur").then((m) => m.Concept19),
  ),
  "20": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-20-karbon").then((m) => m.Concept20),
  ),
  "21": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-21-atlas").then((m) => m.Concept21),
  ),
  "22": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-22-dossier").then((m) => m.Concept22),
  ),
  "23": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-23-blauwdruk").then((m) => m.Concept23),
  ),
  "24": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-24-console").then((m) => m.Concept24),
  ),
  "25": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-25-relief").then((m) => m.Concept25),
  ),
  "26": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-26-perforatie").then((m) => m.Concept26),
  ),
  "27": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-27-courant").then((m) => m.Concept27),
  ),
  "28": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-28-riso").then((m) => m.Concept28),
  ),
  "29": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-29-signaal").then((m) => m.Concept29),
  ),
  "30": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-30-vitrine").then((m) => m.Concept30),
  ),
  "31": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-31-perron").then((m) => m.Concept31),
  ),
  "32": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-32-parel").then((m) => m.Concept32),
  ),
  "33": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-33-zegel").then((m) => m.Concept33),
  ),
  "34": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-34-redactie").then((m) => m.Concept34),
  ),
  "35": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-35-deco").then((m) => m.Concept35),
  ),
  "36": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-36-schemer").then((m) => m.Concept36),
  ),
  "37": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-37-isometrie").then((m) => m.Concept37),
  ),
  "38": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-38-spectrum").then((m) => m.Concept38),
  ),
  "39": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-39-botanie").then((m) => m.Concept39),
  ),
  "40": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-40-kwadrant").then((m) => m.Concept40),
  ),
  "41": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-41-beton").then((m) => m.Concept41),
  ),
  "42": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-42-helvetia").then((m) => m.Concept42),
  ),
  "43": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-43-aqua").then((m) => m.Concept43),
  ),
  "44": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-44-grootboek").then((m) => m.Concept44),
  ),
  "45": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-45-duim").then((m) => m.Concept45),
  ),
  "46": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-46-palet").then((m) => m.Concept46),
  ),
  "47": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-47-ruimte").then((m) => m.Concept47),
  ),
  "48": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-48-paspoort").then((m) => m.Concept48),
  ),
  "49": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-49-meter").then((m) => m.Concept49),
  ),
  "50": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-50-handleiding").then((m) => m.Concept50),
  ),
  "51": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-51-teletekst").then((m) => m.Concept51),
  ),
  "52": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-52-metrokaart").then((m) => m.Concept52),
  ),
  "53": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-53-bauhaus").then((m) => m.Concept53),
  ),
  "54": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-54-eink").then((m) => m.Concept54),
  ),
  "55": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-55-aquarel").then((m) => m.Concept55),
  ),
  "56": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-56-kiosk").then((m) => m.Concept56),
  ),
  "57": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-57-origami").then((m) => m.Concept57),
  ),
  "58": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-58-textiel").then((m) => m.Concept58),
  ),
  "59": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-59-memphis").then((m) => m.Concept59),
  ),
  "60": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-60-schetsboek").then((m) => m.Concept60),
  ),
  "61": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-61-stroom").then((m) => m.Concept61),
  ),
  "62": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-62-neonzon").then((m) => m.Concept62),
  ),
  "63": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-63-strip").then((m) => m.Concept63),
  ),
  "64": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-64-solar").then((m) => m.Concept64),
  ),
  "65": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-65-kinetiek").then((m) => m.Concept65),
  ),
  "66": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-66-prikbord").then((m) => m.Concept66),
  ),
  "67": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-67-parcours").then((m) => m.Concept67),
  ),
  "68": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-68-pictogram").then((m) => m.Concept68),
  ),
  "69": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-69-haard").then((m) => m.Concept69),
  ),
  "70": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-70-krijt").then((m) => m.Concept70),
  ),
  "71": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-71-vertrek").then((m) => m.Concept71),
  ),
  "72": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-72-bon").then((m) => m.Concept72),
  ),
  "73": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-73-printplaat").then((m) => m.Concept73),
  ),
  "74": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-74-sterrenbeeld").then((m) => m.Concept74),
  ),
  "75": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-75-cinema").then((m) => m.Concept75),
  ),
  "76": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-76-etiket").then((m) => m.Concept76),
  ),
  "77": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-77-arcade").then((m) => m.Concept77),
  ),
  "78": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-78-zilver").then((m) => m.Concept78),
  ),
  "79": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-79-radar").then((m) => m.Concept79),
  ),
  "80": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-80-terrazzo").then((m) => m.Concept80),
  ),
  "81": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-81-vloeiglas").then((m) => m.Concept81),
  ),
  "82": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-82-japandi").then((m) => m.Concept82),
  ),
  "83": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-83-therma").then((m) => m.Concept83),
  ),
  "84": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-84-draad").then((m) => m.Concept84),
  ),
  "85": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-85-focus").then((m) => m.Concept85),
  ),
  "86": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-86-revisie").then((m) => m.Concept86),
  ),
  "87": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-87-kader").then((m) => m.Concept87),
  ),
  "88": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-88-widget").then((m) => m.Concept88),
  ),
  "89": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-89-lumen").then((m) => m.Concept89),
  ),
  "90": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-90-marmer").then((m) => m.Concept90),
  ),
  "91": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-91-agenda").then((m) => m.Concept91),
  ),
  "92": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-92-doek").then((m) => m.Concept92),
  ),
  "93": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-93-kaart").then((m) => m.Concept93),
  ),
  "94": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-94-gesprek").then((m) => m.Concept94),
  ),
  "95": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-95-bubbel").then((m) => m.Concept95),
  ),
  "96": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-96-montage").then((m) => m.Concept96),
  ),
  "97": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-97-groef").then((m) => m.Concept97),
  ),
  "98": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-98-ringen").then((m) => m.Concept98),
  ),
  "99": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-99-delft").then((m) => m.Concept99),
  ),
  "100": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-100-boekband").then((m) => m.Concept100),
  ),
  "101": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-101-chroom").then((m) => m.Concept101),
  ),
  "102": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-102-verhaal").then((m) => m.Concept102),
  ),
  "103": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-103-kliniek").then((m) => m.Concept103),
  ),
  "104": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-104-meteo").then((m) => m.Concept104),
  ),
  "105": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-105-karton").then((m) => m.Concept105),
  ),
  "106": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-106-rontgen").then((m) => m.Concept106),
  ),
  "107": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-107-perkament").then((m) => m.Concept107),
  ),
  "108": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-108-nachtdienst").then((m) => m.Concept108),
  ),
  "109": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-109-constructie").then((m) => m.Concept109),
  ),
  "110": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-110-fresco").then((m) => m.Concept110),
  ),
  "111": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-111-gebrandschilderd").then((m) => m.Concept111),
  ),
  "112": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-112-zellige").then((m) => m.Concept112),
  ),
  "113": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-113-filatelie").then((m) => m.Concept113),
  ),
  "114": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-114-ponskaart").then((m) => m.Concept114),
  ),
  "115": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-115-scorebord").then((m) => m.Concept115),
  ),
  "116": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-116-seismograaf").then((m) => m.Concept116),
  ),
  "117": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-117-lakwerk").then((m) => m.Concept117),
  ),
  "118": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-118-entomologie").then((m) => m.Concept118),
  ),
  "119": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-119-emaille").then((m) => m.Concept119),
  ),
  "120": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-120-batik").then((m) => m.Concept120),
  ),
  "121": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-121-compositie").then((m) => m.Concept121),
  ),
  "122": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-122-uurwerk").then((m) => m.Concept122),
  ),
  "123": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-123-portolaan").then((m) => m.Concept123),
  ),
  "124": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-124-suminagashi").then((m) => m.Concept124),
  ),
  "125": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-125-typemachine").then((m) => m.Concept125),
  ),
  "126": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-126-histologie").then((m) => m.Concept126),
  ),
  "127": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-127-cyanotype").then((m) => m.Concept127),
  ),
  "128": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-128-spectraal").then((m) => m.Concept128),
  ),
  "129": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-129-seinvlaggen").then((m) => m.Concept129),
  ),
  "130": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-130-jaarringen").then((m) => m.Concept130),
  ),
  "131": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-131-atelier").then((m) => m.Concept131),
  ),
  "132": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-132-sluis").then((m) => m.Concept132),
  ),
  "133": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-133-wegwijzer").then((m) => m.Concept133),
  ),
  "134": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-134-cockpit").then((m) => m.Concept134),
  ),
  "135": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-135-kaartenbak").then((m) => m.Concept135),
  ),
  "136": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-136-loep").then((m) => m.Concept136),
  ),
  "137": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-137-neonbord").then((m) => m.Concept137),
  ),
  "138": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-138-kruissteek").then((m) => m.Concept138),
  ),
  "139": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-139-knooppunt").then((m) => m.Concept139),
  ),
  "140": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-140-situatiekamer").then((m) => m.Concept140),
  ),
  "141": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-141-schijnwerper").then((m) => m.Concept141),
  ),
  "142": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-142-rasterpunt").then((m) => m.Concept142),
  ),
  "143": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-143-kantlijn").then((m) => m.Concept143),
  ),
  "144": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-144-warmtekaart").then((m) => m.Concept144),
  ),
  "145": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-145-meetlint").then((m) => m.Concept145),
  ),
  "146": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-146-noir").then((m) => m.Concept146),
  ),
  "147": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-147-zonnewijzer").then((m) => m.Concept147),
  ),
  "148": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-148-totem").then((m) => m.Concept148),
  ),
  "149": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-149-gel").then((m) => m.Concept149),
  ),
  "150": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-150-manifest").then((m) => m.Concept150),
  ),
  "151": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-151-fosfor").then((m) => m.Concept151),
  ),
  "152": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-152-zwerk").then((m) => m.Concept152),
  ),
  "153": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-153-reglet").then((m) => m.Concept153),
  ),
  "154": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-154-halogeen").then((m) => m.Concept154),
  ),
  "155": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-155-cel").then((m) => m.Concept155),
  ),
  "156": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-156-marge").then((m) => m.Concept156),
  ),
  "157": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-157-karmijn").then((m) => m.Concept157),
  ),
  "158": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-158-raamwerk").then((m) => m.Concept158),
  ),
  "159": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-159-panorama").then((m) => m.Concept159),
  ),
  "160": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-160-bouwplaats").then((m) => m.Concept160),
  ),
  "161": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-161-kintsugi").then((m) => m.Concept161),
  ),
  "162": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-162-bureaublad").then((m) => m.Concept162),
  ),
  "163": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-163-zwartlicht").then((m) => m.Concept163),
  ),
  "164": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-164-krijtstreep").then((m) => m.Concept164),
  ),
  "165": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-165-vorst").then((m) => m.Concept165),
  ),
  "166": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-166-legpuzzel").then((m) => m.Concept166),
  ),
  "167": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-167-marqueterie").then((m) => m.Concept167),
  ),
  "168": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-168-weegschaal").then((m) => m.Concept168),
  ),
  "169": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-169-almanak").then((m) => m.Concept169),
  ),
  "170": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-170-caleidoscoop").then((m) => m.Concept170),
  ),
  "171": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-171-diafragma").then((m) => m.Concept171),
  ),
  "172": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-172-notariaat").then((m) => m.Concept172),
  ),
  "173": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-173-mycelium").then((m) => m.Concept173),
  ),
  "174": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-174-letterpers").then((m) => m.Concept174),
  ),
  "175": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-175-parallax").then((m) => m.Concept175),
  ),
  "176": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-176-magneet").then((m) => m.Concept176),
  ),
  "177": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-177-korrel").then((m) => m.Concept177),
  ),
  "178": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-178-sediment").then((m) => m.Concept178),
  ),
  "179": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-179-damast").then((m) => m.Concept179),
  ),
  "180": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-180-diorama").then((m) => m.Concept180),
  ),
  "181": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-181-refractie").then((m) => m.Concept181),
  ),
  "182": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-182-hoogtelijn").then((m) => m.Concept182),
  ),
  "183": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-183-halftoon").then((m) => m.Concept183),
  ),
  "184": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-184-molecuul").then((m) => m.Concept184),
  ),
  "185": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-185-diepzee").then((m) => m.Concept185),
  ),
  "186": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-186-jaloezie").then((m) => m.Concept186),
  ),
  "187": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-187-suprematie").then((m) => m.Concept187),
  ),
  "188": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-188-vouwkaart").then((m) => m.Concept188),
  ),
  "189": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-189-passepartout").then((m) => m.Concept189),
  ),
  "190": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-190-amber").then((m) => m.Concept190),
  ),
  "191": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-191-glasvezel").then((m) => m.Concept191),
  ),
  "192": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-192-nieuwe-beelding").then((m) => m.Concept192),
  ),
  "193": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-193-kalligrafie").then((m) => m.Concept193),
  ),
  "194": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-194-heraldiek").then((m) => m.Concept194),
  ),
  "195": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-195-sequencer").then((m) => m.Concept195),
  ),
  "196": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-196-observatorium").then((m) => m.Concept196),
  ),
  "197": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-197-speelkaart").then((m) => m.Concept197),
  ),
  "198": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-198-telraam").then((m) => m.Concept198),
  ),
  "199": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-199-perspectief").then((m) => m.Concept199),
  ),
  "200": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-200-hologram").then((m) => m.Concept200),
  ),
};

/** Rendert het gekozen concept lazy; onbekende id's leveren null (de server-route heeft dan al
 * notFound() aangeroepen op basis van de registry). */
export function ConceptHost({ id }: { id: string }) {
  const Component = COMPONENTS[id];
  if (!Component) return null;
  return <Component />;
}
