"use client";

// Concept 76 — "Etiket" · apotheek / klinisch label & specimen.
// Off-white/perkament (#f4f2ea) met donkere inkt (#23201a), medisch-teal accent (#0f6e63) en
// signaal-rood (#b23b2e) voor waarschuwingen. Alles voelt als een apotheker-/laboratorium-etiket:
// strak omkaderde labels met "Rx"-achtige kop-regels, dossier-/recept-nummers, vintage klinische
// typografie, monospace doseringsvelden en gestempelde "GEVERIFIEERD"-zegels. VOG/diploma's als
// voorschriften. Precisie en vertrouwen.
// Fonts: --font-lab-franklin (labels) + --font-lab-mono (recept-/dossier-nummers) + --font-lab-newsreader (serif-moment).

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Plus,
  MapPin,
  FlaskConical,
  Stamp,
  FileWarning,
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

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#f4f2ea",
  paperAlt: "#eceada",
  card: "#fbfaf4",
  ink: "#23201a",
  inkSoft: "#5a544a",
  faint: "#8c8578",
  teal: "#0f6e63",
  tealSoft: "#e2efec",
  red: "#b23b2e",
  redSoft: "#f6e6e2",
  line: "#23201a",
  lineSoft: "rgba(35,32,26,0.16)",
  hair: "rgba(35,32,26,0.09)",
};

const label = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const serif = { fontFamily: "var(--font-lab-newsreader)" };

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; bg: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.teal, bg: C.tealSoft, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.inkSoft, bg: C.paperAlt, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.red, bg: C.redSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.red, bg: C.redSoft, Icon: XCircle };
  }
}

/* ---------- Kleine bouwstenen ---------- */

// Klinisch etiket-omkadering: dubbele rand met kop-strook, zoals een apotheker-label.
function Label({
  children,
  className = "",
  rx,
}: {
  children: React.ReactNode;
  className?: string;
  rx?: string;
}) {
  return (
    <div
      className={`relative bg-[color:var(--card)] ${className}`}
      style={
        {
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxShadow: "3px 3px 0 rgba(35,32,26,0.08)",
          "--card": C.card,
        } as React.CSSProperties
      }
    >
      {rx && (
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ borderBottom: `1px solid ${C.line}`, background: C.paperAlt }}
        >
          <span
            className="text-[9.5px] font-bold uppercase tracking-[0.24em]"
            style={{ ...label, color: C.ink }}
          >
            {rx}
          </span>
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
            style={{ ...serif, color: C.paper, background: C.teal }}
            aria-hidden="true"
          >
            ℞
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

function Kicker({ children, color = C.teal }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-block text-[10px] font-bold uppercase tracking-[0.28em]"
      style={{ ...label, color }}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-1.5 text-[26px] leading-[1.05] sm:text-[32px]"
      style={{ ...serif, color: C.ink, letterSpacing: "-0.01em" }}
    >
      {children}
    </h1>
  );
}

// Recept-/dossiernummer in monospace, zoals op een specimen-sticker.
function DossierTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-medium tracking-[0.08em]"
      style={{ ...mono, color: C.inkSoft, borderColor: C.lineSoft, background: C.paperAlt }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
      style={{ ...label, color: m.color, borderColor: m.color, background: m.bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Gestempeld "GEVERIFIEERD"-zegel, roterend ingedrukt.
function VerifiedStamp({ size = 72 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, transform: "rotate(-9deg)" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={C.teal} strokeWidth="2" opacity="0.9" />
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke={C.teal}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.7"
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <ShieldCheck size={18} strokeWidth={2.2} color={C.teal} />
        <span
          className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
          style={{ ...label, color: C.teal }}
        >
          Gecontroleerd
        </span>
      </span>
    </span>
  );
}

// Sparkline als klinisch meet-signaal.
function Spark({ data, color = C.teal }: { data: number[]; color?: string }) {
  const w = 92;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />
    </svg>
  );
}

// Doserings-/meetveld in monospace (specimen-stijl k/v-paar).
function DoseField({ k, v, color = C.ink }: { k: string; v: string; color?: string }) {
  return (
    <div className="px-3 py-2.5" style={{ borderRight: `1px solid ${C.hair}` }}>
      <div
        className="text-[8.5px] font-bold uppercase tracking-[0.14em]"
        style={{ ...label, color: C.faint }}
      >
        {k}
      </div>
      <div className="mt-1 text-[15px] tabular-nums" style={{ ...mono, color }}>
        {v}
      </div>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept76() {
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
      style={{
        ...label,
        color: C.ink,
        background: `${C.paper} repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(35,32,26,0.03) 27px, rgba(35,32,26,0.03) 28px)`,
      }}
    >
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk — apotheek-etiket-kolom */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: `1.5px solid ${C.line}`, background: C.paperAlt }}
        >
          <div className="flex h-full flex-col">
            <div className="p-4" style={{ borderBottom: `1.5px solid ${C.line}` }}>
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{ border: `1.5px solid ${C.line}`, background: C.teal }}
                  aria-hidden="true"
                >
                  <FlaskConical size={19} strokeWidth={2} color={C.paper} />
                </span>
                <div className="leading-tight">
                  <div className="text-[16px]" style={{ ...serif, color: C.ink }}>
                    Apotheek
                  </div>
                  <div
                    className="text-[8.5px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: C.teal }}
                  >
                    ZZP · zorgdossier
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <DossierTag>DOSSIER · {PROFIEL.initialen}-2041</DossierTag>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s, idx) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-left text-[12.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e63] md:w-full"
                    style={{
                      color: on ? C.paper : C.inkSoft,
                      background: on ? C.ink : "transparent",
                      border: `1px solid ${on ? C.ink : "transparent"}`,
                    }}
                  >
                    <span
                      className="text-[9px] tabular-nums"
                      style={{ ...mono, color: on ? C.teal : C.faint }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-2.5 p-4 md:flex"
              style={{ borderTop: `1.5px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[12px] font-bold"
                style={{ ...serif, color: C.paper, background: C.ink }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-bold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.teal }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Voorschrift · overzicht</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <DossierTag>UITGIFTE · 04-07</DossierTag>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
          style={{ border: `1.5px solid ${C.red}`, background: C.redSoft }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start"
            style={{ border: `1.5px solid ${C.red}`, background: C.card }}
          >
            <FileWarning size={18} strokeWidth={2.2} color={C.red} aria-hidden="true" />
          </span>
          <p className="text-[12.5px] leading-snug">
            <span className="font-bold uppercase tracking-[0.04em]" style={{ color: C.red }}>
              Waarschuwing —{" "}
            </span>
            <span style={{ color: C.ink }}>{warn.titel}. </span>
            <span style={{ color: C.inkSoft }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b23b2e]"
            style={{ color: C.paper, background: C.red }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Label key={k.label} className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[9.5px] font-bold uppercase leading-tight tracking-[0.1em]"
                style={{ color: C.faint }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.teal : C.red }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} strokeWidth={2.6} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} strokeWidth={2.6} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-2.5 text-[24px] tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.teal : C.red} />
            </div>
          </Label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Label className="lg:col-span-2" rx="RX · beste voorschriften">
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-[15px]" style={{ ...serif, color: C.ink }}>
              Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e63]"
              style={{ color: C.teal }}
            >
              Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-2 p-3" role="status" aria-live="polite">
              <span className="sr-only">Voorschriften worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3"
                  style={{ border: `1px solid ${C.hair}` }}
                >
                  <span
                    className="h-10 w-10 shrink-0 animate-pulse"
                    style={{ background: C.paperAlt }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse"
                      style={{ background: C.paperAlt }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse"
                      style={{ background: C.paperAlt }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul style={{ borderTop: `1px solid ${C.hair}` }}>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#eceada] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f6e63]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center text-[14px] tabular-nums"
                      style={{
                        ...mono,
                        color: o.match >= 90 ? C.teal : C.ink,
                        border: `1.5px solid ${o.match >= 90 ? C.teal : C.line}`,
                        background: o.match >= 90 ? C.tealSoft : C.card,
                      }}
                    >
                      {o.match}
                      <span
                        className="text-[7px] font-bold uppercase tracking-[0.1em]"
                        style={{ ...label, color: C.faint }}
                      >
                        %
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.inkSoft }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={15} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Label>

        <Label rx="Bijsluiter · certificaten">
          <div style={{ borderTop: `1px solid ${C.hair}` }}>
            {CREDENTIALS.map((c, i) => {
              const m = credMeta(c.status);
              const Icon = m.Icon;
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-2.5 px-3.5 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
                >
                  <Icon size={15} strokeWidth={2.2} color={m.color} aria-hidden="true" />
                  <span
                    className="min-w-0 flex-1 truncate text-[12px] font-medium"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.06em]"
                    style={{ ...label, color: m.color }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Label>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

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

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <Kicker>Formularium · open</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ border: `1.5px solid ${C.line}`, background: C.card }}
      >
        <Search size={16} strokeWidth={2.2} color={C.teal} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8c8578]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Label className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center"
            style={{ border: `1.5px solid ${C.line}`, background: C.paperAlt }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2} color={C.teal} />
          </span>
          <p className="mt-4 text-[20px]" style={{ ...serif, color: C.ink }}>
            Geen voorschrift gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.inkSoft }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 px-4 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e63]"
            style={{ color: C.paper, background: C.teal }}
          >
            Zoekopdracht wissen
          </button>
        </Label>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e63]"
                  style={{
                    background: C.card,
                    border: `1.5px solid ${on ? C.teal : C.line}`,
                    boxShadow: on ? `3px 3px 0 ${C.teal}` : "3px 3px 0 rgba(35,32,26,0.08)",
                  }}
                >
                  <div
                    className="flex items-center justify-between px-3.5 py-1.5"
                    style={{
                      borderBottom: `1px solid ${on ? C.teal : C.line}`,
                      background: on ? C.tealSoft : C.paperAlt,
                    }}
                  >
                    <span
                      className="text-[10px] tracking-[0.1em]"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {o.id}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ ...label, color: on ? C.teal : C.faint }}
                    >
                      {on ? "Geselecteerd" : "Voorschrift"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3.5 p-3.5">
                    <span
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center text-[16px] tabular-nums"
                      style={{
                        ...mono,
                        color: o.match >= 90 ? C.teal : C.ink,
                        border: `1.5px solid ${o.match >= 90 ? C.teal : C.line}`,
                        background: o.match >= 90 ? C.tealSoft : C.card,
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-bold" style={{ color: C.ink }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11px]"
                        style={{ color: C.inkSoft }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
                            style={{
                              ...label,
                              color: C.inkSoft,
                              borderColor: C.lineSoft,
                              background: C.paperAlt,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Label rx={`RX · ${sel.id}`}>
                <div className="p-4">
                  <p className="text-[17px] leading-snug" style={{ ...serif, color: C.ink }}>
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[11.5px]" style={{ color: C.inkSoft }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <div className="mt-4 grid grid-cols-2" style={{ border: `1px solid ${C.hair}` }}>
                    <DoseField k="Tarief" v={sel.tarief.replace("€ ", "€")} color={C.teal} />
                    <DoseField k="Omvang" v={sel.uren} />
                    <DoseField k="Start" v={sel.start} />
                    <DoseField k="Match" v={`${sel.match}%`} color={C.teal} />
                  </div>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e63]"
                    style={{ color: C.paper, background: C.ink }}
                  >
                    Open voorschrift <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              </Label>
            </aside>
          )}
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
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Label rx={`RX · voorschrift ${opdracht.id}`}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.opdrachtgever}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[11.5px]" style={{ color: C.inkSoft }}>
              {opdracht.plaats} · {opdracht.uren}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
                  style={{
                    ...label,
                    color: C.inkSoft,
                    borderColor: C.lineSoft,
                    background: C.paperAlt,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          {opdracht.match >= 90 ? (
            <VerifiedStamp />
          ) : (
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center text-[24px] tabular-nums"
              style={{ ...mono, color: C.ink, border: `1.5px solid ${C.line}`, background: C.card }}
              aria-hidden="true"
            >
              {opdracht.match}
              <span
                className="text-[8px] font-bold uppercase tracking-[0.1em]"
                style={{ ...label, color: C.faint }}
              >
                match
              </span>
            </span>
          )}
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <DoseField k="Tarief" v={opdracht.tarief.replace("€ ", "€")} color={C.teal} />
          <DoseField k="Omvang" v={opdracht.uren} />
          <DoseField k="Start" v={opdracht.start} />
          <DoseField k="Match" v={`${opdracht.match}%`} color={C.teal} />
        </div>
        <div className="p-4" style={{ borderTop: `1px solid ${C.line}` }}>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e63] disabled:opacity-90"
            style={{ color: C.paper, background: state === "sent" ? C.teal : C.ink }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" /> Reageer op voorschrift
              </>
            )}
            {state === "sending" && "Uitgifte verwerken…"}
            {state === "sent" && (
              <>
                <Stamp size={15} strokeWidth={2.2} aria-hidden="true" /> Reactie gestempeld
              </>
            )}
          </button>
        </div>
      </Label>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Label rx="Indicaties · pluspunten">
          <ul className="p-4" style={{ borderTop: `1px solid ${C.hair}` }}>
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 py-1.5 text-[12.5px]"
                style={{ color: C.ink }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  color={C.teal}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Label>
        <Label rx="Contra-indicaties · let op">
          <ul className="p-4" style={{ borderTop: `1px solid ${C.hair}` }}>
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 py-1.5 text-[12.5px]"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={15}
                  strokeWidth={2.4}
                  color={C.red}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Label>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.teal, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.red, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.inkSoft, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Kicker>Klinische controle</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[12.5px]" style={{ color: C.inkSoft }}>
          Je bewijsstukken worden veilig en privé bewaard — als specimen in het dossier.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Label key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...mono, color: C.ink }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center"
                style={{ border: `1.5px solid ${s.color}`, background: C.card }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Label>
          );
        })}
      </div>

      <Label>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ border: `1.5px solid ${m.color}`, background: m.bg }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <DossierTag>SPEC-{String(i + 1).padStart(3, "0")}</DossierTag>
                </div>
                <p className="mt-0.5 text-[11px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Label>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker>Uitgifte-lijst</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[12.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.red : C.teal;
          return (
            <Label key={a.titel} className="flex items-stretch">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-1.5"
                style={{
                  background: warn ? C.redSoft : C.tealSoft,
                  borderRight: `1.5px solid ${color}`,
                }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...mono, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Check size={15} strokeWidth={2.6} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...label, color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14px] font-bold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center px-3.5 py-2 text-[10.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e63]"
                style={{
                  color: warn ? C.paper : C.ink,
                  background: warn ? C.red : "transparent",
                  border: `1.5px solid ${warn ? C.red : C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Label>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 p-4"
        style={{ border: `1.5px solid ${C.teal}`, background: C.tealSoft }}
      >
        <Check size={18} strokeWidth={2.4} color={C.teal} aria-hidden="true" />
        <p className="text-[12px]" style={{ color: C.inkSoft }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta: Record<string, { color: string; bg: string }> = {
    Betaald: { color: C.teal, bg: C.tealSoft },
    Openstaand: { color: C.red, bg: C.redSoft },
    Concept: { color: C.faint, bg: C.paperAlt },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Uitgifte-register</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e63]"
          style={{ color: C.paper, background: C.ink }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Label className="p-4">
          <p
            className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...mono, color: C.teal }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Label>
        <Label className="p-4">
          <p
            className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...mono, color: C.red }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Label>
      </div>

      <Label className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{
                color: C.faint,
                borderBottom: `1.5px solid ${C.line}`,
                background: C.paperAlt,
              }}
            >
              <th className="p-3.5">Nummer</th>
              <th className="p-3.5">Klant</th>
              <th className="hidden p-3.5 sm:table-cell">Datum</th>
              <th className="p-3.5 text-right">Bedrag</th>
              <th className="p-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = statusMeta[f.status] ?? { color: C.faint, bg: C.paperAlt };
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                  <td
                    className="p-3.5 text-[11.5px] tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-3.5 text-[12.5px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-3.5 text-[11.5px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-3.5 text-right text-[13px] tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end">
                      <span
                        className="border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em]"
                        style={{ ...label, color: m.color, borderColor: m.color, background: m.bg }}
                      >
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Label>
    </div>
  );
}
