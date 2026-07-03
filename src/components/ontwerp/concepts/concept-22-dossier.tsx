"use client";

// Concept 22 — "Dossier" · Skeuomorf archief/kluis (neo-skeuomorphism 2026).
// Een fysiek dossier voor gevoelige documenten: mappen met tab-navigatie als map-tabbladen bovenaan,
// kraftpapier-textuur, een lakzegel/stempel voor geverifieerde certificaten, “vertrouwelijk”-stempels,
// gestanste ringband-gaatjes links en monospace REF-nummers. Tactiel, warm, vertrouwenwekkend.
// Palet: papier #ece4d3, manila #d9c48f, ink #33291c, dossier-rood/lak #9a2b1e,
// geverifieerd-groen #4a6b3c, kraft-lijn #c3b492. Zachte dubbele schaduw voor diepte.
// Fonts: Newsreader (labels/koppen) + JetBrains Mono (typemachine-cijfers/refs).

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
  ShieldCheck,
  FileText,
  Paperclip,
  Stamp,
  Archive,
  Plus,
  MapPin,
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

const C = {
  ink: "#33291c",
  inkSoft: "#5e5140",
  muted: "#867660",
  faint: "#a89a7d",
  paper: "#ece4d3",
  paperSoft: "#f4eee0",
  card: "#f7f2e6",
  manila: "#d9c48f",
  manilaSoft: "#e6d6ac",
  kraft: "#c3b492",
  kraftSoft: "#d8cbaa",
  line: "#cbbd9d",
  lineSoft: "#ddd0b3",
  lak: "#9a2b1e",
  lakSoft: "rgba(154,43,30,0.12)",
  groen: "#4a6b3c",
  groenSoft: "rgba(74,107,60,0.14)",
  amber: "#b07d24",
  amberSoft: "rgba(176,125,36,0.16)",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Zachte dubbele schaduw voor tactiele diepte.
const SHADOW = "0 1px 0 rgba(255,255,255,0.6) inset, 0 16px 34px -20px rgba(51,41,28,0.42)";
const SHADOW_SM = "0 1px 0 rgba(255,255,255,0.5) inset, 0 10px 22px -16px rgba(51,41,28,0.34)";
// Kraftpapier-textuur via subtiele overlappende gradients (geen externe assets).
const KRAFT =
  "repeating-linear-gradient(90deg, rgba(120,95,55,0.028) 0px, rgba(120,95,55,0.028) 1px, transparent 1px, transparent 4px), radial-gradient(120% 120% at 20% 0%, rgba(255,250,235,0.5), transparent 55%)";

const TAB_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Archive,
  marktplaats: Search,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: Clock,
  facturen: FileText,
  documenten: Paperclip,
  berichten: Bell,
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.groen, bg: C.groenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.amber, bg: C.amberSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.lak, bg: C.lakSoft };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.lak, bg: C.lakSoft };
  }
}

function Sparkline({ data, color = C.lak }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}

// Gestempeld lakzegel voor geverifieerde certificaten.
function WaxSeal({ size = 46, label = "OK" }: { size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 4px 6px rgba(51,41,28,0.35))" }}
    >
      <circle cx="50" cy="50" r="46" fill={C.lak} />
      <circle cx="50" cy="50" r="46" fill="url(#seal-hl)" opacity="0.35" />
      <defs>
        <radialGradient id="seal-hl" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {Array.from({ length: 22 }).map((_, i) => {
        const a = (i / 22) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={50 + Math.cos(a) * 44}
            cy={50 + Math.sin(a) * 44}
            r="2.4"
            fill={C.lak}
          />
        );
      })}
      <circle cx="50" cy="50" r="34" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.5" />
      <text
        x="50"
        y="46"
        textAnchor="middle"
        fontSize="15"
        fill="#fff"
        opacity="0.92"
        style={serif}
        fontWeight="600"
      >
        {label}
      </text>
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontSize="7"
        fill="#fff"
        opacity="0.7"
        style={mono}
        letterSpacing="1"
      >
        ZZP
      </text>
      <title>{`Zegel: ${label}`}</title>
    </svg>
  );
}

// Ringband-gaatjes langs de linkerrand van een dossierpagina.
function BinderHoles() {
  return (
    <div
      className="absolute left-2 top-0 hidden h-full flex-col items-center justify-around py-6 sm:flex"
      aria-hidden="true"
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className="h-3 w-3 rounded-full"
          style={{
            background: C.paper,
            boxShadow: "inset 0 1px 2px rgba(51,41,28,0.45)",
            border: `1px solid ${C.line}`,
          }}
        />
      ))}
    </div>
  );
}

function Folder({
  children,
  className = "",
  holes = false,
}: {
  children: React.ReactNode;
  className?: string;
  holes?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[10px] ${holes ? "pl-8 sm:pl-9" : ""} ${className}`}
      style={{
        background: C.card,
        backgroundImage: KRAFT,
        boxShadow: SHADOW,
        border: `1px solid ${C.line}`,
      }}
    >
      {holes && <BinderHoles />}
      {children}
    </div>
  );
}

// Herbruikbaar "vertrouwelijk"-hoekstempel.
function ConfidentialStamp() {
  return (
    <span
      className="pointer-events-none absolute right-3 top-3 rotate-[-8deg] select-none rounded-[3px] px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.16em]"
      style={{ color: C.lak, border: `1.5px solid ${C.lak}`, opacity: 0.5, ...mono }}
      aria-hidden="true"
    >
      Vertrouwelijk
    </span>
  );
}

function Kicker({ children, color = C.lak }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...mono, color }}
    >
      {children}
    </p>
  );
}

export function Concept22() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...serif,
        color: C.ink,
        background:
          "radial-gradient(1000px 520px at 12% -6%, rgba(154,43,30,0.05), transparent 60%), radial-gradient(900px 500px at 92% 4%, rgba(74,107,60,0.05), transparent 58%), " +
          C.paper,
      }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-[1180px] flex-col px-4 py-6 lg:px-8 lg:py-8">
        {/* Kop */}
        <header className="mb-4 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[9px] text-white"
            style={{ background: C.lak, boxShadow: SHADOW_SM }}
          >
            <Archive size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-[17px] font-semibold leading-tight" style={serif}>
              ZZP Dossier
            </div>
            <div className="text-[10.5px]" style={{ ...mono, color: C.muted }}>
              REF · {PROFIEL.initialen}-2026 · {PROFIEL.rol}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <button
              className="hidden items-center gap-2.5 rounded-[8px] px-4 py-2.5 text-[12.5px] transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 sm:flex"
              style={{
                background: C.card,
                color: C.muted,
                boxShadow: SHADOW_SM,
                border: `1px solid ${C.line}`,
              }}
              aria-label="Zoeken in het archief"
            >
              <Search size={14} aria-hidden="true" />
              <span>Zoek in het archief…</span>
            </button>
            <button
              className="relative rounded-[8px] p-2.5 transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: C.card,
                color: C.muted,
                boxShadow: SHADOW_SM,
                border: `1px solid ${C.line}`,
              }}
              aria-label="Meldingen"
            >
              <Bell size={16} aria-hidden="true" />
              <span
                className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                style={{ background: C.lak }}
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        {/* Map-tabbladen bovenaan (navigatie) */}
        <div className="relative z-10 flex items-end gap-1 overflow-x-auto pl-1">
          {SCREENS.map((s) => {
            const Icon = TAB_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group relative -mb-px flex shrink-0 items-center gap-2 rounded-t-[10px] px-4 py-2.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: on ? C.ink : C.inkSoft,
                  background: on ? C.card : C.manilaSoft,
                  backgroundImage: on ? KRAFT : "none",
                  border: `1px solid ${C.line}`,
                  borderBottom: on ? `1px solid ${C.card}` : `1px solid ${C.line}`,
                  boxShadow: on ? "0 -6px 14px -10px rgba(51,41,28,0.3)" : "none",
                  transform: on ? "translateY(0)" : "translateY(3px)",
                  zIndex: on ? 20 : 1,
                }}
              >
                <Icon size={13} aria-hidden="true" style={{ color: on ? C.lak : C.muted }} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Dossierpagina */}
        <div
          className="relative z-0 flex-1 rounded-[10px] rounded-tl-none p-5 lg:p-7"
          style={{
            background: C.card,
            backgroundImage: KRAFT,
            boxShadow: SHADOW,
            border: `1px solid ${C.line}`,
          }}
        >
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2 border-b pb-5" style={{ borderColor: C.lineSoft }}>
        <Kicker>Dossieromslag · vandaag</Kicker>
        <h1 className="text-[32px] font-semibold leading-[1.05] tracking-tight" style={serif}>
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p
          className="max-w-lg text-[13.5px] leading-relaxed"
          style={{ ...serif, color: C.inkSoft }}
        >
          Je dossier is bijgewerkt. Drie opdrachten liggen ter inzage in de map en één certificaat
          vraagt om een nieuw zegel.
        </p>
      </div>

      {/* KPI's als dossierkaarten */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Folder key={k.label} className="p-4">
            <p className="text-[11.5px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold leading-none tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-3.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums"
                style={{
                  color: k.up ? C.groen : C.lak,
                  background: k.up ? C.groenSoft : C.lakSoft,
                  ...mono,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.groen : C.lak} />
            </div>
          </Folder>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Beste matches */}
          <div>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="text-[18px] font-semibold" style={serif}>
                Beste matches — ter inzage
              </h2>
              <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
                gesorteerd op match
              </span>
            </div>
            <Folder holes className="p-2.5">
              <div className="flex flex-col gap-1">
                {OPDRACHTEN.map((o) => (
                  <button
                    key={o.id}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 rounded-[8px] px-3.5 py-3 text-left transition-colors hover:bg-[#efe7d5] focus-visible:outline-none focus-visible:ring-2"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold tabular-nums"
                      style={{
                        background: C.manilaSoft,
                        color: C.ink,
                        border: `1px solid ${C.line}`,
                        ...mono,
                      }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[11.5px] tabular-nums sm:block"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                ))}
              </div>
            </Folder>
          </div>

          {/* Berichten — als binnengekomen correspondentie */}
          <div>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="text-[18px] font-semibold" style={serif}>
                Correspondentie
              </h2>
              <span className="text-[11px]" style={{ ...mono, color: C.lak }}>
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <Folder className="p-2.5">
              <div className="flex flex-col gap-0.5">
                {BERICHTEN.map((b) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3.5 rounded-[8px] px-3.5 py-2.5 transition-colors hover:bg-[#efe7d5]"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[10.5px] font-semibold text-white"
                      style={{ background: b.ongelezen ? C.lak : C.faint }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
                        {b.ongelezen && (
                          <Paperclip size={11} aria-hidden="true" style={{ color: C.lak }} />
                        )}
                      </div>
                      <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10.5px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Folder>
          </div>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 px-1 text-[18px] font-semibold" style={serif}>
              Certificatenmap
            </h2>
            <Folder className="p-4">
              <div className="space-y-3.5">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      {c.status === "VERIFIED" ? (
                        <WaxSeal size={30} label="✓" />
                      ) : (
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                          style={{ background: st.bg }}
                          aria-hidden="true"
                        >
                          <span className="h-2 w-2 rounded-full" style={{ background: st.fg }} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold">{c.naam}</p>
                        <p className="truncate text-[11px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Folder>
          </div>

          {/* Volgende beste stap */}
          <Folder className="relative overflow-hidden p-0">
            <ConfidentialStamp />
            <div className="px-4 py-3.5" style={{ background: C.lak }}>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80"
                style={mono}
              >
                Volgende beste stap
              </p>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug text-white" style={serif}>
                {primair.titel}
              </p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[12px] leading-relaxed" style={{ ...serif, color: C.inkSoft }}>
                {primair.detail}
              </p>
              <button
                className="mt-3 w-full rounded-[8px] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.lak }}
              >
                {primair.cta}
              </button>
            </div>
          </Folder>
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
    <div className="space-y-6">
      <div className="border-b pb-5" style={{ borderColor: C.lineSoft }}>
        <Kicker color={C.groen}>Marktplaats · openstaande dossiers</Kicker>
        <h1 className="mt-2.5 text-[27px] font-semibold leading-tight tracking-tight" style={serif}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-[8px] px-4 py-3"
        style={{ background: C.paperSoft, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a89a7d]"
          style={{ ...serif, color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <Folder className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.manilaSoft, border: `1px solid ${C.line}` }}
          >
            <Archive size={26} aria-hidden="true" style={{ color: C.muted }} />
          </div>
          <p className="mt-4 text-[18px] font-semibold" style={serif}>
            Geen dossiers gevonden
          </p>
          <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ ...serif, color: C.muted }}>
            Pas je zoekwoorden aan. Nieuwe opdrachten worden automatisch aan het archief toegevoegd
            zodra ze binnenkomen.
          </p>
        </Folder>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group relative rounded-[10px] p-5 text-left transition-all hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: C.card,
                backgroundImage: KRAFT,
                boxShadow: SHADOW,
                border: `1px solid ${C.line}`,
              }}
            >
              {/* map-tab hoekje */}
              <span
                className="absolute -top-2 left-5 h-3 w-16 rounded-t-[6px]"
                style={{
                  background: C.manila,
                  border: `1px solid ${C.line}`,
                  borderBottom: "none",
                }}
                aria-hidden="true"
              />
              <Paperclip
                size={16}
                aria-hidden="true"
                className="absolute -top-2 right-6 rotate-[18deg]"
                style={{ color: C.muted }}
              />
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] tracking-wide" style={{ ...mono, color: C.faint }}>
                  REF · {o.id}
                </span>
                <span
                  className="rounded-[4px] px-2.5 py-1 text-[11px] font-semibold tabular-nums"
                  style={{ background: C.groenSoft, color: C.groen, ...mono }}
                >
                  {o.match}% match
                </span>
              </div>
              <p className="mt-3 text-[17px] font-semibold leading-snug" style={serif}>
                {o.titel}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[4px] px-2.5 py-1 text-[10px] font-medium"
                    style={{ background: C.manilaSoft, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3.5 text-[12px]"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="font-semibold tabular-nums" style={{ ...mono, color: C.lak }}>
                  {o.tarief}
                </span>
                <span className="tabular-nums" style={{ ...mono, color: C.muted }}>
                  {o.uren}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="space-y-6">
      <div
        className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between"
        style={{ borderColor: C.lineSoft }}
      >
        <div>
          <Kicker>REF · {opdracht.id}</Kicker>
          <h1
            className="mt-2.5 text-[27px] font-semibold leading-tight tracking-tight"
            style={serif}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-[8px] px-6 py-3 text-[13px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.lak, boxShadow: SHADOW_SM }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Folder key={m.l} className="p-4">
            <p className="text-[10.5px]" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </p>
          </Folder>
        ))}
      </div>

      <Folder holes className="relative p-6">
        <ConfidentialStamp />
        <h3 className="text-[18px] font-semibold" style={serif}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je dossier — niets verborgen.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-[8px] p-4" style={{ background: C.groenSoft }}>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.groen }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[12.5px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.groen }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[8px] p-4" style={{ background: C.amberSoft }}>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[12.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(176,125,36,0.24)" }}
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
      </Folder>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <div className="border-b pb-5" style={{ borderColor: C.lineSoft }}>
        <Kicker>Kluis · vertrouwen</Kicker>
        <h1 className="mt-2.5 text-[27px] font-semibold leading-tight tracking-tight" style={serif}>
          Verificatie
        </h1>
      </div>

      <Folder className="flex items-center gap-5 p-5">
        <WaxSeal size={58} label="✓" />
        <div>
          <p className="text-[20px] font-semibold" style={serif}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            certificaten gezegeld · <span style={mono}>1</span> vraagt om een nieuw zegel. Alles
            verzegeld bewaard.
          </p>
        </div>
      </Folder>

      <Folder holes className="p-2.5">
        <div className="flex flex-col gap-0.5">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 rounded-[8px] px-3.5 py-3.5 transition-colors hover:bg-[#efe7d5]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  {c.status === "VERIFIED" ? (
                    <WaxSeal size={38} label="✓" />
                  ) : (
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                      style={{ background: st.bg }}
                    >
                      {c.status === "SUBMITTED" ? (
                        <Clock size={17} aria-hidden="true" style={{ color: st.fg }} />
                      ) : (
                        <AlertTriangle size={17} aria-hidden="true" style={{ color: st.fg }} />
                      )}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] px-3 py-1 text-[11px] font-semibold"
                  style={{ color: st.fg, background: st.bg }}
                >
                  {c.status === "VERIFIED" && <Stamp size={11} aria-hidden="true" />}
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Folder>

      <div>
        <h2 className="mb-3 px-1 text-[18px] font-semibold" style={serif}>
          Verzegelde documenten
        </h2>
        <Folder className="p-2.5">
          <div className="flex flex-col gap-0.5">
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 rounded-[8px] px-3.5 py-3 transition-colors hover:bg-[#efe7d5]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                    style={{ background: C.manilaSoft, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <FileText size={16} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                    <p className="truncate text-[10.5px]" style={{ ...mono, color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-[4px] px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.fg, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Folder>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle },
    info: { fg: C.lak, bg: C.lakSoft, Icon: Bell },
  };
  return (
    <div className="space-y-6">
      <div className="border-b pb-5" style={{ borderColor: C.lineSoft }}>
        <Kicker>Openstaande posten</Kicker>
        <h1 className="mt-2.5 text-[27px] font-semibold leading-tight tracking-tight" style={serif}>
          Volgende acties
        </h1>
        <p className="mt-2 text-[13px]" style={{ ...serif, color: C.inkSoft }}>
          Eén post tegelijk afhandelen. Wij houden de rest van het dossier bij.
        </p>
      </div>
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Folder key={a.titel} className="flex items-start gap-4 p-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: t.bg }}
              >
                <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    POST-{String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14px] font-semibold" style={serif}>
                    {a.titel}
                  </p>
                </div>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-[8px] px-4 py-2 text-[12px] font-semibold transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.lakSoft, color: C.lak }}
              >
                {a.cta}
              </button>
            </Folder>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.groen, bg: C.groenSoft },
    Openstaand: { fg: C.amber, bg: C.amberSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  return (
    <div className="space-y-6">
      <div
        className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between"
        style={{ borderColor: C.lineSoft }}
      >
        <div>
          <Kicker>Grootboek</Kicker>
          <h1
            className="mt-2.5 text-[27px] font-semibold leading-tight tracking-tight"
            style={serif}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[8px] px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.lak, boxShadow: SHADOW_SM }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Folder holes className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="px-5 py-3 font-semibold">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.lineSoft };
                return (
                  <tr
                    key={f.nr}
                    className="border-t transition-colors hover:bg-[#efe7d5]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...mono, color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium" style={serif}>
                      {f.klant}
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...mono, color: C.muted }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1 text-[11px] font-semibold"
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
      </Folder>
    </div>
  );
}
