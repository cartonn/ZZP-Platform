"use client";

// Concept 381 — "Dampkring" · Premium-dark met atmosferische glas-diepte.
// Diep nachtblauw/inkt canvas met gelaagde aurora-sluiers (radiale verlopen), luminescente
// glas-panelen met fijne backdrop-blur en haarscherpe lichtranden, gloeiende cyaan/violet accenten.
// Rustig, duur, ruimtelijk — alle complexiteit zakt weg, alleen status + volgende actie lichten op.
// Contrast haalt WCAG-AA ondanks de donkere basis (heldere tekst op diepe grond).
// Palet: inkt-blauw (#080c1a), glas met lage witte alpha, gloed-accent cyaan (#5ee7ff) + violet (#a78bfa).
// Fonts: Space Grotesk (koppen) + IBM Plex/Space Mono (cijfers).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Sparkles,
  MapPin,
  Wallet,
  CalendarClock,
  Gauge,
  ChevronRight,
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

// — Palet: luminescent glas op diep inkt-blauw —
const C = {
  ink: "#080c1a",
  inkDeep: "#05070f",
  glass: "rgba(255,255,255,0.045)",
  glassStrong: "rgba(255,255,255,0.07)",
  glassHover: "rgba(255,255,255,0.10)",
  edge: "rgba(255,255,255,0.10)",
  edgeSoft: "rgba(255,255,255,0.06)",
  text: "#eef2fb",
  sub: "#aeb8d4",
  faint: "#7d88a8",
  cyan: "#5ee7ff",
  cyanDeep: "#2bb6d6",
  violet: "#a78bfa",
  amber: "#fbbf6b",
  rose: "#fb7185",
  green: "#6ee7b7",
};

const head = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, tone: C.cyan };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, alarm: true, tone: C.rose };
  }
}

// — Atmosferische aurora-sluier achter alles —
function AuroraVeil() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-[10%] -top-[20%] h-[520px] w-[520px] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(94,231,255,0.18), transparent 70%)" }}
      />
      <div
        className="absolute right-[-8%] top-[6%] h-[460px] w-[460px] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.20), transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-18%] left-[28%] h-[560px] w-[560px] rounded-full blur-[150px]"
        style={{ background: "radial-gradient(circle, rgba(43,182,214,0.12), transparent 72%)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 100% at 50% -10%, transparent 40%, rgba(5,7,15,0.65) 100%)",
        }}
      />
    </div>
  );
}

// — Luminescent glas-paneel met lichtrand —
function Glass({
  children,
  className = "",
  glow = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`relative rounded-2xl ${className}`}
      style={{
        background: glow ? C.glassStrong : C.glass,
        border: `1px solid ${C.edge}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: glow
          ? "inset 0 1px 0 rgba(255,255,255,0.14), 0 24px 60px -30px rgba(94,231,255,0.28)"
          : "inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 50px -34px rgba(0,0,0,0.8)",
      }}
    >
      {children}
    </Tag>
  );
}

function Overline({ children, tone = C.cyan }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.32em]"
      style={{ color: tone, ...mono }}
    >
      {children}
    </p>
  );
}

function Chip({
  children,
  tone = C.sub,
  alarm = false,
}: {
  children: React.ReactNode;
  tone?: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        color: alarm ? C.ink : tone,
        background: alarm ? tone : "rgba(255,255,255,0.05)",
        border: alarm ? "none" : `1px solid ${C.edgeSoft}`,
        ...body,
      }}
    >
      {children}
    </span>
  );
}

// — Gloeiende sparkline met verloop-vulling —
function GlowSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const id = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 5px ${tone}88)` }}
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={tone} />
    </svg>
  );
}

// — Ronde gloei-meter voor match / ratio —
function Ring({
  value,
  size = 64,
  tone = C.cyan,
}: {
  value: number;
  size?: number;
  tone?: string;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.edge} strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 4px ${tone}aa)`,
            transition: "stroke-dashoffset .6s ease",
          }}
        />
      </svg>
      <span
        className="absolute text-[13px] font-semibold tabular-nums"
        style={{ color: C.text, ...mono }}
      >
        {value}
      </span>
    </span>
  );
}

const btnGlow: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(94,231,255,0.95), rgba(43,182,214,0.95))",
  color: "#04121a",
  boxShadow: "0 12px 30px -12px rgba(94,231,255,0.6)",
};

const btnGhost: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  color: C.text,
  border: `1px solid ${C.edge}`,
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ee7ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c1a]";

export function Concept381() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.text, background: C.ink }}
    >
      <AuroraVeil />
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
    <header className="flex items-center justify-between pt-6">
      <div className="flex items-center gap-3.5">
        <span
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(150deg, rgba(94,231,255,0.9), rgba(167,139,250,0.9))",
            boxShadow: "0 12px 30px -12px rgba(94,231,255,0.7)",
          }}
          aria-hidden="true"
        >
          <Sparkles size={19} color="#04121a" />
        </span>
        <div>
          <p className="text-[20px] font-semibold leading-none tracking-[-0.01em]" style={head}>
            Dampkring
          </p>
          <p
            className="mt-1 text-[10.5px] uppercase leading-none tracking-[0.24em]"
            style={{ color: C.faint, ...mono }}
          >
            Verificatie · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
          style={{
            color: C.cyan,
            background: "rgba(94,231,255,0.10)",
            border: "1px solid rgba(94,231,255,0.30)",
            ...body,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.text }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px]" style={{ color: C.faint }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{
            background: C.glassStrong,
            border: `1px solid ${C.edge}`,
            color: C.cyan,
            ...mono,
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
    <nav className="mt-6" aria-label="Hoofdnavigatie">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5"
        style={{
          background: C.glass,
          border: `1px solid ${C.edgeSoft}`,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className={`relative shrink-0 rounded-xl px-4 py-2 text-[13px] font-medium transition-all motion-reduce:transition-none ${focusRing}`}
              style={{
                color: on ? "#04121a" : C.sub,
                background: on
                  ? "linear-gradient(135deg, rgba(94,231,255,0.95), rgba(43,182,214,0.95))"
                  : "transparent",
                boxShadow: on ? "0 10px 24px -12px rgba(94,231,255,0.6)" : "none",
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
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="self-center">
          <Overline>Vandaag · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[40px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[52px]"
            style={head}
          >
            Goedemorgen,
            <br />
            <span
              style={{
                background: "linear-gradient(120deg, #5ee7ff, #a78bfa)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {PROFIEL.naam.split(" ")[0]}.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.sub }}>
            De lucht is helder. Je profiel is geverifieerd en drie opdrachten lichten vandaag boven
            85% op. Handel eerst wat aandacht vraagt af.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={onActies}
              className={`group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
              style={btnGlow}
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
              style={btnGhost}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: C.cyan }}
                aria-hidden="true"
              />
              {ongelezen} nieuwe berichten
            </span>
          </div>
        </div>

        <Glass glow className="p-6">
          <div className="flex items-center justify-between">
            <Overline tone={C.amber}>Prioriteit</Overline>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{
                background: "rgba(251,191,107,0.14)",
                border: "1px solid rgba(251,191,107,0.3)",
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={16} style={{ color: C.amber }} />
            </span>
          </div>
          <h2 className="mt-4 text-[22px] font-semibold leading-snug" style={head}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
            {primair.detail}
          </p>
          <button
            onClick={onActies}
            className={`group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
            style={{ background: C.amber, color: "#1a1206" }}
          >
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Glass>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Kerncijfers · deze maand</Overline>
          <span
            className="text-[11px] uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            live
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? C.cyan : C.amber;
            return (
              <Glass key={k.label} className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: C.faint }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ color: tone, ...mono }}
                  >
                    {k.up ? (
                      <ArrowUpRight size={12} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={12} aria-hidden="true" />
                    )}
                    {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]"
                  style={{ ...head }}
                >
                  {k.value}
                </p>
                <div className="mt-4">
                  <GlowSpark data={k.spark} tone={tone} />
                </div>
              </Glass>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Open opdrachten</Overline>
          <button
            onClick={onOpen}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-[#5ee7ff] ${focusRing}`}
            style={{ color: C.cyan, ...mono }}
          >
            Marktplaats <ChevronRight size={13} aria-hidden="true" />
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl p-4 text-left transition-all motion-reduce:transition-none ${focusRing}`}
                style={{ background: C.glass, border: `1px solid ${C.edgeSoft}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.glassHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.glass)}
              >
                <Ring value={o.match} size={54} tone={o.match >= 90 ? C.cyan : C.violet} />
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-semibold" style={head}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.sub }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  style={{ color: C.faint }}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
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
    <div className="space-y-7">
      <div>
        <Overline>De marktplaats</Overline>
        <h1 className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.01em]" style={head}>
          Open opdrachten
        </h1>
        <p className="mt-3 max-w-lg text-[14px]" style={{ color: C.sub }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten binnen je bereik en
          verificatieniveau.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.glass, border: `1px solid ${C.edge}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: C.text, ...body }}
          />
        </div>
        <div
          className="flex items-center gap-1 rounded-full p-1"
          role="group"
          aria-label="Sorteren"
          style={{ background: C.glass, border: `1px solid ${C.edgeSoft}` }}
        >
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-all motion-reduce:transition-none ${focusRing}`}
                style={{
                  color: on ? "#04121a" : C.sub,
                  background: on
                    ? "linear-gradient(135deg, rgba(94,231,255,0.95), rgba(43,182,214,0.95))"
                    : "transparent",
                }}
              >
                {s === "match" ? "Op match" : "Op tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Glass className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "rgba(94,231,255,0.08)",
                border: "1px solid rgba(94,231,255,0.24)",
              }}
              aria-hidden="true"
            >
              <Search size={26} style={{ color: C.cyan }} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={head}>
              Geen opdracht gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.sub }}>
              Niets past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm of wis het filter.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
              style={btnGlow}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Glass>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({
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
    <Glass className="p-5" glow={index === 0}>
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <Ring value={opdracht.match} size={62} tone={strong ? C.cyan : C.violet} />
        <div className="min-w-0">
          <h3 className="text-[19px] font-semibold leading-snug" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[18px] font-semibold" style={{ color: C.text, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[11px]" style={{ color: C.faint }}>
            per uur
          </span>
        </div>
      </div>
      <div
        className="mt-4 flex items-center gap-4 border-t pt-3"
        style={{ borderColor: C.edgeSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-medium transition-colors ${focusRing}`}
          style={{ color: C.sub }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-semibold transition-colors hover:text-[#5ee7ff] ${focusRing}`}
          style={{ color: C.cyan }}
        >
          Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
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
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.green, ...mono }}
              >
                Pluspunten
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.sub }}
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
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.amber, ...mono }}
              >
                Aandachtspunten
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.sub }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.amber }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Glass>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const meta = [
    { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
    { l: "Omvang", v: opdracht.uren, Icon: Gauge },
    { l: "Start", v: opdracht.start, Icon: CalendarClock },
    { l: "Match", v: `${opdracht.match}%`, Icon: MapPin },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.12em] transition-colors hover:text-[#5ee7ff] ${focusRing}`}
        style={{ color: C.faint, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Glass glow className="overflow-hidden p-7 md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] tracking-[0.1em]" style={{ color: C.faint, ...mono }}>
            {opdracht.id}
          </span>
          <Chip tone={C.cyan}>
            <ShieldCheck size={12} aria-hidden="true" /> {opdracht.match}% match
          </Chip>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[44px]"
          style={head}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: C.sub }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
            style={btnGlow}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
            style={btnGhost}
          >
            Bewaar
          </button>
        </div>
      </Glass>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {meta.map((m) => (
          <Glass key={m.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "rgba(94,231,255,0.10)",
                border: "1px solid rgba(94,231,255,0.22)",
              }}
              aria-hidden="true"
            >
              <m.Icon size={15} style={{ color: C.cyan }} />
            </span>
            <p className="mt-3 text-[10px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p className="mt-1 text-[19px] font-semibold tracking-[-0.01em]" style={{ ...mono }}>
              {m.v}
            </p>
          </Glass>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: C.sub }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én waar je op moet
          letten, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Glass className="p-5">
            <Overline tone={C.green}>Pluspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px] first:border-t-0 first:pt-0"
                  style={{ borderColor: C.edgeSoft, color: C.text }}
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
          </Glass>
          <Glass className="p-5">
            <Overline tone={C.amber}>Aandachtspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px] first:border-t-0 first:pt-0"
                  style={{ borderColor: C.edgeSoft, color: C.sub }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
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
    <div className="space-y-7">
      <Glass glow className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Verificatie · vertrouwensniveau</Overline>
            <h1
              className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
              style={head}
            >
              Certificaten
            </h1>
            <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: C.sub }}>
              <span className="font-semibold" style={{ color: C.text }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Ring value={ratio} size={92} tone={C.cyan} />
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
                Geverifieerd
              </p>
              <p className="text-[14px]" style={{ color: C.sub }}>
                {verified}/{CREDENTIALS.length} documenten
              </p>
            </div>
          </div>
        </div>
      </Glass>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Glass className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left ${focusRing}`}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: `${st.tone}1f`, border: `1px solid ${st.tone}55` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} style={{ color: st.tone }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-semibold" style={head}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.sub }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Chip tone={st.tone} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.faint, transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}
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
                    <div className="mt-3 border-t pl-14 pt-3" style={{ borderColor: C.edgeSoft }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.sub }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en pas na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all ${focusRing}`}
                          style={st.alarm ? { background: st.tone, color: "#1a1206" } : btnGlow}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition-all ${focusRing}`}
                          style={btnGhost}
                        >
                          Historie
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-7">
      <div>
        <Overline>Volgende acties</Overline>
        <h1 className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]" style={head}>
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.sub }}>
          Op volgorde van urgentie. Handel het bovenste eerst af om verifieerbaar en zichtbaar te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.cyan;
          return (
            <li key={a.titel}>
              <Glass className="p-5" glow={warn}>
                <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-[15px] font-semibold tabular-nums"
                    style={{
                      background: `${tone}1f`,
                      border: `1px solid ${tone}55`,
                      color: tone,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <AlertTriangle size={15} aria-hidden="true" style={{ color: tone }} />
                      ) : (
                        <Sparkles size={15} aria-hidden="true" style={{ color: tone }} />
                      )}
                      <h2 className="text-[17px] font-semibold leading-snug" style={head}>
                        {a.titel}
                      </h2>
                    </div>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.sub }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className={`justify-self-start rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all motion-reduce:transition-none sm:justify-self-end ${focusRing}`}
                    style={warn ? { background: tone, color: "#1a1206" } : btnGlow}
                  >
                    {a.cta}
                  </button>
                </div>
              </Glass>
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
  const sums = [
    { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.green, alarm: false },
    { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.amber, alarm: true },
    { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.cyan, alarm: false },
  ];
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={head}
          >
            Facturen
          </h1>
        </div>
        <button
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
          style={btnGlow}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sums.map((s) => (
          <Glass key={s.l} className="p-5" glow={s.alarm}>
            <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tracking-[-0.02em]"
              style={{ color: s.alarm ? s.tone : C.text, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 border-b pb-3 sm:grid"
          style={{ borderColor: C.edge }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors last:border-b-0 sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderColor: C.edgeSoft }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
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
                  style={{ color: C.sub, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip tone={acc ? C.amber : C.green} alarm={acc}>
                    {acc ? (
                      <AlertTriangle size={11} aria-hidden="true" />
                    ) : (
                      <Check size={11} aria-hidden="true" />
                    )}
                    {f.status}
                  </Chip>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.amber : C.text, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between border-t pt-5"
          style={{ borderColor: C.edge }}
        >
          <span
            className="text-[10.5px] uppercase tracking-[0.2em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[24px] font-semibold tabular-nums"
            style={{ ...mono, color: C.cyan }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Glass>
    </div>
  );
}
