"use client";

// Concept 384 — "Majolica" · Warm-menselijk geglazuurd aardewerk.
// Handgemaakte keramiek-tegels met zachte glazuur-glans: warme terracotta, diep kobaltblauw en
// crème op een crème-basis. Ronde vormen, subtiele tegel-patronen als decoratie (nooit druk),
// tactiel en uitnodigend — vertrouwenwekkend rond gevoelige documenten. Elke kaart voelt als een
// geglazuurde tegel met zachte hoogtelicht-rand. Status altijd label + icoon, nooit alleen kleur.
// Palet: crème #f4ece0 / kobalt #2a4d8f / terracotta #c2683c / diep-glazuur #21365f.
// Fonts: Fraunces (koppen), Plus Jakarta Sans (body).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Sparkles,
  Mail,
  FileText,
  ChevronDown,
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

// — Palet: geglazuurd aardewerk —
const C = {
  cream: "#f4ece0",
  creamDeep: "#ece0cd",
  glaze: "#faf4ea", // tegel-oppervlak (crème glazuur)
  glazeAlt: "#f6eddd",
  ink: "#2c2417",
  inkSoft: "#5a4f3d",
  muted: "#8a7c65",
  faint: "#a99a80",
  line: "rgba(44,36,23,0.14)",
  lineSoft: "rgba(44,36,23,0.08)",
  cobalt: "#2a4d8f",
  cobaltDeep: "#21365f",
  cobaltSoft: "#7f97c4",
  terra: "#c2683c",
  terraDeep: "#a9502a",
  terraSoft: "#e0a988",
  glassTop: "rgba(255,255,255,0.6)",
};

const head = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geglazuurd", Icon: ShieldCheck, alarm: false, tone: C.cobalt };
    case "SUBMITTED":
      return { label: "In de oven", Icon: Clock, alarm: false, tone: C.muted };
    case "EXPIRING":
      return { label: "Craquelé", Icon: AlertTriangle, alarm: true, tone: C.terra };
    case "REJECTED":
      return { label: "Gebroken", Icon: AlertTriangle, alarm: true, tone: C.terraDeep };
  }
}

// — Zacht keramiek-tegelpatroon voor achtergrond-decoratie (subtiel) —
function TilePattern({ tone = C.cobaltSoft, opacity = 0.12 }: { tone?: string; opacity?: number }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      style={{ opacity }}
    >
      <defs>
        <pattern id="majTile" width="52" height="52" patternUnits="userSpaceOnUse">
          <path
            d="M26 4 C36 4 48 16 48 26 C48 36 36 48 26 48 C16 48 4 36 4 26 C4 16 16 4 26 4 Z"
            fill="none"
            stroke={tone}
            strokeWidth="1.2"
          />
          <circle cx="26" cy="26" r="4" fill="none" stroke={tone} strokeWidth="1" />
          <path
            d="M26 0 L26 8 M26 44 L26 52 M0 26 L8 26 M44 26 L52 26"
            stroke={tone}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#majTile)" />
    </svg>
  );
}

// — Geglazuurde tegel-container met zachte hoogtelicht-rand —
function Tile({
  children,
  className = "",
  pattern = false,
  tone = C.cobaltSoft,
}: {
  children: React.ReactNode;
  className?: string;
  pattern?: boolean;
  tone?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] ${className}`}
      style={{
        background: `linear-gradient(155deg, ${C.glassTop}, transparent 42%), ${C.glaze}`,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 10px 26px -20px rgba(44,36,23,0.5)",
      }}
    >
      {pattern && <TilePattern tone={tone} opacity={0.1} />}
      <div className="relative">{children}</div>
    </div>
  );
}

// — Geglazuurde sparkline: zacht verlopende lijn met glans-vlak —
function GlazeSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points={area} fill={tone} opacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Overline({ children, tone = C.terra }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.26em]"
      style={{ color: tone, ...body }}
    >
      {children}
    </p>
  );
}

function Chip({
  children,
  tone = C.cobalt,
  solid = false,
}: {
  children: React.ReactNode;
  tone?: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={
        solid
          ? { background: tone, color: "#fff", ...body }
          : {
              color: tone,
              background: "rgba(42,77,143,0.09)",
              border: `1px solid ${tone}33`,
              ...body,
            }
      }
    >
      {children}
    </span>
  );
}

// — Match-diagram: geglazuurd ronde meter —
function MatchGlaze({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.terra : C.cobalt;
  const r = 15;
  const circ = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke={C.lineSoft} strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (value / 100) * circ}
        />
      </svg>
      <span
        className="absolute text-[11px] font-bold tabular-nums"
        style={{ color: tone, ...body }}
      >
        {value}
      </span>
    </span>
  );
}

export function Concept384() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.cream }}
    >
      {/* zacht glazuur-schijnsel */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(1100px 460px at 78% -8%, rgba(42,77,143,0.08), transparent 60%), radial-gradient(760px 380px at 4% 8%, rgba(194,104,60,0.08), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-7">
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
          className="relative flex h-12 w-12 items-center justify-center rounded-[16px]"
          style={{
            background: `linear-gradient(150deg, ${C.terra}, ${C.terraDeep})`,
            boxShadow: "0 2px 0 rgba(255,255,255,0.4) inset, 0 8px 18px -10px rgba(169,80,42,0.8)",
          }}
          aria-hidden="true"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: C.cobalt }}
          >
            <Sparkles size={15} color="#fff" />
          </span>
        </span>
        <div>
          <p
            className="text-[24px] font-semibold leading-none tracking-[-0.01em]"
            style={{ ...head, color: C.ink }}
          >
            Majolica
          </p>
          <p
            className="mt-1 text-[10.5px] uppercase leading-none tracking-[0.22em]"
            style={{ color: C.faint, ...body }}
          >
            Geglazuurd vertrouwen · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.cobalt,
            background: "rgba(42,77,143,0.08)",
            border: `1px solid ${C.cobalt}30`,
            ...body,
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
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
          className="flex h-11 w-11 items-center justify-center rounded-[15px] text-[13px] font-bold text-white"
          style={{
            background: `linear-gradient(150deg, ${C.cobalt}, ${C.cobaltDeep})`,
            boxShadow: "0 2px 0 rgba(255,255,255,0.35) inset",
            ...body,
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
    <nav
      className="mt-6 flex items-center gap-1.5 overflow-x-auto rounded-[18px] p-1.5"
      aria-label="Hoofdnavigatie"
      style={{ background: C.creamDeep, border: `1px solid ${C.line}` }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="shrink-0 rounded-[13px] px-4 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
            style={
              on
                ? {
                    background: C.glaze,
                    color: C.cobalt,
                    boxShadow:
                      "0 1px 0 rgba(255,255,255,0.7) inset, 0 6px 14px -10px rgba(44,36,23,0.6)",
                    ...body,
                  }
                : { color: C.muted, ...body }
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
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Tile className="p-7 md:p-9" pattern tone={C.cobaltSoft}>
          <Overline>Werkplaats · Vandaag</Overline>
          <h1
            className="mt-4 text-[40px] font-semibold leading-[1] tracking-[-0.015em] md:text-[52px]"
            style={{ ...head, color: C.ink }}
          >
            Goedemorgen,
            <br />
            <span style={{ color: C.terra }}>{PROFIEL.naam.split(" ")[0]}.</span>
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Elke tegel op zijn plek. Je profiel glanst, drie matches wachten en één certificaat
            vraagt om een nieuwe glazuurlaag.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onActies}
              className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
              style={{
                background: `linear-gradient(150deg, ${C.terra}, ${C.terraDeep})`,
                boxShadow: "0 2px 0 rgba(255,255,255,0.35) inset",
                ...body,
              }}
            >
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium"
              style={{ color: C.cobalt, background: "rgba(42,77,143,0.08)", ...body }}
            >
              <Mail size={14} aria-hidden="true" />
              {ongelezen} nieuwe berichten
            </span>
          </div>
        </Tile>

        <Tile className="flex flex-col p-6" tone={C.terraSoft} pattern>
          <div className="flex items-center justify-between">
            <Overline tone={C.cobalt}>Fijnste match</Overline>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: C.terra }}
              aria-hidden="true"
            >
              <AlertTriangle size={14} color="#fff" />
            </span>
          </div>
          <h2
            className="mt-3 text-[22px] font-semibold leading-snug"
            style={{ ...head, color: C.ink }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <button
            onClick={onActies}
            className="group mt-5 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
            style={{
              color: C.cobalt,
              background: C.glazeAlt,
              border: `1px solid ${C.cobalt}33`,
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
        </Tile>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Deze maand</Overline>
          <span className="text-[11px]" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Tile key={k.label} className="p-5">
              <div className="flex items-start justify-between">
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.08em]"
                  style={{ color: C.muted }}
                >
                  {k.label}
                </p>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.cobalt : C.terra,
                    background: k.up ? "rgba(42,77,143,0.1)" : "rgba(194,104,60,0.12)",
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={{ ...head, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <GlazeSpark data={k.spark} tone={k.up ? C.cobalt : C.terra} />
              </div>
            </Tile>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Open opdrachten</Overline>
          <button
            onClick={onOpen}
            className="rounded-full px-2 text-[12px] font-semibold transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.terra }}
          >
            Alle opdrachten
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[18px] p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{
                  background: C.glaze,
                  border: `1px solid ${C.line}`,
                  boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
                }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-[13px] text-[13px] font-bold text-white"
                  style={{ background: i === 0 ? C.terra : C.cobalt, ...body }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[16px] font-semibold"
                    style={{ ...head, color: C.ink }}
                  >
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchGlaze value={o.match} />
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.faint }}
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
    <div className="space-y-6">
      <div>
        <Overline>Het tegelvel</Overline>
        <h1
          className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.015em]"
          style={{ ...head, color: C.ink }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
          {filtered.length} van {OPDRACHTEN.length} matches, elk transparant onderbouwd.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.glaze, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a99a80]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div
          className="flex items-center gap-1 rounded-full p-1"
          role="group"
          aria-label="Sorteren"
          style={{ background: C.creamDeep, border: `1px solid ${C.line}` }}
        >
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
                style={
                  on
                    ? {
                        background: C.glaze,
                        color: C.cobalt,
                        boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset",
                        ...body,
                      }
                    : { color: C.muted, ...body }
                }
              >
                {s === "match" ? "Op match" : "Op tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Tile className="p-0" pattern tone={C.cobaltSoft}>
          <div className="flex flex-col items-center py-16 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-[20px]"
              style={{ background: C.glazeAlt, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Search size={28} style={{ color: C.faint }} />
            </span>
            <p className="mt-5 text-[24px] font-semibold" style={{ ...head, color: C.ink }}>
              Geen tegel gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om het vel
              opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.cobalt, ...body }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Tile>
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
  return (
    <Tile className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span
          className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-[14px] text-[14px] font-bold text-white"
          style={{ background: index === 0 ? C.terra : C.cobalt, ...body }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3 className="text-[19px] font-semibold leading-snug" style={{ ...head, color: C.ink }}>
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
        <div className="flex flex-col items-end gap-1.5">
          <MatchGlaze value={opdracht.match} />
          <span className="text-[14px] font-semibold" style={{ color: C.inkSoft }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="mt-4 flex items-center gap-3 border-t pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.cobalt, background: "rgba(42,77,143,0.08)" }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.terra }}
        >
          Reageer <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[16px] p-4" style={{ background: "rgba(42,77,143,0.06)" }}>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.cobalt }}
              >
                Pluspunten
              </p>
              <ul className="mt-2.5 space-y-2">
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
                      style={{ color: C.cobalt }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[16px] p-4" style={{ background: "rgba(194,104,60,0.07)" }}>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.terra }}
              >
                Aandachtspunten
              </p>
              <ul className="mt-2.5 space-y-2">
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
                      style={{ color: C.terra }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Tile>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, background: C.creamDeep }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar het vel
      </button>

      <div
        className="relative overflow-hidden rounded-[24px] p-7 text-white md:p-10"
        style={{ background: `linear-gradient(155deg, ${C.cobalt}, ${C.cobaltDeep})` }}
      >
        <TilePattern tone="#ffffff" opacity={0.09} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="text-[11px] font-semibold tracking-[0.1em]"
              style={{ color: C.cobaltSoft }}
            >
              {opdracht.id}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-bold"
              style={{ background: C.terra, color: "#fff" }}
            >
              {opdracht.match}% match
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[36px] font-semibold leading-[1.05] tracking-[-0.015em] md:text-[48px]"
            style={head}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: "rgba(255,255,255,0.82)" }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold text-white transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.terra, ...body }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.35)", ...body }}
            >
              Bewaar tegel
            </button>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Tile key={m.l} className="p-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[21px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ ...head, color: C.ink }}
            >
              {m.v}
            </p>
          </Tile>
        ))}
      </section>

      <section>
        <Overline>De onderbouwing</Overline>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant opgebouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Tile className="p-5" pattern tone={C.cobaltSoft}>
            <Overline tone={C.cobalt}>Pluspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(42,77,143,0.14)" }}
                    aria-hidden="true"
                  >
                    <Check size={12} style={{ color: C.cobalt }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Tile>
          <Tile className="p-5" pattern tone={C.terraSoft}>
            <Overline tone={C.terra}>Aandachtspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(194,104,60,0.16)" }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={11} style={{ color: C.terra }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Tile>
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
    <div className="space-y-6">
      <Tile className="p-6 md:p-8" pattern tone={C.cobaltSoft}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <Overline>Bewijs · authenticatie</Overline>
            <h1
              className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.015em]"
              style={{ ...head, color: C.ink }}
            >
              Certificaten
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.cobalt }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten glanzen geverifieerd. Eén craqueleert
              binnenkort en vraagt om een nieuwe laag.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="relative inline-flex items-center justify-center" aria-hidden="true">
              <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
                <circle cx="42" cy="42" r="34" fill="none" stroke={C.lineSoft} strokeWidth="7" />
                <circle
                  cx="42"
                  cy="42"
                  r="34"
                  fill="none"
                  stroke={C.cobalt}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 - (ratio / 100) * 2 * Math.PI * 34}
                />
              </svg>
              <span
                className="absolute text-[20px] font-bold tabular-nums"
                style={{ color: C.cobalt, ...head }}
              >
                {ratio}
              </span>
            </span>
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint }}
              >
                Geverifieerd
              </p>
              <p className="text-[13px]" style={{ color: C.muted }}>
                {verified}/{CREDENTIALS.length} certificaten
              </p>
            </div>
          </div>
        </div>
      </Tile>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Tile className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                    style={{ background: `${st.tone}18`, border: `1px solid ${st.tone}40` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} style={{ color: st.tone }} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="truncate text-[16px] font-semibold"
                      style={{ ...head, color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
                      style={{
                        color: st.tone,
                        background: `${st.tone}14`,
                        border: `1px solid ${st.tone}30`,
                      }}
                    >
                      <st.Icon size={12} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.faint, transform: isOpen ? "rotate(180deg)" : "none" }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="mt-3 border-t pl-[3.75rem] pt-3"
                      style={{ borderColor: C.lineSoft }}
                    >
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: st.alarm ? C.terra : C.cobalt, ...body }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            color: C.inkSoft,
                            background: C.glazeAlt,
                            border: `1px solid ${C.line}`,
                            ...body,
                          }}
                        >
                          Historie
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Tile>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Overline>Volgende acties</Overline>
        <h1
          className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.015em]"
          style={{ ...head, color: C.ink }}
        >
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[14px]" style={{ color: C.muted }}>
          Werk deze op volgorde af — elke afgeronde stap houdt je profiel geglazuurd.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.terra : C.cobalt;
          return (
            <li key={a.titel}>
              <Tile className="p-5">
                <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-[15px] text-[16px] font-bold text-white"
                    style={{ background: tone, ...body }}
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
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: tone, background: `${tone}16` }}
                      >
                        {warn ? "Urgent" : "Aanbevolen"}
                      </span>
                    </div>
                    <h2
                      className="mt-1.5 text-[18px] font-semibold leading-snug"
                      style={{ ...head, color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="justify-self-start rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                    style={{ background: tone, ...body }}
                  >
                    {a.cta}
                  </button>
                </div>
              </Tile>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Het grootboek</Overline>
          <h1
            className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.015em]"
            style={{ ...head, color: C.ink }}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.cobalt, ...body }}
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
          <Tile key={s.l} className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.terra : C.ink, ...head }}
            >
              {s.v}
            </p>
            <p
              className="mt-1 flex items-center gap-1.5 text-[12px]"
              style={{ color: s.alarm ? C.terraDeep : C.faint }}
            >
              {s.alarm && <AlertTriangle size={12} aria-hidden="true" />}
              {s.sub}
            </p>
          </Tile>
        ))}
      </section>

      <Tile className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_8rem_6rem] gap-4 border-b pb-2.5 sm:grid"
          style={{ borderColor: C.line }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-3.5 transition-colors hover:bg-[rgba(42,77,143,0.04)] sm:grid-cols-[8rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] font-medium tabular-nums"
                  style={{ color: C.faint }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2"
                  style={{ ...head, color: C.ink }}
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
                  <Chip
                    tone={acc ? C.terra : f.status === "Betaald" ? C.cobalt : C.muted}
                    solid={acc}
                  >
                    {acc && <AlertTriangle size={11} aria-hidden="true" />}
                    {f.status}
                  </Chip>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.terra : C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-4">
          <span
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            <FileText size={12} aria-hidden="true" /> Totaal betaald
          </span>
          <span
            className="text-[24px] font-semibold tabular-nums"
            style={{ ...head, color: C.ink }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Tile>
    </div>
  );
}
