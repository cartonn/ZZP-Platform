"use client";

// Concept 375 — "Guilloché" · Securité graveerlijnen.
// Bankbiljet/paspoort-veiligheidsdruk: fijne ineengevlochten gegraveerde curve-lijnen
// (engine-turning), rozetten/guilloché-medaillons, microtekst-randen, zegel-motief. Securité-groen
// (#1c5b4a) op ivoor (#f3efe3), met koper/goud accent (#b08a3e). Fonts: Cormorant (display),
// Plex Mono (serienummers/microtekst), Inter (body). Motief: verificatie als authenticiteitszegel
// met guilloché-rozet. Precies, gezaghebbend, premium-security.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Stamp,
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

// — Palet: securité-groen op ivoor, koper/goud accent —
const C = {
  ivory: "#f3efe3",
  paper: "#f7f4ea",
  card: "#faf7ef",
  ink: "#173026",
  green: "#1c5b4a",
  greenSoft: "#4d7d6e",
  muted: "#5f6f68",
  faint: "#8b968f",
  line: "rgba(23,48,38,0.16)",
  lineSoft: "rgba(23,48,38,0.08)",
  gold: "#b08a3e",
  goldSoft: "#d6bd85",
  red: "#9a2f28",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const microFont = { fontFamily: "var(--font-lab-plex-mono), ui-monospace, monospace" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Gewaarmerkt", Icon: Check, alarm: false };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Zegel verloopt", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Ongeldig", Icon: AlertTriangle, alarm: true };
  }
}

// Serienummer, decoratief securité-label.
function serial(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 33 + seed.charCodeAt(i)) % 1000000;
  return `№ ${String(n).padStart(6, "0")}`;
}

// — Guilloché-rozet: ineengevlochten golflijnen (engine-turning) —
function Rosette({
  size = 120,
  stroke = C.green,
  rings = 3,
  petals = 14,
  opacity = 1,
}: {
  size?: number;
  stroke?: string;
  rings?: number;
  petals?: number;
  opacity?: number;
}) {
  const c = size / 2;
  const paths: React.ReactNode[] = [];
  for (let ring = 0; ring < rings; ring++) {
    const baseR = (c - 6) * (0.5 + (ring / rings) * 0.5);
    const amp = 6 + ring * 2.5;
    const pts: string[] = [];
    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const r = baseR + Math.sin(a * petals + ring * 0.6) * amp;
      const x = c + Math.cos(a) * r;
      const y = c + Math.sin(a) * r;
      pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    paths.push(
      <path
        key={ring}
        d={pts.join(" ")}
        fill="none"
        stroke={ring === rings - 1 ? C.gold : stroke}
        strokeWidth={ring === rings - 1 ? 0.7 : 0.5}
        opacity={0.5 + ring * 0.12}
      />,
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      <circle cx={c} cy={c} r={c - 3} fill="none" stroke={stroke} strokeWidth="0.6" opacity="0.4" />
      {paths}
      <circle cx={c} cy={c} r={c * 0.14} fill="none" stroke={C.gold} strokeWidth="0.8" />
    </svg>
  );
}

// — Guilloché-band: horizontale ineengevlochten golflijnen —
function GuillocheBand({
  width = 600,
  height = 18,
  stroke = C.green,
}: {
  width?: number;
  height?: number;
  stroke?: string;
}) {
  const lines: React.ReactNode[] = [];
  const waves = 3;
  for (let w = 0; w < waves; w++) {
    const pts: string[] = [];
    const steps = Math.round(width / 4);
    const phase = (w / waves) * Math.PI * 2;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const y =
        height / 2 + Math.sin(x / 26 + phase) * (height / 2 - 3) * Math.cos(x / 90 + phase * 0.5);
      pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    lines.push(
      <path
        key={w}
        d={pts.join(" ")}
        fill="none"
        stroke={w === waves - 1 ? C.gold : stroke}
        strokeWidth="0.5"
        opacity={0.55}
      />,
    );
  }
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines}
    </svg>
  );
}

// — Sparkline als fijne intaglio-lijn —
function Spark({ data, up }: { data: number[]; up: boolean }) {
  const w = 74;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? C.green : C.red}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Microtekst-rand: herhaalde kleine tekst als securité-detail.
function MicroBorder({ text }: { text: string }) {
  return (
    <div
      className="overflow-hidden whitespace-nowrap text-[6.5px] uppercase leading-none tracking-[0.25em]"
      style={{ color: C.greenSoft, ...microFont }}
      aria-hidden="true"
    >
      {Array.from({ length: 24 }, (_, i) => (
        <span key={i}>{text} · </span>
      ))}
    </div>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.34em]" style={{ color: C.gold, ...microFont }}>
      {children}
    </p>
  );
}

function Seal({ children, alarm }: { children: React.ReactNode; alarm?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em]"
      style={{
        color: alarm ? C.red : C.green,
        border: `1px solid ${alarm ? "rgba(154,47,40,0.45)" : "rgba(28,91,74,0.4)"}`,
        background: alarm ? "rgba(154,47,40,0.05)" : "rgba(28,91,74,0.05)",
        ...microFont,
      }}
    >
      {children}
    </span>
  );
}

function Doc({
  children,
  className = "",
  medallion = false,
}: {
  children: React.ReactNode;
  className?: string;
  medallion?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[3px]"
      style={{ border: `1px solid ${C.line}`, background: C.card }}
    >
      <div
        className="pointer-events-none absolute inset-1.5 rounded-[2px]"
        style={{ border: `1px solid ${C.lineSoft}` }}
        aria-hidden="true"
      />
      {medallion && (
        <div
          className="pointer-events-none absolute -right-6 -top-6 opacity-[0.10]"
          aria-hidden="true"
        >
          <Rosette size={150} />
        </div>
      )}
      <div className={`relative ${className}`}>{children}</div>
    </div>
  );
}

export function Concept375() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.ivory, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
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

function TopBar() {
  return (
    <header className="border-b py-6" style={{ borderColor: C.ink }}>
      <div className="mb-3">
        <MicroBorder text="geverifieerd platform · securité" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center" aria-hidden="true">
            <Rosette size={48} rings={3} petals={12} />
          </span>
          <div>
            <p className="text-[27px] font-semibold leading-none tracking-[0.01em]" style={display}>
              Guilloché
            </p>
            <p
              className="mt-1 text-[9.5px] uppercase leading-none tracking-[0.28em]"
              style={{ color: C.faint, ...microFont }}
            >
              Gewaarmerkt werk &amp; verificatie · {serial(PROFIEL.naam)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] sm:inline-flex"
            style={{ color: C.green, border: `1px solid rgba(28,91,74,0.4)`, ...microFont }}
          >
            <ShieldCheck size={12} aria-hidden="true" style={{ color: C.gold }} />
            {PROFIEL.trust}
          </span>
          <span className="hidden text-right sm:block">
            <span className="block text-[13px] font-medium leading-none" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="mt-1 block text-[10px] leading-none"
              style={{ color: C.faint, ...microFont }}
            >
              {PROFIEL.plaats}
            </span>
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px]"
            style={{
              border: `1.5px solid ${C.gold}`,
              color: C.green,
              background: C.paper,
              ...microFont,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.line }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-3.5 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: on ? C.ink : C.muted, ...display, fontWeight: on ? 600 : 500 }}
          >
            <span
              className="mr-2 text-[9.5px] tabular-nums"
              style={{ color: on ? C.gold : C.faint, ...microFont }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5"
                style={{ background: C.gold }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="self-center">
          <Overline>Sectie I · Vandaag</Overline>
          <h1
            className="mt-5 text-[46px] font-semibold leading-[0.98] tracking-[-0.01em] md:text-[60px]"
            style={display}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Elk onderdeel van je week gewaarmerkt en op orde. Eén handeling vandaag en je dossier
            blijft gaaf — zoals een zegel dat klopt.
          </p>
          <div className="mt-6 max-w-sm">
            <GuillocheBand width={340} height={16} />
          </div>
        </div>

        <Doc medallion>
          <div className="p-6">
            <Overline>Eerste waarmerk</Overline>
            <h2 className="mt-2 text-[23px] font-semibold leading-snug" style={display}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
            <button
              onClick={onOpen}
              className="group mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.green, color: C.ivory, ...body }}
            >
              {primair.cta}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </Doc>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Sectie II · Kengetallen</Overline>
          <span
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...microFont }}
          >
            deze maand
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Doc key={k.label} className="p-5">
              <div className="flex items-baseline justify-between">
                <p
                  className="text-[10.5px] uppercase tracking-[0.1em]"
                  style={{ color: C.muted, ...microFont }}
                >
                  {k.label}
                </p>
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: k.up ? C.green : C.red, ...microFont }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2 text-[32px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-3 flex justify-end">
                <Spark data={k.spark} up={k.up} />
              </div>
            </Doc>
          ))}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Sectie III · Opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[10px] uppercase tracking-[0.14em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.gold, ...microFont }}
          >
            Volledig register
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[3px] p-4 text-left transition-colors hover:bg-[#faf7ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ border: `1px solid ${C.line}` }}
              >
                <span className="text-[9.5px] tabular-nums" style={{ color: C.gold, ...microFont }}>
                  {serial(o.id)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[16.5px] font-semibold" style={display}>
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11.5px]"
                    style={{ color: C.muted, ...microFont }}
                  >
                    {o.opdrachtgever} · {o.plaats}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchSeal value={o.match} />
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.ink }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MatchSeal({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span
        className="text-[16px] font-semibold tabular-nums"
        style={{ color: strong ? C.green : C.ink, ...display }}
      >
        {value}%
      </span>
      <span
        className="hidden h-1.5 w-16 overflow-hidden rounded-full sm:block"
        style={{ background: C.lineSoft }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: strong ? C.green : C.gold }}
        />
      </span>
    </span>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Overline>Register</Overline>
          <h1
            className="mt-3 text-[38px] font-semibold leading-none tracking-[-0.01em]"
            style={display}
          >
            Opdrachten
          </h1>
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.12em]"
          style={{ color: C.faint, ...microFont }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          vermeldingen
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ border: `1px solid ${C.ink}`, background: C.paper }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8b968f]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.green, color: C.ivory, ...microFont }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...microFont }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Doc>
          <div className="flex flex-col items-center py-16 text-center">
            <Rosette size={96} stroke={C.faint} />
            <p className="mt-4 text-[26px] font-semibold" style={display}>
              Geen vermelding gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om het
              register opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.green, color: C.ivory }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Doc>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Doc className="p-5" medallion>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <span
            className="text-[9.5px] uppercase tracking-[0.12em]"
            style={{ color: C.gold, ...microFont }}
          >
            {serial(opdracht.id)}
          </span>
          <h3 className="mt-1 text-[19px] font-semibold leading-snug" style={display}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted, ...microFont }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Seal key={t}>{t}</Seal>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[24px] font-semibold tabular-nums leading-none"
            style={{ color: opdracht.match >= 90 ? C.green : C.ink, ...display }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[14px] font-medium" style={{ color: C.ink, ...microFont }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="mt-4 flex items-center gap-4 border-t pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...microFont }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.gold, ...display }}
        >
          Reageer <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p
                className="text-[9.5px] uppercase tracking-[0.18em]"
                style={{ color: C.green, ...microFont }}
              >
                Gewaarmerkt (pro)
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.ink }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.green }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-[9.5px] uppercase tracking-[0.18em]"
                style={{ color: C.red, ...microFont }}
              >
                Aandachtspunten (contra)
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.red }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Doc>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...microFont }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar register
      </button>

      <Doc medallion>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] tracking-[0.1em]" style={{ color: C.gold, ...microFont }}>
              {serial(opdracht.id)}
            </span>
            <Seal>{opdracht.match}% match</Seal>
            <span
              className="text-[10px] uppercase tracking-[0.1em]"
              style={{ color: C.faint, ...microFont }}
            >
              {opdracht.plaats}
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[38px] font-semibold leading-[1.04] tracking-[-0.01em] md:text-[50px]"
            style={display}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-medium transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.green, color: C.ivory }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-medium transition-colors hover:bg-[#eee9db] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.ink, border: `1px solid ${C.ink}` }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </Doc>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Doc key={m.l} className="p-4">
            <p
              className="text-[9.5px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...microFont }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[24px] font-semibold tabular-nums tracking-[-0.01em]"
              style={display}
            >
              {m.v}
            </p>
          </Doc>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Overline>Waarmerk · waarom deze match</Overline>
        </div>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed" style={{ color: C.ink }}>
          Transparant onderbouwd op je geverifieerde profiel — wat gewaarmerkt past én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Doc className="p-5">
            <Overline>Gewaarmerkt (pro)</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.ink }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Doc>
          <Doc className="p-5">
            <p
              className="text-[10px] uppercase tracking-[0.28em]"
              style={{ color: C.red, ...microFont }}
            >
              Aandachtspunten (contra)
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.red }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Doc>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-8">
      <Doc medallion>
        <div className="flex flex-wrap items-center justify-between gap-6 p-7">
          <div className="max-w-md">
            <Overline>Authenticiteitszegel</Overline>
            <h1
              className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.01em]"
              style={display}
            >
              Certificaten
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-medium" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten gewaarmerkt. Eén zegel verloopt
              binnenkort.
            </p>
          </div>
          <div className="relative flex h-24 w-24 items-center justify-center">
            <Rosette size={96} rings={3} petals={16} />
            <span className="absolute flex flex-col items-center">
              <span className="text-[22px] font-semibold tabular-nums leading-none" style={display}>
                {ratio}%
              </span>
              <span
                className="text-[8px] uppercase tracking-[0.12em]"
                style={{ color: C.gold, ...microFont }}
              >
                geldig
              </span>
            </span>
          </div>
        </div>
      </Doc>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Doc className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center"
                    aria-hidden="true"
                  >
                    <Rosette size={44} rings={2} petals={10} stroke={st.alarm ? C.red : C.green} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <st.Icon
                        size={15}
                        aria-hidden="true"
                        style={{ color: st.alarm ? C.red : C.green }}
                      />
                      <span className="truncate text-[17px] font-semibold" style={display}>
                        {c.naam}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 block text-[12.5px]"
                      style={{ color: C.muted, ...microFont }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Seal alarm={st.alarm}>{st.label}</Seal>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.muted,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 border-t pl-14 pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.ink }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                        expliciete toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: C.green, color: C.ivory }}
                        >
                          {c.status === "EXPIRING" ? "Zegel vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#eee9db] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ color: C.ink, border: `1px solid ${C.line}`, ...microFont }}
                        >
                          Logboek
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Doc>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <div className="border-b pb-6" style={{ borderColor: C.ink }}>
        <Overline>Volgende waarmerken</Overline>
        <h1
          className="mt-3 text-[36px] font-semibold leading-none tracking-[-0.01em]"
          style={display}
        >
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Werk deze punten op volgorde af — elke afgeronde actie houdt je dossier gaaf en geldig.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Doc className="overflow-hidden">
                <div
                  className="grid grid-cols-1 items-center gap-4 border-l-[3px] p-5 sm:grid-cols-[auto_1fr_auto]"
                  style={{ borderColor: warn ? C.red : C.gold }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                    style={
                      warn
                        ? { background: C.red, color: C.ivory, ...microFont }
                        : {
                            border: `1.5px solid ${C.green}`,
                            color: C.green,
                            background: C.paper,
                            ...microFont,
                          }
                    }
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <AlertTriangle size={15} aria-hidden="true" style={{ color: C.red }} />
                      ) : (
                        <Stamp size={15} aria-hidden="true" style={{ color: C.gold }} />
                      )}
                      <h2 className="text-[18px] font-semibold leading-snug" style={display}>
                        {a.titel}
                      </h2>
                    </div>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="justify-self-start rounded-full px-5 py-2.5 text-[13px] font-medium transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                    style={
                      warn
                        ? { background: C.red, color: C.ivory }
                        : { border: `1px solid ${C.ink}`, color: C.ink }
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </Doc>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Overline>Kasboek</Overline>
          <h1
            className="mt-3 text-[36px] font-semibold leading-none tracking-[-0.01em]"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-medium transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.green, color: C.ivory }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Doc key={s.l} className="p-5">
            <p
              className="text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...microFont }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[30px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ color: s.alarm ? C.red : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Doc>
        ))}
      </section>

      <Doc className="p-5">
        <div
          className="hidden grid-cols-[9rem_1fr_5rem_8rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.ink }}
        >
          {["Serienummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...microFont }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#faf7ef] sm:grid-cols-[9rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[11.5px] tabular-nums"
                  style={{ color: C.faint, ...microFont }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15.5px] font-semibold sm:order-2"
                  style={display}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...microFont }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Seal alarm={acc}>{f.status}</Seal>
                </span>
                <span
                  className="order-2 text-right text-[15.5px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.red : C.ink, ...display }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: C.faint, ...microFont }}
          >
            Totaal betaald
          </span>
          <span className="text-[26px] font-semibold tabular-nums" style={display}>
            {totaalBetaald}
          </span>
        </div>
      </Doc>
    </div>
  );
}
