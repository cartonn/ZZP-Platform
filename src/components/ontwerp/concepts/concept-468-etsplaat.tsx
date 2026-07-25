"use client";

// Concept 468 — "Etsplaat" · Intaglio / guilloché security-print. De vertrouwens- en verificatiekern
// van het platform voelt als een gewaarmerkt waardepapier: fijn-lijn gravure, guilloché-rozetten
// (parametrisch met SVG getekend), koper-inkt (#9a6534) op ivoor-papier, en zegel-achtige waarmerken
// voor geverifieerde certificaten. Klassiek-precies, hoog lijncontrast — geen risograph of zeefdruk,
// maar de dunne parallelle lijnen van een bankbiljet. Bewegingen zijn ingetogen; gedempt bij
// prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Stamp,
  TrendingDown,
  TrendingUp,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: koper-inkt op ivoor waardepapier —
const C = {
  paper: "#f4eedd", // ivoor waardepapier
  paperAlt: "#ece3ce", // guilloché-onderdruk
  card: "#fbf7ec",
  ink: "#211c14", // graveerinkt
  inkSoft: "#453c2c",
  inkMute: "#736852",
  inkFaint: "#a3967a",
  line: "#d5c8ab", // fijne lijn
  lineStrong: "#bcab86",
  copper: "#985f2e", // intaglio koper
  copperDeep: "#7a4a22",
  copperSoft: "#eaddc6",
  green: "#3f6140", // zegel-groen
  greenSoft: "#dde6d3",
  amber: "#8f6216",
  amberSoft: "#efe4c8",
  red: "#963030",
  redSoft: "#eed7cf",
  blue: "#33506f",
  blueSoft: "#dbe2ec",
};

const bodyFont = {
  fontFamily:
    "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, 'Times New Roman', serif",
};
const sans = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  fontVariantNumeric: "tabular-nums" as const,
};

// Fijne parallelle gravure-hatching als onderdruk (bankbiljet-gevoel).
function engraved(base: string): React.CSSProperties {
  return {
    backgroundColor: base,
    backgroundImage: `repeating-linear-gradient(45deg, ${C.line}22 0px, ${C.line}22 0.5px, transparent 0.5px, transparent 5px), repeating-linear-gradient(-45deg, ${C.copper}12 0px, ${C.copper}12 0.5px, transparent 0.5px, transparent 6px)`,
  };
}

// — Guilloché-rozet: parametrische spirograaf, fijn-lijn — puur decoratief —
function Guilloche({
  size = 120,
  stroke = C.copper,
  opacity = 0.5,
  rings = 5,
  petals = 7,
}: {
  size?: number;
  stroke?: string;
  opacity?: number;
  rings?: number;
  petals?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const paths: string[] = [];
  for (let k = 0; k < rings; k++) {
    const baseR = (size / 2) * (0.28 + (k / rings) * 0.62);
    const amp = (size / 2) * 0.07;
    const phase = (k * Math.PI) / rings;
    let d = "";
    for (let a = 0; a <= 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      const rr = baseR + Math.sin(rad * petals + phase) * amp;
      const x = cx + Math.cos(rad) * rr;
      const y = cy + Math.sin(rad) * rr;
      d += `${a === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
    }
    paths.push(d.trim() + " Z");
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={stroke} strokeWidth="0.5" />
      ))}
      <circle cx={cx} cy={cy} r={size * 0.12} fill="none" stroke={stroke} strokeWidth="0.6" />
    </svg>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Gewaarmerkt",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.green,
        wash: C.greenSoft,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.blue, wash: C.blueSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        wash: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.red, wash: C.redSoft };
  }
}

// — Waardepapier-kaart met dubbele fijne rand —
function Plate({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`relative rounded-[3px] ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: `inset 0 0 0 3px ${C.card}, inset 0 0 0 3.6px ${C.line}, 0 1px 2px rgba(33,28,20,0.07)`,
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.copper }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ color: tone, ...sans }}
    >
      <span className="inline-block h-px w-6" style={{ background: tone }} aria-hidden="true" />
      {children}
      <span
        className="inline-block h-px w-6"
        style={{ background: tone, opacity: 0.4 }}
        aria-hidden="true"
      />
    </p>
  );
}

function CopperButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[3px] px-5 py-2.5 text-[12.5px] font-semibold text-[#fbf7ec] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211c14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4eedd] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: C.copper,
        border: `1px solid ${C.copperDeep}`,
        boxShadow: `inset 0 0 0 1px ${C.copperSoft}55`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211c14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4eedd] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fbf7ec" : C.ink,
        background: active ? C.ink : "transparent",
        border: `1px solid ${active ? C.ink : C.lineStrong}`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Zegel-waarmerk: guilloché-rozet met percentage in het hart —
function Seal({
  value,
  label = "match",
  tone = C.copper,
}: {
  value: number;
  label?: string;
  tone?: string;
}) {
  return (
    <span className="relative inline-flex h-16 w-16 items-center justify-center" aria-hidden="true">
      <span className="absolute inset-0">
        <Guilloche size={64} stroke={tone} opacity={0.65} rings={4} petals={9} />
      </span>
      <span className="relative flex flex-col items-center justify-center">
        <span className="text-[16px] font-bold leading-none" style={{ color: tone, ...num }}>
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: tone, ...sans }}
        >
          {label}
        </span>
      </span>
    </span>
  );
}

// — Gegraveerde sparkline: fijne lijn met hatching-vulling —
function EtsSpark({ data, id, tone = C.copper }: { data: number[]; id: string; tone?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 2 - ((d - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`ets-h-${id}`}
          width="4"
          height="4"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="4" stroke={tone} strokeWidth="0.5" opacity="0.4" />
        </pattern>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#ets-h-${id})`} />
      <path d={line} fill="none" stroke={tone} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function Concept468() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...engraved(C.paper) }}
    >
      <style>{`
        @keyframes etsRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .ets-rise { animation: etsRise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .ets-rise { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="ets-rise pt-6">
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
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header
      className="flex items-center justify-between gap-4 border-b py-5"
      style={{ borderColor: C.lineStrong }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-12 w-12 items-center justify-center rounded-[3px]"
          style={{ border: `1px solid ${C.copperDeep}`, background: C.card }}
          aria-hidden="true"
        >
          <span className="absolute inset-0 flex items-center justify-center">
            <Guilloche size={48} stroke={C.copper} opacity={0.6} rings={3} petals={8} />
          </span>
          <Stamp size={18} strokeWidth={1.8} style={{ color: C.copperDeep }} className="relative" />
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-tight" style={{ color: C.ink }}>
            Etsplaat
          </p>
          <p
            className="mt-1.5 text-[10.5px] uppercase leading-none tracking-[0.16em]"
            style={{ color: C.inkMute, ...sans }}
          >
            {PROFIEL.plaats} · gewaarmerkt register
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.green,
            background: C.greenSoft,
            border: `1px solid ${C.green}`,
            ...sans,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[3px]"
          style={{ background: C.card, border: `1px solid ${C.lineStrong}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-[#fbf7ec]"
              style={{ background: C.red, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...sans }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-[3px] text-[12.5px] font-bold"
          style={{
            background: C.card,
            border: `1px solid ${C.copperDeep}`,
            color: C.copperDeep,
            ...num,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-4">
      <div
        className="flex items-stretch gap-0 overflow-x-auto border-b"
        style={{ borderColor: C.lineStrong }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#211c14] motion-reduce:transition-none"
              style={{
                color: on ? C.copperDeep : C.inkMute,
                borderBottom: on ? `2px solid ${C.copper}` : "2px solid transparent",
                ...sans,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6 pt-2">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Plate className="relative overflow-hidden p-7 md:p-8">
          <span className="pointer-events-none absolute -right-8 -top-8" aria-hidden="true">
            <Guilloche size={200} stroke={C.copper} opacity={0.16} rings={7} petals={11} />
          </span>
          <Eyebrow>Gewaarmerkt · vandaag</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Jouw dossier draagt het zegel: elk certificaat gewaarmerkt, elke verificatie in het
            register. Loop de openstaande posten na — alles verifieerbaar, niets in twijfel.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <CopperButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </CopperButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
          <p
            className="mt-6 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.line, ...sans }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.green }} />
            {verified}/{CREDENTIALS.length} certificaten gewaarmerkt · 7 open reacties
          </p>
        </Plate>

        <Plate className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.amber}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={17} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <CopperButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </CopperButton>
          </div>
        </Plate>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.green}>Registers · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const Trend = k.up ? TrendingUp : TrendingDown;
            const tone = k.up ? C.green : C.red;
            return (
              <Plate key={k.label} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.inkMute, ...sans }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <EtsSpark data={k.spark} id={`d468-${i}`} tone={tone} />
                </div>
              </Plate>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211c14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4eedd]"
              style={{ color: C.copperDeep, ...sans }}
            >
              Alle →
            </button>
          </div>
          <Plate>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#ece3ce] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#211c14] motion-reduce:transition-none"
                  >
                    <Seal value={o.match} tone={o.match >= 90 ? C.green : C.copper} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-bold" style={{ color: C.ink }}>
                        {o.titel}
                      </span>
                      <span className="block text-[11.5px]" style={{ color: C.inkMute, ...sans }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      style={{ color: C.inkFaint }}
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Plate>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.green}>Zegelregister</Eyebrow>
          </div>
          <Plate className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[3px]"
                      style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[10.5px]"
                        style={{ color: C.inkMute, ...sans }}
                      >
                        {st.label}
                      </span>
                    </span>
                    {st.alarm && <span className="sr-only">(let op)</span>}
                  </li>
                );
              })}
            </ul>
          </Plate>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
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
    <div className="space-y-6 pt-2">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ color: C.inkMute, ...sans }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} posten in het register
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[3px] px-4 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.lineStrong}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3967a]"
            style={{ color: C.ink, ...sans }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Plate className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-[2px]" style={{ background: C.paperAlt }} />
                  <div className="h-5 w-2/3 rounded-[2px]" style={{ background: C.paperAlt }} />
                  <div className="h-3 w-1/2 rounded-[2px]" style={{ background: C.paperAlt }} />
                </div>
              </Plate>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Plate className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-[3px]"
              style={{
                background: C.paperAlt,
                border: `1px solid ${C.lineStrong}`,
                color: C.inkMute,
              }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.ink }}>
              Blanco plaat
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen post bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en beproef opnieuw.
            </p>
            <div className="mt-6">
              <CopperButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </CopperButton>
            </div>
          </div>
        </Plate>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <Plate className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-[2px] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...sans }}
            >
              Serie {String(index + 1).padStart(3, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute, ...sans }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[2px] px-2 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.paperAlt,
                  border: `1px solid ${C.line}`,
                  ...sans,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Seal value={opdracht.match} tone={strong ? C.green : C.copper} />
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211c14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7ec]"
          style={{ color: C.ink, border: `1px solid ${C.lineStrong}`, ...sans }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <CopperButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </CopperButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In je voordeel"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.red}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Plate>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-[3px] p-4"
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone, ...sans }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.copper;
  return (
    <div className="space-y-5 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[3px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211c14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4eedd]"
        style={{ color: C.ink, border: `1px solid ${C.lineStrong}`, background: C.card, ...sans }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Plate className="relative overflow-hidden p-7 md:p-8">
        <span
          className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          <Guilloche size={190} stroke={tone} opacity={0.18} rings={6} petals={10} />
        </span>
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-[2px] px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[11px] font-semibold text-[#fbf7ec]"
            style={{ background: tone, ...sans }}
          >
            <Award size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <CopperButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </CopperButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Plate>

      <Plate>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...sans }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Plate>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Getoetst aan je gewaarmerkte profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Plate className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.green, ...sans }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
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
          </Plate>
          <Plate className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.red, ...sans }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Let op
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
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
          </Plate>
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
    <div className="space-y-5 pt-2">
      <Plate className="relative overflow-hidden p-7 md:p-8">
        <span className="pointer-events-none absolute -bottom-12 -left-10" aria-hidden="true">
          <Guilloche size={220} stroke={C.green} opacity={0.14} rings={7} petals={12} />
        </span>
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.green}>Verificatie · waarmerk</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten dragen het zegel. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="relative inline-flex h-28 w-28 items-center justify-center"
            aria-hidden="true"
          >
            <span className="absolute inset-0">
              <Guilloche size={112} stroke={C.green} opacity={0.8} rings={5} petals={11} />
            </span>
            <span className="relative flex flex-col items-center justify-center">
              <span
                className="text-[28px] font-bold leading-none"
                style={{ color: C.green, ...num }}
              >
                {ratio}
              </span>
              <span
                className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.green, ...sans }}
              >
                % op orde
              </span>
            </span>
          </span>
        </div>
      </Plate>

      <Plate>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{
                  borderTop: idx === 0 ? "none" : `1px solid ${C.line}`,
                  background: idx % 2 === 1 ? C.paperAlt : "transparent",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#ece3ce] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#211c14] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px]"
                    style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute, ...sans }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span
                    className="hidden w-max items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
                    style={{
                      color: st.ink,
                      background: st.wash,
                      border: `1px solid ${st.ink}`,
                      ...sans,
                    }}
                  >
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                    {st.alarm && <span className="sr-only"> (let op)</span>}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[72px]">
                      <div
                        className="rounded-[3px] p-4"
                        style={{ background: C.card, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <CopperButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </CopperButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Plate>

      <div>
        <div className="mb-3">
          <Eyebrow tone={C.blue}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Plate key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[3px]"
                  style={{
                    background: C.paperAlt,
                    border: `1px solid ${C.lineStrong}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[2px] px-2 py-1 text-[10px] font-semibold"
                  style={{
                    color: st.ink,
                    background: st.wash,
                    border: `1px solid ${st.ink}`,
                    ...sans,
                  }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Plate>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-2">
      <div>
        <Eyebrow>Acties · op urgentie</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Werk van boven naar beneden af — zo blijft je register gewaarmerkt en betaald.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.blue;
          const wash = warn ? C.amberSoft : C.blueSoft;
          return (
            <li key={a.titel}>
              <Plate className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[3px] text-[14px] font-bold"
                    style={{ background: C.card, border: `1px solid ${tone}`, color: tone, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: wash,
                        border: `1px solid ${tone}`,
                        ...sans,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Stamp size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <CopperButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </CopperButton>
                  </div>
                </div>
              </Plate>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.red, wash: C.redSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, wash: C.greenSoft, Icon: Check };
  return { ink: C.inkMute, wash: C.paperAlt, Icon: FileText };
}

function Facturen() {
  const [dicht, setDicht] = useState(false);
  const zichtbaar = useMemo(
    () => (dicht ? FACTUREN.filter((f) => f.status !== "Concept") : FACTUREN),
    [dicht],
  );
  return (
    <div className="space-y-5 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · debiteuren</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Waardepapieren
          </h1>
        </div>
        <CopperButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </CopperButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Voldaan", v: "€ 8.622", sub: "3 facturen", tone: C.green, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.red, alarm: true },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te waarmerken",
            tone: C.inkMute,
            alarm: false,
          },
        ].map((s) => (
          <Plate key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...sans }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.red }} />}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute, ...sans }}>
              {s.sub}
            </p>
          </Plate>
        ))}
      </section>

      <div className="flex items-center justify-end">
        <GhostButton onClick={() => setDicht((v) => !v)} active={dicht} ariaPressed={dicht}>
          {dicht ? "Toon concepten" : "Verberg concepten"}
        </GhostButton>
      </div>

      <Plate>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Debiteur", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkMute, ...sans }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#ece3ce]"
                    style={{
                      background: i % 2 === 1 ? C.paperAlt : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3.5 text-[11.5px] font-semibold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3.5 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[10.5px] font-semibold"
                        style={{
                          color: ft.ink,
                          background: ft.wash,
                          border: `1px solid ${ft.ink}`,
                          ...sans,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13.5px] font-bold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Plate>
    </div>
  );
}
