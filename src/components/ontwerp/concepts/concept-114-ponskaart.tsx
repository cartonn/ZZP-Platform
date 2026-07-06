"use client";

// Concept 114 — "Ponskaart" · Hollerith/IBM-ponskaart uit de vroege computertelling (jaren '60).
// Buff/manila kaart-oppervlak met de karakteristieke afgesneden linkerbovenhoek (clip-path),
// data als geponste kolommen: genummerde posities 0-9 waar donkere afgeronde "gaten" een
// waarde coderen. Rode drukregel-lijnen zoals op echte ponskaarten. IBM Plex Mono (thematisch
// IBM) als hoofdfont + Inter voor lopende tekst. Eén moderne indigo-accent houdt het strak en
// premium i.p.v. puur nostalgisch. Onderscheidend van Console (phosphor-terminal), Teletekst en
// Printplaat (PCB): dit is de FYSIEKE ponskaart met gaten & kolomtelling. Light concept.

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  ShieldCheck,
  SquareStack,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  card: "#e9dcc0", // manila-buff kaart
  cardDeep: "#e0d1af",
  cardEdge: "#d3c199",
  ink: "#2c2519", // drukinkt-antraciet
  inkSoft: "#5b503c",
  muted: "#8c7d5f",
  red: "#b2402f", // drukregel-rood
  redSoft: "rgba(178,64,47,0.5)",
  hole: "#211d14", // near-black gat
  indigo: "#33447a", // moderne accent
  indigoDeep: "#28376a",
  line: "rgba(44,37,25,0.16)",
  lineStrong: "rgba(44,37,25,0.3)",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Kaartoppervlak: warme papiervezel via zachte gradients + heel fijne verticale kolomlijnen.
const cardSurface =
  "repeating-linear-gradient(90deg, transparent 0 22px, rgba(44,37,25,0.028) 22px 23px)," +
  "radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,0.4), transparent 45%)," +
  "radial-gradient(140% 120% at 100% 100%, rgba(51,68,122,0.05), transparent 55%)";

// De afgesneden linkerbovenhoek — dé signatuur van de Hollerith-kaart.
const notchClip = "polygon(28px 0, 100% 0, 100% 100%, 0 100%, 0 28px)";

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.indigo };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.muted };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.red };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Kaart-paneel met afgesneden hoek en warme rand.
function Card({
  children,
  className = "",
  notch = true,
  tone = "plain",
}: {
  children: React.ReactNode;
  className?: string;
  notch?: boolean;
  tone?: "plain" | "indigo" | "red";
}) {
  const edge = tone === "indigo" ? C.indigo : tone === "red" ? C.red : C.cardEdge;
  return (
    <div
      className={className}
      style={{
        background: C.cardDeep,
        backgroundImage: cardSurface,
        border: `1px solid ${edge}`,
        clipPath: notch ? notchClip : undefined,
        boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 2px 8px rgba(44,37,25,0.06)",
      }}
    >
      {children}
    </div>
  );
}

// Eén geponste kolom: rijen 0..9, het gat zit op de gecodeerde waarde.
function PunchColumn({
  digit,
  tone = C.hole,
  label,
}: {
  digit: number;
  tone?: string;
  label?: string;
}) {
  const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const d = Math.max(0, Math.min(9, digit));
  return (
    <div className="flex flex-col items-center gap-[3px]" aria-hidden="true">
      {label && (
        <span className="mb-0.5 text-[8px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {label}
        </span>
      )}
      {rows.map((r) => {
        const punched = r === d;
        return (
          <span
            key={r}
            className="flex h-[9px] w-[13px] items-center justify-center rounded-[2px] transition-colors"
            style={{
              background: punched ? tone : "rgba(44,37,25,0.05)",
              border: `1px solid ${punched ? tone : "rgba(44,37,25,0.14)"}`,
              boxShadow: punched ? "inset 0 1px 2px rgba(0,0,0,0.5)" : "none",
            }}
          >
            <span
              className="text-[6px] tabular-nums leading-none"
              style={{ ...mono, color: punched ? "transparent" : "rgba(44,37,25,0.28)" }}
            >
              {r}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// Een waarde als reeks geponste kolommen (per cijfer één kolom).
function PunchNumber({ value, tone = C.hole }: { value: string; tone?: string }) {
  const digits = value.replace(/\D/g, "").slice(0, 4).split("");
  return (
    <div className="flex items-end gap-[5px]">
      {digits.map((ch, i) => (
        <PunchColumn key={i} digit={Number(ch)} tone={tone} label={String.fromCharCode(65 + i)} />
      ))}
    </div>
  );
}

// Match% als horizontale gaten-balk: geponste vakjes tot het percentage.
function PunchBar({ value, tone = C.indigo }: { value: number; tone?: string }) {
  const cells = 20;
  const filled = Math.round((value / 100) * cells);
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-[2px]" aria-hidden="true">
        {Array.from({ length: cells }).map((_, i) => (
          <span
            key={i}
            className="h-3.5 w-[5px] rounded-[1px] transition-colors"
            style={{
              background: i < filled ? tone : "rgba(44,37,25,0.08)",
              boxShadow: i < filled ? "inset 0 1px 1px rgba(0,0,0,0.4)" : "none",
            }}
          />
        ))}
      </div>
      <span className="text-[13px] font-medium tabular-nums" style={{ ...mono, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

// Sparkline in ponskaart-stijl (dunne inktlijn).
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Sectiekop met kaart-serienummer en rode drukregel.
function Kop({ nr, children, sub }: { nr: string; children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span
          className="text-[10px] tabular-nums"
          style={{ ...mono, color: C.red, letterSpacing: "0.12em" }}
        >
          {nr}
        </span>
        {sub && (
          <span
            className="text-[10px] uppercase tracking-[0.28em]"
            style={{ ...ui, color: C.muted }}
          >
            {sub}
          </span>
        )}
      </div>
      <h2
        className="mt-1.5 text-[22px] font-semibold uppercase leading-none tracking-[0.04em] sm:text-[26px]"
        style={{ ...mono, color: C.ink }}
      >
        {children}
      </h2>
      <div className="mt-3 h-[2px] w-full" style={{ background: C.redSoft }} aria-hidden="true" />
    </div>
  );
}

export function Concept114() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.card, backgroundImage: cardSurface, color: C.ink }}
    >
      {/* Kop — kaart-header met serienummer en geponste identiteit */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center"
            style={{
              background: C.ink,
              color: C.card,
              clipPath: "polygon(26% 0, 100% 0, 100% 100%, 0 100%, 0 26%)",
            }}
            aria-hidden="true"
          >
            <SquareStack size={19} strokeWidth={1.9} />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.ink }}
            >
              Ponskaart
            </div>
            <div
              className="mt-1 text-[9px] uppercase tracking-[0.34em]"
              style={{ ...ui, color: C.muted }}
            >
              ZZP · Registratie-eenheid
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-medium" style={{ ...mono, color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center text-[12px] font-semibold"
            style={{
              ...mono,
              background: C.card,
              color: C.indigo,
              border: `1px solid ${C.indigo}`,
              clipPath: "polygon(26% 0, 100% 0, 100% 100%, 0 100%, 0 26%)",
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — rode drukregel eronder, actief = geponst kolomstreepje */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-4 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `2px solid ${C.redSoft}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-2 text-[12.5px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                color: on ? C.ink : C.muted,
                fontWeight: on ? 600 : 400,
              }}
            >
              <span className="mr-1.5 text-[9px] tabular-nums" style={{ color: C.red }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[6px] left-2 right-2 h-[3px]"
                  style={{ background: C.ink }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.hole, C.indigo, C.red, C.hole];
  return (
    <div className="space-y-10">
      {/* Groet als geponste kaartrand */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
          Kaart 001 · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-[0.02em] sm:text-[40px]"
          style={{ ...mono, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Je registratie is bijna volledig gecodeerd. Eén kolom vraagt vandaag een nieuwe pons — de
          rest staat vast.
        </p>
      </section>

      {/* Primaire actie */}
      <Card tone="red" className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.24em]"
              style={{ color: C.red }}
            >
              <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2 text-[20px] font-semibold leading-tight sm:text-[23px]"
              style={{ ...mono, color: C.ink }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 px-6 py-3 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...mono, background: C.red, color: C.card }}
          >
            {primair.cta}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </Card>

      {/* KPI's als geponste tellingen */}
      <section>
        <Kop nr="COL 01–04" sub="Getelde waarden">
          Prestatie
        </Kop>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            const num = k.value.replace(/\D/g, "") || "0";
            return (
              <Card
                key={k.label}
                className="group p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-[10px] uppercase tracking-[0.14em]"
                    style={{ color: C.muted }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ ...mono, color: k.up ? C.indigo : C.red }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
                  style={{ ...mono, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <PunchNumber value={num} tone={tone} />
                  <div className="w-20">
                    <Spark data={k.spark} tone={tone} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Top-match als geponste hoofdkaart */}
      <section>
        <Kop nr="COL 05" sub="Beste match">
          Voor jou
        </Kop>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Card
            tone="indigo"
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex shrink-0 flex-col items-center gap-2 px-4 py-3"
              style={{ background: C.card, border: `1px solid ${C.indigo}` }}
            >
              <PunchColumn digit={Math.round(top.match / 10)} tone={C.indigo} label="MATCH" />
              <span
                className="text-[16px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.indigo }}
              >
                {top.match}%
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[19px] font-semibold leading-tight"
                style={{ ...mono, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 text-[10.5px]"
                    style={{ background: C.card, color: C.inkSoft, border: `1px solid ${C.line}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.indigo }}
              aria-hidden="true"
            />
          </Card>
        </button>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-8">
      <Kop nr="STACK 12" sub="Open opdrachten">
        Marktplaats
      </Kop>

      <Card className="flex items-center gap-3 px-4 py-1" notch={false}>
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[18px] font-semibold uppercase" style={{ ...mono, color: C.ink }}>
            Geen kaarten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.red, color: C.card }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Card className="flex flex-col gap-4 p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] tabular-nums"
                        style={{ ...mono, color: C.red, letterSpacing: "0.1em" }}
                      >
                        {o.id}
                      </span>
                    </div>
                    <h3
                      className="mt-0.5 text-[17px] font-semibold leading-tight"
                      style={{ ...mono, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10.5px]"
                          style={{
                            background: C.card,
                            color: C.inkSoft,
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <PunchBar value={o.match} />
                    <ArrowRight
                      size={18}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.red }}
                      aria-hidden="true"
                    />
                  </div>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.06em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.muted }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.red }}>
            {opdracht.id}
          </span>
          <span
            className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]"
            style={{ ...mono, background: C.indigo, color: C.card }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.08] tracking-[0.01em] sm:text-[36px]"
          style={{ ...mono, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      {/* Feiten als vier geponste kolommen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              {m.l}
            </div>
            <div
              className="mt-1.5 text-[18px] font-semibold tabular-nums leading-tight"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </div>
          </Card>
        ))}
      </div>

      {/* Redenen — geponste plus/min */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card tone="indigo" className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.indigo }}
          >
            <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-0.5 flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-[2px]"
                  style={{ background: C.indigo }}
                  aria-hidden="true"
                >
                  <Check size={9} strokeWidth={3} style={{ color: C.card }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card tone="red" className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.red }}
          >
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-1 h-[11px] w-[11px] shrink-0 rounded-[2px]"
                  style={{ background: C.red, boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...mono, background: C.red, color: C.card }}
        >
          Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, border: `1px solid ${C.lineStrong}`, color: C.ink }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-8">
      <Kop nr="AUTH 07" sub="Vertrouwen">
        Verificatie
      </Kop>

      {/* Dekking als geponste voortgangsband */}
      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <div className="flex items-baseline gap-2">
            <span
              className="text-[38px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {pct}%
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
              gedekt
            </span>
          </div>
          <div className="mt-3">
            <PunchBar value={pct} tone={C.indigo} />
          </div>
        </div>
        <div className="sm:border-l sm:pl-6" style={{ borderColor: C.line }}>
          <div
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.indigo }}
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig gecodeerd. Eén kolom vraagt
            binnenkort een nieuwe pons — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Card>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Card className="flex items-center gap-4 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{
                    background: C.card,
                    border: `1px solid ${st.tone}`,
                    color: st.tone,
                    clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0 100%, 0 28%)",
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ ...mono, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
                  style={{
                    ...mono,
                    background: C.card,
                    color: st.tone,
                    border: `1px solid ${st.tone}`,
                  }}
                >
                  <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-8">
      <Kop nr="QUEUE 03" sub="De volgende beste stap">
        Volgende acties
      </Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.red : C.indigo;
          return (
            <li key={a.titel}>
              <Card
                tone={warn ? "red" : "plain"}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    background: C.card,
                    color: tone,
                    border: `1px solid ${tone}`,
                    clipPath: "polygon(24% 0, 100% 0, 100% 100%, 0 100%, 0 24%)",
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Check
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[16px] font-semibold leading-tight"
                      style={{ ...mono, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{ ...mono, background: tone, color: C.card }}
                >
                  {a.cta}
                </button>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): string => {
    if (status === "Betaald") return C.indigo;
    if (status === "Openstaand") return C.red;
    return C.muted;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop nr="LEDGER 09" sub="Omzet">
          Facturen
        </Kop>
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...mono, background: C.red, color: C.card }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-x-auto" notch={false}>
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.redSoft}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.muted, fontWeight: 600 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-opacity hover:opacity-80"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
                      style={{ ...mono, color: tone, border: `1px solid ${tone}` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-[1px]"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[14px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.lineStrong}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[10px] uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[18px] font-semibold tabular-nums"
                style={{ ...mono, color: C.indigo }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}
