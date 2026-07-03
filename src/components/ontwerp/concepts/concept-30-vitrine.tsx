"use client";

// Concept 30 — "Vitrine" · Museum / galerie-curatie.
// Een museale, gecureerde presentatie: royale passe-partout (matting) rond content,
// wandlabel-typografie (elegante serif-onderschriften), zachte spotlight-belichting,
// veel rust en ademruimte. Elke opdracht/certificaat is een tentoongesteld object met
// een curator-onderschrift (plaquette). Zaal-/collectie-taal, nummering als cat.nr.
// Palet: wand #f6f4f0, ink #1e1c19, muted #6e685e, matting-lijn #e2ddd3,
// brons #7c6a45, diepgroen-geverifieerd #4a6350, spotlight = zeer lichte radial.
// Fonts: --font-lab-instrument-serif (display/onderschriften) + --font-lab-manrope (UI/meta).

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
  wall: "#f6f4f0",
  wallDeep: "#efece5",
  paper: "#fffefb",
  ink: "#1e1c19",
  inkSoft: "#4a453d",
  muted: "#6e685e",
  faint: "#9b9488",
  mat: "#e2ddd3",
  matSoft: "#ece8df",
  bronze: "#7c6a45",
  bronzeSoft: "rgba(124,106,69,0.10)",
  green: "#4a6350",
  greenSoft: "rgba(74,99,80,0.12)",
  amber: "#9a7b3c",
  amberSoft: "rgba(154,123,60,0.12)",
  rust: "#8a4b3c",
  rustSoft: "rgba(138,75,60,0.12)",
};

const display = { fontFamily: "var(--font-lab-instrument-serif)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };

const SPOTLIGHT =
  "radial-gradient(1200px 380px at 50% -12%, rgba(255,255,255,0.9), rgba(255,255,255,0) 62%)";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const ROOM_LABEL: Record<ScreenKey, string> = {
  dashboard: "Entree",
  marktplaats: "Matches",
  opdracht: "Object",
  verificatie: "Bewijs",
  acties: "Attentie",
  facturen: "Ledger",
  documenten: "Archief",
  berichten: "Correspondentie",
};

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, bg: C.greenSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.bronze, bg: C.bronzeSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.rust, bg: C.rustSoft, Icon: AlertTriangle };
  }
}

// Dubbele passe-partout — buitenkader + binnenmat rond een tentoongesteld object.
function Frame({
  children,
  className = "",
  lifted = false,
}: {
  children: React.ReactNode;
  className?: string;
  lifted?: boolean;
}) {
  return (
    <div
      className={`p-1.5 ${className}`}
      style={{
        background: C.matSoft,
        border: `1px solid ${C.mat}`,
        boxShadow: lifted ? "0 24px 60px -34px rgba(60,52,38,0.4)" : "none",
      }}
    >
      <div className="h-full w-full" style={{ background: C.paper, border: `1px solid ${C.mat}` }}>
        {children}
      </div>
    </div>
  );
}

// Wandlabel / plaquette-onderschrift onder een object: klein-kapitaal titel + cursieve meta.
function Plaque({
  cat,
  titel,
  meta,
  right,
}: {
  cat: string;
  titel: string;
  meta: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-baseline gap-3 px-4 py-3"
      style={{ borderTop: `1px solid ${C.mat}`, background: C.wallDeep }}
    >
      <span
        className="shrink-0 text-[10px] uppercase tracking-[0.28em]"
        style={{ color: C.bronze, ...ui }}
      >
        {cat}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: C.ink, ...ui }}
        >
          {titel}
        </p>
        <p className="mt-0.5 truncate text-[13px] italic" style={{ color: C.muted, ...display }}>
          {meta}
        </p>
      </div>
      {right}
    </div>
  );
}

function RoomHeading({ room, title, note }: { room: string; title: string; note?: string }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="h-px w-8" style={{ background: C.bronze }} aria-hidden="true" />
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: C.bronze, ...ui }}
        >
          {room}
        </p>
      </div>
      <h1 className="mt-3 text-[40px] leading-[1.02]" style={{ ...display, color: C.ink }}>
        {title}
      </h1>
      {note && (
        <p
          className="mt-2.5 max-w-xl text-[14px] leading-relaxed"
          style={{ color: C.muted, ...ui }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function Sparkline({ data, color = C.bronze }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.4} fill={color} />
      ))}
    </svg>
  );
}

export function Concept30() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, color: C.ink, background: C.wall }}
    >
      {/* Buitenste passe-partout rond de hele zaal */}
      <div className="p-3 sm:p-5 lg:p-7">
        <div
          className="min-h-[640px]"
          style={{
            background: C.wall,
            border: `1px solid ${C.mat}`,
            boxShadow: "inset 0 0 0 8px #fffefb",
          }}
        >
          {/* Museale kop */}
          <header
            className="relative flex flex-col gap-4 px-6 pb-5 pt-6 sm:flex-row sm:items-center lg:px-10"
            style={{ background: SPOTLIGHT, borderBottom: `1px solid ${C.mat}` }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-11 w-11 items-center justify-center text-[19px]"
                style={{ background: C.ink, color: C.wall, ...display }}
              >
                Z
              </div>
              <div>
                <div className="text-[17px] leading-tight" style={display}>
                  ZZP · Collectie
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.28em]"
                  style={{ color: C.bronze, ...ui }}
                >
                  Gecureerd overzicht
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:ml-auto">
              <button
                className="flex items-center gap-2.5 rounded-full px-4 py-2 text-[12.5px] transition-colors hover:bg-[#efece5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
                style={{ color: C.muted, border: `1px solid ${C.mat}` }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoek in collectie</span>
              </button>
              <button
                className="relative rounded-full p-2.5 transition-colors hover:bg-[#efece5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
                style={{ color: C.muted, border: `1px solid ${C.mat}` }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.bronze }}
                  aria-hidden="true"
                />
              </button>
              <div
                className="hidden items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 sm:flex"
                style={{ border: `1px solid ${C.mat}` }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center text-[11px]"
                  style={{ background: C.green, color: C.wall, ...display }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="leading-tight">
                  <div className="text-[11.5px] font-semibold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="text-[9.5px] uppercase tracking-[0.14em]"
                    style={{ color: C.green }}
                  >
                    {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Zaal-navigatie (plattegrond) */}
          <nav
            className="flex gap-1 overflow-x-auto px-4 py-3 lg:px-8"
            style={{ borderBottom: `1px solid ${C.mat}` }}
            aria-label="Zalen"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
                  style={{
                    background: on ? C.ink : "transparent",
                    color: on ? C.wall : C.muted,
                  }}
                >
                  <span
                    className="text-[10px] tabular-nums tracking-[0.1em]"
                    style={{ color: on ? C.faint : C.bronze }}
                  >
                    ZAAL {ROMAN[i]}
                  </span>
                  <span className="text-[12.5px] font-medium">{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="px-6 py-9 lg:px-12 lg:py-11">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>

          {/* Voettekst — museale colofon */}
          <footer
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-4 text-[10.5px] uppercase tracking-[0.2em] lg:px-10"
            style={{ borderTop: `1px solid ${C.mat}`, color: C.faint }}
          >
            <span>Collectie {ROOM_LABEL[screen]}</span>
            <span aria-hidden="true">·</span>
            {NAV.slice(2).map((n) => (
              <span key={n}>{n}</span>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-5xl space-y-11">
      <RoomHeading
        room="Zaal I · Entree"
        title={`Welkom terug, ${PROFIEL.naam.split(" ")[0]}.`}
        note="Drie zorgvuldig gecureerde matches hangen klaar en één certificaat vraagt om aandacht. Neem rustig de tijd — de collectie wacht op u."
      />

      {/* KPI's als vitrinekaartjes */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Frame key={k.label}>
            <div className="px-4 py-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
                  cat. {ROMAN[i]}
                </span>
              </div>
              <p
                className="mt-2.5 text-[30px] tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-3.5 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                  style={{ color: k.up ? C.green : C.rust }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Sparkline data={k.spark} color={k.up ? C.green : C.bronze} />
              </div>
            </div>
          </Frame>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {/* Beste matches */}
          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="h-px w-6" style={{ background: C.bronze }} aria-hidden="true" />
              <h2
                className="text-[13px] font-semibold uppercase tracking-[0.26em]"
                style={{ color: C.bronze }}
              >
                Zaal II · Matches
              </h2>
            </div>
            <div className="space-y-5">
              {OPDRACHTEN.map((o) => (
                <Frame key={o.id} lifted>
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#faf8f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center text-[15px] tabular-nums"
                      style={{ background: C.bronzeSoft, color: C.bronze, ...display }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[15px] leading-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] tabular-nums sm:block"
                      style={{ color: C.inkSoft }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                  <Plaque
                    cat={`Cat.nr ${o.id}`}
                    titel={o.tags[0] ?? "Opdracht"}
                    meta={`${o.match}% match · ${o.uren} · ${o.start}`}
                  />
                </Frame>
              ))}
            </div>
          </div>

          {/* Correspondentie */}
          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="h-px w-6" style={{ background: C.bronze }} aria-hidden="true" />
                <h2
                  className="text-[13px] font-semibold uppercase tracking-[0.26em]"
                  style={{ color: C.bronze }}
                >
                  Correspondentie
                </h2>
              </div>
              <span className="text-[11px]" style={{ color: C.muted }}>
                {ongelezen} ongelezen
              </span>
            </div>
            <Frame>
              <div className="flex flex-col">
                {BERICHTEN.map((b, i) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3.5 px-4 py-3.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.mat}` }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center text-[11px]"
                      style={{
                        background: b.ongelezen ? C.green : C.matSoft,
                        color: b.ongelezen ? C.wall : C.muted,
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
                            style={{ background: C.bronze }}
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
              </div>
            </Frame>
          </div>
        </div>

        <div className="space-y-10">
          {/* Certificaten */}
          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="h-px w-6" style={{ background: C.bronze }} aria-hidden="true" />
              <h2
                className="text-[13px] font-semibold uppercase tracking-[0.26em]"
                style={{ color: C.bronze }}
              >
                Bewijsstukken
              </h2>
            </div>
            <Frame>
              <div className="px-4 py-4">
                <div className="space-y-4">
                  {CREDENTIALS.map((c) => {
                    const st = statusStyle(c.status);
                    return (
                      <div key={c.naam} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{ background: st.bg }}
                          aria-hidden="true"
                        >
                          <st.Icon size={14} style={{ color: st.fg }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold">{c.naam}</p>
                          <p
                            className="truncate text-[11.5px] italic"
                            style={{ color: C.muted, ...display }}
                          >
                            {c.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Frame>
          </div>

          {/* Volgende beste stap */}
          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="h-px w-6" style={{ background: C.bronze }} aria-hidden="true" />
              <h2
                className="text-[13px] font-semibold uppercase tracking-[0.26em]"
                style={{ color: C.bronze }}
              >
                Aanbevolen
              </h2>
            </div>
            <div className="p-1.5" style={{ background: C.ink }}>
              <div className="px-5 py-5" style={{ border: `1px solid rgba(255,255,255,0.12)` }}>
                <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: C.faint }}>
                  Volgende beste stap
                </p>
                <p
                  className="mt-2.5 text-[21px] leading-tight"
                  style={{ ...display, color: C.wall }}
                >
                  {primair.titel}
                </p>
                <p
                  className="mt-2 text-[12.5px] leading-relaxed"
                  style={{ color: "rgba(246,244,240,0.72)" }}
                >
                  {primair.detail}
                </p>
                <button
                  className="mt-4 w-full rounded-full py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-[#efece5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
                  style={{ background: C.wall, color: C.ink }}
                >
                  {primair.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <RoomHeading
        room="Zaal II · Matches"
        title="Open opdrachten"
        note="Elke opdracht als tentoongesteld object, met curator-onderschrift en vertrouwensmerk."
      />

      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ background: C.paper, border: `1px solid ${C.mat}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.bronze }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9b9488]"
          style={{ color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Frame>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.bronzeSoft }}
            >
              <Search size={24} aria-hidden="true" style={{ color: C.bronze }} />
            </div>
            <p className="mt-4 text-[22px]" style={{ ...display, color: C.ink }}>
              Deze zaal is momenteel leeg
            </p>
            <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: C.muted }}>
              Geen object voldoet aan uw zoekterm. Verruim gerust uw zoekwoorden of beschikbaarheid;
              we hangen nieuw werk op zodra het binnenkomt.
            </p>
          </div>
        </Frame>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {filtered.map((o) => (
            <Frame key={o.id} lifted>
              <button
                onClick={onOpen}
                className="w-full text-left transition-colors hover:bg-[#faf8f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
              >
                <div className="px-5 pb-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: C.faint }}
                    >
                      Cat.nr {o.id}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums"
                      style={{ background: C.greenSoft, color: C.green }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: C.green }}
                        aria-hidden="true"
                      />
                      {o.match}% match
                    </span>
                  </div>
                  <p className="mt-4 text-[22px] leading-snug" style={{ ...display, color: C.ink }}>
                    {o.titel}
                  </p>
                  <p
                    className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-1 text-[10.5px]"
                        style={{
                          background: C.matSoft,
                          color: C.inkSoft,
                          border: `1px solid ${C.mat}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
              <Plaque
                cat="Tarief"
                titel={o.tarief}
                meta={`${o.uren} · start ${o.start.replace("Per ", "").toLowerCase()}`}
              />
            </Frame>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <RoomHeading room={`Zaal III · Object · Cat.nr ${opdracht.id}`} title={opdracht.titel} />
        <button
          className="flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-[13px] font-semibold transition-colors hover:bg-[#332f28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
          style={{ background: C.ink, color: C.wall }}
        >
          <Send size={15} aria-hidden="true" /> Reageer op opdracht
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
        <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Frame key={m.l}>
            <div className="px-4 py-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                  {m.l}
                </p>
                <span className="text-[9px] uppercase tracking-[0.18em]" style={{ color: C.faint }}>
                  {ROMAN[i]}
                </span>
              </div>
              <p className="mt-2 text-[19px] tabular-nums" style={{ ...display, color: C.ink }}>
                {m.v}
              </p>
            </div>
          </Frame>
        ))}
      </div>

      <Frame lifted>
        <div className="px-6 py-6">
          <div className="flex items-baseline gap-3">
            <span className="h-px w-6" style={{ background: C.bronze }} aria-hidden="true" />
            <h3
              className="text-[13px] font-semibold uppercase tracking-[0.26em]"
              style={{ color: C.bronze }}
            >
              Curator-notitie
            </h3>
          </div>
          <p className="mt-3 text-[24px] leading-snug" style={{ ...display, color: C.ink }}>
            Waarom deze match
          </p>
          <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
            Transparant onderbouwd op basis van uw profiel — niets verborgen.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div
              className="p-5"
              style={{ background: C.greenSoft, border: `1px solid ${C.green}22` }}
            >
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: C.green }}
              >
                Pluspunten
              </p>
              <ul className="mt-3.5 space-y-3">
                {opdracht.redenen.plus.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[13px]">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ background: C.green }}
                      aria-hidden="true"
                    >
                      <Check size={12} style={{ color: C.wall }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="p-5"
              style={{ background: C.amberSoft, border: `1px solid ${C.amber}22` }}
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
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ background: C.amberSoft, border: `1px solid ${C.amber}44` }}
                      aria-hidden="true"
                    >
                      <Minus size={12} style={{ color: C.amber }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Frame>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <RoomHeading room="Zaal IV · Bewijs" title="Verificatie" />

      <Frame lifted>
        <div className="flex items-center gap-5 px-6 py-6" style={{ background: SPOTLIGHT }}>
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ background: C.greenSoft }}
          >
            <Check size={28} aria-hidden="true" style={{ color: C.green }} />
          </div>
          <div>
            <p className="text-[26px]" style={{ ...display, color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              <span className="tabular-nums">{verified}</span> van{" "}
              <span className="tabular-nums">{CREDENTIALS.length}</span> bewijsstukken volledig
              geverifieerd · <span className="tabular-nums">1</span> vraagt om aandacht. Alles
              veilig gearchiveerd.
            </p>
          </div>
        </div>
      </Frame>

      <div className="space-y-5">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <Frame key={c.naam}>
              <div className="flex items-center gap-4 px-5 py-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: st.bg }}
                >
                  <st.Icon size={18} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-tight" style={{ ...display, color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[12px] italic" style={{ color: C.muted, ...display }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[11px] font-medium"
                  style={{ color: st.fg, background: st.bg }}
                >
                  {st.label}
                </span>
              </div>
            </Frame>
          );
        })}
      </div>

      {/* Archief */}
      <div>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="h-px w-6" style={{ background: C.bronze }} aria-hidden="true" />
          <h2
            className="text-[13px] font-semibold uppercase tracking-[0.26em]"
            style={{ color: C.bronze }}
          >
            Archief · Documenten
          </h2>
        </div>
        <Frame>
          <div className="flex flex-col">
            {DOCUMENTEN.map((d, i) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.mat}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{ background: C.matSoft }}
                    aria-hidden="true"
                  >
                    <FileText size={15} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                    style={{ color: st.fg, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Frame>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle },
    info: { fg: C.bronze, bg: C.bronzeSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-9">
      <RoomHeading
        room="Zaal V · Attentie"
        title="Volgende acties"
        note="Eén object tegelijk onder de aandacht. De rest houden wij voor u in de gaten."
      />
      <div className="space-y-5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Frame key={a.titel}>
              <div className="flex items-start gap-4 px-5 py-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  style={{ background: t.bg }}
                >
                  <t.Icon size={20} aria-hidden="true" style={{ color: t.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: C.faint }}
                    >
                      Cat. {ROMAN[i]}
                    </span>
                    <p className="text-[16px] leading-tight" style={{ ...display, color: C.ink }}>
                      {a.titel}
                    </p>
                  </div>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#efece5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
                  style={{ color: t.fg, border: `1px solid ${t.fg}44` }}
                >
                  {a.cta}
                </button>
              </div>
            </Frame>
          );
        })}
      </div>

      <div
        className="flex items-center gap-4 px-5 py-4"
        style={{ background: C.wallDeep, border: `1px solid ${C.mat}` }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.greenSoft }}
        >
          <Check size={18} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bekeken? Uitstekend. Nieuwe objecten verschijnen hier zodra ze relevant worden — u
          hoeft niets zelf te bewaken.
        </p>
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.green, bg: C.greenSoft },
    Openstaand: { fg: C.amber, bg: C.amberSoft },
    Concept: { fg: C.muted, bg: C.matSoft },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <RoomHeading room="Zaal VI · Ledger" title="Facturen" />
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-[#332f28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6a45]"
          style={{ background: C.ink, color: C.wall }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Frame lifted>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.mat}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="px-5 py-3.5 font-semibold">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.matSoft };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#faf8f3]"
                    style={{ borderTop: `1px solid ${C.matSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td className="px-5 py-4 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
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
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                        style={{ color: t.fg, background: t.bg }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Frame>
    </div>
  );
}
