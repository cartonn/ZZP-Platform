"use client";

// Concept 131 — "Atelier" · couture-naaipatroon / technisch modepatroon als interface.
// Op crème/ecru tissuepapier (#f4efe0) leeft een technisch KNIPPATROON: dunne stippel-kniplijnen,
// kerf-inkepingen (notches), maatgradatie-lijnen, patroonstuk-labels met richtingpijl (grainline)
// en dun blauw/rood technisch lijnwerk. Editorial-technisch, geen glossy mode. Match-redenen zijn
// "pasvorm". Onderscheidend van redactioneel-luxe (Folio) en herbarium (Botanie): dit is een
// TECHNISCH PATROON met kniplijnen, notches en naadtoeslag. Fonts: Fraunces (display) + Spline Mono.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Scissors,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Ruler,
  MoveHorizontal,
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

// Atelier-palet — tissuepapier crème, inktblauw technisch lijnwerk, één rood signaal.
const C = {
  bg: "#f4efe0", // ecru tissuepapier
  paper: "#faf6ea", // lichter patroonpapier (panelen)
  paperSoft: "#efe7d3", // gedempt papier
  ink: "#1b2947", // diep inktblauw (schrift + lijnen)
  inkSoft: "#4a5674", // gedempt schrift
  inkFaint: "#8a8ea0", // fijn schrift
  blue: "#2f4a86", // technisch blauw (accent)
  blueSoft: "#5c78b4",
  red: "#c0362c", // rood signaal (kniplijn / urgent)
  redSoft: "#d9756c",
  green: "#3f7a52", // geverifieerd
  amber: "#b5772a", // let-op
  line: "#ddd2b8", // patroonpapier-lijn
  lineStrong: "#c7b993",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };
const ui = { fontFamily: "var(--font-lab-fraunces)" };

// ── Patroon-motieven ─────────────────────────────────────────────────────────
// Millimeterraster + subtiele diagonale gradatielijnen — het patroonpapier zelf.
const patternPaper =
  "repeating-linear-gradient(0deg, rgba(27,41,71,0.04) 0 1px, transparent 1px 22px)," +
  "repeating-linear-gradient(90deg, rgba(27,41,71,0.04) 0 1px, transparent 1px 22px)," +
  "repeating-linear-gradient(45deg, rgba(47,74,134,0.03) 0 1px, transparent 1px 11px)," +
  "radial-gradient(120% 90% at 8% 0%, rgba(250,246,234,0.6), transparent 55%)";

// Grainline — de dubbele richtingpijl die op elk patroonstuk de draadrichting aangeeft.
function Grainline({
  className = "",
  vertical = false,
}: {
  className?: string;
  vertical?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 12"
      className={className}
      style={vertical ? { transform: "rotate(90deg)" } : undefined}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <line x1="8" y1="6" x2="92" y2="6" stroke={C.blue} strokeWidth="1.4" />
      <path d="M8 6 L16 2.5 L16 9.5 Z" fill={C.blue} />
      <path d="M92 6 L84 2.5 L84 9.5 Z" fill={C.blue} />
    </svg>
  );
}

// Kniplijn met notches — de stippel-rand van een patroonstuk met kerf-inkepingen.
function CutEdge({ notches = 3 }: { notches?: number }) {
  const marks = Array.from({ length: notches }, (_, i) => 14 + i * (72 / Math.max(notches - 1, 1)));
  return (
    <svg
      viewBox="0 0 100 10"
      className="h-2.5 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="5"
        x2="100"
        y2="5"
        stroke={C.red}
        strokeWidth="1.3"
        strokeDasharray="2 2.4"
      />
      {marks.map((x, i) => (
        <line key={i} x1={x} y1="0.5" x2={x} y2="9.5" stroke={C.red} strokeWidth="1.2" />
      ))}
    </svg>
  );
}

// Patroonstuk-cirkel: een genummerd patroonmerk (◯ met kruis) — gebruikt als "logo"/avatar.
function PatternMark({
  size = 44,
  label,
  filled,
}: {
  size?: number;
  label?: string | number;
  filled?: number; // 0..1 vulgraad
}) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = filled !== undefined ? c * filled : 0;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke={C.line} strokeWidth="4" />
        {filled !== undefined && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={C.blue}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 50 50)"
          />
        )}
        <line x1="50" y1="18" x2="50" y2="82" stroke={C.blue} strokeWidth="1.4" opacity="0.6" />
        <line x1="18" y1="50" x2="82" y2="50" stroke={C.blue} strokeWidth="1.4" opacity="0.6" />
      </svg>
      {label !== undefined && (
        <span
          className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums"
          style={{ ...mono, color: C.ink }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Op maat", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In afwerking", Icon: Clock, tone: C.blue };
    case "EXPIRING":
      return { label: "Vraagt herstel", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgekeurd", Icon: XCircle, tone: C.red };
  }
}

// ── Herbruikbare bouwstenen ──────────────────────────────────────────────────
// Een patroonstuk-paneel: crème papier met een stippel-kniprand langs de bovenkant.
function Piece({
  children,
  className = "",
  interactive = false,
  code,
  edge = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  code?: string;
  edge?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[3px] ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: "0 1px 0 rgba(27,41,71,0.05)",
      }}
    >
      {edge && (
        <div className="pointer-events-none absolute -top-[6px] left-4 right-4">
          <CutEdge notches={4} />
        </div>
      )}
      {code && (
        <span
          className="pointer-events-none absolute right-2.5 top-2.5 text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          {code}
        </span>
      )}
      {children}
    </div>
  );
}

function Tag({
  children,
  tone,
  solid = false,
}: {
  children: React.ReactNode;
  tone: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[10.5px] font-semibold uppercase leading-none tracking-[0.08em]"
      style={
        solid
          ? { ...mono, background: tone, color: C.paper }
          : { ...mono, background: `${tone}14`, color: tone, border: `1px solid ${tone}55` }
      }
    >
      {children}
    </span>
  );
}

// Maatgradatie-meter: gestapelde parallelle lijnen (grading) als voortgang/match-schaal.
function GradeMeter({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-3.5 w-24 overflow-hidden rounded-[2px]"
        style={{ background: C.paperSoft, border: `1px solid ${C.line}` }}
        aria-hidden="true"
      >
        <div className="absolute inset-0" style={{ width: `${value}%`, background: `${tone}22` }} />
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${value}%`,
            backgroundImage: `repeating-linear-gradient(90deg, ${tone} 0 1.5px, transparent 1.5px 6px)`,
          }}
        />
      </div>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

function Kop({ children, sub, n }: { children: React.ReactNode; sub?: string; n?: number }) {
  return (
    <div className="flex items-center gap-3">
      <PatternMark size={34} label={n ?? "◯"} />
      <div>
        {sub && (
          <div
            className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ ...mono, color: C.red }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[26px] font-medium leading-none tracking-[-0.01em] sm:text-[31px]"
          style={{ ...display, color: C.ink }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

export function Concept131() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, backgroundImage: patternPaper, color: C.ink }}
    >
      {/* Kop — atelier-merk als patroonstuk-titelblok */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <PatternMark size={46} label="1" filled={0.72} />
          <div className="leading-none">
            <div
              className="text-[21px] font-medium tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              Atelier
            </div>
            <div
              className="mt-1.5 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.22em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              <Scissors size={11} strokeWidth={2.2} aria-hidden="true" /> Patroon · ZZP-platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[10.5px]" style={{ ...mono, color: C.inkSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[3px] text-[12px] font-semibold"
            style={{ ...mono, background: C.ink, color: C.paper }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — patroonstukken-strip met stippel-onderrand */}
      <nav
        className="mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1.5px dashed ${C.lineStrong}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-2.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mono, color: on ? C.ink : C.inkSoft, fontWeight: on ? 600 : 500 }}
            >
              <span className="mr-1.5 text-[10px]" style={{ color: on ? C.red : C.inkFaint }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[2px] left-2 right-2 h-[3px]"
                  style={{ background: C.red }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
        {screen === "dashboard" && (
          <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
        )}
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

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.blue, C.green, C.red, C.amber];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ ...mono, color: C.red }}
        >
          <Scissors size={12} strokeWidth={2.4} aria-hidden="true" /> Werkblad · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2.5 text-[34px] font-medium leading-[1.03] tracking-[-0.02em] sm:text-[46px]"
          style={{ ...display, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2.5 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Je patroon ligt uitgelegd. Één stuk vraagt vandaag om afwerking — de rest zit op maat.
        </p>
        <div className="mt-4 max-w-xs">
          <Grainline className="h-3 w-full" />
        </div>
      </section>

      {/* Primaire actie — als knip-instructie */}
      <Piece edge code="STUK · A" className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[3px]"
              style={{ background: `${C.red}12`, border: `1.5px dashed ${C.red}` }}
              aria-hidden="true"
            >
              <AlertTriangle size={20} strokeWidth={2.2} style={{ color: C.red }} />
            </span>
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.red }}
              >
                Kniplijn · vraagt aandacht
              </span>
              <h2
                className="mt-1.5 text-[23px] font-medium leading-tight sm:text-[27px]"
                style={{ ...display, color: C.ink }}
              >
                {primair.titel}
              </h2>
              <p
                className="mt-1.5 max-w-md text-[13px] leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                {primair.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onActies}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[3px] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...mono, background: C.red, color: C.paper }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Piece>

      {/* KPI-tegels — als maat-kaartjes */}
      <section>
        <Kop sub="Maatstaven" n={2}>
          Prestatie
        </Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Piece key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <Ruler size={16} style={{ color: tone }} aria-hidden="true" />
                  <span
                    className="text-[10.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.red }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-medium tabular-nums leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11px]" style={{ ...mono, color: C.inkSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Piece>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <Kop sub="Beste pasvorm" n={3}>
          Voor jou
        </Kop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Piece
            interactive
            edge
            code="STUK · B"
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <PatternMark size={72} label={`${top.match}`} filled={top.match / 100} />
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-medium leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12px]" style={{ ...mono, color: C.inkSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Tag key={t} tone={C.blue}>
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.red }}
              aria-hidden="true"
            />
          </Piece>
        </button>
      </section>
    </div>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 3"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map((p, i) => {
        const [x, y] = p.split(",");
        return <circle key={i} cx={x} cy={y} r={1.6} fill={tone} />;
      })}
    </svg>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );
  return (
    <div className="space-y-7">
      <Kop sub="Uitgelegde patronen" n={4}>
        Marktplaats
      </Kop>

      <Piece className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.inkFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[13px] outline-none placeholder:opacity-50"
          style={{ ...mono, color: C.ink }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...mono, color: C.inkFaint }}
        >
          {filtered.length}
        </span>
      </Piece>

      {filtered.length === 0 ? (
        <Piece className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <PatternMark size={54} label="0" />
          <p className="text-[20px] font-medium" style={{ ...display, color: C.ink }}>
            Geen patroon gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.blue, color: C.paper }}
          >
            Zoekopdracht wissen
          </button>
        </Piece>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, idx) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Piece
                  interactive
                  code={`STUK · ${String.fromCharCode(67 + idx)}`}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                >
                  <PatternMark size={46} label={`${o.match}`} filled={o.match / 100} />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-medium leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Tag key={t} tone={C.inkSoft}>
                          {t}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <GradeMeter value={o.match} tone={o.match >= 90 ? C.green : C.blue} />
                    <ArrowRight
                      size={19}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.red }}
                      aria-hidden="true"
                    />
                  </div>
                </Piece>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...mono, color: C.inkSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="flex items-start gap-4">
        <PatternMark size={56} label={`${opdracht.match}`} filled={opdracht.match / 100} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {opdracht.id}
            </span>
            <Tag tone={C.red} solid>
              {opdracht.match}% pasvorm
            </Tag>
          </div>
          <h1
            className="mt-2 text-[30px] font-medium leading-[1.06] tracking-[-0.02em] sm:text-[39px]"
            style={{ ...display, color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-1.5 text-[12.5px]" style={{ ...mono, color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Piece key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.blue }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {m.l}
            </div>
          </Piece>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Piece className="p-5" edge>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.green }}
          >
            <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Zit op maat
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.ink }}
              >
                <Check
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Piece>
        <Piece className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.amber }}
          >
            <MoveHorizontal size={14} strokeWidth={2.8} aria-hidden="true" /> Bijstellen
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.ink }}
              >
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-[1px]"
                  style={{ border: `1.5px dashed ${C.amber}` }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Piece>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-[3px] px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...mono, background: C.blue, color: C.paper }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, border: `1.5px solid ${C.lineStrong}`, color: C.ink }}
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
    <div className="space-y-7">
      <Kop sub="Op maat gemaakt" n={5}>
        Verificatie
      </Kop>

      <Piece edge className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0">
          <PatternMark size={112} label={`${pct}%`} filled={verified / CREDENTIALS.length} />
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-[2px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{
              ...mono,
              background: `${C.green}14`,
              color: C.green,
              border: `1px solid ${C.green}44`,
            }}
          >
            <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} bewijsstukken zitten volledig op maat. Elk
            goedgekeurd stuk sluit de naad — één dossier vraagt binnenkort om herstel.
          </p>
        </div>
      </Piece>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Piece className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
                  style={{
                    background: `${st.tone}12`,
                    border: `1.5px dashed ${st.tone}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-medium leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Tag tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Tag>
              </Piece>
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
    <div className="space-y-7">
      <Kop sub="De volgende steek" n={6}>
        Volgende acties
      </Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.red : C.blue;
          return (
            <li key={a.titel}>
              <Piece className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center" edge={warn}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] text-[15px] font-medium tabular-nums"
                  style={{
                    ...mono,
                    background: `${tone}12`,
                    color: tone,
                    border: `1.5px dashed ${tone}`,
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
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Scissors
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-medium leading-tight"
                      style={{ ...display, color: C.ink }}
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
                  className="shrink-0 self-start rounded-[3px] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ ...mono, background: tone, color: C.paper }}
                >
                  {a.cta}
                </button>
              </Piece>
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
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.red;
    if (status === "Concept") return C.inkFaint;
    return C.blue;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Afgeleverd werk">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...mono, background: C.blue, color: C.paper }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Piece className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.inkFaint }}
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
                  className="transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: `1px dashed ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Tag tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Tag>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-medium tabular-nums"
                    style={{ ...display, color: C.ink }}
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
                className="px-4 py-4 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-medium tabular-nums"
                style={{ ...display, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Piece>
    </div>
  );
}
