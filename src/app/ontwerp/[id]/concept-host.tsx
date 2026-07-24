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
  "201": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-201-sneltoets").then((m) => m.Concept201),
  ),
  "202": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-202-tijdbalk").then((m) => m.Concept202),
  ),
  "203": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-203-triage").then((m) => m.Concept203),
  ),
  "204": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-204-kolommen").then((m) => m.Concept204),
  ),
  "205": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-205-leder").then((m) => m.Concept205),
  ),
  "206": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-206-vuurtoren").then((m) => m.Concept206),
  ),
  "207": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-207-steendruk").then((m) => m.Concept207),
  ),
  "208": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-208-parelmoer").then((m) => m.Concept208),
  ),
  "209": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-209-klapbord").then((m) => m.Concept209),
  ),
  "210": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-210-sjabloon").then((m) => m.Concept210),
  ),
  "211": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-211-getal").then((m) => m.Concept211),
  ),
  "212": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-212-loket").then((m) => m.Concept212),
  ),
  "213": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-213-contour").then((m) => m.Concept213),
  ),
  "214": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-214-marker").then((m) => m.Concept214),
  ),
  "215": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-215-kwelder").then((m) => m.Concept215),
  ),
  "216": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-216-cassette").then((m) => m.Concept216),
  ),
  "217": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-217-blok").then((m) => m.Concept217),
  ),
  "218": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-218-middernacht").then((m) => m.Concept218),
  ),
  "219": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-219-onthaal").then((m) => m.Concept219),
  ),
  "220": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-220-snoep").then((m) => m.Concept220),
  ),
  "221": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-221-duplex").then((m) => m.Concept221),
  ),
  "222": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-222-grafiet").then((m) => m.Concept222),
  ),
  "223": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-223-kwarts").then((m) => m.Concept223),
  ),
  "224": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-224-veer").then((m) => m.Concept224),
  ),
  "225": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-225-anker").then((m) => m.Concept225),
  ),
  "226": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-226-etage").then((m) => m.Concept226),
  ),
  "227": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-227-kompres").then((m) => m.Concept227),
  ),
  "228": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-228-saffier").then((m) => m.Concept228),
  ),
  "229": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-229-vonk").then((m) => m.Concept229),
  ),
  "230": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-230-horizon").then((m) => m.Concept230),
  ),
  "231": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-231-carson").then((m) => m.Concept231),
  ),
  "232": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-232-draadmodel").then((m) => m.Concept232),
  ),
  "233": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-233-knipsel").then((m) => m.Concept233),
  ),
  "234": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-234-systeem").then((m) => m.Concept234),
  ),
  "235": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-235-jugendstil").then((m) => m.Concept235),
  ),
  "236": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-236-ukiyoe").then((m) => m.Concept236),
  ),
  "237": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-237-opart").then((m) => m.Concept237),
  ),
  "238": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-238-voxel").then((m) => m.Concept238),
  ),
  "239": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-239-stickervel").then((m) => m.Concept239),
  ),
  "240": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-240-glitch").then((m) => m.Concept240),
  ),
  "241": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-241-adaptief").then((m) => m.Concept241),
  ),
  "242": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-242-etmaal").then((m) => m.Concept242),
  ),
  "243": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-243-anaglyf").then((m) => m.Concept243),
  ),
  "244": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-244-osmose").then((m) => m.Concept244),
  ),
  "245": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-245-variabel").then((m) => m.Concept245),
  ),
  "246": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-246-zwaartekracht").then((m) => m.Concept246),
  ),
  "247": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-247-serre").then((m) => m.Concept247),
  ),
  "248": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-248-choreografie").then((m) => m.Concept248),
  ),
  "249": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-249-warmte").then((m) => m.Concept249),
  ),
  "250": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-250-duiding").then((m) => m.Concept250),
  ),
  "251": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-251-lenticulair").then((m) => m.Concept251),
  ),
  "252": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-252-nixie").then((m) => m.Concept252),
  ),
  "253": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-253-ferrofluid").then((m) => m.Concept253),
  ),
  "254": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-254-lapidair").then((m) => m.Concept254),
  ),
  "255": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-255-synth").then((m) => m.Concept255),
  ),
  "256": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-256-emaille").then((m) => m.Concept256),
  ),
  "257": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-257-relief").then((m) => m.Concept257),
  ),
  "258": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-258-zettel").then((m) => m.Concept258),
  ),
  "259": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-259-plotter").then((m) => m.Concept259),
  ),
  "260": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-260-lichtbak").then((m) => m.Concept260),
  ),
  "261": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-261-arcana").then((m) => m.Concept261),
  ),
  "262": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-262-reisaffiche").then((m) => m.Concept262),
  ),
  "263": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-263-bouwpakket").then((m) => m.Concept263),
  ),
  "264": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-264-honingraat").then((m) => m.Concept264),
  ),
  "265": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-265-scheurkalender").then((m) => m.Concept265),
  ),
  "266": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-266-kruiswoord").then((m) => m.Concept266),
  ),
  "267": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-267-vaporwave").then((m) => m.Concept267),
  ),
  "268": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-268-recept").then((m) => m.Concept268),
  ),
  "269": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-269-nautilus").then((m) => m.Concept269),
  ),
  "270": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-270-staalkaart").then((m) => m.Concept270),
  ),
  "271": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-271-klavier").then((m) => m.Concept271),
  ),
  "272": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-272-windroos").then((m) => m.Concept272),
  ),
  "273": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-273-dichroisch").then((m) => m.Concept273),
  ),
  "274": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-274-getallenas").then((m) => m.Concept274),
  ),
  "275": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-275-solarisatie").then((m) => m.Concept275),
  ),
  "276": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-276-sgraffito").then((m) => m.Concept276),
  ),
  "277": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-277-duotoon").then((m) => m.Concept277),
  ),
  "278": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-278-splitflap").then((m) => m.Concept278),
  ),
  "279": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-279-bioluminescentie").then((m) => m.Concept279),
  ),
  "280": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-280-kalkverf").then((m) => m.Concept280),
  ),
  "281": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-281-atlas").then((m) => m.Concept281),
  ),
  "282": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-282-courant").then((m) => m.Concept282),
  ),
  "283": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-283-spectraal").then((m) => m.Concept283),
  ),
  "284": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-284-blauwdruk").then((m) => m.Concept284),
  ),
  "285": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-285-perkament").then((m) => m.Concept285),
  ),
  "286": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-286-origami").then((m) => m.Concept286),
  ),
  "287": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-287-amber").then((m) => m.Concept287),
  ),
  "288": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-288-herbarium").then((m) => m.Concept288),
  ),
  "289": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-289-glasinlood").then((m) => m.Concept289),
  ),
  "290": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-290-zwitsers").then((m) => m.Concept290),
  ),
  "291": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-291-futurisme").then((m) => m.Concept291),
  ),
  "292": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-292-instant").then((m) => m.Concept292),
  ),
  "293": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-293-aero").then((m) => m.Concept293),
  ),
  "294": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-294-zeefdruk").then((m) => m.Concept294),
  ),
  "295": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-295-echolood").then((m) => m.Concept295),
  ),
  "296": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-296-windtunnel").then((m) => m.Concept296),
  ),
  "297": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-297-aquaduct").then((m) => m.Concept297),
  ),
  "298": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-298-astrolabium").then((m) => m.Concept298),
  ),
  "299": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-299-lampion").then((m) => m.Concept299),
  ),
  "300": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-300-zootroop").then((m) => m.Concept300),
  ),
  "301": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-301-ganzenbord").then((m) => m.Concept301),
  ),
  "302": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-302-lopendeband").then((m) => m.Concept302),
  ),
  "303": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-303-maquette").then((m) => m.Concept303),
  ),
  "304": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-304-zoutvlak").then((m) => m.Concept304),
  ),
  "305": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-305-partituur").then((m) => m.Concept305),
  ),
  "306": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-306-laboratorium").then((m) => m.Concept306),
  ),
  "307": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-307-veiling").then((m) => m.Concept307),
  ),
  "308": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-308-magma").then((m) => m.Concept308),
  ),
  "309": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-309-zeppelin").then((m) => m.Concept309),
  ),
  "310": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-310-kruidenier").then((m) => m.Concept310),
  ),
  "311": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-311-waas").then((m) => m.Concept311),
  ),
  "312": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-312-mechaniek").then((m) => m.Concept312),
  ),
  "313": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-313-kladblok").then((m) => m.Concept313),
  ),
  "314": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-314-lichtkrant").then((m) => m.Concept314),
  ),
  "315": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-315-dauw").then((m) => m.Concept315),
  ),
  "316": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-316-rekenkamer").then((m) => m.Concept316),
  ),
  "317": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-317-diagonaal").then((m) => m.Concept317),
  ),
  "318": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-318-filigraan").then((m) => m.Concept318),
  ),
  "319": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-319-nachtmarkt").then((m) => m.Concept319),
  ),
  "320": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-320-handpalm").then((m) => m.Concept320),
  ),
  "321": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-321-mistral").then((m) => m.Concept321),
  ),
  "322": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-322-kwik").then((m) => m.Concept322),
  ),
  "323": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-323-beitel").then((m) => m.Concept323),
  ),
  "324": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-324-zephyr").then((m) => m.Concept324),
  ),
  "325": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-325-kommando").then((m) => m.Concept325),
  ),
  "326": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-326-glans").then((m) => m.Concept326),
  ),
  "327": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-327-kobalt").then((m) => m.Concept327),
  ),
  "328": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-328-etalage").then((m) => m.Concept328),
  ),
  "329": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-329-aubergine").then((m) => m.Concept329),
  ),
  "330": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-330-momentum").then((m) => m.Concept330),
  ),
  "331": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-331-nevel").then((m) => m.Concept331),
  ),
  "332": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-332-relief").then((m) => m.Concept332),
  ),
  "333": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-333-sferisch").then((m) => m.Concept333),
  ),
  "334": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-334-zine").then((m) => m.Concept334),
  ),
  "335": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-335-aquarel").then((m) => m.Concept335),
  ),
  "336": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-336-kinfolk").then((m) => m.Concept336),
  ),
  "337": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-337-riso").then((m) => m.Concept337),
  ),
  "338": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-338-grafiet").then((m) => m.Concept338),
  ),
  "339": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-339-kompres").then((m) => m.Concept339),
  ),
  "340": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-340-galerie").then((m) => m.Concept340),
  ),
  "341": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-341-meridiaan").then((m) => m.Concept341),
  ),
  "342": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-342-terracotta").then((m) => m.Concept342),
  ),
  "343": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-343-kobaltglas").then((m) => m.Concept343),
  ),
  "344": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-344-passer").then((m) => m.Concept344),
  ),
  "345": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-345-schaduwspel").then((m) => m.Concept345),
  ),
  "346": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-346-vlonder").then((m) => m.Concept346),
  ),
  "347": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-347-ivoor").then((m) => m.Concept347),
  ),
  "348": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-348-kwintet").then((m) => m.Concept348),
  ),
  "349": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-349-vensterbank").then((m) => m.Concept349),
  ),
  "350": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-350-loden").then((m) => m.Concept350),
  ),
  "351": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-351-baken").then((m) => m.Concept351),
  ),
  "352": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-352-diepzee").then((m) => m.Concept352),
  ),
  "353": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-353-atelier").then((m) => m.Concept353),
  ),
  "354": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-354-kwarts").then((m) => m.Concept354),
  ),
  "355": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-355-meridiaan").then((m) => m.Concept355),
  ),
  "356": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-356-halogeen").then((m) => m.Concept356),
  ),
  "357": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-357-prisma").then((m) => m.Concept357),
  ),
  "358": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-358-sediment").then((m) => m.Concept358),
  ),
  "359": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-359-zonnewijzer").then((m) => m.Concept359),
  ),
  "360": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-360-notenbalk").then((m) => m.Concept360),
  ),
  "361": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-361-zetsel").then((m) => m.Concept361),
  ),
  "362": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-362-lagen").then((m) => m.Concept362),
  ),
  "363": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-363-boarding").then((m) => m.Concept363),
  ),
  "364": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-364-golfslag").then((m) => m.Concept364),
  ),
  "365": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-365-kwartet").then((m) => m.Concept365),
  ),
  "366": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-366-ledger").then((m) => m.Concept366),
  ),
  "367": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-367-blauwuur").then((m) => m.Concept367),
  ),
  "368": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-368-draaiboek").then((m) => m.Concept368),
  ),
  "369": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-369-passe-partout").then((m) => m.Concept369),
  ),
  "370": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-370-sextant").then((m) => m.Concept370),
  ),
  "371": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-371-deco").then((m) => m.Concept371),
  ),
  "372": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-372-marqueterie").then((m) => m.Concept372),
  ),
  "373": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-373-gebrand").then((m) => m.Concept373),
  ),
  "374": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-374-anaglyph").then((m) => m.Concept374),
  ),
  "375": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-375-guilloche").then((m) => m.Concept375),
  ),
  "376": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-376-warmtekaart").then((m) => m.Concept376),
  ),
  "377": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-377-oscilloscoop").then((m) => m.Concept377),
  ),
  "378": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-378-seismograaf").then((m) => m.Concept378),
  ),
  "379": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-379-batik").then((m) => m.Concept379),
  ),
  "380": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-380-scherenschnitt").then((m) => m.Concept380),
  ),
  "381": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-381-dampkring").then((m) => m.Concept381),
  ),
  "382": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-382-maalstroom").then((m) => m.Concept382),
  ),
  "383": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-383-leporello").then((m) => m.Concept383),
  ),
  "384": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-384-majolica").then((m) => m.Concept384),
  ),
  "385": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-385-kwartslag").then((m) => m.Concept385),
  ),
  "386": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-386-telegraaf").then((m) => m.Concept386),
  ),
  "387": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-387-zoutkristal").then((m) => m.Concept387),
  ),
  "388": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-388-lichtorgel").then((m) => m.Concept388),
  ),
  "389": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-389-schaduwdoos").then((m) => m.Concept389),
  ),
  "390": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-390-windvaan").then((m) => m.Concept390),
  ),
  "391": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-391-risograaf").then((m) => m.Concept391),
  ),
  "392": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-392-eink").then((m) => m.Concept392),
  ),
  "393": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-393-synthwave").then((m) => m.Concept393),
  ),
  "394": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-394-origami").then((m) => m.Concept394),
  ),
  "395": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-395-terrazzo").then((m) => m.Concept395),
  ),
  "396": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-396-borduurwerk").then((m) => m.Concept396),
  ),
  "397": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-397-metrokaart").then((m) => m.Concept397),
  ),
  "398": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-398-herbarium").then((m) => m.Concept398),
  ),
  "399": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-399-printplaat").then((m) => m.Concept399),
  ),
  "400": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-400-almanak").then((m) => m.Concept400),
  ),
  "401": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-401-meniscus").then((m) => m.Concept401),
  ),
  "402": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-402-schuinte").then((m) => m.Concept402),
  ),
  "403": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-403-zandsteen").then((m) => m.Concept403),
  ),
  "404": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-404-regelkamer").then((m) => m.Concept404),
  ),
  "405": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-405-speelgoed").then((m) => m.Concept405),
  ),
  "406": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-406-jaarverslag").then((m) => m.Concept406),
  ),
  "407": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-407-vectorveld").then((m) => m.Concept407),
  ),
  "408": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-408-duinpan").then((m) => m.Concept408),
  ),
  "409": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-409-marktkraam").then((m) => m.Concept409),
  ),
  "410": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-410-nachtwacht").then((m) => m.Concept410),
  ),
  "411": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-411-ravijn").then((m) => m.Concept411),
  ),
  "412": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-412-salon").then((m) => m.Concept412),
  ),
  "413": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-413-kadans").then((m) => m.Concept413),
  ),
  "414": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-414-veerpont").then((m) => m.Concept414),
  ),
  "415": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-415-kwast").then((m) => m.Concept415),
  ),
  "416": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-416-muntslag").then((m) => m.Concept416),
  ),
  "417": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-417-kelder").then((m) => m.Concept417),
  ),
  "418": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-418-contactvel").then((m) => m.Concept418),
  ),
  "419": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-419-volt").then((m) => m.Concept419),
  ),
  "420": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-420-wad").then((m) => m.Concept420),
  ),
  "421": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-421-nevelmesh").then((m) => m.Concept421),
  ),
  "422": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-422-plakblok").then((m) => m.Concept422),
  ),
  "423": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-423-sonar").then((m) => m.Concept423),
  ),
  "424": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-424-vlakverdeling").then((m) => m.Concept424),
  ),
  "425": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-425-lakmoes").then((m) => m.Concept425),
  ),
  "426": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-426-broeikas").then((m) => m.Concept426),
  ),
  "427": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-427-cortenstaal").then((m) => m.Concept427),
  ),
  "428": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-428-isohypse").then((m) => m.Concept428),
  ),
  "429": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-429-dijkgraaf").then((m) => m.Concept429),
  ),
  "430": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-430-barnsteen").then((m) => m.Concept430),
  ),
  "431": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-431-meander").then((m) => m.Concept431),
  ),
  "432": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-432-tektoniek").then((m) => m.Concept432),
  ),
  "433": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-433-passaat").then((m) => m.Concept433),
  ),
  "434": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-434-fluweel").then((m) => m.Concept434),
  ),
  "435": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-435-craquele").then((m) => m.Concept435),
  ),
  "436": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-436-salie").then((m) => m.Concept436),
  ),
  "437": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-437-amplitude").then((m) => m.Concept437),
  ),
  "438": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-438-aquarium").then((m) => m.Concept438),
  ),
  "439": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-439-gouache").then((m) => m.Concept439),
  ),
  "440": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-440-linnen").then((m) => m.Concept440),
  ),
  "441": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-441-kelp").then((m) => m.Concept441),
  ),
  "442": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-442-prairie").then((m) => m.Concept442),
  ),
  "443": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-443-barcode").then((m) => m.Concept443),
  ),
  "444": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-444-basalt").then((m) => m.Concept444),
  ),
  "445": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-445-gletsjer").then((m) => m.Concept445),
  ),
  "446": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-446-macrame").then((m) => m.Concept446),
  ),
  "447": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-447-houtskool").then((m) => m.Concept447),
  ),
  "448": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-448-eclips").then((m) => m.Concept448),
  ),
  "449": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-449-papierrol").then((m) => m.Concept449),
  ),
  "450": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-450-mokume").then((m) => m.Concept450),
  ),
  "451": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-451-origami").then((m) => m.Concept451),
  ),
  "452": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-452-balpen").then((m) => m.Concept452),
  ),
  "453": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-453-aquarel").then((m) => m.Concept453),
  ),
  "454": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-454-apotheek").then((m) => m.Concept454),
  ),
  "455": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-455-sterrenkaart").then((m) => m.Concept455),
  ),
  "456": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-456-mycelium").then((m) => m.Concept456),
  ),
  "457": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-457-glasvezel").then((m) => m.Concept457),
  ),
  "458": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-458-craquele").then((m) => m.Concept458),
  ),
  "459": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-459-risograaf").then((m) => m.Concept459),
  ),
  "460": dynamic(() =>
    import("@/components/ontwerp/concepts/concept-460-grootboek").then((m) => m.Concept460),
  ),
};

/** Rendert het gekozen concept lazy; onbekende id's leveren null (de server-route heeft dan al
 * notFound() aangeroepen op basis van de registry). */
export function ConceptHost({ id }: { id: string }) {
  const Component = COMPONENTS[id];
  if (!Component) return null;
  return <Component />;
}
