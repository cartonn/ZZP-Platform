"use client";

// Concept 56 — "Kiosk" · Groot-format touch, 10-voet-interface (balie / receptie / bemiddelaarsdesk).
// Ontworpen voor een zelfbedienings-terminal of tablet-kiosk: extra grote raakvlakken (XL-touch),
// grote typografie, hoge leesbaarheid op afstand, brede knoppen met duidelijke iconen + labels,
// minimale dichtheid per scherm maar heldere hiërarchie en grote status-tegels. Eén heldere
// accentkleur, rustig neutraal daaromheen, dikke focus-ringen en hoog contrast (WCAG). Een grote
// "volgende actie"-kaart staat centraal.
// Onderscheidend van mobiel-first (kleine schermen) en hoog-contrast: expliciet groot-format/10-voet.
// Palet: bg #eef1f6, blad #ffffff, inkt #10192a, grijs #55617a, hairline #d9dfe9, accent #1d5eff.
// Fonts: --font-lab-sora (display) + --font-lab-manrope (body).

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  FileText,
  Search,
  MapPin,
  Check,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  ArrowRight,
  Minus,
  Plus,
  Send,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#eef1f6",
  panel: "#ffffff",
  panelAlt: "#f3f6fb",
  ink: "#10192a",
  inkSoft: "#334155",
  muted: "#55617a",
  faint: "#8895a8",
  line: "#d9dfe9",
  lineSoft: "#e8ecf3",
  accent: "#1d5eff",
  accentInk: "#ffffff",
  accentSoft: "#e5edff",
  accentLine: "#c2d3ff",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

/* ---------- Status-taal (kleur + icoon + label, groot leesbaar) ---------- */

type Tone = "green" | "blue" | "amber" | "red";

const TONE: Record<Tone, { fg: string; bg: string; line: string }> = {
  green: { fg: "#0f7a52", bg: "#e3f5ec", line: "#b6e3cd" },
  blue: { fg: "#1d5eff", bg: "#e5edff", line: "#c2d3ff" },
  amber: { fg: "#9a5b00", bg: "#fdf0d8", line: "#f2d79f" },
  red: { fg: "#c22b45", bg: "#fce8ec", line: "#f2c1cc" },
};

function statusMeta(s: CredStatus): { label: string; tone: Tone; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "green", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "blue", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "amber", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tone: "red", Icon: X };
  }
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

/* ---------- Primitieven ---------- */

function StatusTag({ status, big = false }: { status: CredStatus; big?: boolean }) {
  const m = statusMeta(status);
  const t = TONE[m.tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${
        big ? "px-4 py-2 text-[15px]" : "px-3 py-1.5 text-[13px]"
      }`}
      style={{ color: t.fg, background: t.bg, border: `1.5px solid ${t.line}`, ...body }}
    >
      <m.Icon size={big ? 18 : 15} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{
        background: C.panel,
        border: `1.5px solid ${C.line}`,
        boxShadow: "0 2px 4px rgba(16,25,42,0.04), 0 20px 40px -30px rgba(16,25,42,0.4)",
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[13px] font-bold uppercase tracking-[0.2em]"
      style={{ color: C.accent, ...body }}
    >
      {children}
    </p>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[40px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p
          className="mt-3 max-w-3xl text-[17px] leading-relaxed"
          style={{ color: C.muted, ...body }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// Grote match-ring — dik, van veraf leesbaar.
function MatchRing({ value, size = 72 }: { value: number; size?: number }) {
  const tone: Tone = value >= 90 ? "green" : "blue";
  const t = TONE[tone];
  const deg = (value / 100) * 360;
  const inner = size - 16;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${t.fg} ${deg}deg, ${t.bg} ${deg}deg)`,
      }}
      role="img"
      aria-label={`Match ${value} procent`}
    >
      <span
        className="flex items-center justify-center rounded-full font-bold tabular-nums"
        style={{
          width: inner,
          height: inner,
          background: C.panel,
          color: C.ink,
          fontSize: size >= 72 ? 20 : 16,
          ...display,
        }}
      >
        {value}
      </span>
    </span>
  );
}

// XL-knop met dikke focus-ring.
function BigButton({
  children,
  onClick,
  variant = "accent",
  className = "",
  disabled = false,
  ariaLive,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "accent" | "ghost" | "tone";
  className?: string;
  disabled?: boolean;
  ariaLive?: "polite";
}) {
  const base =
    "inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-2xl px-6 text-[16px] font-bold transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-90";
  const styles: React.CSSProperties =
    variant === "accent"
      ? { background: C.accent, color: C.accentInk }
      : variant === "ghost"
        ? { background: C.panel, color: C.ink, border: `1.5px solid ${C.line}` }
        : { background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentLine}` };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-live={ariaLive}
      className={`${base} ${className}`}
      style={{
        ...styles,
        ["--tw-ring-color" as string]: C.accent,
        ["--tw-ring-offset-color" as string]: C.bg,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Hoofdcomponent ---------- */

export function Concept56() {
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
      style={{ color: C.ink, background: C.bg, ...body }}
    >
      <div className="flex min-h-[680px] flex-col">
        {/* Grote koptekst */}
        <header
          className="flex items-center gap-4 px-5 py-4 sm:px-8"
          style={{ background: C.panel, borderBottom: `1.5px solid ${C.line}` }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: C.accent }}
          >
            <LayoutGrid size={24} style={{ color: C.accentInk }} aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <div className="text-[19px] font-bold tracking-tight" style={display}>
              Kiosk
            </div>
            <div className="text-[13px]" style={{ color: C.muted }}>
              ZZP · balie-terminal
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              className="hidden h-12 items-center gap-2.5 rounded-2xl px-5 text-[15px] font-semibold transition-colors hover:bg-[#f3f6fb] focus-visible:outline-none focus-visible:ring-4 sm:flex"
              style={{
                border: `1.5px solid ${C.line}`,
                color: C.inkSoft,
                ["--tw-ring-color" as string]: C.accent,
              }}
              aria-label="Zoeken"
            >
              <Search size={18} aria-hidden="true" />
              <span>Zoeken</span>
            </button>
            <div className="flex items-center gap-3 rounded-2xl px-2 py-1">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-[15px] font-bold"
                style={{ background: C.accentSoft, color: C.accent, ...display }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-[14px] font-bold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[12.5px]"
                  style={{ color: TONE.green.fg }}
                >
                  <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Grote navigatie-tegels (XL-touch) */}
        <nav
          className="flex gap-3 overflow-x-auto px-5 py-4 sm:px-8"
          aria-label="Hoofdnavigatie"
          style={{ background: C.panel, borderBottom: `1.5px solid ${C.line}` }}
        >
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="flex min-h-[72px] min-w-[104px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-4 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 active:scale-[0.97]"
                style={{
                  background: on ? C.accent : C.panelAlt,
                  color: on ? C.accentInk : C.inkSoft,
                  border: `1.5px solid ${on ? C.accent : C.line}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <Icon size={26} aria-hidden="true" />
                <span className="text-[13.5px] font-bold">{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-8 sm:py-9">
          {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
          {screen === "marktplaats" && (
            <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
          )}
          {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onOpen={open} />}
          {screen === "facturen" && <Facturen />}
        </div>
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
  const KPI_TONE: Tone[] = ["green", "blue", "green", "amber"];
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SectionHead
        kicker="Overzicht"
        title={`Welkom, ${PROFIEL.naam.split(" ")[0]}`}
        note="Alles wat nu telt, groot en helder in beeld. Raak een tegel aan om verder te gaan."
      />

      {/* Grote 'volgende actie'-kaart, centraal */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 h-full w-2"
          style={{ background: TONE.amber.fg }}
        />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl"
            style={{ background: TONE.amber.bg, border: `1.5px solid ${TONE.amber.line}` }}
          >
            <AlertTriangle size={38} style={{ color: TONE.amber.fg }} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-bold uppercase tracking-wide"
              style={{
                color: TONE.amber.fg,
                background: TONE.amber.bg,
                border: `1.5px solid ${TONE.amber.line}`,
              }}
            >
              Actie vereist
            </span>
            <h2
              className="mt-2.5 text-[26px] font-bold leading-tight sm:text-[30px]"
              style={display}
            >
              {ACTIES[0]?.titel}
            </h2>
            <p className="mt-2 max-w-2xl text-[16px] leading-relaxed" style={{ color: C.muted }}>
              {ACTIES[0]?.detail}
            </p>
          </div>
          <BigButton onClick={() => onOpen()} className="w-full sm:w-auto">
            {ACTIES[0]?.cta} <ArrowRight size={20} aria-hidden="true" />
          </BigButton>
        </div>
      </Card>

      {/* Grote KPI-tegels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const t = TONE[KPI_TONE[i] ?? "green"];
          return (
            <Card key={k.label} className="p-6">
              <p className="text-[14px] font-semibold" style={{ color: C.muted }}>
                {k.label}
              </p>
              <p className="mt-2 text-[36px] font-bold leading-none tracking-tight" style={display}>
                {k.value}
              </p>
              <div
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13.5px] font-bold"
                style={{ color: t.fg, background: t.bg }}
              >
                {k.up ? (
                  <ArrowUpRight size={15} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={15} aria-hidden="true" />
                )}
                {k.trend}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Beste matches, grote rijen */}
      <Card className="overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1.5px solid ${C.lineSoft}` }}
        >
          <h3 className="text-[20px] font-bold tracking-tight" style={display}>
            Beste opdrachten voor jou
          </h3>
          <BigButton
            variant="ghost"
            onClick={() => onGo("marktplaats")}
            className="hidden sm:inline-flex"
          >
            Alles bekijken <ChevronRight size={18} aria-hidden="true" />
          </BigButton>
        </div>
        <div>
          {OPDRACHTEN.map((o, i) => (
            <button
              key={o.id}
              onClick={() => onOpen(o.id)}
              className="flex w-full items-center gap-5 px-6 py-5 text-left transition-colors hover:bg-[#f3f6fb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset"
              style={{
                borderTop: i === 0 ? "none" : `1.5px solid ${C.lineSoft}`,
                ["--tw-ring-color" as string]: C.accent,
              }}
            >
              <MatchRing value={o.match} size={64} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[18px] font-bold" style={{ color: C.ink }}>
                  {o.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-2 truncate text-[14.5px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={15} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-[18px] font-bold" style={{ color: C.ink }}>
                  {o.tarief}
                </p>
                <p className="text-[13.5px]" style={{ color: C.muted }}>
                  {o.uren}
                </p>
              </div>
              <ChevronRight size={24} aria-hidden="true" style={{ color: C.accent }} />
            </button>
          ))}
        </div>
      </Card>
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
    <div className="mx-auto max-w-6xl space-y-7">
      <SectionHead
        kicker="Marktplaats"
        title="Open opdrachten"
        note="Kies links een opdracht; het detail verschijnt groot in beeld."
      />

      <Card className="flex items-center gap-4 px-5 py-3">
        <Search size={22} aria-hidden="true" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="min-h-[44px] w-full bg-transparent text-[17px] outline-none placeholder:text-[#8895a8]"
          style={{ color: C.ink }}
        />
        <span
          className="shrink-0 text-[15px] font-semibold tabular-nums"
          style={{ color: C.muted }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="px-6 py-20 text-center">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: C.accentSoft }}
            aria-hidden="true"
          >
            <Search size={34} style={{ color: C.accent }} />
          </div>
          <p className="mt-5 text-[24px] font-bold" style={display}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-md text-[16px]" style={{ color: C.muted }}>
            Geen opdracht komt overeen met &quot;{q}&quot;. Probeer een ander zoekwoord.
          </p>
          <BigButton variant="accent" onClick={() => setQ("")} className="mt-6">
            Zoekopdracht wissen
          </BigButton>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="w-full text-left transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 active:scale-[0.99]"
                  style={{
                    ["--tw-ring-color" as string]: C.accent,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  <div
                    className="relative flex items-center gap-5 rounded-3xl p-5"
                    style={{
                      background: C.panel,
                      border: `2px solid ${on ? C.accent : C.line}`,
                      boxShadow: on
                        ? "0 16px 36px -24px rgba(29,94,255,0.6)"
                        : "0 2px 4px rgba(16,25,42,0.03)",
                    }}
                  >
                    <MatchRing value={o.match} size={68} />
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[13px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: C.muted }}
                      >
                        {o.id}
                      </span>
                      <p
                        className="truncate text-[19px] font-bold leading-snug"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-1 flex items-center gap-2 truncate text-[14.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={15} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[18px] font-bold" style={{ color: C.ink }}>
                        {o.tarief}
                      </p>
                      <p className="text-[13.5px]" style={{ color: C.muted }}>
                        {o.uren}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <Card className="sticky top-4 h-fit p-6">
              <div className="flex items-center gap-4">
                <MatchRing value={sel.match} size={80} />
                <div className="min-w-0">
                  <span
                    className="text-[13px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: C.muted }}
                  >
                    {sel.id}
                  </span>
                  <h2 className="text-[22px] font-bold leading-tight" style={display}>
                    {sel.titel}
                  </h2>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-[15px]" style={{ color: C.muted }}>
                <MapPin size={16} aria-hidden="true" /> {sel.opdrachtgever} · {sel.plaats}
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { l: "Tarief", v: sel.tarief },
                  { l: "Omvang", v: sel.uren },
                  { l: "Start", v: sel.start },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-2xl px-3 py-3.5 text-center"
                    style={{ background: C.panelAlt }}
                  >
                    <dt
                      className="text-[11.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: C.muted }}
                    >
                      {m.l}
                    </dt>
                    <dd className="mt-1 text-[15px] font-bold" style={{ color: C.ink }}>
                      {m.v}
                    </dd>
                  </div>
                ))}
              </dl>
              <BigButton onClick={() => onOpen(sel.id)} className="mt-5 w-full">
                Opdracht openen <ArrowRight size={20} aria-hidden="true" />
              </BigButton>
            </Card>
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
    window.setTimeout(() => setState("sent"), 900);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            <MatchRing value={opdracht.match} size={84} />
            <div className="min-w-0">
              <Kicker>{opdracht.id}</Kicker>
              <h1
                className="mt-1.5 text-[30px] font-bold leading-tight tracking-tight sm:text-[34px]"
                style={display}
              >
                {opdracht.titel}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-[16px]" style={{ color: C.muted }}>
                <MapPin size={17} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-3 py-1 text-[13px] font-semibold"
                    style={{
                      background: C.panelAlt,
                      color: C.inkSoft,
                      border: `1.5px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <BigButton
            onClick={react}
            disabled={state !== "idle"}
            ariaLive="polite"
            variant={state === "sent" ? "tone" : "accent"}
            className="w-full sm:w-auto"
          >
            {state === "sending" && (
              <Loader2 size={19} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={19} aria-hidden="true" />}
            {state === "idle" && <Send size={18} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </BigButton>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="rounded-2xl p-4" style={{ background: C.panelAlt }}>
              <p
                className="text-[12px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.muted }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[20px] font-bold" style={{ color: C.ink }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h3 className="text-[22px] font-bold tracking-tight" style={display}>
          Waarom deze match
        </h3>
        <p className="mt-1.5 text-[15px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.1em]"
              style={{ color: TONE.green.fg }}
            >
              <Check size={17} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-4 space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[16px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: TONE.green.bg }}
                    aria-hidden="true"
                  >
                    <Check size={16} style={{ color: TONE.green.fg }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.1em]"
              style={{ color: TONE.amber.fg }}
            >
              <Minus size={17} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-4 space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[16px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: TONE.amber.bg }}
                    aria-hidden="true"
                  >
                    <Minus size={16} style={{ color: TONE.amber.fg }} />
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

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <SectionHead
        kicker="Verificatie"
        title="Certificaten & documenten"
        note="Grote, duidelijke status-tegels. Groen is klaar, amber vraagt aandacht."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[240px_1fr]">
        <Card className="p-6">
          <p
            className="text-[14px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.muted }}
          >
            Gereedheid
          </p>
          <p className="mt-2 text-[52px] font-bold leading-none tracking-tight" style={display}>
            {verified}
            <span className="text-[26px]" style={{ color: C.muted }}>
              /{total}
            </span>
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[14px] font-bold"
              style={{ color: TONE.green.fg, background: TONE.green.bg }}
            >
              <Check size={16} aria-hidden="true" /> {verified} klaar
            </span>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[14px] font-bold"
              style={{ color: TONE.amber.fg, background: TONE.amber.bg }}
            >
              <AlertTriangle size={16} aria-hidden="true" /> {attention} aandacht
            </span>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const m = statusMeta(c.status);
            return (
              <Card key={c.naam} className="flex items-start gap-4 p-5">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: TONE[m.tone].bg,
                    border: `1.5px solid ${TONE[m.tone].line}`,
                  }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={24}
                      className="motion-safe:animate-spin"
                      style={{ color: TONE[m.tone].fg }}
                      aria-hidden="true"
                    />
                  ) : (
                    <m.Icon size={24} style={{ color: TONE[m.tone].fg }} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold leading-snug" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="mt-1 text-[13.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                  <div className="mt-2.5">
                    <StatusTag status={c.status} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-5" style={{ borderBottom: `1.5px solid ${C.lineSoft}` }}>
          <h3 className="text-[20px] font-bold tracking-tight" style={display}>
            Documentenarchief
          </h3>
        </div>
        {DOCUMENTEN.map((d, i) => (
          <div
            key={d.naam}
            className="flex items-center gap-4 px-6 py-4"
            style={{ borderTop: i === 0 ? "none" : `1.5px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: C.panelAlt, border: `1.5px solid ${C.line}` }}
              aria-hidden="true"
            >
              <FileText size={20} style={{ color: C.accent }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15.5px] font-bold" style={{ color: C.ink }}>
                {d.naam}
              </p>
              <p className="truncate text-[13px]" style={{ color: C.muted }}>
                {d.type} · {d.grootte} · {d.bijgewerkt}
              </p>
            </div>
            <StatusTag status={d.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onOpen }: { onOpen: (id?: string) => void }) {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <SectionHead
        kicker="Volgende acties"
        title="Wat vraagt nu je aandacht"
        note="Op volgorde van urgentie. Raak een knop aan om direct verder te gaan."
      />
      <div className="space-y-4">
        {ACTIES.map((a) => {
          const warn = a.urgentie === "warning";
          const tone: Tone = warn ? "amber" : "blue";
          return (
            <Card key={a.titel} className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: TONE[tone].bg, border: `1.5px solid ${TONE[tone].line}` }}
              >
                {warn ? (
                  <AlertTriangle size={30} style={{ color: TONE[tone].fg }} aria-hidden="true" />
                ) : (
                  <Bell size={30} style={{ color: TONE[tone].fg }} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-bold uppercase tracking-wide"
                  style={{
                    color: TONE[tone].fg,
                    background: TONE[tone].bg,
                    border: `1.5px solid ${TONE[tone].line}`,
                  }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-2 text-[19px] font-bold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-1 text-[15px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <BigButton
                onClick={() => onOpen()}
                variant={warn ? "accent" : "tone"}
                className="w-full sm:w-auto"
              >
                {a.cta} <ArrowRight size={19} aria-hidden="true" />
              </BigButton>
            </Card>
          );
        })}
      </div>

      <Card className="flex items-center gap-4 p-6">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: TONE.green.bg, border: `1.5px solid ${TONE.green.line}` }}
        >
          <Check size={26} style={{ color: TONE.green.fg }} aria-hidden="true" />
        </div>
        <p className="text-[15px] leading-relaxed" style={{ color: C.muted }}>
          Verder is alles op orde. Nieuwe acties verschijnen hier groot in beeld zodra ze relevant
          worden.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const meta: Record<string, { tone: Tone; Icon: LucideIcon }> = {
    Betaald: { tone: "green", Icon: Check },
    Openstaand: { tone: "amber", Icon: Clock },
    Concept: { tone: "blue", Icon: FileText },
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
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Facturen"
          title="Kasstroom"
          note="Betaald en openstaand, groot en helder."
        />
        <BigButton variant="accent" className="w-full sm:w-auto">
          <Plus size={19} aria-hidden="true" /> Nieuwe factuur
        </BigButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: TONE.green.bg }}
              aria-hidden="true"
            >
              <Check size={24} style={{ color: TONE.green.fg }} />
            </span>
            <p
              className="text-[14px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.muted }}
            >
              Ontvangen
            </p>
          </div>
          <p className="mt-3 text-[34px] font-bold tracking-tight" style={display}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: TONE.amber.bg }}
              aria-hidden="true"
            >
              <Clock size={24} style={{ color: TONE.amber.fg }} />
            </span>
            <p
              className="text-[14px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.muted }}
            >
              Openstaand
            </p>
          </div>
          <p className="mt-3 text-[34px] font-bold tracking-tight" style={display}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[12.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.muted, borderBottom: `1.5px solid ${C.line}` }}
              >
                <th className="px-6 py-4 font-bold">Nummer</th>
                <th className="px-6 py-4 font-bold">Klant</th>
                <th className="hidden px-6 py-4 font-bold sm:table-cell">Datum</th>
                <th className="px-6 py-4 text-right font-bold">Bedrag</th>
                <th className="px-6 py-4 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = meta[f.status] ?? meta.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f3f6fb]"
                    style={{ borderTop: i === 0 ? "none" : `1.5px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-6 py-5 text-[14px] font-semibold tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-6 py-5 text-[15.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-6 py-5 text-[14px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-6 py-5 text-right text-[16px] font-bold tabular-nums"
                      style={{ color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end">
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13.5px] font-bold"
                          style={{
                            color: TONE[m.tone].fg,
                            background: TONE[m.tone].bg,
                            border: `1.5px solid ${TONE[m.tone].line}`,
                          }}
                        >
                          <m.Icon size={15} aria-hidden="true" />
                          {f.status}
                        </span>
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
