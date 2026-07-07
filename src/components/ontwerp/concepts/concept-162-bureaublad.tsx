"use client";

// Concept 162 — "Bureaublad" · spatial venster-OS met dock. UX-metafoor: een besturingssysteem-
// desktop. Een menubalk bovenaan (systeemstatus), elk kernscherm als een 'venster'-kaart met
// traffic-light-controls (rood/geel/groen bolletjes — puur decoratief chroom, nooit kleur-alleen
// status), subtiele venster-schaduw/diepte, en een DOCK onderaan met app-iconen om tussen schermen
// te schakelen (de schermschakelaar). Rustig, licht paneel-grijs, macOS-achtig. Onderscheidend van
// alle andere concepten: venster + dock als navigatie-chroom. Status altijd label + icoon. Determin-
// istisch — geen random/Date. UI-taal Nederlands. Fonts: Geist (interface) + JetBrains Mono (data).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  LayoutDashboard,
  Store,
  Briefcase,
  Zap,
  Receipt,
  Wifi,
  BatteryFull,
  Command,
  Bell,
  Circle,
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

// ── Palet — macOS-achtig licht paneel-grijs met één rustige systeem-accent (blauw) ──
const C = {
  accent: "#2f6df6",
  accentDeep: "#1f57d6",
  accentSoft: "#e7eefe",
  desk1: "#dfe3ea",
  desk2: "#eef1f6",
  chrome: "#f4f5f8",
  chromeDeep: "#e9ebf1",
  win: "#ffffff",
  winMuted: "#fbfcfe",
  line: "#e2e5ec",
  lineSoft: "#eef0f5",
  ink: "#1c2230",
  sub: "#616a7d",
  subSoft: "#8b94a6",
  ok: "#1f9d55",
  okSoft: "#e4f5ec",
  warn: "#b26a00",
  warnSoft: "#fbefd9",
  danger: "#d13a3a",
  dangerSoft: "#fbe6e6",
  tlRed: "#ff5f57",
  tlYel: "#febc2e",
  tlGrn: "#28c840",
  white: "#ffffff",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Zachte venster-schaduw (diepte boven het bureaublad).
const winShadow = {
  boxShadow: "0 1px 1px rgba(28,34,48,0.04), 0 18px 48px -20px rgba(28,34,48,0.35)",
};
const winShadowSm = {
  boxShadow: "0 1px 2px rgba(28,34,48,0.05), 0 8px 22px -14px rgba(28,34,48,0.3)",
};
const deskBg = `radial-gradient(120% 120% at 20% 0%, ${C.desk2} 0%, ${C.desk1} 100%)`;

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft, ring: "#bfe6cf" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.sub, bg: C.chromeDeep, ring: C.line };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnSoft,
        ring: "#f0d9a8",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft, ring: "#f0c2c2" };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
      style={{ ...ui, background: m.bg, color: m.fg, border: `1px solid ${m.ring}` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Traffic-light-controls — puur decoratief venster-chroom (geen status).
function TrafficLights() {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span className="h-3 w-3 rounded-full" style={{ background: C.tlRed }} />
      <span className="h-3 w-3 rounded-full" style={{ background: C.tlYel }} />
      <span className="h-3 w-3 rounded-full" style={{ background: C.tlGrn }} />
    </span>
  );
}

// Venster — titelbalk met traffic-lights + inhoud.
function Window({
  title,
  Icon,
  children,
  className = "",
  toolbar,
}: {
  title: string;
  Icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  toolbar?: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{ background: C.win, border: `1px solid ${C.line}`, ...winShadow }}
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ background: C.chrome, borderBottom: `1px solid ${C.line}` }}
      >
        <TrafficLights />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Icon size={13} strokeWidth={2.2} style={{ color: C.sub }} aria-hidden="true" />
          <span className="truncate text-[12.5px] font-semibold" style={{ ...ui, color: C.ink }}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {toolbar ?? <span className="w-[46px]" aria-hidden="true" />}
        </div>
      </div>
      {children}
    </section>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.sub }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.subSoft }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function matchTone(m: number): { bg: string; fg: string; ring: string } {
  if (m >= 90) return { bg: C.accentSoft, fg: C.accentDeep, ring: "#c6d8fd" };
  if (m >= 84) return { bg: C.okSoft, fg: C.ok, ring: "#bfe6cf" };
  return { bg: C.chromeDeep, fg: C.sub, ring: C.line };
}

// Mini staaf-diagram in vensterstijl.
function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.accent : C.chromeDeep,
          }}
        />
      ))}
    </div>
  );
}

// Dock-icoon — app-tegel in de onderbalk (schermschakelaar).
const DOCK_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: Bell,
  acties: Zap,
};

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept162() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const label = SCREENS.find((s) => s.key === screen)?.label ?? "";

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden antialiased"
      style={{ ...ui, background: deskBg, color: C.ink }}
    >
      {/* Menubalk — systeemstatus bovenaan */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-1.5 text-[12px] backdrop-blur md:px-6"
        style={{
          background: "rgba(244,245,248,0.82)",
          borderBottom: `1px solid ${C.line}`,
          color: C.ink,
        }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold">
            <span
              className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px]"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              <ShieldCheck size={11} strokeWidth={2.6} style={{ color: C.white }} />
            </span>
            ZZP OS
          </span>
          <nav
            className="hidden items-center gap-3.5 font-medium sm:flex"
            style={{ color: C.sub }}
            aria-label="Menu"
          >
            <span aria-current="page" style={{ color: C.ink, fontWeight: 600 }}>
              {label}
            </span>
            <span>Weergave</span>
            <span>Venster</span>
            <span>Help</span>
          </nav>
        </div>
        <div className="flex items-center gap-3.5" style={{ color: C.sub }}>
          <span className="hidden items-center gap-1.5 sm:flex" style={{ ...mono }}>
            <ShieldCheck size={13} strokeWidth={2.2} style={{ color: C.ok }} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
          <Wifi size={14} strokeWidth={2.2} aria-hidden="true" />
          <BatteryFull size={16} strokeWidth={2} aria-hidden="true" />
          <span style={{ ...mono }}>{PROFIEL.initialen}</span>
        </div>
      </header>

      {/* Bureaublad-oppervlak */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 pb-28 md:px-6 md:py-8 md:pb-28">
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

      {/* Dock — schermschakelaar onderaan */}
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-30 flex justify-center px-3">
        <nav
          className="pointer-events-auto flex items-end gap-1.5 rounded-2xl px-2.5 py-2 backdrop-blur"
          aria-label="Dock — schakel tussen schermen"
          style={{
            background: "rgba(255,255,255,0.72)",
            border: `1px solid ${C.line}`,
            boxShadow: "0 14px 40px -16px rgba(28,34,48,0.5)",
          }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const DIcon = DOCK_ICON[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                title={s.label}
                className="group relative flex flex-col items-center focus-visible:outline-none"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5 group-focus-visible:ring-2"
                  style={{
                    background: on ? C.accent : C.win,
                    border: `1px solid ${on ? C.accentDeep : C.line}`,
                    boxShadow: on
                      ? "0 6px 16px -6px rgba(47,109,246,0.7)"
                      : "0 2px 6px -3px rgba(28,34,48,0.3)",
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  <DIcon
                    size={20}
                    strokeWidth={2.1}
                    style={{ color: on ? C.white : C.sub }}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className="mt-1 h-1 w-1 rounded-full transition-opacity"
                  style={{ background: C.accent, opacity: on ? 1 : 0 }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-5">
      <Window title="Overzicht — Sanne de Vries" Icon={LayoutDashboard}>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
                style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
              >
                <Command size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
              </span>
              <h1
                className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]"
                style={{ ...ui, color: C.ink }}
              >
                Drie matches boven 85%. De omzet stijgt.
              </h1>
              <p className="mt-2.5 text-[14px] leading-relaxed" style={{ color: C.sub }}>
                Eén venster vraagt actie: je VOG verloopt binnenkort. Los het op en blijf
                verifieerbaar.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...ui, background: C.accent, ["--tw-ring-color" as string]: C.accent }}
                >
                  Bekijk matches <ArrowRight size={15} aria-hidden="true" />
                </button>
                <button
                  onClick={onActies}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-[#eef1f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...ui,
                    background: C.win,
                    color: C.ink,
                    border: `1px solid ${C.line}`,
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  <TriangleAlert
                    size={14}
                    strokeWidth={2.2}
                    style={{ color: C.warn }}
                    aria-hidden="true"
                  />{" "}
                  Los actie op
                </button>
              </div>
            </div>
            <div
              className="w-full rounded-xl p-4 sm:w-56"
              style={{ background: C.winMuted, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-medium uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.subSoft }}
                >
                  Verificatiedekking
                </span>
                <ShieldCheck
                  size={14}
                  strokeWidth={2.2}
                  style={{ color: C.ok }}
                  aria-hidden="true"
                />
              </div>
              <div
                className="mt-1.5 text-[36px] font-semibold leading-none tracking-[-0.03em]"
                style={{ ...ui, color: C.ink }}
              >
                {dek}%
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full"
                style={{ background: C.chromeDeep }}
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${dek}%`, background: C.ok }}
                />
              </div>
              <div className="mt-1.5 text-[11.5px]" style={{ color: C.sub }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
            </div>
          </div>
        </div>
      </Window>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-xl p-4"
            style={{ background: C.win, border: `1px solid ${C.line}`, ...winShadowSm }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-medium uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.subSoft }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...ui, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <Bars data={k.spark} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Window title="Aanbevolen matches" Icon={Store} className="lg:col-span-2">
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const t = matchTone(o.match);
              return (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-[#f7f9fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.accent }}
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                      style={{ background: t.bg, border: `1px solid ${t.ring}` }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[16px] font-semibold leading-none"
                        style={{ ...ui, color: t.fg }}
                      >
                        {o.match}
                      </span>
                      <span
                        className="text-[8px] font-medium uppercase"
                        style={{ ...mono, color: t.fg }}
                      >
                        match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[14.5px] font-semibold tracking-[-0.01em]"
                        style={{ ...ui, color: C.ink }}
                      >
                        {o.titel}
                      </div>
                      <div className="mt-0.5 truncate text-[12.5px]" style={{ color: C.sub }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              ...ui,
                              background: C.chrome,
                              color: C.sub,
                              border: `1px solid ${C.lineSoft}`,
                            }}
                          >
                            <Check
                              size={10}
                              strokeWidth={3}
                              style={{ color: C.ok }}
                              aria-hidden="true"
                            />{" "}
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight
                      size={17}
                      className="shrink-0"
                      style={{ color: C.subSoft }}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </Window>

        <Window title="Prioriteit" Icon={Zap}>
          <div className="p-4">
            <div
              className="rounded-xl p-4"
              style={{ background: C.warnSoft, border: `1px solid #f0d9a8` }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.warn }}
              >
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Urgent
              </span>
              <h3
                className="mt-2 text-[15.5px] font-semibold leading-tight"
                style={{ ...ui, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...ui, background: C.warn, ["--tw-ring-color" as string]: C.warn }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 space-y-1.5">
              {BERICHTEN.slice(0, 2).map((b) => (
                <div
                  key={b.van}
                  className="flex items-center gap-2.5 rounded-lg p-2.5"
                  style={{ background: C.winMuted, border: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold"
                    style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="truncate text-[12px] font-semibold"
                        style={{ ...ui, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <Circle size={7} strokeWidth={0} fill={C.accent} aria-label="ongelezen" />
                      )}
                    </div>
                    <p className="truncate text-[11.5px]" style={{ color: C.sub }}>
                      {b.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Window
      title="Marktplaats — open opdrachten"
      Icon={Store}
      toolbar={
        <div
          className="flex items-center gap-1.5 rounded-lg px-2 py-1"
          style={{ background: C.win, border: `1px solid ${C.line}` }}
        >
          <Search size={13} style={{ color: C.subSoft }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoeken…"
            aria-label="Opdrachten zoeken"
            className="w-24 bg-transparent text-[12px] outline-none placeholder:opacity-60 sm:w-36"
            style={{ ...ui, color: C.ink }}
          />
        </div>
      }
    >
      <div className="p-4 sm:p-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: C.chrome, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Search size={22} style={{ color: C.subSoft }} />
            </span>
            <p className="text-[17px] font-semibold" style={{ ...ui, color: C.ink }}>
              Geen resultaten
            </p>
            <p className="max-w-xs text-[13px]" style={{ color: C.sub }}>
              Niets gevonden voor “{q}”. Pas je zoekterm aan.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-1 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...ui, background: C.accent, ["--tw-ring-color" as string]: C.accent }}
            >
              Zoekterm wissen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((o) => {
              const t = matchTone(o.match);
              return (
                <div
                  key={o.id}
                  className="flex flex-col overflow-hidden rounded-xl"
                  style={{ background: C.win, border: `1px solid ${C.line}`, ...winShadowSm }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <span
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
                      style={{ background: t.bg, border: `1px solid ${t.ring}` }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[15px] font-semibold leading-none"
                        style={{ ...ui, color: t.fg }}
                      >
                        {o.match}
                      </span>
                      <span
                        className="text-[7px] font-medium uppercase"
                        style={{ ...mono, color: t.fg }}
                      >
                        match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[14.5px] font-semibold leading-tight tracking-[-0.01em]"
                        style={{ ...ui, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                        {o.opdrachtgever}
                      </p>
                    </div>
                  </div>
                  <div
                    className="px-4 pb-3"
                    style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 12 }}
                  >
                    <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                      <Meta Icon={MapPin} value={o.plaats} />
                      <Meta Icon={Coins} value={o.tarief} />
                      <Meta Icon={Clock} value={o.uren} />
                      <Meta Icon={CalendarDays} value={o.start} />
                    </dl>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md px-2 py-0.5 text-[10.5px] font-medium"
                          style={{
                            ...ui,
                            background: C.chrome,
                            color: C.sub,
                            border: `1px solid ${C.lineSoft}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onOpen}
                    className="mt-auto flex items-center justify-center gap-2 py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-[#f7f9fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{
                      ...ui,
                      color: C.accentDeep,
                      borderTop: `1px solid ${C.lineSoft}`,
                      ["--tw-ring-color" as string]: C.accent,
                    }}
                  >
                    Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Window>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[#eef1f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...ui,
          background: C.win,
          color: C.ink,
          border: `1px solid ${C.line}`,
          ...winShadowSm,
          ["--tw-ring-color" as string]: C.accent,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Window title={`Opdracht — ${opdracht.id}`} Icon={Briefcase}>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <span
                className="inline-block rounded-md px-2 py-1 text-[11px] font-medium"
                style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
              >
                {opdracht.id}
              </span>
              <h1
                className="mt-3 max-w-2xl text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]"
                style={{ ...ui, color: C.ink }}
              >
                {opdracht.titel}
              </h1>
              <p className="mt-2 text-[14px]" style={{ color: C.sub }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <div
              className="flex flex-col items-center rounded-xl px-5 py-3"
              style={{ background: C.accentSoft, border: `1px solid #c6d8fd` }}
            >
              <span
                className="text-[40px] font-semibold leading-none tracking-[-0.03em]"
                style={{ ...ui, color: C.accentDeep }}
              >
                {opdracht.match}
              </span>
              <span
                className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.accentDeep }}
              >
                % match
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {feiten.map((f) => (
              <div
                key={f.l}
                className="rounded-xl p-3.5"
                style={{ background: C.winMuted, border: `1px solid ${C.line}` }}
              >
                <f.Icon
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.accent }}
                  aria-hidden="true"
                />
                <div
                  className="mt-2 text-[15px] font-semibold leading-none"
                  style={{ ...ui, color: C.ink }}
                >
                  {f.v}
                </div>
                <div
                  className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.subSoft }}
                >
                  {f.l}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div
              className="rounded-xl p-4"
              style={{ background: C.winMuted, border: `1px solid ${C.line}` }}
            >
              <h3
                className="flex items-center gap-2 text-[13px] font-semibold"
                style={{ ...ui, color: C.ink }}
              >
                <Check size={15} strokeWidth={2.4} style={{ color: C.ok }} aria-hidden="true" />{" "}
                Waarom dit past
              </h3>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                    style={{ color: C.ink }}
                  >
                    <span
                      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                      style={{ background: C.okSoft, border: `1px solid #bfe6cf` }}
                      aria-hidden="true"
                    >
                      <Check size={11} strokeWidth={3} style={{ color: C.ok }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: C.winMuted, border: `1px solid ${C.line}` }}
            >
              <h3
                className="flex items-center gap-2 text-[13px] font-semibold"
                style={{ ...ui, color: C.ink }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Om te overwegen
              </h3>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                    style={{ color: C.ink }}
                  >
                    <span
                      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                      style={{ background: C.warnSoft, border: `1px solid #f0d9a8` }}
                      aria-hidden="true"
                    >
                      <TriangleAlert size={10} strokeWidth={2.8} style={{ color: C.warn }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-[13.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...ui, background: C.accent, ["--tw-ring-color" as string]: C.accent }}
            >
              Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-[13.5px] font-semibold transition-colors hover:bg-[#eef1f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...ui,
                background: C.win,
                color: C.ink,
                border: `1px solid ${C.line}`,
                ["--tw-ring-color" as string]: C.accent,
              }}
            >
              <Star size={15} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />{" "}
              Bewaar
            </button>
          </div>
        </div>
      </Window>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <Window
      title="Verificatie & certificaten"
      Icon={ShieldCheck}
      toolbar={
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2"
          style={{ ...ui, background: C.accent, ["--tw-ring-color" as string]: C.accent }}
        >
          <Plus size={13} aria-hidden="true" /> Toevoegen
        </button>
      }
    >
      <div className="p-4 sm:p-5">
        <div
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-5"
          style={{ background: C.accentSoft, border: `1px solid #c6d8fd` }}
        >
          <div className="flex items-center gap-5">
            <div
              className="text-[48px] font-semibold leading-none tracking-[-0.03em]"
              style={{ ...ui, color: C.accentDeep }}
            >
              {dek}%
            </div>
            <div className="max-w-xs">
              <div className="text-[15px] font-semibold" style={{ ...ui, color: C.ink }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.sub }}>
                Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
                vertrouwen.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold"
            style={{ ...mono, background: C.win, color: C.ok, border: `1px solid #bfe6cf` }}
          >
            <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const m = credMeta(c.status);
            const actionable = c.status !== "VERIFIED";
            return (
              <div
                key={c.naam}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: C.winMuted, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.bg, border: `1px solid ${m.ring}` }}
                  aria-hidden="true"
                >
                  <m.Icon size={18} strokeWidth={2.2} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14px] font-semibold tracking-[-0.01em]"
                    style={{ ...ui, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                    {c.detail}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <StatusTag status={c.status} />
                    {actionable && (
                      <button
                        className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#eef1f6] focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          ...ui,
                          background: C.win,
                          color: C.accentDeep,
                          border: `1px solid ${C.line}`,
                          ["--tw-ring-color" as string]: C.accent,
                        }}
                      >
                        {c.status === "EXPIRING"
                          ? "Vernieuwen"
                          : c.status === "REJECTED"
                            ? "Opnieuw indienen"
                            : "Bekijk"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Window>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <Window title="Volgende beste acties" Icon={Zap}>
      <div className="p-4 sm:p-5">
        <p className="mb-3 text-[13px]" style={{ color: C.sub }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
        <ol className="space-y-3">
          {sorted.map((a, i) => {
            const warn = a.urgentie === "warning";
            return (
              <li
                key={a.titel}
                className="flex items-stretch overflow-hidden rounded-xl"
                style={{
                  background: warn ? C.warnSoft : C.winMuted,
                  border: `1px solid ${warn ? "#f0d9a8" : C.line}`,
                }}
              >
                <span
                  className="flex w-12 shrink-0 items-center justify-center text-[22px] font-semibold"
                  style={{
                    ...ui,
                    background: warn ? "transparent" : C.chrome,
                    color: warn ? C.warn : C.subSoft,
                    borderRight: `1px solid ${warn ? "#f0d9a8" : C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={20} strokeWidth={2.2} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        ...mono,
                        background: warn ? C.warn : C.accentSoft,
                        color: warn ? C.white : C.accentDeep,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15px] font-semibold tracking-[-0.01em]"
                      style={{ ...ui, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                  <button
                    className="mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      ...ui,
                      background: warn ? C.warn : C.accent,
                      ["--tw-ring-color" as string]: warn ? C.warn : C.accent,
                    }}
                  >
                    {a.cta} <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Window>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft, ring: "#bfe6cf" };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft, ring: "#f0d9a8" };
    return { label: "Concept", Icon: FileText, fg: C.sub, bg: C.chromeDeep, ring: C.line };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <Window
      title="Facturen"
      Icon={Receipt}
      toolbar={
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2"
          style={{ ...ui, background: C.accent, ["--tw-ring-color" as string]: C.accent }}
        >
          <Plus size={13} aria-hidden="true" /> Nieuw
        </button>
      }
    >
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { l: "Betaald (mnd)", v: betaald },
            { l: "Openstaand", v: `${open}` },
            { l: "Te factureren", v: "€ 1.350" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl p-4"
              style={{ background: C.winMuted, border: `1px solid ${C.line}` }}
            >
              <div
                className="text-[10.5px] font-medium uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.subSoft }}
              >
                {s.l}
              </div>
              <div
                className="mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.02em]"
                style={{ ...ui, color: C.ink }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
          <ul>
            {FACTUREN.map((f, i) => {
              const m = factMeta(f.status);
              return (
                <li
                  key={f.nr}
                  className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#f7f9fc]"
                  style={{
                    background: C.win,
                    borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                  }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: m.bg, border: `1px solid ${m.ring}` }}
                    aria-hidden="true"
                  >
                    <m.Icon size={15} strokeWidth={2.2} style={{ color: m.fg }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[13.5px] font-semibold tracking-[-0.01em]"
                      style={{ ...ui, color: C.ink }}
                    >
                      {f.nr}
                    </div>
                    <div className="text-[12px]" style={{ color: C.sub }}>
                      {f.klant} · {f.datum}
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
                    style={{ ...ui, background: m.bg, color: m.fg, border: `1px solid ${m.ring}` }}
                  >
                    <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                  </span>
                  <span
                    className="w-24 text-right text-[15px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </span>
                </li>
              );
            })}
          </ul>
          <div
            className="flex items-center justify-between p-4"
            style={{ background: C.chrome, borderTop: `1px solid ${C.line}` }}
          >
            <span
              className="text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.subSoft }}
            >
              Totaal betaald
            </span>
            <span
              className="text-[17px] font-semibold tabular-nums"
              style={{ ...ui, color: C.ink }}
            >
              {betaald}
            </span>
          </div>
        </div>
      </div>
    </Window>
  );
}
