"use client";

// Concept 379 — "Batik" · Wax-resist textiel.
// Indonesische batik: organische wax-resist patronen (parang, kawung), rijke indigo en soga-bruin met
// crème-resist en accent-oranje, craquelé-adertjes van gebarsten was, gelaagde dye-patronen. Secties en
// kaarten dragen een subtiele batik-patroontextuur als achtergrond; warme, handgemaakte rijkdom.
// Status altijd via label + icoon. Palet: indigo (#1b3a5c), soga-bruin (#6b3f22), crème-resist
// (#efe6d2), accent-oranje (#c26a2c). Fonts: Cormorant (display), Plus Jakarta (body).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Flower2,
  Waves,
  Feather,
  Leaf,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: indigo & soga-bruin met crème-resist en accent-oranje —
const C = {
  cream: "#efe6d2",
  creamAlt: "#e7dcc3",
  card: "#f5eeddff",
  indigo: "#1b3a5c",
  indigoDeep: "#12283f",
  soga: "#6b3f22",
  sogaSoft: "#8a5a38",
  orange: "#c26a2c",
  orangeSoft: "#d98a4e",
  ink: "#241a10",
  inkSoft: "#463521",
  muted: "#6c5636",
  faint: "#9a835f",
  line: "rgba(36,26,16,0.2)",
  lineSoft: "rgba(36,26,16,0.1)",
  danger: "#a8442b",
};

const head = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Vastgezet", Icon: Check, alarm: false, tone: C.indigo };
    case "SUBMITTED":
      return { label: "In het bad", Icon: Clock, alarm: false, tone: C.soga };
    case "EXPIRING":
      return { label: "Verkleurt binnenkort", Icon: AlertTriangle, alarm: true, tone: C.danger };
    case "REJECTED":
      return { label: "Losgelaten", Icon: AlertTriangle, alarm: true, tone: C.danger };
  }
}

// — Batik-patroontextuur (kawung / parang-achtig) als achtergrond, subtiel —
const kawung: React.CSSProperties = {
  backgroundImage: `radial-gradient(circle at 0 0, transparent 34%, ${C.lineSoft} 35%, transparent 37%), radial-gradient(circle at 22px 22px, transparent 34%, ${C.lineSoft} 35%, transparent 37%)`,
  backgroundSize: "44px 44px",
};

const parang: React.CSSProperties = {
  backgroundImage: `repeating-linear-gradient(135deg, ${C.lineSoft} 0 1px, transparent 1px 12px), repeating-linear-gradient(135deg, transparent 0 9px, rgba(194,106,44,0.06) 9px 11px, transparent 11px 20px)`,
};

// Craquelé — fijne barsten in de was, decoratieve SVG-overlay.
function Craquele({ seed = 3, opacity = 0.14 }: { seed?: number; opacity?: number }) {
  const lines = useMemo(() => {
    const arr: string[] = [];
    let n = seed * 2654435761;
    for (let i = 0; i < 26; i++) {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const x = n % 100;
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const y = n % 100;
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const dx = (n % 24) - 12;
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const dy = (n % 24) - 12;
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const dx2 = (n % 20) - 10;
      arr.push(`M${x} ${y} q${dx} ${dy} ${dx + dx2} ${dy - 4}`);
    }
    return arr;
  }, [seed]);
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ opacity }}
    >
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={C.indigoDeep} strokeWidth="0.25" />
      ))}
    </svg>
  );
}

// — Ronde dye-medaillon met concentrische ringen als voortgangsmeter —
function DyeMedallion({ value, size = 92 }: { value: number; size?: number }) {
  const c = size / 2;
  const r = c - 5;
  const frac = Math.max(0, Math.min(100, value)) / 100;
  const petals = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const on = i / 12 < frac;
    return (
      <circle
        key={i}
        cx={c + Math.cos(a) * (r - 8)}
        cy={c + Math.sin(a) * (r - 8)}
        r={on ? 3 : 1.6}
        fill={on ? C.orange : C.lineSoft}
      />
    );
  });
  const circ = 2 * Math.PI * (r - 2);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke={C.line} strokeWidth="0.8" />
      <circle
        cx={c}
        cy={c}
        r={r - 2}
        fill="none"
        stroke={C.indigo}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={`${circ * frac} ${circ}`}
        transform={`rotate(-90 ${c} ${c})`}
      />
      {petals}
      <circle
        cx={c}
        cy={c}
        r={r - 16}
        fill="none"
        stroke={C.soga}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <circle cx={c} cy={c} r="2.4" fill={C.soga} />
    </svg>
  );
}

// — Fijne sparkline als dye-drip —
function DripLine({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return { x, y };
  });
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={up ? C.indigo : C.soga}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {last && <circle cx={last.x} cy={last.y} r="2.4" fill={C.orange} />}
    </svg>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.3em]"
      style={{ color: C.orange, ...body }}
    >
      {children}
    </p>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em]"
      style={{
        color: tone ?? C.inkSoft,
        border: `1px solid ${tone ? tone : C.line}`,
        borderRadius: 999,
        ...body,
      }}
    >
      {children}
    </span>
  );
}

function Panel({
  children,
  className = "",
  pattern,
}: {
  children: React.ReactNode;
  className?: string;
  pattern?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        border: `1px solid ${C.line}`,
        background: C.card,
        borderRadius: 12,
        boxShadow: "0 10px 34px -26px rgba(27,58,92,0.5)",
      }}
    >
      {pattern && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ ...pattern, opacity: 0.5 }}
          aria-hidden="true"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

export function Concept379() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.cream }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ ...kawung, opacity: 0.5 }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
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
  return (
    <header
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full"
          style={{ background: C.indigo }}
          aria-hidden="true"
        >
          <span className="absolute inset-0" style={{ ...parang, opacity: 0.5 }} />
          <Flower2 size={20} color={C.cream} className="relative" />
        </span>
        <div>
          <p className="text-[26px] font-semibold leading-none tracking-[-0.01em]" style={head}>
            Batik
          </p>
          <p
            className="mt-1 text-[10.5px] uppercase leading-none tracking-[0.26em]"
            style={{ color: C.faint, ...body }}
          >
            Geweven vertrouwen · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
          style={{ color: C.indigo, border: `1px solid ${C.line}`, ...body }}
        >
          <Leaf size={12} aria-hidden="true" style={{ color: C.orange }} />
          {PROFIEL.trust}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.inkSoft }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px]" style={{ color: C.faint }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{ background: C.soga, color: C.cream, ...body }}
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
    <nav className="flex items-center gap-1.5 overflow-x-auto py-3" aria-label="Hoofdnavigatie">
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              on
                ? { color: C.cream, background: C.indigo, ...body }
                : { color: C.muted, border: `1px solid ${C.line}`, ...body }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="self-center">
          <Overline>Het weefsel · Vandaag</Overline>
          <h1
            className="mt-5 text-[46px] font-semibold leading-[0.98] tracking-[-0.01em] md:text-[60px]"
            style={head}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Elke dag legt een nieuwe waslaag. Zet één patroon vast en de rest van het weefsel volgt
            de lijn vanzelf.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={onActies}
              className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.indigo, color: C.cream, ...body }}
            >
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px]"
              style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}
            >
              <Feather size={14} aria-hidden="true" style={{ color: C.orange }} />
              {ongelezen} nieuwe berichten
            </span>
          </div>
        </div>

        <Panel pattern={parang} className="p-6">
          <Craquele seed={9} opacity={0.1} />
          <div className="relative">
            <Overline>Helderste patroon</Overline>
            <h2 className="mt-3 text-[26px] font-semibold leading-snug" style={head}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
            <button
              onClick={onOpen}
              className="group mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: C.card,
                color: C.indigo,
                border: `1px solid ${C.indigo}`,
                ...body,
              }}
            >
              {primair.cta}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </Panel>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2.5"
          style={{ borderColor: C.line }}
        >
          <Overline>Motieven · deze maand</Overline>
          <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel key={k.label} pattern={kawung} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.indigo : C.soga }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p
                  className="text-[32px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={head}
                >
                  {k.value}
                </p>
                <DyeMedallion
                  value={Math.min(100, (k.spark[k.spark.length - 1] ?? 0) * (k.up ? 11 : 13))}
                  size={52}
                />
              </div>
              <div className="mt-4">
                <DripLine data={k.spark} up={k.up} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2.5"
          style={{ borderColor: C.line }}
        >
          <Overline>Open patronen · opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-[#c26a2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.orange }}
          >
            Volledige lap
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl p-4 text-left transition-all hover:bg-[#e7dcc3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: i === 0 ? C.orange : C.creamAlt }}
                  aria-hidden="true"
                >
                  {i === 0 ? (
                    <Waves size={16} color={C.cream} />
                  ) : (
                    <Waves size={15} color={C.soga} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-semibold" style={head}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchThread value={o.match} />
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.inkSoft }}
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

function MatchThread({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: strong ? C.orange : C.inkSoft }}
      >
        {value}%
      </span>
      <span
        className="hidden h-1.5 w-14 overflow-hidden rounded-full sm:block"
        style={{ background: C.lineSoft }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: strong ? C.orange : C.indigo }}
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
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>De marktlap</Overline>
          <h1
            className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.01em]"
            style={head}
          >
            Open opdrachten
          </h1>
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          patronen
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ border: `1px solid ${C.line}`, background: C.card }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9a835f]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded-full px-4 py-2 text-[12px] font-medium uppercase tracking-[0.06em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.indigo, color: C.cream, ...body }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...body }
                }
              >
                {s === "match" ? "Op match" : "Op tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel pattern={kawung} className="p-0">
          <div className="flex flex-col items-center py-16 text-center">
            <Flower2 size={44} aria-hidden="true" style={{ color: C.faint }} />
            <p className="mt-4 text-[28px] font-semibold" style={head}>
              Geen patroon gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen lap past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om de marktlap
              opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.indigo, color: C.cream, ...body }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtLap opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtLap({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Panel pattern={index % 2 === 0 ? parang : kawung} className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${C.line}`, ...body }}
          aria-hidden="true"
        >
          <span className="text-[11px] font-semibold" style={{ color: C.orange }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </span>
        <div className="min-w-0">
          <h3 className="text-[20px] font-semibold leading-snug" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DyeMedallion value={opdracht.match} size={60} />
          <span className="text-[14px] font-medium" style={{ color: C.inkSoft }}>
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
          className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.orange }}
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
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.indigo }}>
                Sterke draad
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.indigo }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.danger }}>
                Losse draad
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
                      style={{ color: C.danger }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar de marktlap
      </button>

      <Panel className="p-0">
        <div className="relative overflow-hidden" style={{ background: C.indigo }}>
          <div
            className="absolute inset-0"
            style={{ ...parang, opacity: 0.35 }}
            aria-hidden="true"
          />
          <Craquele seed={opdracht.match} opacity={0.16} />
          <div className="relative p-6 md:p-8" style={{ color: C.cream }}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] tracking-[0.1em]" style={{ color: C.orangeSoft }}>
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.orange, color: C.cream }}
              >
                {opdracht.match}% match
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[42px] font-semibold leading-[1.02] tracking-[-0.01em] md:text-[54px]"
              style={head}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-3 text-[15px]" style={{ color: "rgba(239,230,210,0.82)" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.orange, color: C.cream, ...body }}
              >
                Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ color: C.cream, border: "1px solid rgba(239,230,210,0.4)", ...body }}
              >
                Bewaar patroon
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} pattern={kawung} className="p-4">
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={head}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Overline>Het weefpatroon · waarom deze match</Overline>
        </div>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — de sterke draden én de losse draden,
          zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Panel pattern={parang} className="p-5">
            <Overline>Sterke draad</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.indigo }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel pattern={parang} className="p-5">
            <p className="text-[10.5px] uppercase tracking-[0.3em]" style={{ color: C.danger }}>
              Losse draad
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
                    style={{ color: C.danger }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
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
      <div
        className="flex flex-wrap items-end justify-between gap-6 border-b pb-8"
        style={{ borderColor: C.line }}
      >
        <div className="max-w-md">
          <Overline>Vastgezette kleuren · authenticatie</Overline>
          <h1
            className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.01em]"
            style={head}
          >
            Certificaten
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-medium" style={{ color: C.ink }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten zijn vastgezet in het weefsel. Eén
            kleur verkleurt binnenkort en vraagt om een nieuw bad.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <DyeMedallion value={ratio} size={104} />
          <div>
            <p
              className="text-[48px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={head}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: C.faint }}
            >
              vastgezet
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel pattern={kawung} className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${st.tone}` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={15} style={{ color: st.tone }} />
                  </span>
                  <span className="min-w-0">
                    <span className="truncate text-[17px] font-semibold" style={head}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Chip tone={st.alarm ? C.danger : C.indigo}>{st.label}</Chip>
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
                    <div className="mt-3 border-t pl-12 pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: C.indigo, color: C.cream, ...body }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="rounded-full px-4 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...body }}
                        >
                          Historie
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
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
      <div className="border-b pb-6" style={{ borderColor: C.line }}>
        <Overline>Het patroonboek · volgende acties</Overline>
        <h1 className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.01em]" style={head}>
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Zet deze patronen op volgorde vast — elke afgeronde actie houdt het weefsel strak.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel pattern={parang} className="border-l-[3px] p-5">
                <div
                  className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto]"
                  style={{
                    borderLeft: `3px solid ${warn ? C.danger : C.orange}`,
                    paddingLeft: 14,
                    marginLeft: -18,
                  }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                    style={
                      warn
                        ? { background: C.danger, color: C.cream, ...body }
                        : { border: `1.5px solid ${C.indigo}`, color: C.indigo, ...body }
                    }
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <AlertTriangle size={15} aria-hidden="true" style={{ color: C.danger }} />
                      ) : (
                        <Leaf size={15} aria-hidden="true" style={{ color: C.orange }} />
                      )}
                      <h2 className="text-[18px] font-semibold leading-snug" style={head}>
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
                    className="justify-self-start rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                    style={
                      warn
                        ? { background: C.danger, color: C.cream, ...body }
                        : { border: `1px solid ${C.indigo}`, color: C.indigo, ...body }
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </Panel>
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
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Het grootboek</Overline>
          <h1
            className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.01em]"
            style={head}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.indigo, color: C.cream, ...body }}
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
          <Panel key={s.l} pattern={kawung} className="p-5">
            <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[30px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.danger : C.ink, ...head }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel pattern={parang} className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_8rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.line }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#e7dcc3] sm:grid-cols-[8rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="order-1 text-[12px] tabular-nums" style={{ color: C.faint }}>
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2"
                  style={head}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip tone={acc ? C.danger : C.indigo}>{f.status}</Chip>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.danger : C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
            Totaal betaald
          </span>
          <span className="text-[26px] font-semibold tabular-nums" style={head}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
