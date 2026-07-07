"use client";

// Concept 143 — "Kantlijn" · geannoteerd manuscript / marginalia. Een gelinieerde tekstkolom met een
// brede kantlijn vol handgeschreven-aanvoelende notities, verwijstekens en een voetnoot-apparaat. De
// margenoten geven context/uitleg — matching-redenen, verificatie-toelichting — als kanttekening met
// een verwijsnummer dat terugslaat op de tekst. Warm papier, dunne liniatuur, een rode margelijn en
// rood correctie-accent. Onderscheidend van redactie/courant: dit gaat over ANNOTATIE en de marge als
// UI, niet over krantenopmaak. Deterministisch — geen random, geen Date. Fonts: Newsreader (tekst) +
// JetBrains Mono (margenummers/apparaat).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Feather,
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

// ── Palet — warm papier, inkt, rood correctie-accent ────────────────────────────
const C = {
  paper: "#f7f2e7",
  paperEdge: "#efe7d4",
  sheet: "#fbf7ec",
  ink: "#2a2620", // inkt
  inkSoft: "#5b5347",
  inkFaint: "#938a78",
  rule: "#e2d8bf", // liniatuur
  ruleSoft: "#ece3cd",
  margin: "#c0553f", // rode margelijn / correctie
  marginSoft: "#d98b6a",
  ok: "#3f6b4a", // groen voor geverifieerd (dof, inkt-achtig)
  pencil: "#7d7565",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Gelinieerd papier-vlak (dunne horizontale liniatuur).
const ruledBg: React.CSSProperties = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, ${C.rule} 27px, ${C.rule} 28px)`,
};

// ── Status-model — nooit kleur alleen ───────────────────────────────────────────
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.inkSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.margin };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.margin };
  }
}

function matchTone(m: number): string {
  return m >= 90 ? C.ok : m >= 80 ? C.ink : C.margin;
}

// ── Verwijsteken in de lopende tekst (superscript, rood) ────────────────────────
function Ref({ n }: { n: number }) {
  return (
    <sup
      className="ml-0.5 align-super text-[10px] font-bold"
      style={{ ...mono, color: C.margin }}
      aria-label={`kanttekening ${n}`}
    >
      [{n}]
    </sup>
  );
}

// ── Kanttekening in de marge ────────────────────────────────────────────────────
type Note = { n: number; text: string; tone?: string };

function MarginNote({ note }: { note: Note }) {
  const tone = note.tone ?? C.inkSoft;
  return (
    <li className="flex gap-2 leading-snug">
      <span
        className="mt-px shrink-0 text-[10.5px] font-bold tabular-nums"
        style={{ ...mono, color: C.margin }}
        aria-hidden="true"
      >
        [{note.n}]
      </span>
      <span className="text-[12px]" style={{ ...serif, color: tone, fontStyle: "italic" }}>
        {note.text}
      </span>
    </li>
  );
}

// Manuscript-blad: kantlijn met margenoten + gelinieerde hoofdkolom met rode margelijn.
function Leaf({
  notes,
  heading,
  children,
}: {
  notes: Note[];
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-0 md:grid-cols-[190px_minmax(0,1fr)]">
      {/* Kantlijn met kanttekeningen */}
      <aside className="order-2 pt-4 md:order-1 md:pr-5 md:pt-1">
        <div
          className="flex items-center gap-1.5 pb-2"
          style={{ borderBottom: `1px dotted ${C.marginSoft}` }}
        >
          <Feather size={12} style={{ color: C.margin }} aria-hidden="true" />
          <span
            className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.margin }}
          >
            Kanttekeningen
          </span>
        </div>
        {notes.length === 0 ? (
          <p className="pt-2 text-[11.5px] italic" style={{ ...serif, color: C.inkFaint }}>
            Geen kanttekeningen bij dit blad.
          </p>
        ) : (
          <ul className="space-y-2.5 pt-3">
            {notes.map((nt) => (
              <MarginNote key={nt.n} note={nt} />
            ))}
          </ul>
        )}
      </aside>

      {/* Hoofdkolom — manuscript */}
      <div
        className="order-1 pl-4 md:order-2 md:pl-6"
        style={{ borderLeft: `2px solid ${C.margin}` }}
      >
        {heading && (
          <h2
            className="mb-3 text-[22px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ ...serif, color: C.ink }}
          >
            {heading}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

// Statuschip — label + icoon + vorm.
function Chip({
  tone,
  Icon,
  children,
}: {
  tone: string;
  Icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ ...mono, border: `1px solid ${tone}`, color: tone, background: `${tone}12` }}
    >
      <Icon size={11} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </span>
  );
}

// Onderstreepte "potlood"-meter voor scores.
function ScoreBar({ value, tone }: { value: number; tone: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: C.ruleSoft }}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12.5px] font-semibold tabular-nums" style={{ ...mono, color: tone }}>
        {value}%
      </span>
    </span>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────────
export function Concept143() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...serif, background: C.paper, color: C.ink }}
    >
      <div className="mx-auto max-w-[1080px] px-4 py-6 md:px-10 md:py-9">
        {/* Titelblad */}
        <header
          className="flex flex-wrap items-end justify-between gap-4 pb-4"
          style={{ borderBottom: `2px solid ${C.ink}` }}
        >
          <div>
            <div className="flex items-center gap-2">
              <Feather size={16} style={{ color: C.margin }} aria-hidden="true" />
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.28em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Werkdossier · geannoteerd
              </span>
            </div>
            <h1
              className="mt-1.5 text-[27px] font-semibold leading-none tracking-[-0.01em]"
              style={{ ...serif, color: C.ink }}
            >
              Kantlijn
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Chip tone={C.ok} Icon={ShieldCheck}>
              {PROFIEL.trust}
            </Chip>
            <div className="text-right leading-tight">
              <div className="text-[13px] font-semibold" style={{ ...serif, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div className="text-[10.5px]" style={{ ...mono, color: C.inkFaint }}>
                {PROFIEL.plaats}
              </div>
            </div>
          </div>
        </header>

        {/* Inhoudsopgave / register als tabs */}
        <nav
          className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1.5 pb-1"
          aria-label="Schermen"
        >
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...serif,
                  color: on ? C.paper : C.inkSoft,
                  background: on ? C.ink : "transparent",
                }}
              >
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ ...mono, color: on ? C.marginSoft : C.margin }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
              </button>
            );
          })}
        </nav>

        <main
          className="mt-6 rounded-lg p-4 md:p-8"
          style={{
            background: C.sheet,
            border: `1px solid ${C.ruleSoft}`,
            boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
          }}
        >
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
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────────
function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const urgent = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  const notes: Note[] = [
    {
      n: 1,
      text: `Dekking ${dek}%: ${verified} van ${CREDENTIALS.length} certificaten zijn geverifieerd.`,
      tone: C.ok,
    },
    {
      n: 2,
      text: "Deze opdracht scoort het hoogst op je profiel en beschikbaarheid.",
      tone: C.inkSoft,
    },
    { n: 3, text: urgent.detail, tone: C.margin },
  ];

  return (
    <Leaf heading="Dashboard" notes={notes}>
      {/* Lopende samenvatting */}
      <p className="text-[15px] leading-[28px]" style={{ ...serif, color: C.ink, ...ruledBg }}>
        Goedemorgen, {PROFIEL.naam.split(" ")[0]}. Je verificatie-dekking staat op {dek}%
        <Ref n={1} />, je best passende opdracht is{" "}
        <span className="font-semibold">{top.titel}</span>
        <Ref n={2} />, en er staat één actie open die aandacht vraagt
        <Ref n={3} />.
      </p>

      {/* KPI-regel als voetnoot-apparaat */}
      <div
        className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4"
        style={{ borderTop: `1px solid ${C.ruleSoft}`, paddingTop: 16 }}
      >
        {KPIS.map((k) => (
          <div key={k.label}>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {k.label}
            </div>
            <div
              className="mt-1 text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...serif, color: C.ink }}
            >
              {k.value}
            </div>
            <div
              className="mt-1 text-[11px] font-semibold tabular-nums"
              style={{ ...mono, color: k.up ? C.ok : C.margin }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Urgente actie */}
      <div
        className="mt-6 flex flex-col gap-3 rounded-md p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: `${C.margin}0e`, border: `1px solid ${C.marginSoft}` }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={18}
            strokeWidth={2.2}
            className="mt-0.5 shrink-0"
            style={{ color: C.margin }}
            aria-hidden="true"
          />
          <div>
            <div className="text-[14.5px] font-semibold" style={{ ...serif, color: C.ink }}>
              {urgent.titel}
            </div>
            <div className="text-[12.5px]" style={{ ...serif, color: C.inkSoft }}>
              Zie kanttekening [3] in de marge.
            </div>
          </div>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, background: C.margin, color: C.paper }}
        >
          {urgent.cta} <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Top-match uitgelicht */}
      <button
        onClick={onOpen}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-md p-4 text-left transition-colors hover:bg-[#f2ecdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ border: `1px solid ${C.ruleSoft}` }}
      >
        <div className="min-w-0">
          <div className="text-[14.5px] font-semibold" style={{ ...serif, color: C.ink }}>
            {top.titel}
          </div>
          <div className="text-[12px]" style={{ ...serif, color: C.inkSoft }}>
            {top.opdrachtgever} · {top.plaats} · {top.tarief}
          </div>
        </div>
        <ScoreBar value={top.match} tone={matchTone(top.match)} />
      </button>
    </Leaf>
  );
}

// ── Marktplaats ─────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const notes: Note[] = filtered.slice(0, 3).map((o, i) => ({
    n: i + 1,
    text: `${o.titel}: ${o.redenen.plus[0]}${o.redenen.min[0] ? `; let op — ${o.redenen.min[0].toLowerCase()}` : ""}.`,
    tone: o.redenen.min[0] ? C.inkSoft : C.ok,
  }));

  return (
    <Leaf heading="Marktplaats" notes={notes}>
      <div
        className="mb-4 flex items-center gap-2 rounded-md px-3 py-2"
        style={{ border: `1px solid ${C.ruleSoft}`, background: C.paper }}
      >
        <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Doorzoek het register…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:opacity-50"
          style={{ ...serif, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.inkFaint }}>
          {filtered.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Search size={22} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
            Geen inschrijvingen gevonden
          </p>
          <p className="max-w-xs text-[13px] italic" style={{ ...serif, color: C.inkSoft }}>
            Geen resultaat voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.ink, color: C.paper }}
          >
            Zoekterm wissen
          </button>
        </div>
      ) : (
        <ol className="divide-y" style={{ borderColor: C.ruleSoft }}>
          {filtered.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="flex w-full items-start gap-4 py-4 text-left transition-colors hover:bg-[#f2ecdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <span
                  className="mt-0.5 text-[12px] font-bold tabular-nums"
                  style={{ ...mono, color: C.margin }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15.5px] font-semibold leading-tight"
                    style={{ ...serif, color: C.ink }}
                  >
                    {o.titel}
                    {i < 3 && <Ref n={i + 1} />}
                  </div>
                  <div className="text-[12.5px]" style={{ ...serif, color: C.inkSoft }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] italic"
                        style={{ ...serif, color: C.pencil }}
                      >
                        · {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 pt-1">
                  <ScoreBar value={o.match} tone={matchTone(o.match)} />
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Leaf>
  );
}

// ── Opdracht-detail ─────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string }[] = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Plaats", v: opdracht.plaats },
  ];
  const tone = matchTone(opdracht.match);

  const notes: Note[] = [
    ...opdracht.redenen.plus.map((r, i) => ({ n: i + 1, text: r, tone: C.ok })),
    ...opdracht.redenen.min.map((r, i) => ({
      n: opdracht.redenen.plus.length + i + 1,
      text: r,
      tone: C.margin,
    })),
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded text-[12px] font-medium transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.inkSoft }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar register
      </button>

      <Leaf heading={opdracht.titel} notes={notes}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-[11px] uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.inkFaint }}
          >
            {opdracht.id}
          </span>
          <Chip tone={tone} Icon={Check}>
            Match {opdracht.match}%
          </Chip>
          <span className="text-[13px]" style={{ ...serif, color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
        </div>

        {/* Feiten als geregeld overzicht */}
        <dl
          className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4"
          style={{
            borderTop: `1px solid ${C.ruleSoft}`,
            borderBottom: `1px solid ${C.ruleSoft}`,
            paddingBlock: 14,
          }}
        >
          {feiten.map((f) => (
            <div key={f.l}>
              <dt
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                {f.l}
              </dt>
              <dd className="mt-1 text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
                {f.v}
              </dd>
            </div>
          ))}
        </dl>

        {/* Beoordelend proza met verwijzingen naar de marge */}
        <p
          className="mt-5 text-[15px] leading-[28px]"
          style={{ ...serif, color: C.ink, ...ruledBg }}
        >
          Deze opdracht past goed bij je profiel: {opdracht.redenen.plus[0]?.toLowerCase() ?? ""}
          <Ref n={1} />
          {opdracht.redenen.plus[1] ? (
            <>
              , en {opdracht.redenen.plus[1].toLowerCase()}
              <Ref n={2} />
            </>
          ) : null}
          . Houd wel rekening met {opdracht.redenen.min[0]?.toLowerCase() ?? ""}
          <Ref n={opdracht.redenen.plus.length + 1} />. De volledige toelichting staat in de
          kantlijn.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded px-6 py-3 text-[13.5px] font-semibold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.ink, color: C.paper }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, border: `1px solid ${C.ink}`, color: C.ink }}
          >
            Bewaren
          </button>
        </div>
      </Leaf>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  const notes: Note[] = CREDENTIALS.filter((c) => c.status !== "VERIFIED").map((c, i) => ({
    n: i + 1,
    text: `${c.naam}: ${c.detail}.`,
    tone: c.status === "EXPIRING" || c.status === "REJECTED" ? C.margin : C.inkSoft,
  }));

  return (
    <Leaf heading="Verificatie & certificaten" notes={notes}>
      <p className="text-[15px] leading-[28px]" style={{ ...serif, color: C.ink }}>
        Vertrouwensniveau:{" "}
        <span className="font-semibold" style={{ color: C.ok }}>
          {PROFIEL.trust}
        </span>
        . Van je {CREDENTIALS.length} certificaten zijn er {verified} geverifieerd — een dekking van{" "}
        {pct}%. De items die nog aandacht vragen zijn in de kantlijn toegelicht.
      </p>

      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full"
        style={{ background: C.ruleSoft }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: pct >= 80 ? C.ok : C.margin }}
        />
      </div>

      <ul className="mt-5 divide-y" style={{ borderColor: C.ruleSoft }}>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          const noteN = CREDENTIALS.slice(0, i).filter((x) => x.status !== "VERIFIED").length + 1;
          return (
            <li key={c.naam} className="flex flex-wrap items-center gap-3 py-3.5">
              <m.Icon
                size={18}
                strokeWidth={2.2}
                className="shrink-0"
                style={{ color: m.tone }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold" style={{ ...serif, color: C.ink }}>
                  {c.naam}
                  {actionable && <Ref n={noteN} />}
                </div>
                <div className="text-[12px]" style={{ ...serif, color: C.inkSoft }}>
                  {c.detail}
                </div>
              </div>
              <Chip tone={m.tone} Icon={m.Icon}>
                {m.label}
              </Chip>
              <button
                disabled={!actionable}
                className="rounded px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                style={
                  actionable
                    ? { ...mono, background: C.margin, color: C.paper }
                    : { ...mono, border: `1px solid ${C.ruleSoft}`, color: C.inkFaint }
                }
              >
                {actionable ? "Behandelen" : "Compleet"}
              </button>
            </li>
          );
        })}
      </ul>
    </Leaf>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const notes: Note[] = sorted.map((a, i) => ({
    n: i + 1,
    text: a.detail,
    tone: a.urgentie === "warning" ? C.margin : C.inkSoft,
  }));

  return (
    <Leaf heading="Volgende beste acties" notes={notes}>
      <p className="mb-4 text-[14px] italic leading-relaxed" style={{ ...serif, color: C.inkSoft }}>
        Op volgorde van urgentie. Elke regel verwijst naar een toelichting in de kantlijn.
      </p>
      <ol className="divide-y" style={{ borderColor: C.ruleSoft }}>
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel} className="flex flex-wrap items-center gap-3 py-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums"
                style={{
                  ...mono,
                  border: `1px solid ${warn ? C.margin : C.ink}`,
                  color: warn ? C.margin : C.ink,
                }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {warn && (
                    <span
                      className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...mono, color: C.margin }}
                    >
                      <AlertTriangle size={11} strokeWidth={2.6} aria-hidden="true" /> Urgent
                    </span>
                  )}
                </div>
                <div className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
                  {a.titel}
                  <Ref n={i + 1} />
                </div>
              </div>
              <button
                className="shrink-0 rounded px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...mono, background: warn ? C.margin : C.ink, color: C.paper }}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>
    </Leaf>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────
function Facturen() {
  const meta = (status: string): { tone: string; Icon: LucideIcon } => {
    if (status === "Betaald") return { tone: C.ok, Icon: Check };
    if (status === "Openstaand") return { tone: C.margin, Icon: Clock };
    return { tone: C.inkFaint, Icon: Feather };
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand");
  const notes: Note[] = open.map((f, i) => ({
    n: i + 1,
    text: `${f.nr} aan ${f.klant} staat nog open — ${f.bedrag}.`,
    tone: C.margin,
  }));

  return (
    <Leaf
      heading="Facturen"
      notes={notes.length ? notes : [{ n: 1, text: "Geen openstaande posten.", tone: C.ok }]}
    >
      <div
        className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2"
        style={{ borderBottom: `1px solid ${C.ruleSoft}`, paddingBottom: 14 }}
      >
        {[
          { l: "Betaald (mnd)", v: "€ 8.622", tone: C.ok },
          { l: "Openstaand", v: `${open.length}`, tone: C.margin },
          { l: "Te factureren", v: "€ 1.350", tone: C.ink },
        ].map((s) => (
          <div key={s.l}>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-0.5 text-[19px] font-semibold tabular-nums leading-none"
              style={{ ...serif, color: s.tone }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.ink}` }}>
            {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
              <th
                key={h}
                className={`py-2 text-[10px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                style={{ ...mono, color: C.inkFaint }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FACTUREN.map((f) => {
            const m = meta(f.status);
            const openIdx = open.findIndex((o) => o.nr === f.nr);
            return (
              <tr key={f.nr} style={{ borderBottom: `1px solid ${C.ruleSoft}` }}>
                <td
                  className="py-3 pr-3 text-[12.5px] tabular-nums"
                  style={{ ...mono, color: C.inkSoft }}
                >
                  {f.nr}
                </td>
                <td className="py-3 pr-3 text-[13.5px]" style={{ ...serif, color: C.ink }}>
                  {f.klant}
                  {openIdx >= 0 && <Ref n={openIdx + 1} />}
                </td>
                <td
                  className="py-3 pr-3 text-[12.5px] tabular-nums"
                  style={{ ...mono, color: C.inkSoft }}
                >
                  {f.datum}
                </td>
                <td className="py-3 pr-3">
                  <Chip tone={m.tone} Icon={m.Icon}>
                    {f.status}
                  </Chip>
                </td>
                <td
                  className="py-3 text-right text-[14px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Leaf>
  );
}
