"use client";

// Concept 35 — "Deco" · Art-deco geometrie — jewel & goud (DARK, luxe).
// Art-deco/Gatsby luxe: symmetrische gouden linework-ornamenten (dunne SVG-lijnen, gestapelde/
// getrapte geometrie, zonnestraal-motieven, chevrons), diepe juweeltinten, gouden hairline-randen
// en een verfijnd serif-displaymoment. Elegant, symmetrisch, premium.
// Palet: bg diep smaragd #10231f, fg #f2ede0, accent goud #c9a24b, secundair jade #2f6f5e.
// Fonts: --font-lab-fraunces (display serif) + --font-lab-manrope (body).

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
  bg: "#10231f",
  bgDeep: "#0b1a17",
  panel: "#14302a",
  panelHi: "#173730",
  ink: "#f2ede0",
  inkSoft: "#d6cfbc",
  muted: "#9bab9f",
  faint: "#6f8279",
  gold: "#c9a24b",
  goldSoft: "rgba(201,162,75,0.12)",
  goldLine: "rgba(201,162,75,0.34)",
  goldFaint: "rgba(201,162,75,0.16)",
  jade: "#2f6f5e",
  jadeSoft: "rgba(47,111,94,0.2)",
  ruby: "#b0483f",
  rubySoft: "rgba(176,72,63,0.18)",
  amber: "#c98a3a",
  amberSoft: "rgba(201,138,58,0.16)",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.gold, bg: C.goldSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.jade, bg: C.jadeSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.ruby, bg: C.rubySoft, Icon: AlertTriangle };
  }
}

/* ---------- Art-deco ornamenten ---------- */

// Zonnestraal-motief — symmetrische stralen vanuit één punt.
function Sunburst({
  size = 64,
  color = C.gold,
  rays = 13,
}: {
  size?: number;
  color?: string;
  rays?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 1;
  const lines = Array.from({ length: rays }).map((_, i) => {
    const a = (Math.PI / (rays - 1)) * i;
    const x = cx + Math.cos(Math.PI + a) * rOuter;
    const y = cy + Math.sin(Math.PI + a) * rOuter;
    return { x, y };
  });
  return (
    <svg
      width={size}
      height={size / 2 + 2}
      viewBox={`0 0 ${size} ${size / 2 + 2}`}
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={l.x}
          y2={l.y}
          stroke={color}
          strokeWidth={i % 2 ? 0.7 : 1.1}
        />
      ))}
      <circle cx={cx} cy={cy} r={2.4} fill={color} />
    </svg>
  );
}

// Getrapte chevron-scheidingslijn — symmetrisch, gouden hairline.
function ChevronRule({ color = C.goldLine }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 240 12"
      className="h-3 w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <line x1="0" y1="6" x2="96" y2="6" stroke={color} strokeWidth="1" />
      <polyline
        points="104,6 112,2 120,6 112,10 104,6"
        fill="none"
        stroke={C.gold}
        strokeWidth="1"
      />
      <polyline
        points="120,6 128,2 136,6 128,10 120,6"
        fill="none"
        stroke={C.gold}
        strokeWidth="1"
      />
      <line x1="144" y1="6" x2="240" y2="6" stroke={color} strokeWidth="1" />
    </svg>
  );
}

// Getrapte hoek-ornamenten voor panelen (art-deco corner brackets).
function DecoPanel({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.goldFaint}`,
        boxShadow: glow ? "0 24px 60px -34px rgba(0,0,0,0.7)" : "none",
      }}
    >
      {/* getrapte gouden hoeken */}
      <span className="pointer-events-none absolute left-1.5 top-1.5 h-3 w-3" aria-hidden="true">
        <span className="absolute left-0 top-0 h-full w-px" style={{ background: C.goldLine }} />
        <span className="absolute left-0 top-0 h-px w-full" style={{ background: C.goldLine }} />
      </span>
      <span className="pointer-events-none absolute right-1.5 top-1.5 h-3 w-3" aria-hidden="true">
        <span className="absolute right-0 top-0 h-full w-px" style={{ background: C.goldLine }} />
        <span className="absolute right-0 top-0 h-px w-full" style={{ background: C.goldLine }} />
      </span>
      <span className="pointer-events-none absolute bottom-1.5 left-1.5 h-3 w-3" aria-hidden="true">
        <span className="absolute bottom-0 left-0 h-full w-px" style={{ background: C.goldLine }} />
        <span className="absolute bottom-0 left-0 h-px w-full" style={{ background: C.goldLine }} />
      </span>
      <span
        className="pointer-events-none absolute bottom-1.5 right-1.5 h-3 w-3"
        aria-hidden="true"
      >
        <span
          className="absolute bottom-0 right-0 h-full w-px"
          style={{ background: C.goldLine }}
        />
        <span
          className="absolute bottom-0 right-0 h-px w-full"
          style={{ background: C.goldLine }}
        />
      </span>
      {children}
    </div>
  );
}

// Sectiekop met symmetrisch zonnestraal-embleem en gouden regels.
function DecoHeading({
  nr,
  kicker,
  title,
  note,
}: {
  nr: string;
  kicker: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <Sunburst size={56} rays={11} />
      </div>
      <p
        className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.42em]"
        style={{ color: C.gold, ...body }}
      >
        {kicker} · {nr}
      </p>
      <h1
        className="mt-2.5 text-[34px] leading-[1.05] tracking-[-0.01em] sm:text-[42px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p
          className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed"
          style={{ color: C.muted, ...body }}
        >
          {note}
        </p>
      )}
      <div className="mx-auto mt-5 max-w-xs">
        <ChevronRule />
      </div>
    </div>
  );
}

// Getrapte staafkolommen (art-deco skyline) voor KPI-sparkline.
function DecoColumns({ data, color = C.gold }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const w = 104;
  const h = 36;
  const gap = 2.5;
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {data.map((d, i) => {
        const bh = Math.max(2, (d / max) * (h - 3));
        const x = i * (bw + gap);
        const last = i === data.length - 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={h - bh}
              width={bw}
              height={bh}
              fill={last ? color : "transparent"}
              stroke={color}
              strokeWidth={0.8}
              opacity={last ? 1 : 0.5}
            />
          </g>
        );
      })}
      <line x1={0} y1={h - 0.5} x2={w} y2={h - 0.5} stroke={C.goldLine} strokeWidth={0.8} />
    </svg>
  );
}

// Match-embleem: dubbele ring met gouden accent.
function MatchEmblem({ value, color = C.gold }: { value: number; color?: string }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span className="relative inline-flex h-11 w-11 items-center justify-center" aria-hidden="true">
      <svg width={44} height={44} viewBox="0 0 44 44" className="-rotate-90">
        <circle cx={22} cy={22} r={19} fill="none" stroke={C.goldFaint} strokeWidth={0.8} />
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={2.5}
        />
        <circle
          cx={22}
          cy={22}
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

/* ---------- Hoofdcomponent ---------- */

export function Concept35() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `radial-gradient(1100px 520px at 50% -12%, rgba(201,162,75,0.08), transparent 62%), ${C.bg}`,
      }}
    >
      <div className="p-3 sm:p-5 lg:p-7">
        {/* Gouden dubbele rand rond het geheel */}
        <div
          className="min-h-[640px]"
          style={{
            border: `1px solid ${C.goldLine}`,
            boxShadow: `inset 0 0 0 4px ${C.bg}, inset 0 0 0 5px ${C.goldFaint}`,
          }}
        >
          {/* Kop */}
          <header
            className="flex flex-col gap-4 px-5 pb-5 pt-6 sm:flex-row sm:items-center lg:px-9"
            style={{ borderBottom: `1px solid ${C.goldFaint}` }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-11 w-11 items-center justify-center text-[19px]"
                style={{
                  background: "transparent",
                  color: C.gold,
                  border: `1px solid ${C.goldLine}`,
                  ...display,
                }}
              >
                Z
              </div>
              <div>
                <div
                  className="text-[18px] leading-tight tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  Maison ZZP
                </div>
                <div
                  className="text-[9.5px] font-semibold uppercase tracking-[0.34em]"
                  style={{ color: C.gold }}
                >
                  Établi 2026
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:ml-auto">
              <button
                className="hidden items-center gap-2.5 px-4 py-2 text-[12.5px] transition-colors hover:bg-[#173730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] sm:flex"
                style={{ color: C.muted, border: `1px solid ${C.goldFaint}` }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Doorzoek collectie</span>
              </button>
              <button
                className="relative p-2.5 transition-colors hover:bg-[#173730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                style={{ color: C.muted, border: `1px solid ${C.goldFaint}` }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.gold }}
                  aria-hidden="true"
                />
              </button>
              <div
                className="hidden items-center gap-2.5 py-1 pl-1 pr-3.5 sm:flex"
                style={{ border: `1px solid ${C.goldFaint}` }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center text-[11px]"
                  style={{
                    background: C.goldSoft,
                    color: C.gold,
                    border: `1px solid ${C.goldLine}`,
                    ...display,
                  }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="leading-tight">
                  <div className="text-[11.5px] font-semibold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.gold }}
                  >
                    <Check size={9} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Navigatie */}
          <nav
            className="flex justify-center gap-1 overflow-x-auto px-4 py-3.5 lg:px-8"
            style={{ borderBottom: `1px solid ${C.goldFaint}` }}
            aria-label="Secties"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex shrink-0 items-center gap-2 px-4 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                  style={{
                    background: on ? C.goldSoft : "transparent",
                    color: on ? C.ink : C.muted,
                    border: `1px solid ${on ? C.goldLine : "transparent"}`,
                  }}
                >
                  <span
                    className="text-[10px] tabular-nums tracking-[0.1em]"
                    style={{ color: on ? C.gold : C.faint }}
                  >
                    {ROMAN[i]}
                  </span>
                  <span className="text-[12.5px] font-medium">{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="px-5 py-10 sm:px-8 lg:px-12">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>

          {/* Voettekst */}
          <footer
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-6 py-4 text-center text-[10px] uppercase tracking-[0.24em] lg:px-10"
            style={{ borderTop: `1px solid ${C.goldFaint}`, color: C.faint }}
          >
            {NAV.slice(2).map((n) => (
              <span key={n}>{n}</span>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const kpiColors = [C.gold, C.jade, C.gold, C.amber];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <DecoHeading
        nr="I"
        kicker="Le tableau"
        title={`Welkom terug, ${PROFIEL.naam.split(" ")[0]}`}
        note="Drie verfijnde matches liggen klaar, uw omzet stijgt gestaag en één certificaat vraagt om aandacht. Alles met de allure die uw praktijk verdient."
      />

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.gold;
          return (
            <DecoPanel key={k.label} className="px-5 py-5">
              <div className="flex items-baseline justify-between">
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.gold : C.ruby }}
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
                className="mt-2.5 text-[30px] tabular-nums leading-none tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-3.5">
                <DecoColumns data={k.spark} color={col} />
              </div>
            </DecoPanel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-10 lg:col-span-2">
          <section>
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="h-px w-8" style={{ background: C.goldLine }} aria-hidden="true" />
              <h2
                className="text-[12px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: C.gold }}
              >
                Sélection · Beste matches
              </h2>
              <span className="h-px w-8" style={{ background: C.goldLine }} aria-hidden="true" />
            </div>
            <DecoPanel glow>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#173730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a24b]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.goldFaint}` }}
                >
                  <MatchEmblem value={o.match} color={o.match >= 90 ? C.gold : C.jade} />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[15.5px] leading-snug"
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
                    className="hidden text-[12.5px] tabular-nums sm:inline"
                    style={{ color: C.inkSoft }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.gold }} />
                </button>
              ))}
            </DecoPanel>
          </section>

          {/* Correspondentie */}
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2
                className="text-[12px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: C.gold }}
              >
                Correspondance
              </h2>
              <span className="text-[11px]" style={{ color: C.muted }}>
                {ongelezen} ongelezen
              </span>
            </div>
            <DecoPanel>
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3.5 px-5 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.goldFaint}` }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[11px]"
                    style={{
                      background: b.ongelezen ? C.goldSoft : "transparent",
                      color: b.ongelezen ? C.gold : C.muted,
                      border: `1px solid ${b.ongelezen ? C.goldLine : C.goldFaint}`,
                      ...display,
                    }}
                  >
                    {b.initialen}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold">{b.van}</p>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.gold }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[12px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
                    {b.tijd}
                  </span>
                </div>
              ))}
            </DecoPanel>
          </section>
        </div>

        {/* Zijkolom */}
        <div className="space-y-10">
          <section>
            <div className="mb-4 text-center">
              <h2
                className="text-[12px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: C.gold }}
              >
                Certificats
              </h2>
            </div>
            <DecoPanel className="px-5 py-5">
              <ul className="space-y-4">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <li key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center"
                        style={{ background: st.bg, border: `1px solid ${st.fg}44` }}
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
                        className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: st.fg }}
                      >
                        {st.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </DecoPanel>
          </section>

          {/* Aanbevolen */}
          <section>
            <DecoPanel glow className="overflow-hidden">
              <div
                className="px-6 py-6 text-center"
                style={{
                  background: `radial-gradient(400px 160px at 50% 0%, ${C.goldSoft}, transparent 70%)`,
                }}
              >
                <div className="flex justify-center">
                  <Sunburst size={44} rays={9} />
                </div>
                <p
                  className="mt-2 text-[9.5px] font-semibold uppercase tracking-[0.34em]"
                  style={{ color: C.gold }}
                >
                  Recommandation
                </p>
                <p
                  className="mt-2.5 text-[21px] leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {ACTIES[0]?.titel}
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                  {ACTIES[0]?.detail}
                </p>
                <button
                  className="mt-4 w-full py-2.5 text-[12.5px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14302a]"
                  style={{ background: C.gold, color: C.bgDeep }}
                >
                  {ACTIES[0]?.cta}
                </button>
              </div>
            </DecoPanel>
          </section>
        </div>
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
  return (
    <div className="mx-auto max-w-6xl space-y-9">
      <DecoHeading
        nr="II"
        kicker="Le marché"
        title="Open opdrachten"
        note="Elke opdracht als een gecureerd juweel, met verklaarde matchscore en gouden vertrouwensmerk."
      />

      <DecoPanel className="mx-auto flex max-w-xl items-center gap-3 px-5 py-3">
        <Search size={16} aria-hidden="true" style={{ color: C.gold }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f8279]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </DecoPanel>

      {filtered.length === 0 ? (
        <DecoPanel className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center"
            style={{ background: C.goldSoft, border: `1px solid ${C.goldLine}` }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.gold }} />
          </div>
          <p className="mt-4 text-[22px]" style={{ ...display, color: C.ink }}>
            Geen juweel gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px]" style={{ color: C.muted }}>
            Geen opdracht voldoet aan &quot;{q}&quot;. Verruim gerust uw zoektermen; nieuw werk
            wordt hier met zorg tentoongesteld zodra het binnenkomt.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
            style={{ background: C.gold, color: C.bgDeep }}
          >
            Zoekopdracht wissen
          </button>
        </DecoPanel>
      ) : (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {filtered.map((o) => (
            <DecoPanel key={o.id} glow>
              <button
                onClick={onOpen}
                className="w-full text-left transition-colors hover:bg-[#173730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a24b]"
              >
                <div className="px-6 pb-5 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: C.faint }}
                    >
                      №&nbsp;{o.id}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tabular-nums"
                      style={{
                        background: o.match >= 90 ? C.goldSoft : C.jadeSoft,
                        color: o.match >= 90 ? C.gold : C.jade,
                        border: `1px solid ${o.match >= 90 ? C.goldLine : "transparent"}`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: o.match >= 90 ? C.gold : C.jade }}
                        aria-hidden="true"
                      />
                      {o.match}% match
                    </span>
                  </div>
                  <p className="mt-4 text-[22px] leading-snug" style={{ ...display, color: C.ink }}>
                    {o.titel}
                  </p>
                  <p
                    className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 text-[10.5px]"
                        style={{ color: C.inkSoft, border: `1px solid ${C.goldFaint}` }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mx-6 my-1">
                  <ChevronRule color={C.goldFaint} />
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ color: C.gold }}
                  >
                    {o.tarief}
                  </span>
                  <span className="text-[12px] tabular-nums" style={{ color: C.muted }}>
                    {o.uren} · {o.start}
                  </span>
                </div>
              </button>
            </DecoPanel>
          ))}
        </div>
      )}
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
      <DecoHeading nr="III" kicker={`Dossier № ${opdracht.id}`} title={opdracht.titel} />

      <div className="flex flex-col items-center gap-3">
        <p className="flex items-center gap-1.5 text-[13.5px]" style={{ color: C.muted }}>
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <button
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] disabled:opacity-90"
          style={{
            background: state === "sent" ? C.jade : C.gold,
            color: state === "sent" ? C.ink : C.bgDeep,
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

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <DecoPanel key={m.l} className="px-4 py-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              {m.l} · {ROMAN[i]}
            </p>
            <p className="mt-2 text-[19px] tabular-nums" style={{ ...display, color: C.ink }}>
              {m.v}
            </p>
          </DecoPanel>
        ))}
      </div>

      <DecoPanel glow className="px-6 py-7">
        <div className="text-center">
          <div className="flex justify-center">
            <Sunburst size={44} rays={9} />
          </div>
          <h3
            className="mt-2 text-[12px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: C.gold }}
          >
            La raison · Waarom deze match
          </h3>
          <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
            Transparant onderbouwd op uw geverifieerde profiel — niets verborgen.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div
            className="px-5 py-5"
            style={{ background: C.goldSoft, border: `1px solid ${C.goldFaint}` }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: C.gold }}
            >
              In het voordeel
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.goldSoft, border: `1px solid ${C.goldLine}` }}
                    aria-hidden="true"
                  >
                    <Check size={11} style={{ color: C.gold }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="px-5 py-5"
            style={{ background: C.amberSoft, border: `1px solid ${C.amber}33` }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.amberSoft, border: `1px solid ${C.amber}44` }}
                    aria-hidden="true"
                  >
                    <Minus size={11} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DecoPanel>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <DecoHeading
        nr="IV"
        kicker="La confiance"
        title="Verificatie"
        note="Zoals een juwelier zijn stenen certificeert, wordt elk bewijsstuk onafhankelijk geverifieerd."
      />

      <DecoPanel glow className="px-6 py-7">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center"
            style={{ background: C.goldSoft, border: `1px solid ${C.goldLine}` }}
          >
            <Check size={28} aria-hidden="true" style={{ color: C.gold }} />
          </div>
          <div className="flex-1">
            <p className="text-[26px] leading-none" style={{ ...display, color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
              <span className="font-semibold tabular-nums">{verified}</span> van{" "}
              <span className="font-semibold tabular-nums">{total}</span> bewijsstukken volledig
              geverifieerd · één vraagt om aandacht.
            </p>
          </div>
          <div className="flex items-end gap-1.5" aria-hidden="true">
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <span
                  key={c.naam}
                  className="w-2"
                  style={{ height: c.status === "VERIFIED" ? 40 : 22, background: st.fg }}
                />
              );
            })}
          </div>
        </div>
      </DecoPanel>

      <DecoPanel>
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#173730]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.goldFaint}` }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: st.bg, border: `1px solid ${st.fg}44` }}
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
                <p className="text-[15px] leading-tight" style={{ ...display, color: C.ink }}>
                  {c.naam}
                </p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 text-[11px] font-semibold"
                style={{ color: st.fg, background: st.bg, border: `1px solid ${st.fg}33` }}
              >
                <st.Icon size={11} aria-hidden="true" /> {st.label}
              </span>
            </div>
          );
        })}
      </DecoPanel>

      {/* Archief */}
      <section>
        <div className="mb-4 text-center">
          <h2
            className="text-[12px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: C.gold }}
          >
            Archives · Documenten
          </h2>
        </div>
        <DecoPanel>
          {DOCUMENTEN.map((d, i) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3.5 px-5 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.goldFaint}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ border: `1px solid ${C.goldFaint}` }}
                  aria-hidden="true"
                >
                  <FileText size={15} style={{ color: C.gold }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                  <p className="truncate text-[11px]" style={{ color: C.muted }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-semibold"
                  style={{ color: st.fg, background: st.bg }}
                >
                  <st.Icon size={10} aria-hidden="true" /> {st.label}
                </span>
              </div>
            );
          })}
        </DecoPanel>
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
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.gold, bg: C.goldSoft, Icon: Bell, label: "Ter info" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-9">
      <DecoHeading
        nr="V"
        kicker="L'agenda"
        title="Volgende acties"
        note="Eén onderwerp tegelijk onder de schijnwerpers. De rest houden wij voor u in de gaten."
      />
      <div className="space-y-5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <DecoPanel key={a.titel} className="flex items-start gap-4 px-5 py-4">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] tabular-nums" style={{ color: C.faint }}>
                  {ROMAN[i]}
                </span>
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center"
                  style={{ background: t.bg, border: `1px solid ${t.fg}44` }}
                >
                  <t.Icon size={20} aria-hidden="true" style={{ color: t.fg }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: t.fg, background: t.bg }}
                >
                  <t.Icon size={9} aria-hidden="true" /> {t.label}
                </span>
                <p className="mt-2 text-[16px] leading-tight" style={{ ...display, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#173730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                style={{ color: t.fg, border: `1px solid ${t.fg}55` }}
              >
                {a.cta}
              </button>
            </DecoPanel>
          );
        })}
      </div>
      <DecoPanel className="flex items-center gap-4 px-5 py-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center"
          style={{ background: C.goldSoft, border: `1px solid ${C.goldLine}` }}
        >
          <Check size={18} aria-hidden="true" style={{ color: C.gold }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bekeken? Voortreffelijk. Nieuwe agendapunten verschijnen hier zodra ze relevant
          worden — u hoeft niets zelf te bewaken.
        </p>
      </DecoPanel>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string; Icon: LucideIcon; label: string }> = {
    Betaald: { fg: C.gold, bg: C.goldSoft, Icon: Check, label: "Betaald" },
    Openstaand: { fg: C.amber, bg: C.amberSoft, Icon: Clock, label: "Openstaand" },
    Concept: { fg: C.muted, bg: "rgba(155,171,159,0.12)", Icon: FileText, label: "Concept" },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <DecoHeading
        nr="VI"
        kicker="Les comptes"
        title="Facturen"
        note="Uw grootboek, in stijl bijgehouden."
      />
      <div className="flex justify-center">
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
          style={{ background: C.gold, color: C.bgDeep }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <DecoPanel glow>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.goldFaint}` }}
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
                    className="transition-colors hover:bg-[#173730]"
                    style={{ borderTop: `1px solid ${C.goldFaint}` }}
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
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg, border: `1px solid ${t.fg}33` }}
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
      </DecoPanel>
    </div>
  );
}
