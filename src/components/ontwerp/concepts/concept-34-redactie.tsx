"use client";

// Concept 34 — "Redactie" · Datajournalistiek — geannoteerde grafiek-editorial (LICHT).
// NYT/FT-stijl data-storytelling: inline SVG-grafieken (staaf, lijn/area, kleine multiples) met
// redactionele annotaties, bijschriften en "hoe te lezen"-notities. Serif-koppen boven zakelijke
// sans-body. Data-ink minimalisme (Tufte): dunne assen, directe labels, één signaalkleur.
// KPI's als geannoteerde mini-charts, matching-redenen als bar-chart, omzet als area-chart.
// Palet: bg #fbfaf7, fg #14181a, accent inkt-teal #1a5e63, signaal #c0392b.
// Fonts: --font-lab-newsreader (serif display) + --font-lab-inter (body).

import { useState } from "react";
import {
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  FileText,
  Send,
  Loader2,
  CornerDownRight,
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
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  paper: "#fbfaf7",
  paperDeep: "#f4f1ea",
  card: "#ffffff",
  ink: "#14181a",
  inkSoft: "#3c4247",
  muted: "#6b7177",
  faint: "#9aa0a5",
  rule: "#e4e0d6",
  ruleSoft: "#eeebe3",
  teal: "#1a5e63",
  tealSoft: "rgba(26,94,99,0.10)",
  tealLine: "rgba(26,94,99,0.22)",
  signal: "#c0392b",
  signalSoft: "rgba(192,57,43,0.10)",
  amber: "#a06a12",
  amberSoft: "rgba(160,106,18,0.10)",
  grid: "#ece8de",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const SECTION_NR: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

const SECTION_KICKER: Record<ScreenKey, string> = {
  dashboard: "De redactie",
  marktplaats: "Marktanalyse",
  opdracht: "Dossier",
  verificatie: "Verantwoording",
  acties: "Op de agenda",
  facturen: "De cijfers",
  documenten: "Archief",
  berichten: "Correspondentie",
};

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.teal, bg: C.tealSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.amber, bg: C.amberSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.signal, bg: C.signalSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.signal, bg: C.signalSoft, Icon: AlertTriangle };
  }
}

/* ---------- Redactionele bouwstenen ---------- */

// Sectiekop met nummer, dunne regel en serif-titel — als een krantensectie.
function SectionHead({
  nr,
  kicker,
  title,
  standfirst,
}: {
  nr: string;
  kicker: string;
  title: string;
  standfirst?: string;
}) {
  return (
    <header>
      <div className="flex items-center gap-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: C.signal, ...body }}
        >
          {kicker}
        </span>
        <span className="h-px flex-1" style={{ background: C.rule }} aria-hidden="true" />
        <span
          className="text-[11px] font-semibold tabular-nums tracking-[0.2em]"
          style={{ color: C.faint, ...body }}
        >
          § {nr}
        </span>
      </div>
      <h1
        className="mt-4 text-[34px] leading-[1.06] tracking-[-0.01em] sm:text-[40px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {standfirst && (
        <p
          className="mt-3 max-w-2xl text-[15px] leading-relaxed"
          style={{ color: C.inkSoft, ...body }}
        >
          {standfirst}
        </p>
      )}
    </header>
  );
}

// Redactionele annotatie-regel ("hoe te lezen"-notitie of bijschrift).
function Annotation({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-start gap-1.5 text-[11.5px] italic leading-snug"
      style={{ color: C.muted, ...display }}
    >
      <CornerDownRight size={12} aria-hidden="true" className="mt-0.5 shrink-0 not-italic" />
      <span>{children}</span>
    </p>
  );
}

function Byline({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: C.muted, ...body }}
    >
      {children}
    </p>
  );
}

// KPI als geannoteerde mini-bar-chart (kolommen). Directe waarde-label, één signaal-accent.
function MiniColumns({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const w = 118;
  const h = 40;
  const gap = 3;
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line x1={0} y1={h - 0.5} x2={w} y2={h - 0.5} stroke={C.rule} strokeWidth={1} />
      {data.map((d, i) => {
        const bh = Math.max(2, (d / max) * (h - 4));
        const x = i * (bw + gap);
        const last = i === data.length - 1;
        return (
          <rect
            key={i}
            x={x}
            y={h - bh - 1}
            width={bw}
            height={bh}
            rx={1}
            fill={last ? color : C.grid}
          />
        );
      })}
    </svg>
  );
}

// Area/lijn-grafiek voor omzet — Tufte: dunne as, directe eindlabel, één signaalkleur.
function AreaChart({
  data,
  color = C.teal,
  labels,
  height = 150,
}: {
  data: number[];
  color?: string;
  labels?: string[];
  height?: number;
}) {
  const max = Math.max(...data) * 1.08;
  const min = Math.min(...data) * 0.86;
  const span = max - min || 1;
  const w = 560;
  const h = height;
  const padL = 4;
  const padR = 4;
  const padT = 14;
  const padB = 22;
  const iw = w - padL - padR;
  const ih = h - padT - padB;
  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * iw;
    const y = padT + (1 - (d - min) / span) * ih;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${padL},${padT + ih} ${line} ${padL + iw},${padT + ih}`;
  const gid = `ac${color.replace("#", "")}`;
  const last = pts[pts.length - 1] as readonly [number, number];
  // horizontale hulplijnen (dun, laag contrast)
  const rows = [0.5];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      role="img"
      aria-label="Omzetontwikkeling per maand, oplopende trend"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.16} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {rows.map((r, i) => (
        <line
          key={i}
          x1={padL}
          y1={padT + r * ih}
          x2={padL + iw}
          y2={padT + r * ih}
          stroke={C.grid}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      ))}
      <line
        x1={padL}
        y1={padT + ih}
        x2={padL + iw}
        y2={padT + ih}
        stroke={C.rule}
        strokeWidth={1}
      />
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === pts.length - 1 ? 3.4 : 2}
          fill={i === pts.length - 1 ? color : C.card}
          stroke={color}
          strokeWidth={1.4}
        />
      ))}
      <circle
        cx={last[0]}
        cy={last[1]}
        r={6}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
      />
      {labels &&
        labels.map((l, i) => {
          const x = padL + (i / (labels.length - 1)) * iw;
          return (
            <text
              key={l}
              x={x}
              y={h - 6}
              textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
              fontSize={9.5}
              fill={C.faint}
              style={body}
            >
              {l}
            </text>
          );
        })}
    </svg>
  );
}

// Horizontale bar-chart voor matching-redenen (gewicht per reden).
function ReasonBars({
  items,
  color,
  sign,
}: {
  items: string[];
  color: string;
  sign: "plus" | "min";
}) {
  // Deterministische pseudo-gewichten op basis van positie — presentatief, geen echte data.
  const weights = items.map((_, i) => 92 - i * 16 - (sign === "min" ? 22 : 0));
  return (
    <ul className="space-y-3.5">
      {items.map((r, i) => {
        const wgt = Math.max(30, weights[i] ?? 40);
        return (
          <li key={r}>
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="flex items-start gap-2 text-[13px] leading-snug"
                style={{ color: C.inkSoft, ...body }}
              >
                <span
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: sign === "plus" ? C.tealSoft : C.amberSoft }}
                  aria-hidden="true"
                >
                  {sign === "plus" ? (
                    <Check size={10} style={{ color }} />
                  ) : (
                    <Minus size={10} style={{ color }} />
                  )}
                </span>
                {r}
              </span>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ color: C.faint, ...body }}
              >
                {wgt}
              </span>
            </div>
            <div
              className="ml-6 mt-1.5 h-[3px] overflow-hidden rounded-full"
              style={{ background: C.ruleSoft }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${wgt}%`, background: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Donut/gauge voor match-percentage in opdrachtkaarten.
function MatchGauge({ value, color = C.teal }: { value: number; color?: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span className="relative inline-flex h-10 w-10 items-center justify-center" aria-hidden="true">
      <svg width={40} height={40} viewBox="0 0 40 40" className="-rotate-90">
        <circle cx={20} cy={20} r={r} fill="none" stroke={C.grid} strokeWidth={2.5} />
        <circle
          cx={20}
          cy={20}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute text-[11px] font-semibold tabular-nums"
        style={{ color: C.ink, ...body }}
      >
        {value}
      </span>
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ background: C.card, border: `1px solid ${C.rule}` }}>
      {children}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept34() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      {/* Masthead */}
      <header className="px-5 pt-6 sm:px-8 lg:px-12" style={{ borderBottom: `2px solid ${C.ink}` }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.4em]"
              style={{ color: C.signal }}
            >
              Onafhankelijk · Verifieerbaar · Editie {new Date().getFullYear()}
            </div>
            <h1
              className="mt-1 text-[30px] leading-none tracking-[-0.02em] sm:text-[38px]"
              style={{ ...display, color: C.ink }}
            >
              De ZZP-Courant
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="hidden items-center gap-2 rounded-sm px-3 py-2 text-[12px] transition-colors hover:bg-[#f4f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5e63] sm:flex"
              style={{ color: C.muted, border: `1px solid ${C.rule}` }}
              aria-label="Zoeken in de editie"
            >
              <Search size={14} aria-hidden="true" />
              <span>Doorzoek editie</span>
            </button>
            <button
              className="relative rounded-sm p-2 transition-colors hover:bg-[#f4f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5e63]"
              style={{ color: C.muted, border: `1px solid ${C.rule}` }}
              aria-label="Meldingen"
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                style={{ background: C.signal }}
                aria-hidden="true"
              />
            </button>
            <div
              className="hidden items-center gap-2.5 rounded-sm py-1 pl-1 pr-3 sm:flex"
              style={{ border: `1px solid ${C.rule}` }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center text-[12px]"
                style={{ background: C.teal, color: "#fff", ...display }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="leading-tight">
                <div className="text-[12px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-medium"
                  style={{ color: C.teal }}
                >
                  <Check size={9} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secties-navigatie als krantenindex */}
        <nav className="-mb-px mt-4 flex gap-0.5 overflow-x-auto" aria-label="Secties">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5e63]"
                style={{
                  borderColor: on ? C.signal : "transparent",
                  color: on ? C.ink : C.muted,
                }}
              >
                <span
                  className="text-[10px] font-semibold tabular-nums"
                  style={{ color: on ? C.signal : C.faint }}
                >
                  {SECTION_NR[s.key]}
                </span>
                <span className="text-[12.5px] font-medium">{s.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="px-5 py-9 sm:px-8 lg:px-12 lg:py-11">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      {/* Colofon */}
      <footer
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 text-[10.5px] uppercase tracking-[0.18em] sm:px-8 lg:px-12"
        style={{ borderTop: `1px solid ${C.rule}`, color: C.faint }}
      >
        <span style={{ color: C.signal }}>{SECTION_KICKER[screen]}</span>
        <span aria-hidden="true">·</span>
        {NAV.slice(2).map((n) => (
          <span key={n}>{n}</span>
        ))}
      </footer>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const kpiColors = [C.teal, C.signal, C.teal, C.amber];
  const omzet = KPIS[2];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-11">
      <SectionHead
        nr="01"
        kicker="De redactie"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}. Uw week in cijfers.`}
        standfirst="Een datajournalistiek overzicht van uw praktijk: drie matches boven de 80 procent, een oplopende omzet en één certificaat dat aandacht vraagt. Hieronder de cijfers, met de context erbij."
      />

      {/* KPI's als geannoteerde mini-charts */}
      <section>
        <div
          className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: C.rule }}
        >
          {KPIS.map((k, i) => {
            const col = kpiColors[i % kpiColors.length] ?? C.teal;
            return (
              <div key={k.label} className="px-5 py-5" style={{ background: C.card }}>
                <div className="flex items-baseline justify-between">
                  <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.teal : C.signal }}
                  >
                    {k.up ? (
                      <ArrowUpRight size={12} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={12} aria-hidden="true" />
                    )}
                    {k.trend}
                  </span>
                </div>
                <p
                  className="mt-2 text-[30px] tabular-nums leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </p>
                <div className="mt-3.5">
                  <MiniColumns data={k.spark} color={col} />
                </div>
              </div>
            );
          })}
        </div>
        <Annotation>
          Laatste kolom in kleur = huidige week. Grijze kolommen tonen het verloop over de afgelopen
          zeven weken.
        </Annotation>
      </section>

      <div className="grid grid-cols-1 gap-11 lg:grid-cols-3">
        {/* Hoofdverhaal: omzet-area */}
        <section className="lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <Byline>Hoofdverhaal · Omzet</Byline>
            <span className="text-[11px] tabular-nums" style={{ color: C.faint }}>
              jan — jul
            </span>
          </div>
          <h2 className="mt-2 text-[22px] leading-tight" style={{ ...display, color: C.ink }}>
            Omzet groeit zeven weken op rij door naar {omzet?.value}
          </h2>
          <Card className="mt-4 px-4 pb-2 pt-4">
            <AreaChart
              data={(omzet?.spark ?? []).map((n) => n)}
              color={C.teal}
              labels={["jan", "feb", "mrt", "apr", "mei", "jun", "jul"]}
            />
          </Card>
          <Annotation>
            De piek volgt op drie extra avonddiensten in juni. De trendlijn ligt boven uw ondergrens
            van € 6.000 per maand.
          </Annotation>

          {/* Beste matches als redactionele lijst */}
          <div className="mt-9">
            <Byline>Selectie · Beste matches</Byline>
            <Card className="mt-3">
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#faf8f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a5e63]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ruleSoft}` }}
                >
                  <MatchGauge value={o.match} color={o.match >= 90 ? C.teal : C.amber} />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[15px] leading-snug"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden text-[12.5px] font-medium tabular-nums sm:inline"
                    style={{ color: C.inkSoft }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </Card>
          </div>
        </section>

        {/* Zijkolom */}
        <aside className="space-y-9">
          {/* Credentials */}
          <section>
            <Byline>Verantwoording · Certificaten</Byline>
            <Card className="mt-3 p-4">
              <ul className="space-y-3.5">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <li key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ background: st.bg }}
                        aria-hidden="true"
                      >
                        <st.Icon size={13} style={{ color: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold">{c.naam}</p>
                        <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-[10.5px] font-semibold"
                        style={{ color: st.fg }}
                      >
                        {st.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>

          {/* Ingezonden — correspondentie */}
          <section>
            <div className="flex items-baseline justify-between">
              <Byline>Ingezonden</Byline>
              <span className="text-[11px]" style={{ color: C.muted }}>
                {ongelezen} ongelezen
              </span>
            </div>
            <Card className="mt-3">
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ruleSoft}` }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px]"
                    style={{
                      background: b.ongelezen ? C.teal : C.paperDeep,
                      color: b.ongelezen ? "#fff" : C.muted,
                      ...display,
                    }}
                  >
                    {b.initialen}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.signal }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
                    {b.tijd}
                  </span>
                </div>
              ))}
            </Card>
          </section>

          {/* Redactioneel commentaar — next best action */}
          <section>
            <div className="p-5" style={{ background: C.ink, color: C.paper }}>
              <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#c98a80" }}>
                Commentaar
              </p>
              <p className="mt-2.5 text-[20px] leading-snug" style={{ ...display, color: C.paper }}>
                {ACTIES[0]?.titel}
              </p>
              <p
                className="mt-2 text-[12.5px] leading-relaxed"
                style={{ color: "rgba(251,250,247,0.72)" }}
              >
                {ACTIES[0]?.detail}
              </p>
              <button
                className="mt-4 w-full py-2.5 text-[12.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0392b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14181a]"
                style={{ background: C.signal, color: "#fff" }}
              >
                {ACTIES[0]?.cta}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const gem = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);
  return (
    <div className="mx-auto max-w-6xl space-y-9">
      <SectionHead
        nr="02"
        kicker="Marktanalyse"
        title="De markt, uitgelicht en verklaard"
        standfirst="Elke opdracht met haar matchscore en de redenen erachter. Gesorteerd op relevantie, niet op recentheid — zodat het beste werk bovenaan staat."
      />

      {/* Marktbalk — mini staafdiagram van de matchscores */}
      <Card className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
              Gem. match
            </p>
            <p
              className="text-[26px] tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {gem}%
            </p>
          </div>
          <div className="flex items-end gap-1.5" aria-hidden="true">
            {OPDRACHTEN.map((o) => (
              <div key={o.id} className="flex flex-col items-center gap-1">
                <div
                  className="w-6 rounded-sm"
                  style={{
                    height: (o.match / 100) * 46,
                    background: o.match >= 90 ? C.teal : C.amber,
                  }}
                />
                <span className="text-[9px] tabular-nums" style={{ color: C.faint }}>
                  {o.match}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div
          className="flex items-center gap-3 rounded-sm px-4 py-2.5 sm:w-80"
          style={{ background: C.paper, border: `1px solid ${C.rule}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.teal }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa0a5]"
            style={{ color: C.ink }}
          />
          <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.tealSoft }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.teal }} />
          </div>
          <p className="mt-4 text-[20px]" style={{ ...display, color: C.ink }}>
            Geen artikel gevonden voor &quot;{q}&quot;
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px]" style={{ color: C.muted }}>
            De redactie vond geen opdracht die aan uw zoekterm voldoet. Verbreed de zoekopdracht of
            pas uw beschikbaarheid aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#154b4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5e63]"
            style={{ background: C.teal, color: "#fff" }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-px md:grid-cols-2" style={{ background: C.rule }}>
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group flex flex-col text-left transition-colors hover:bg-[#faf8f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a5e63]"
              style={{ background: C.card }}
            >
              <div className="flex-1 px-5 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="text-[10.5px] uppercase tracking-[0.18em]"
                    style={{ color: C.faint }}
                  >
                    Dossier {o.id}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
                    style={{
                      background: o.match >= 90 ? C.tealSoft : C.amberSoft,
                      color: o.match >= 90 ? C.teal : C.amber,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: o.match >= 90 ? C.teal : C.amber }}
                      aria-hidden="true"
                    />
                    {o.match}% match
                  </span>
                </div>
                <p className="mt-3 text-[21px] leading-snug" style={{ ...display, color: C.ink }}>
                  {o.titel}
                </p>
                <p
                  className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>

                {/* Mini reden-balken */}
                <div className="mt-4 space-y-1.5">
                  {o.redenen.plus.slice(0, 2).map((r, i) => (
                    <div key={r} className="flex items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full"
                        style={{ background: C.ruleSoft }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${88 - i * 16}%`, background: C.teal }}
                        />
                      </div>
                      <span className="w-28 truncate text-[11px]" style={{ color: C.inkSoft }}>
                        {r}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: `1px solid ${C.ruleSoft}` }}
              >
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.ink }}>
                  {o.tarief}
                </span>
                <span className="text-[12px] tabular-nums" style={{ color: C.muted }}>
                  {o.uren} · {o.start}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      <Annotation>
        Balklengte per opdracht = matchscore. Kleur teal bij ≥ 90 procent, amber daaronder — één
        signaalkleur per richting, conform de huisstijl.
      </Annotation>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHead nr="03" kicker={`Dossier ${opdracht.id}`} title={opdracht.titel} />
        <button
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className="inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5e63] disabled:opacity-90"
          style={{
            background: state === "sent" ? C.teal : C.ink,
            color: "#fff",
          }}
        >
          {state === "sending" && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
          {state === "sent" && <Check size={15} aria-hidden="true" />}
          {state === "idle" && <Send size={14} aria-hidden="true" />}
          {state === "idle"
            ? "Reageer op opdracht"
            : state === "sending"
              ? "Versturen…"
              : "Reactie verstuurd"}
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[13.5px]" style={{ color: C.muted }}>
        <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>

      {/* Feiten-tabel — factbox */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ background: C.rule, gap: 1 }}>
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="px-4 py-4" style={{ background: C.card }}>
              <p className="text-[10.5px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                {m.l}
              </p>
              <p className="mt-1.5 text-[19px] tabular-nums" style={{ ...display, color: C.ink }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Analyse — matching-redenen als bar-chart */}
      <section>
        <Byline>De analyse · Waarom deze match</Byline>
        <h2 className="mt-2 text-[24px] leading-tight" style={{ ...display, color: C.ink }}>
          Transparant onderbouwd op uw geverifieerde profiel
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-px md:grid-cols-2" style={{ background: C.rule }}>
          <div className="px-5 py-5" style={{ background: C.card }}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.teal }}
            >
              In het voordeel
            </p>
            <div className="mt-4">
              <ReasonBars items={opdracht.redenen.plus} color={C.teal} sign="plus" />
            </div>
          </div>
          <div className="px-5 py-5" style={{ background: C.card }}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <div className="mt-4">
              <ReasonBars items={opdracht.redenen.min} color={C.amber} sign="min" />
            </div>
          </div>
        </div>
        <Annotation>
          Balklengte geeft het relatieve gewicht van elke reden in de matchscore. Getallen zijn
          indicatief en verklaren de sortering — niets blijft verborgen.
        </Annotation>
      </section>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {opdracht.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-3 py-1 text-[11.5px]"
            style={{ background: C.paperDeep, color: C.inkSoft, border: `1px solid ${C.rule}` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const pct = Math.round((verified / total) * 100);
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <SectionHead
        nr="04"
        kicker="Verantwoording"
        title="Uw vertrouwensniveau, controleerbaar vastgelegd"
        standfirst="Zoals een redactie haar bronnen verantwoordt, legt u hier uw bewijsstukken vast. Elk certificaat wordt onafhankelijk geverifieerd."
      />

      {/* Vertrouwens-meter als stacked bar */}
      <Card className="px-6 py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ background: C.tealSoft }}
          >
            <Check size={28} aria-hidden="true" style={{ color: C.teal }} />
          </div>
          <div className="flex-1">
            <p className="text-[24px] leading-none" style={{ ...display, color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
              <span className="font-semibold tabular-nums">{verified}</span> van{" "}
              <span className="font-semibold tabular-nums">{total}</span> bewijsstukken volledig
              geverifieerd. Eén stuk vraagt om aandacht.
            </p>
            {/* stacked meter */}
            <div
              className="mt-3.5 flex h-2.5 overflow-hidden rounded-full"
              style={{ background: C.ruleSoft }}
            >
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div
                    key={c.naam}
                    className="h-full"
                    style={{
                      width: `${100 / total}%`,
                      background: st.fg,
                      opacity: c.status === "VERIFIED" ? 1 : 0.55,
                    }}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
            <p className="mt-2 text-[11px] tabular-nums" style={{ color: C.faint }}>
              {pct}% van uw certificaten is geverifieerd
            </p>
          </div>
        </div>
      </Card>

      {/* Certificaten-lijst */}
      <Card>
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#faf8f3]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ruleSoft}` }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: st.bg }}
              >
                {c.status === "SUBMITTED" ? (
                  <Loader2
                    size={17}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                    style={{ color: st.fg }}
                  />
                ) : (
                  <st.Icon size={17} aria-hidden="true" style={{ color: st.fg }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] leading-tight" style={{ ...display, color: C.ink }}>
                  {c.naam}
                </p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ color: st.fg, background: st.bg }}
              >
                <st.Icon size={11} aria-hidden="true" /> {st.label}
              </span>
            </div>
          );
        })}
      </Card>

      {/* Archief */}
      <section>
        <Byline>Archief · Documenten</Byline>
        <Card className="mt-3">
          {DOCUMENTEN.map((d, i) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.ruleSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm"
                  style={{ background: C.paperDeep }}
                  aria-hidden="true"
                >
                  <FileText size={15} style={{ color: C.muted }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                  <p className="truncate text-[11px]" style={{ color: C.muted }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                  style={{ color: st.fg, background: st.bg }}
                >
                  <st.Icon size={10} aria-hidden="true" /> {st.label}
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; Icon: LucideIcon; label: string }
  > = {
    warning: { fg: C.signal, bg: C.signalSoft, Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.teal, bg: C.tealSoft, Icon: Bell, label: "Ter info" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-9">
      <SectionHead
        nr="05"
        kicker="Op de agenda"
        title="Wat vandaag uw aandacht verdient"
        standfirst="De redactionele agenda, op volgorde van urgentie. Eén onderwerp tegelijk in de schijnwerpers — de rest houden wij voor u in de gaten."
      />
      <div className="space-y-px" style={{ background: C.rule }}>
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-4 px-5 py-5"
              style={{ background: C.card }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: C.faint }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: t.bg }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: t.fg, background: t.bg }}
                  >
                    <t.Icon size={9} aria-hidden="true" /> {t.label}
                  </span>
                </div>
                <p className="mt-2 text-[17px] leading-tight" style={{ ...display, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#faf8f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5e63]"
                style={{ color: t.fg, border: `1px solid ${t.fg}55` }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>
      <Card className="flex items-center gap-4 px-5 py-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.tealSoft }}
        >
          <Check size={18} aria-hidden="true" style={{ color: C.teal }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles gelezen? Uitstekend. Nieuwe agendapunten verschijnen hier zodra ze relevant worden —
          u hoeft niets zelf te bewaken.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string; Icon: LucideIcon; label: string }> = {
    Betaald: { fg: C.teal, bg: C.tealSoft, Icon: Check, label: "Betaald" },
    Openstaand: { fg: C.amber, bg: C.amberSoft, Icon: Clock, label: "Openstaand" },
    Concept: { fg: C.muted, bg: C.paperDeep, Icon: FileText, label: "Concept" },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").length;
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          nr="06"
          kicker="De cijfers"
          title="Facturen, in het kort verklaard"
          standfirst={`${betaald} van ${FACTUREN.length} facturen zijn voldaan. Eén staat open — een herinnering kan lonen.`}
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-[#154b4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5e63]"
          style={{ background: C.teal, color: "#fff" }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.rule}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#faf8f3]"
                    style={{ borderTop: `1px solid ${C.ruleSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[14px] tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg }}
                      >
                        <t.Icon size={11} aria-hidden="true" /> {t.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Annotation>
        Bedragen in euro, exclusief btw. Concept-facturen tellen niet mee in de omzet tot ze
        verzonden zijn.
      </Annotation>
    </div>
  );
}
