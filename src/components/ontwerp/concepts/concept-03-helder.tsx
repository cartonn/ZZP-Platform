"use client";

// Concept 03 — "Helder" · Toegankelijk hoog-contrast (LIGHT, accessibility-as-aesthetic).
// Bewijs dat toegankelijk mooi is: zuiver witte achtergrond, bijna-zwarte tekst, WCAG-AAA-contrast.
// Grote, leesbare typografie (body >=16px, royale koppen), dikke focusringen (ring-4 met offset),
// ruime witruimte en grote raakdoelen (>=44px), onderstreepte links. Status is NOOIT alleen kleur —
// altijd gekoppeld aan een tekstlabel én een icoon. Zelfverzekerd, helder, royale hiërarchie.
// Palet: bg #ffffff, panel #f7f8fa, ink #0a0a0a, inkSoft #2b2f36, muted #50555d,
// line #d2d6dc, accent blauw #1d4ed8, accentSoft #e6edff,
// success #15803d, successSoft #e3f4e8, warn #92400e, warnSoft #fbe5cf, danger #b91c1c.
// Font: Manrope (groot).

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  MapPin,
  Command,
  ArrowRight,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#ffffff",
  panel: "#f7f8fa",
  ink: "#0a0a0a",
  inkSoft: "#2b2f36",
  muted: "#50555d",
  line: "#d2d6dc",
  lineStrong: "#b6bcc5",
  accent: "#1d4ed8",
  accentSoft: "#e6edff",
  success: "#15803d",
  successSoft: "#e3f4e8",
  warn: "#92400e",
  warnSoft: "#fbe5cf",
  danger: "#b91c1c",
  dangerSoft: "#fbe3e3",
};

const ui = { fontFamily: "var(--font-lab-manrope)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.success, bg: C.successSoft, Icon: CheckCircle2 };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accent, bg: C.accentSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.danger, bg: C.dangerSoft, Icon: XCircle };
  }
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function StatusBadge({ status }: { status: CredStatus }) {
  const st = statusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[14px] font-bold"
      style={{ background: st.bg, color: st.fg }}
    >
      <st.Icon size={16} aria-hidden="true" />
      {st.label}
    </span>
  );
}

export function Concept03() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[260px] shrink-0 flex-col border-r-2 px-4 py-6 md:flex"
          style={{ borderColor: C.line }}
        >
          <div className="flex items-center gap-3 px-2 pb-8">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[18px] font-extrabold text-white"
              style={{ background: C.accent }}
            >
              Z
            </div>
            <div className="leading-tight">
              <div className="text-[16px] font-extrabold tracking-tight">ZZP Platform</div>
              <div className="text-[13px] font-semibold" style={{ color: C.muted }}>
                Helder
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-[16px] font-bold transition-colors ${focusRing}`}
                  style={{
                    background: on ? C.accent : "transparent",
                    color: on ? "#ffffff" : C.inkSoft,
                  }}
                >
                  <Icon size={20} aria-hidden="true" style={{ color: on ? "#ffffff" : C.muted }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="flex items-center gap-3 rounded-xl border-2 p-3"
              style={{ borderColor: C.line }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[14px] font-extrabold"
                style={{ background: C.accentSoft, color: C.accent }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold">{PROFIEL.naam}</div>
                <div className="truncate text-[13px] font-semibold" style={{ color: C.muted }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-[72px] shrink-0 items-center gap-3 border-b-2 px-5 md:px-8"
            style={{ borderColor: C.line }}
          >
            <h2 className="text-[18px] font-extrabold tracking-tight">
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-3">
              <button
                className={`flex min-h-[44px] items-center gap-2.5 rounded-xl border-2 px-4 text-[15px] font-bold transition-colors hover:bg-[#f7f8fa] ${focusRing}`}
                style={{ borderColor: C.line, color: C.inkSoft }}
                aria-label="Zoeken openen"
              >
                <Search size={18} aria-hidden="true" />
                <span className="hidden sm:inline">Zoeken</span>
                <kbd
                  className="hidden items-center gap-0.5 rounded-md border-2 px-1.5 py-0.5 text-[12px] font-bold sm:flex"
                  style={{ borderColor: C.line, color: C.muted }}
                >
                  <Command size={11} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className={`relative flex h-[44px] w-[44px] items-center justify-center rounded-xl border-2 transition-colors hover:bg-[#f7f8fa] ${focusRing}`}
                style={{ borderColor: C.line, color: C.inkSoft }}
                aria-label="Meldingen, 2 ongelezen"
              >
                <Bell size={18} aria-hidden="true" />
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-extrabold text-white ring-2 ring-white"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                >
                  2
                </span>
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-2 overflow-x-auto border-b-2 px-4 py-3 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className={`min-h-[44px] shrink-0 rounded-xl px-4 text-[15px] font-bold transition-colors ${focusRing}`}
                  style={{
                    color: on ? "#ffffff" : C.inkSoft,
                    background: on ? C.accent : C.panel,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-7 md:px-8 md:py-9">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border-2 ${className}`}
      style={{ borderColor: C.line, background: C.bg }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const actie = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-2 text-[17px] font-medium" style={{ color: C.inkSoft }}>
          Drie matches boven 80 procent. Eén credential vraagt aandacht.
        </p>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-5">
            <p className="text-[15px] font-bold" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p className="mt-2 text-[30px] font-extrabold tabular-nums leading-none tracking-tight">
              {k.value}
            </p>
            <p
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[14px] font-bold tabular-nums"
              style={{
                color: k.up ? C.success : C.warn,
                background: k.up ? C.successSoft : C.warnSoft,
              }}
            >
              {k.up ? (
                <TrendingUp size={15} aria-hidden="true" />
              ) : (
                <TrendingDown size={15} aria-hidden="true" />
              )}
              {k.trend}
            </p>
          </Panel>
        ))}
      </div>

      {/* Volgende actie — prominent */}
      <Panel className="overflow-hidden">
        <div
          className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
          style={{ background: C.accentSoft }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: C.bg, color: C.warn }}
          >
            <AlertTriangle size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[14px] font-extrabold uppercase tracking-wide"
              style={{ color: C.accent }}
            >
              Volgende actie
            </p>
            <p className="mt-1 text-[19px] font-bold leading-snug">{actie.titel}</p>
            <p className="mt-1 text-[15px] font-medium" style={{ color: C.inkSoft }}>
              {actie.detail}
            </p>
          </div>
          <button
            className={`inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-[16px] font-bold text-white transition-colors hover:opacity-90 ${focusRing}`}
            style={{ background: C.accent }}
          >
            {actie.cta} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Beste matches */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-[20px] font-extrabold tracking-tight">Beste matches</h2>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li
                  key={o.id}
                  className={i < OPDRACHTEN.length - 1 ? "border-b-2" : ""}
                  style={{ borderColor: C.line }}
                >
                  <button
                    onClick={onOpen}
                    className={`flex min-h-[64px] w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#f7f8fa] ${focusRing}`}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold tabular-nums"
                      style={{ background: C.accentSoft, color: C.accent }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-bold">{o.titel}</p>
                      <p
                        className="mt-0.5 truncate text-[14px] font-medium"
                        style={{ color: C.muted }}
                      >
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span className="hidden text-[15px] font-bold tabular-nums sm:block">
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={22} aria-hidden="true" style={{ color: C.muted }} />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Credentials */}
        <div>
          <h2 className="mb-3 text-[20px] font-extrabold tracking-tight">Credentials</h2>
          <Panel className="p-5">
            <ul className="space-y-4">
              {CREDENTIALS.map((c) => (
                <li key={c.naam}>
                  <p className="text-[15px] font-bold">{c.naam}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={c.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Open opdrachten</h1>
        <p className="mt-1.5 text-[16px] font-medium" style={{ color: C.inkSoft }}>
          Vind een opdracht die bij je geverifieerde profiel past.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-[15px] font-bold">Zoek opdrachten</span>
        <div
          className="flex min-h-[52px] items-center gap-3 rounded-xl border-2 px-4 focus-within:ring-4 focus-within:ring-[#1d4ed8] focus-within:ring-offset-2"
          style={{ borderColor: C.lineStrong, background: C.bg }}
        >
          <Search size={20} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Zoek opdrachten op titel, plaats of opdrachtgever"
            className="w-full bg-transparent text-[16px] font-medium outline-none placeholder:text-[#50555d]"
            style={{ color: C.ink }}
          />
          <span className="shrink-0 text-[14px] font-bold tabular-nums" style={{ color: C.muted }}>
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>
      </label>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-14 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.accentSoft, color: C.accent }}
          >
            <Search size={26} aria-hidden="true" />
          </div>
          <p className="mt-4 text-[20px] font-extrabold">Geen opdrachten gevonden</p>
          <p className="mt-2 max-w-sm text-[16px] font-medium" style={{ color: C.inkSoft }}>
            Er zijn geen opdrachten die op &ldquo;{q}&rdquo; passen. Pas je zoekopdracht aan of wis
            het filter.
          </p>
          <button
            onClick={() => setQ("")}
            className={`mt-5 inline-flex min-h-[48px] items-center rounded-xl border-2 px-5 text-[16px] font-bold transition-colors hover:bg-[#f7f8fa] ${focusRing}`}
            style={{ borderColor: C.lineStrong, color: C.ink }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span
                  className="rounded-lg px-2.5 py-1 text-[14px] font-extrabold tabular-nums"
                  style={{ background: C.accentSoft, color: C.accent }}
                >
                  {o.match}% match
                </span>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: C.muted }}>
                  {o.id}
                </span>
              </div>
              <h2 className="mt-3 text-[19px] font-extrabold leading-snug">{o.titel}</h2>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[15px] font-semibold"
                style={{ color: C.inkSoft }}
              >
                <MapPin size={16} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-lg px-2.5 py-1 text-[13px] font-bold"
                    style={{ background: C.panel, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t-2 pt-4"
                style={{ borderColor: C.line }}
              >
                <div>
                  <span className="text-[17px] font-extrabold tabular-nums">{o.tarief}</span>
                  <span
                    className="ml-2 text-[14px] font-semibold tabular-nums"
                    style={{ color: C.muted }}
                  >
                    {o.uren}
                  </span>
                </div>
                <button
                  onClick={onOpen}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 text-[15px] font-bold text-white transition-colors hover:opacity-90 ${focusRing}`}
                  style={{ background: C.accent }}
                >
                  Bekijk <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span
            className="inline-block rounded-lg px-2.5 py-1 text-[14px] font-extrabold tabular-nums"
            style={{ background: C.accentSoft, color: C.accent }}
          >
            {opdracht.match}% match · {opdracht.id}
          </span>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight">
            {opdracht.titel}
          </h1>
          <p
            className="mt-2 flex items-center gap-1.5 text-[16px] font-semibold"
            style={{ color: C.inkSoft }}
          >
            <MapPin size={18} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className={`inline-flex min-h-[52px] shrink-0 items-center rounded-xl px-6 text-[17px] font-bold text-white transition-colors hover:opacity-90 ${focusRing}`}
          style={{ background: C.accent }}
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
          <Panel key={m.l} className="p-4">
            <p className="text-[14px] font-bold" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[19px] font-extrabold tabular-nums tracking-tight">{m.v}</p>
          </Panel>
        ))}
      </div>

      <div>
        <h2 className="text-[22px] font-extrabold tracking-tight">Waarom deze match</h2>
        <p className="mt-2 max-w-2xl text-[16px] font-medium" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op basis van je geverifieerde profiel. Je ziet altijd de pluspunten
          én de aandachtspunten.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Panel className="p-5">
            <p
              className="flex items-center gap-2 text-[16px] font-extrabold"
              style={{ color: C.success }}
            >
              <CheckCircle2 size={20} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-3 text-[16px] font-medium">
                  <Plus
                    size={20}
                    aria-hidden="true"
                    style={{ color: C.success, marginTop: 1, flexShrink: 0 }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <p
              className="flex items-center gap-2 text-[16px] font-extrabold"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={20} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[16px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <Minus
                    size={20}
                    aria-hidden="true"
                    style={{ color: C.warn, marginTop: 1, flexShrink: 0 }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Verificatie</h1>
        <p className="mt-1.5 text-[16px] font-medium" style={{ color: C.inkSoft }}>
          Je vertrouwensniveau bepaalt welke opdrachten je kunt aannemen.
        </p>
      </div>

      <Panel className="flex items-center gap-5 p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: C.successSoft, color: C.success }}
        >
          <ShieldCheck size={30} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[22px] font-extrabold">{PROFIEL.trust}</p>
          <p className="mt-0.5 text-[16px] font-semibold" style={{ color: C.inkSoft }}>
            <span className="tabular-nums">{verified}</span> van{" "}
            <span className="tabular-nums">{CREDENTIALS.length}</span> credentials geverifieerd ·{" "}
            <span style={{ color: C.warn }}>1 vraagt actie</span>
          </p>
        </div>
      </Panel>

      <Panel>
        <ul>
          {CREDENTIALS.map((c, i) => {
            const st = statusStyle(c.status);
            return (
              <li
                key={c.naam}
                className={i < CREDENTIALS.length - 1 ? "border-b-2" : ""}
                style={{ borderColor: C.line }}
              >
                <div className="flex min-h-[72px] items-center gap-4 p-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: st.bg, color: st.fg }}
                  >
                    <st.Icon size={22} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-bold">{c.naam}</p>
                    <p className="mt-0.5 text-[14px] font-medium" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle },
    info: { fg: C.accent, bg: C.accentSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Volgende acties</h1>
        <p className="mt-1.5 text-[16px] font-medium" style={{ color: C.inkSoft }}>
          Wat nu je aandacht vraagt, op volgorde van urgentie.
        </p>
      </div>
      <ul className="space-y-4">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.bg, color: t.fg }}
                >
                  <t.Icon size={22} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-bold leading-snug">{a.titel}</p>
                  <p className="mt-1 text-[15px] font-medium" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className={`inline-flex min-h-[44px] shrink-0 items-center rounded-xl border-2 px-4 text-[15px] font-bold transition-colors hover:bg-[#f7f8fa] ${focusRing}`}
                  style={{ borderColor: C.lineStrong, color: C.ink }}
                >
                  {a.cta}
                </button>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Facturen() {
  const fallbackTone = { fg: C.muted, bg: C.panel, Icon: Minus };
  const statusTone: Record<string, { fg: string; bg: string; Icon: LucideIcon }> = {
    Betaald: { fg: C.success, bg: C.successSoft, Icon: CheckCircle2 },
    Openstaand: { fg: C.warn, bg: C.warnSoft, Icon: Clock },
    Concept: fallbackTone,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Facturen</h1>
          <p className="mt-1.5 text-[16px] font-medium" style={{ color: C.inkSoft }}>
            Overzicht van je verzonden en openstaande facturen.
          </p>
        </div>
        <button
          className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-[16px] font-bold text-white transition-colors hover:opacity-90 ${focusRing}`}
          style={{ background: C.accent }}
        >
          <Plus size={18} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 text-[14px] font-extrabold" style={{ borderColor: C.line }}>
                <th className="px-5 py-4">Nummer</th>
                <th className="px-5 py-4">Klant</th>
                <th className="px-5 py-4">Datum</th>
                <th className="px-5 py-4 text-right">Bedrag</th>
                <th className="px-5 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = statusTone[f.status] ?? fallbackTone;
                return (
                  <tr
                    key={f.nr}
                    className={i < FACTUREN.length - 1 ? "border-b-2" : ""}
                    style={{ borderColor: C.line }}
                  >
                    <td className="px-5 py-4 text-[15px] font-bold tabular-nums">{f.nr}</td>
                    <td className="px-5 py-4 text-[15px] font-semibold">{f.klant}</td>
                    <td
                      className="px-5 py-4 text-[15px] font-medium tabular-nums"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4 text-right text-[16px] font-extrabold tabular-nums">
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[14px] font-bold"
                        style={{ color: t.fg, background: t.bg }}
                      >
                        <t.Icon size={16} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
