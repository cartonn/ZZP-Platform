// Dienst → ORT-segmenten. Pure motor: zet een gewerkte dienst (begin/eind) automatisch om in
// uren per ORT-categorie, zodat een zorgverlener alléén de diensttijden invoert ("22:00–07:00")
// en het systeem avond/nacht/weekend/feestdag zelf afleidt — geen handmatige urenverdeling (Excel).
//
// Precedentie = hoogste toeslag wint: kwalificeert een minuut voor meerdere categorieën (bv.
// zaterdagnacht), dan telt de categorie met de hoogste toeslag (bps) volgens het sectorprofiel.
// Dat sluit aan op de gangbare CAO-regel. Tijdvensters/feestdagen zijn configureerbaar.
//
// Let op: tijden worden in de lokale runtime-tijdzone geïnterpreteerd; zet TZ=Europe/Amsterdam in
// productie zodat avond/nacht-grenzen kloppen. Geld loopt nooit via het platform — dit is berekening.

import {
  type OrtCategory,
  ORT_TIME_WINDOWS,
  DEFAULT_ORT_RATES_BPS,
  ORT_CATEGORIES,
} from "@/lib/config";
import { type OrtSegment, type OrtSegmentCategory } from "@/lib/ort";

/** Lokale datumsleutel YYYY-MM-DD (voor feestdag-vergelijking). */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Alle ORT-categorieën waarvoor dit tijdstip in aanmerking komt (kan er meerdere zijn). */
function applicableCategories(d: Date, holidays: ReadonlySet<string>): OrtCategory[] {
  const cats: OrtCategory[] = [];
  if (holidays.has(dateKey(d))) cats.push("HOLIDAY");
  const dow = d.getDay(); // 0 = zondag, 6 = zaterdag
  if (dow === 0) cats.push("SUNDAY");
  if (dow === 6) cats.push("SATURDAY");
  const h = d.getHours();
  if (h >= ORT_TIME_WINDOWS.nightStartHour || h < ORT_TIME_WINDOWS.nightEndHour) {
    cats.push("NIGHT");
  } else if (h >= ORT_TIME_WINDOWS.eveningStartHour) {
    cats.push("EVENING");
  }
  return cats;
}

/** Kies de categorie met de hoogste toeslag; geen enkele → NORMAL. */
function classify(
  d: Date,
  rates: Record<OrtCategory, number>,
  holidays: ReadonlySet<string>,
): OrtSegmentCategory {
  const cats = applicableCategories(d, holidays);
  if (cats.length === 0) return "NORMAL";
  return cats.reduce((best, c) => (rates[c] > rates[best] ? c : best));
}

export interface SegmentShiftOptions {
  /** Toeslagprofiel dat de precedentie bepaalt (hoogste toeslag wint). Default = standaardtarieven. */
  rates?: Record<OrtCategory, number>;
  /** Erkende feestdagen als YYYY-MM-DD-set. Leeg = geen feestdagtoeslag. */
  holidays?: ReadonlySet<string>;
  /** Resolutie in minuten waarmee de dienst wordt doorlopen (default 15). */
  stepMinutes?: number;
}

/**
 * Splitst een dienst [start, end) in ORT-segmenten (uren per categorie). Loopt de dienst in
 * stappen van `stepMinutes` door en telt per categorie op; uren worden op 2 decimalen afgerond.
 * Werpt bij ongeldige invoer (eind ≤ start). Een dienst mag middernacht passeren.
 */
export function segmentShift(start: Date, end: Date, opts: SegmentShiftOptions = {}): OrtSegment[] {
  if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Ongeldige diensttijden.");
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error("Het einde van de dienst moet na het begin liggen.");
  }
  const rates = opts.rates ?? DEFAULT_ORT_RATES_BPS;
  const holidays = opts.holidays ?? new Set<string>();
  const step = opts.stepMinutes && opts.stepMinutes > 0 ? opts.stepMinutes : 15;
  const stepMs = step * 60_000;

  const minutesByCat = new Map<OrtSegmentCategory, number>();
  for (let t = start.getTime(); t < end.getTime(); t += stepMs) {
    const sliceMs = Math.min(stepMs, end.getTime() - t);
    const cat = classify(new Date(t), rates, holidays);
    minutesByCat.set(cat, (minutesByCat.get(cat) ?? 0) + sliceMs / 60_000);
  }

  // Vaste volgorde: NORMAL eerst, daarna de toeslagcategorieën in configvolgorde.
  const order: OrtSegmentCategory[] = ["NORMAL", ...ORT_CATEGORIES];
  const segments: OrtSegment[] = [];
  for (const cat of order) {
    const mins = minutesByCat.get(cat);
    if (mins && mins > 0) {
      segments.push({ category: cat, hours: Math.round((mins / 60) * 100) / 100 });
    }
  }
  return segments;
}

/** Eén gewerkte dienst (begin/eind). */
export interface Shift {
  start: Date;
  end: Date;
}

/**
 * Aggregeert meerdere diensten (bv. een week- of maand-urenstaat) tot één set ORT-segmenten.
 * Elke dienst wordt apart gesegmenteerd; gelijke categorieën worden opgeteld. Zo levert een
 * periode met veel diensten één factuur op met de juiste toeslagen — geen handmatige optelling.
 */
export function segmentShifts(shifts: readonly Shift[], opts: SegmentShiftOptions = {}): OrtSegment[] {
  const hoursByCat = new Map<OrtSegmentCategory, number>();
  for (const s of shifts) {
    for (const seg of segmentShift(s.start, s.end, opts)) {
      hoursByCat.set(seg.category, (hoursByCat.get(seg.category) ?? 0) + seg.hours);
    }
  }
  const order: OrtSegmentCategory[] = ["NORMAL", ...ORT_CATEGORIES];
  const segments: OrtSegment[] = [];
  for (const cat of order) {
    const hours = hoursByCat.get(cat);
    if (hours && hours > 0) segments.push({ category: cat, hours: Math.round(hours * 100) / 100 });
  }
  return segments;
}

/**
 * Officiële Nederlandse feestdagen voor een jaar als YYYY-MM-DD-set. Pasen via de
 * algoritmeberekening (Meeus/Jones/Butcher); Koningsdag schuift naar zaterdag als 27 april op
 * zondag valt. Bevrijdingsdag (5 mei) alleen in lustrumjaren als officiële vrije dag, maar voor
 * ORT nemen we 'm jaarlijks mee — overschrijf de set als een CAO dit anders regelt.
 */
export function dutchHolidays(year: number): Set<string> {
  const set = new Set<string>();
  const add = (m: number, d: number) => set.add(`${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  const addDate = (date: Date) => set.add(dateKey(date));

  add(1, 1); //   Nieuwjaarsdag
  // Koningsdag: 27 april, of 26 april als 27 april een zondag is.
  const kings = new Date(year, 3, 27);
  add(4, kings.getDay() === 0 ? 26 : 27);
  add(5, 5); //   Bevrijdingsdag
  add(12, 25); // Eerste Kerstdag
  add(12, 26); // Tweede Kerstdag

  // Pasen (Meeus/Jones/Butcher) → afgeleide dagen.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const dd = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - dd - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = maart, 4 = april
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);
  const offsetDay = (days: number) => new Date(year, month - 1, day + days);

  addDate(offsetDay(-2)); // Goede Vrijdag
  addDate(easter); //        Eerste Paasdag
  addDate(offsetDay(1)); //  Tweede Paasdag
  addDate(offsetDay(39)); // Hemelvaartsdag
  addDate(offsetDay(49)); // Eerste Pinksterdag
  addDate(offsetDay(50)); // Tweede Pinksterdag

  return set;
}
