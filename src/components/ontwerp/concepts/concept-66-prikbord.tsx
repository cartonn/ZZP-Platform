"use client";

// Concept 66 — "Prikbord" · skeuomorfisch prikbord / scrapbook.
// Kurk-textuur ondergrond, opgeprikte indexkaartjes en post-its met lichte rotatie en slagschaduw,
// washi-tape-hoekjes, punaises en rode-draad-verbindingen (SVG) tussen gerelateerde items
// (opdracht ↔ vereist certificaat). Tactiel en menselijk — het bureau van de ZZP'er — maar de
// content zelf crisp, leesbaar en professioneel, geen rommel.
// Onderscheidend van Schetsboek (hand-getekend) en Textiel (stof/stiksel): dit is een fysiek
// prikbord met kaartjes, tape en draad.
// Palet: kurk #d8b98a / #e2c9a0, ink #33291b, kaart-wit #fbf7ee, punaise-rood #d4483b, teal #3f6f7a.
// Fonts: --font-lab-newsreader (kop) + --font-lab-space (body).

import { useEffect, useState } from "react";
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
  cork: "#d8b98a",
  corkHi: "#e2c9a0",
  corkLo: "#c9a877",
  card: "#fbf7ee",
  cardAlt: "#fff9e6",
  ink: "#33291b",
  muted: "#6b5c46",
  faint: "#93826a",
  red: "#d4483b",
  teal: "#3f6f7a",
  green: "#4f7a3f",
  amber: "#c98a2b",
  line: "#e3dcc9",
};

const heading = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-space)" };

// Kurk-textuur via gestapelde radiale spikkels.
const corkBg = `
  radial-gradient(circle at 20% 30%, ${C.corkHi}55 0 2px, transparent 3px),
  radial-gradient(circle at 60% 70%, ${C.corkLo}55 0 2px, transparent 3px),
  radial-gradient(circle at 80% 20%, ${C.corkLo}44 0 1.5px, transparent 2.5px),
  radial-gradient(circle at 40% 85%, ${C.corkHi}44 0 1.5px, transparent 2.5px),
  ${C.cork}
`;
const corkSize = "22px 22px, 26px 26px, 18px 18px, 30px 30px, auto";

function eur(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const credMeta: Record<CredStatus, { label: string; tint: string; sym: string }> = {
  VERIFIED: { label: "Geverifieerd", tint: C.green, sym: "✓" },
  SUBMITTED: { label: "In beoordeling", tint: C.teal, sym: "◔" },
  EXPIRING: { label: "Verloopt bijna", tint: C.amber, sym: "◑" },
  REJECTED: { label: "Afgewezen", tint: C.red, sym: "✕" },
};

const CARD_SHADOW = "0 8px 18px rgba(51,41,27,0.22), 0 2px 4px rgba(51,41,27,0.14)";

function Pin({ color = C.red, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="drop-shadow">
      <circle cx={8} cy={7} r={5.5} fill={color} />
      <circle cx={6.2} cy={5.2} r={1.6} fill="#fff" opacity={0.7} />
      <rect x={7.3} y={11} width={1.4} height={4} rx={0.7} fill="#5b4a33" />
    </svg>
  );
}

function Tape({ className = "", rotate = -6 }: { className?: string; rotate?: number }) {
  return (
    <span
      className={`pointer-events-none absolute h-5 w-16 ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(200,190,150,0.35))",
        border: "1px solid rgba(120,110,80,0.25)",
        transform: `rotate(${rotate}deg)`,
      }}
      aria-hidden="true"
    />
  );
}

// Herbruikbaar opgeprikt kaartje.
function Card({
  children,
  className = "",
  rotate = 0,
  tint = C.card,
  pin = true,
  pinColor = C.red,
  tape = false,
}: {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  tint?: string;
  pin?: boolean;
  pinColor?: string;
  tape?: boolean;
}) {
  return (
    <div className={`relative ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
      {pin && (
        <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
          <Pin color={pinColor} size={18} />
        </span>
      )}
      {tape && (
        <>
          <Tape className="-left-3 -top-2 z-10" rotate={-8} />
          <Tape className="-right-3 -top-2 z-10" rotate={9} />
        </>
      )}
      <div style={{ background: tint, boxShadow: CARD_SHADOW, border: `1px solid ${C.line}` }}>
        {children}
      </div>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{ ...body, color: C.red }}
    >
      <Pin size={13} />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[28px] font-semibold italic leading-[1.02] tracking-tight sm:text-[36px]"
      style={{ ...heading, color: C.ink }}
    >
      {children}
    </h1>
  );
}

function Chip({ label, tint, sym }: { label: string; tint: string; sym: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-bold"
      style={{ ...body, color: "#fff", background: tint }}
    >
      <span aria-hidden="true">{sym}</span>
      {label}
    </span>
  );
}

const NAV_COLOR: Record<ScreenKey, string> = {
  dashboard: C.red,
  marktplaats: C.teal,
  opdracht: C.amber,
  verificatie: C.green,
  acties: C.red,
  facturen: C.teal,
  documenten: C.amber,
  berichten: C.green,
};

export function Concept66() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: corkBg, backgroundSize: corkSize, color: C.ink }}
    >
      {/* Houten lijst-rand van het prikbord */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ boxShadow: "inset 0 0 0 10px #a9895c, inset 0 0 0 12px #8a6f45" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-[680px] flex-col p-3 sm:p-5">
        {/* Kop-kaartje + navigatie */}
        <div className="mb-5">
          <Card rotate={-0.6} className="mx-auto max-w-6xl" pin={false}>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-sm"
                  style={{ background: C.red }}
                  aria-hidden="true"
                >
                  <Pin color="#fff" size={16} />
                </span>
                <div className="leading-tight">
                  <div className="text-[17px] font-semibold italic" style={heading}>
                    Prikbord
                  </div>
                  <div
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: C.faint }}
                  >
                    ZZP · werkbureau
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-[12px] font-bold">{PROFIEL.naam}</div>
                  <div className="text-[10.5px]" style={{ color: C.green }}>
                    {PROFIEL.trust}
                  </div>
                </div>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-sm text-[12px] font-bold"
                  style={{
                    ...heading,
                    background: C.corkHi,
                    color: C.ink,
                    border: `1px solid ${C.corkLo}`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
              </div>
            </div>
            <nav
              className="flex flex-row gap-1 overflow-x-auto border-t px-3 py-2"
              style={{ borderColor: C.line }}
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="flex shrink-0 items-center gap-2 rounded-sm px-3.5 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4483b]"
                    style={{
                      color: on ? "#fff" : C.muted,
                      background: on ? NAV_COLOR[s.key] : "transparent",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: on ? "#fff" : NAV_COLOR[s.key] }}
                      aria-hidden="true"
                    />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        <div className="mx-auto w-full max-w-6xl flex-1">
          {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
          {screen === "marktplaats" && (
            <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
          )}
          {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onGo={setScreen} />}
          {screen === "facturen" && <Facturen />}
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);
  const rot = [-1.5, 1, -0.8, 1.4];
  const tints = [C.card, C.cardAlt, C.card, C.cardAlt];

  return (
    <div className="space-y-7">
      <div>
        <Kicker>Overzicht</Kicker>
        <Title>Goedendag, {PROFIEL.naam.split(" ")[0]}</Title>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          {PROFIEL.rol} · {PROFIEL.plaats}
        </p>
      </div>

      {warn && (
        <Card rotate={-0.8} tint={C.cardAlt} pinColor={C.amber}>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" role="alert">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-sm text-[15px] text-white"
              style={{ background: C.amber }}
              aria-hidden="true"
            >
              ◑
            </span>
            <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
              <span className="font-semibold italic" style={heading}>
                {warn.titel}.
              </span>{" "}
              {warn.detail}
            </p>
            <button
              onClick={() => onGo("verificatie")}
              className="ml-auto shrink-0 rounded-sm px-4 py-2 text-[12px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33291b]"
              style={{ background: C.red }}
            >
              {warn.cta}
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-7 pt-2 lg:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <Card key={i} rotate={rot[i]} pinColor={C.teal}>
                <div className="p-4" role="status" aria-label="Laden">
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-sm"
                    style={{ background: C.line }}
                  />
                  <span
                    className="mt-4 block h-6 w-2/3 animate-pulse rounded-sm"
                    style={{ background: C.line }}
                  />
                  <span
                    className="mt-3 block h-3 w-full animate-pulse rounded-sm"
                    style={{ background: C.line }}
                  />
                </div>
              </Card>
            ))
          : KPIS.map((k, i) => (
              <Card
                key={k.label}
                rotate={rot[i]}
                tint={tints[i]}
                pinColor={i % 2 === 0 ? C.red : C.teal}
              >
                <div className="p-4" style={{ minHeight: 118 }}>
                  <p
                    className="text-[10.5px] font-bold uppercase leading-tight tracking-[0.06em]"
                    style={{ color: C.muted }}
                  >
                    {k.label}
                  </p>
                  <p
                    className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
                    style={{ ...heading, color: C.ink }}
                  >
                    {k.value}
                  </p>
                  <p
                    className="mt-2 text-[11px] font-bold tabular-nums"
                    style={{ color: k.up ? C.green : C.red }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </p>
                </div>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-7 pt-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card rotate={-0.5} pin={false}>
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: C.line }}
            >
              <h3 className="text-[15px] font-semibold italic" style={heading}>
                Beste matches
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className="rounded-sm px-3 py-1 text-[11.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33291b]"
                style={{ background: C.teal }}
              >
                Alles
              </button>
            </div>
            <ul className="divide-y" style={{ borderColor: C.line }}>
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f3ecda] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4483b]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-[13px] font-semibold tabular-nums"
                      style={{
                        ...heading,
                        background: o.match >= 90 ? C.green : C.corkHi,
                        color: o.match >= 90 ? "#fff" : C.ink,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">{o.titel}</span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="text-[13px]" style={{ color: C.red }} aria-hidden="true">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card rotate={1} tint={C.cardAlt} pinColor={C.green}>
          <div className="border-b px-5 py-4" style={{ borderColor: C.line }}>
            <h3 className="text-[15px] font-semibold italic" style={heading}>
              Certificaten
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: C.line }}>
            {CREDENTIALS.map((c) => {
              const m = credMeta[c.status];
              return (
                <div key={c.naam} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                    {c.naam}
                  </span>
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: m.tint }}
                    aria-hidden="true"
                  >
                    {m.sym}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];
  const rot = [-1.4, 1.1, -0.7];

  return (
    <div className="space-y-6">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <Card rotate={-0.4} pin={false}>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-[14px]" style={{ color: C.teal }} aria-hidden="true">
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#93826a]"
            style={{ color: C.ink }}
          />
          <span
            className="shrink-0 text-[11.5px] font-bold tabular-nums"
            style={{ color: C.faint }}
          >
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card rotate={-0.6} tint={C.cardAlt} pin={false} tape className="mx-auto max-w-md">
          <div className="p-10 text-center">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.corkHi }}
              aria-hidden="true"
            >
              <Pin size={22} />
            </span>
            <p className="mt-4 text-[18px] font-semibold italic" style={heading}>
              Leeg prikbord
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-5 rounded-sm px-5 py-2 text-[12.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33291b]"
              style={{ background: C.teal }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o, i) => {
            const on = sel?.id === o.id;
            return (
              <Card
                key={o.id}
                rotate={rot[i % 3]}
                tint={on ? C.cardAlt : C.card}
                pinColor={i % 2 === 0 ? C.red : C.teal}
              >
                <button
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="block w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4483b]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                      style={{ color: C.faint }}
                    >
                      {o.id}
                    </span>
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-[13px] font-semibold tabular-nums"
                      style={{
                        ...heading,
                        background: o.match >= 90 ? C.green : C.corkHi,
                        color: o.match >= 90 ? "#fff" : C.ink,
                      }}
                    >
                      {o.match}
                    </span>
                  </div>
                  <p className="mt-1 text-[15px] font-bold leading-snug">{o.titel}</p>
                  <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-sm px-2 py-0.5 text-[10.5px] font-bold"
                        style={{ background: C.corkHi, color: C.ink }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="mt-3 border-t pt-2 text-[11px] font-bold"
                    style={{ borderColor: C.line, color: C.teal }}
                  >
                    {o.tarief} · {o.uren}
                  </div>
                </button>
                <div className="border-t px-4 py-2" style={{ borderColor: C.line }}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="text-[11.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4483b]"
                    style={{ color: C.red }}
                  >
                    Open opdracht →
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Opdracht-detail met rode-draad-verbinding tussen opdracht en vereist certificaat.
function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };
  const vereist = CREDENTIALS[0];

  return (
    <div className="space-y-6">
      <div>
        <Kicker>{opdracht.id}</Kicker>
        <Title>{opdracht.titel}</Title>
      </div>

      {/* Prikbord-cluster met rode draad */}
      <div className="relative">
        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden="true">
          <line
            x1="26%"
            y1="14%"
            x2="80%"
            y2="78%"
            stroke={C.red}
            strokeWidth={2}
            strokeDasharray="1 0"
            opacity={0.85}
          />
        </svg>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 pt-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card rotate={-0.8} pinColor={C.red}>
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12.5px] font-medium" style={{ color: C.muted }}>
                      {opdracht.opdrachtgever} · {opdracht.plaats}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {opdracht.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-sm px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: C.corkHi, color: C.ink }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className="h-18 w-18 flex shrink-0 flex-col items-center justify-center rounded-sm p-3"
                    style={{ background: opdracht.match >= 90 ? C.green : C.amber, color: "#fff" }}
                  >
                    <span
                      className="text-[24px] font-semibold tabular-nums leading-none"
                      style={heading}
                    >
                      {opdracht.match}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">match</span>
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { l: "Tarief", v: opdracht.tarief },
                    { l: "Omvang", v: opdracht.uren },
                    { l: "Start", v: opdracht.start },
                    { l: "Match", v: `${opdracht.match}%` },
                  ].map((m) => (
                    <div key={m.l} className="rounded-sm p-2.5" style={{ background: C.corkHi }}>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{ color: C.muted }}
                      >
                        {m.l}
                      </p>
                      <p className="mt-0.5 text-[14px] font-semibold tabular-nums" style={heading}>
                        {m.v}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={react}
                  disabled={state !== "idle"}
                  aria-live="polite"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm px-5 py-3 text-[13px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33291b] disabled:opacity-90"
                  style={{ background: state === "sent" ? C.green : C.red }}
                >
                  {state === "idle" && "Reageer op opdracht"}
                  {state === "sending" && "Versturen…"}
                  {state === "sent" && "✓ Reactie verstuurd"}
                </button>
              </div>
            </Card>
          </div>

          {/* Vereist-certificaat-kaartje aan de rode draad */}
          {vereist && (
            <div className="self-end">
              <Card rotate={2.2} tint={C.cardAlt} pin={false} tape>
                <div className="p-4">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: C.red }}
                  >
                    ✂ Verbonden — vereist
                  </p>
                  <p className="mt-2 text-[14px] font-bold">{vereist.naam}</p>
                  <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                    {vereist.detail}
                  </p>
                  <div className="mt-3">
                    <Chip
                      label={credMeta[vereist.status].label}
                      tint={credMeta[vereist.status].tint}
                      sym={credMeta[vereist.status].sym}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Card rotate={-0.4} pin={false}>
        <div className="border-b px-5 py-4" style={{ borderColor: C.line }}>
          <h3 className="text-[15px] font-semibold italic" style={heading}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="p-5 sm:border-r" style={{ borderColor: C.line }}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 shrink-0 font-bold"
                    style={{ color: C.green }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.line}` }}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <span
                    className="mt-0.5 shrink-0 font-bold"
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  >
                    ◑
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const rot = [-1.6, 1.2, -0.9, 1.5];

  return (
    <div className="space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          {verified} van {total} geverifieerd — elk kaartje is een bewijsstuk op je bord.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-8 pt-3 sm:grid-cols-2">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta[c.status];
          return (
            <Card
              key={c.naam}
              rotate={rot[i]}
              tint={i % 2 === 0 ? C.card : C.cardAlt}
              pinColor={m.tint}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold leading-snug">{c.naam}</p>
                    <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white"
                    style={{ background: m.tint }}
                    aria-hidden="true"
                  >
                    {m.sym}
                  </span>
                </div>
                <div className="mt-3">
                  <Chip label={m.label} tint={m.tint} sym={m.sym} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const rot = [-1.2, 1, -0.6];
  return (
    <div className="space-y-6">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Post-its op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-8 pt-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tint = warn ? C.amber : C.teal;
          return (
            <Card
              key={a.titel}
              rotate={rot[i % 3]}
              tint={warn ? C.cardAlt : C.card}
              pinColor={warn ? C.red : C.teal}
            >
              <div className="flex items-stretch">
                <div
                  className="flex w-14 shrink-0 flex-col items-center justify-center gap-2 text-white"
                  style={{ background: tint }}
                >
                  <span className="text-[16px] font-semibold tabular-nums" style={heading}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span aria-hidden="true">{warn ? "◑" : "◆"}</span>
                </div>
                <div className="min-w-0 flex-1 p-4">
                  <span
                    className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: tint }}
                  >
                    {warn ? "Waarschuwing" : "Notitie"}
                  </span>
                  <p className="mt-1 text-[14.5px] font-bold">{a.titel}</p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                  className="shrink-0 self-center rounded-sm px-4 py-2 text-[12px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33291b] sm:mr-4"
                  style={{ background: tint }}
                >
                  {a.cta}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card rotate={0.6} tint={C.cardAlt} pinColor={C.green}>
        <div className="flex items-center gap-4 p-4">
          <span className="text-[18px]" style={{ color: C.green }} aria-hidden="true">
            ✓
          </span>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            Verder is alles bijgewerkt. Nieuwe briefjes verschijnen automatisch op het bord.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Facturen() {
  const statusMeta: Record<string, { tint: string; sym: string }> = {
    Betaald: { tint: C.green, sym: "✓" },
    Openstaand: { tint: C.red, sym: "◑" },
    Concept: { tint: C.amber, sym: "◔" },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + eur(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + eur(f.bedrag),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-sm px-4 py-2.5 text-[12.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33291b]"
          style={{ background: C.teal }}
        >
          + Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-7 pt-2">
        <Card rotate={-1.2} pinColor={C.green}>
          <div className="p-5">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.muted }}
            >
              Ontvangen
            </p>
            <p
              className="mt-2 text-[24px] font-semibold tabular-nums"
              style={{ ...heading, color: C.green }}
            >
              € {betaald.toLocaleString("nl-NL")}
            </p>
          </div>
        </Card>
        <Card rotate={1.3} tint={C.cardAlt} pinColor={C.red}>
          <div className="p-5">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.muted }}
            >
              Openstaand
            </p>
            <p
              className="mt-2 text-[24px] font-semibold tabular-nums"
              style={{ ...heading, color: C.red }}
            >
              € {open.toLocaleString("nl-NL")}
            </p>
          </div>
        </Card>
      </div>

      <Card rotate={-0.4} pin={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3">Nummer</th>
                <th className="px-5 py-3">Klant</th>
                <th className="hidden px-5 py-3 sm:table-cell">Datum</th>
                <th className="px-5 py-3 text-right">Bedrag</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = statusMeta[f.status] ?? statusMeta.Concept!;
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                    <td className="px-5 py-3 text-[12px] font-bold tabular-nums">{f.nr}</td>
                    <td className="px-5 py-3 text-[13px] font-semibold">{f.klant}</td>
                    <td
                      className="hidden px-5 py-3 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3 text-right text-[13px] font-semibold tabular-nums"
                      style={heading}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        style={{ color: m.tint }}
                      >
                        <span aria-hidden="true">{m.sym}</span>
                        <span className="text-[11.5px] font-bold">{f.status}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
