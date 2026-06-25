"use client";

// Concept 01 — "Atlas" · Zwitsers besturingssysteem.
// International Typographic Style als bedieningsoppervlak: strikt baseline/kolom-raster,
// zichtbare hairline-regels, monochrome neutralen met EEN inkt-rood accent, oversized
// tabulaire cijfers als data-ankers, toetsenbord-eerst (Cmd-K, J/K rij-hints).
// Palet: canvas #fafafa, surface #ffffff, ink #0a0a0a, line #e4e4e4, muted #6b6b6b,
// accent inkt-rood #dc2626, accentSoft #fdeaea. Fonts: Geist (UI) + JetBrains Mono (cijfers/labels).

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  FileSpreadsheet,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  CornerDownLeft,
  Check,
  Minus,
  Clock,
  AlertTriangle,
  MapPin,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  canvas: "#fafafa",
  surface: "#ffffff",
  ink: "#0a0a0a",
  line: "#e4e4e4",
  lineSoft: "#efefef",
  muted: "#6b6b6b",
  faint: "#9a9a9a",
  accent: "#dc2626",
  accentSoft: "#fdeaea",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: FileSpreadsheet,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Search,
};

function statusStyle(s: CredStatus): { label: string; fg: string; mark: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ink, mark: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.muted, mark: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.accent, mark: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.accent, mark: Minus };
  }
}

// A label rendered in mono, uppercase, tracked-out — the Swiss kicker.
function Kicker({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className="text-[10px] font-medium uppercase leading-none"
      style={{ ...mono, letterSpacing: "0.14em", color: accent ? C.accent : C.faint }}
    >
      {children}
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 24;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.25} strokeLinejoin="round" />
    </svg>
  );
}

export function Concept01() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar — strict ruled column */}
        <aside
          className="hidden w-[228px] shrink-0 flex-col border-r md:flex"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: C.line }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight">ZZP</span>
              <Kicker>Atlas</Kicker>
            </div>
            <span className="h-2.5 w-2.5" style={{ background: C.accent }} aria-hidden="true" />
          </div>

          <nav className="flex flex-col py-2" aria-label="Hoofdnavigatie">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 px-5 py-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ color: on ? C.ink : C.muted }}
                >
                  {on && (
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  <span className="font-medium">{s.label}</span>
                  <span className="ml-auto text-[10px]" style={{ ...mono, color: C.faint }}>
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t px-5 py-4" style={{ borderColor: C.line }}>
            <Kicker>Profiel</Kicker>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center border text-[12px] font-semibold"
                style={{ borderColor: C.line, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.muted }}>
                  {PROFIEL.plaats}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-14 shrink-0 items-center gap-4 border-b px-6"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <div className="flex items-baseline gap-2.5">
              <Kicker>{PROFIEL.rol.split(" · ")[1] ?? "ZZP"}</Kicker>
              <span className="text-[14px] font-semibold tracking-tight">
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                className="flex items-center gap-2 border px-3 py-1.5 text-[12px] transition-colors hover:border-[#cfcfcf] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={13} aria-hidden="true" />
                <span>Zoeken</span>
                <kbd className="ml-1 px-1 text-[10px]" style={{ ...mono, color: C.faint }}>
                  ⌘K
                </kbd>
              </button>
              <div className="hidden items-center gap-1.5 lg:flex" aria-hidden="true">
                <span className="text-[10px]" style={{ ...mono, color: C.faint }}>
                  Navigeer
                </span>
                <kbd
                  className="flex h-5 w-5 items-center justify-center border text-[10px]"
                  style={{ borderColor: C.line, ...mono }}
                >
                  J
                </kbd>
                <kbd
                  className="flex h-5 w-5 items-center justify-center border text-[10px]"
                  style={{ borderColor: C.line, ...mono }}
                >
                  K
                </kbd>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
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

function PageHead({ index, title, sub }: { index: string; title: string; sub: string }) {
  return (
    <div
      className="flex items-end justify-between gap-4 border-b pb-4"
      style={{ borderColor: C.line }}
    >
      <div>
        <Kicker>{index}</Kicker>
        <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          {sub}
        </p>
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="px-6 py-6">
      <PageHead
        index="00 / Overzicht"
        title="Dashboard"
        sub="Je platform op een ruled raster — wat telt en wat actie vraagt."
      />

      {/* KPI band — oversized tabular numerals as data anchors */}
      <div
        className="mt-6 grid grid-cols-2 border-l border-t lg:grid-cols-4"
        style={{ borderColor: C.line }}
      >
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="border-b border-r px-5 py-5 transition-colors hover:bg-[#fcfcfc]"
            style={{ borderColor: C.line }}
          >
            <Kicker>{k.label}</Kicker>
            <div
              className="mt-3 text-[34px] font-semibold tabular-nums leading-none tracking-tight"
              style={mono}
            >
              {k.value}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                style={{ ...mono, color: k.up ? C.ink : C.muted }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" style={{ color: C.accent }} />
                ) : (
                  <ArrowDownRight size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={C.accent} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Matches table */}
        <section className="lg:col-span-2">
          <div
            className="flex items-center justify-between border-b pb-2"
            style={{ borderColor: C.ink }}
          >
            <Kicker>Beste matches</Kicker>
            <span className="text-[10px]" style={{ ...mono, color: C.faint }}>
              ⏎ openen
            </span>
          </div>
          <div>
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group flex w-full items-center gap-4 border-b py-3.5 text-left transition-colors hover:bg-[#fcfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="w-8 shrink-0 text-center text-[11px] tabular-nums"
                  style={{ ...mono, color: C.faint }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="hidden text-[12.5px] tabular-nums sm:inline" style={mono}>
                  {o.tarief}
                </span>
                <span
                  className="w-12 text-right text-[15px] font-semibold tabular-nums"
                  style={{ ...mono, color: o.match >= 90 ? C.accent : C.ink }}
                >
                  {o.match}%
                </span>
                <CornerDownLeft
                  size={14}
                  aria-hidden="true"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: C.faint }}
                />
              </button>
            ))}
          </div>
        </section>

        {/* Credentials ledger */}
        <section>
          <div className="border-b pb-2" style={{ borderColor: C.ink }}>
            <Kicker>Credentials</Kicker>
          </div>
          <div>
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="flex items-start gap-3 border-b py-3"
                  style={{ borderColor: C.lineSoft }}
                >
                  <st.mark size={14} aria-hidden="true" style={{ color: st.fg, marginTop: 2 }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="px-6 py-6">
      <PageHead
        index="01 / Open opdrachten"
        title="Marktplaats"
        sub="Gefilterd op jouw profiel — verklaarbaar gesorteerd."
      />

      <div className="mt-5 flex items-center gap-3">
        <div
          className="flex flex-1 items-center gap-2 border px-3 py-2"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <Search size={14} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel of plaats…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
          />
          <span className="text-[10px]" style={{ ...mono, color: C.faint }}>
            {filtered.length} / {OPDRACHTEN.length}
          </span>
        </div>
        {NAV.slice(0, 3).map((f) => (
          <span
            key={f}
            className="hidden border px-3 py-2 text-[11px] sm:inline"
            style={{ borderColor: C.line, color: C.muted, ...mono }}
          >
            {f}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="mt-6 border px-6 py-16 text-center"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <Kicker accent>Leeg</Kicker>
          <p className="mt-2 text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Pas je filter aan of verbreed je beschikbaarheid.
          </p>
        </div>
      ) : (
        <div
          className="mt-6 grid grid-cols-1 border-l border-t md:grid-cols-2"
          style={{ borderColor: C.line }}
        >
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group border-b border-r p-5 text-left transition-colors hover:bg-[#fcfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{ borderColor: C.line }}
            >
              <div className="flex items-start justify-between gap-3">
                <Kicker>{o.id}</Kicker>
                <span
                  className="text-[18px] font-semibold tabular-nums"
                  style={{ ...mono, color: o.match >= 90 ? C.accent : C.ink }}
                >
                  {o.match}
                  <span className="text-[11px]">%</span>
                </span>
              </div>
              <p className="mt-2.5 text-[14px] font-semibold leading-snug">{o.titel}</p>
              <p
                className="mt-1 flex items-center gap-1.5 text-[11.5px]"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="border px-1.5 py-0.5 text-[10.5px]"
                    style={{ borderColor: C.line, color: C.muted, ...mono }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3 text-[12px] tabular-nums"
                style={{ borderColor: C.lineSoft, ...mono }}
              >
                <span className="font-semibold" style={{ color: C.ink }}>
                  {o.tarief}
                </span>
                <span style={{ color: C.muted }}>{o.uren}</span>
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
    <div className="px-6 py-6">
      <div
        className="flex flex-wrap items-start justify-between gap-4 border-b pb-5"
        style={{ borderColor: C.line }}
      >
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h2 className="mt-1.5 text-[24px] font-semibold tracking-tight">{opdracht.titel}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div
        className="mt-6 grid grid-cols-2 border-l border-t sm:grid-cols-4"
        style={{ borderColor: C.line }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="border-b border-r px-5 py-4" style={{ borderColor: C.line }}>
            <Kicker>{m.l}</Kicker>
            <p className="mt-2 text-[18px] font-semibold tabular-nums tracking-tight" style={mono}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      {/* Verklaarbare matching — twee geruled kolommen */}
      <section className="mt-8">
        <div className="border-b pb-2" style={{ borderColor: C.ink }}>
          <Kicker accent>Waarom deze match</Kicker>
          <h3 className="mt-1.5 text-[15px] font-semibold">Transparant onderbouwd op je profiel</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div
            className="border-b py-4 sm:border-b-0 sm:border-r sm:pr-6"
            style={{ borderColor: C.line }}
          >
            <Kicker>Pluspunten · {opdracht.redenen.plus.length}</Kicker>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <Check size={15} aria-hidden="true" style={{ color: C.ink, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="py-4 sm:pl-6">
            <Kicker accent>Aandachtspunten · {opdracht.redenen.min.length}</Kicker>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <Minus size={15} aria-hidden="true" style={{ color: C.accent, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="px-6 py-6">
      <PageHead
        index="03 / Vertrouwen"
        title="Verificatie"
        sub="Server-side bepaald — de bron van je vertrouwensniveau."
      />

      {/* Trust seal — ruled banner */}
      <div
        className="mt-6 flex items-center gap-5 border p-5"
        style={{ borderColor: C.ink, background: C.surface }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center border"
          style={{ borderColor: C.accent, background: C.accentSoft }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: C.accent }} />
        </div>
        <div className="flex-1">
          <Kicker accent>Zegel</Kicker>
          <p className="mt-1 text-[17px] font-semibold">{PROFIEL.trust}</p>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-semibold tabular-nums leading-none" style={mono}>
            {verified}
            <span className="text-[16px]" style={{ color: C.faint }}>
              /{CREDENTIALS.length}
            </span>
          </div>
          <p className="mt-1 text-[11px]" style={{ ...mono, color: C.muted }}>
            geverifieerd
          </p>
        </div>
      </div>

      {/* Ruled ledger */}
      <div className="mt-6 border-t" style={{ borderColor: C.ink }}>
        <div
          className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Kicker>Certificaat</Kicker>
          <Kicker>Status</Kicker>
        </div>
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-3.5 transition-colors hover:bg-[#fcfcfc]"
              style={{ borderColor: C.lineSoft }}
            >
              <div className="flex items-center gap-3">
                <st.mark size={16} aria-hidden="true" style={{ color: st.fg }} />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold">{c.naam}</p>
                  <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
              </div>
              <span
                className="text-[11px] font-medium uppercase"
                style={{ ...mono, letterSpacing: "0.1em", color: st.fg }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { Icon: LucideIcon; accent: boolean }> = {
    warning: { Icon: AlertTriangle, accent: true },
    info: { Icon: ListChecks, accent: false },
  };
  return (
    <div className="px-6 py-6">
      <PageHead
        index="04 / Prioriteit"
        title="Volgende acties"
        sub="Wat vraagt nu jouw aandacht — op urgentie gesorteerd."
      />

      <div className="mt-6 border-t" style={{ borderColor: C.ink }}>
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-4 border-b py-4 transition-colors hover:bg-[#fcfcfc]"
              style={{ borderColor: C.line }}
            >
              <span
                className="w-8 shrink-0 text-center text-[12px] tabular-nums"
                style={{ ...mono, color: t.accent ? C.accent : C.faint }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <t.Icon
                size={16}
                aria-hidden="true"
                style={{ color: t.accent ? C.accent : C.muted, marginTop: 1 }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 border px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-[#cfcfcf] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  borderColor: t.accent ? C.accent : C.line,
                  color: t.accent ? C.accent : C.ink,
                }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusFg: Record<string, string> = {
    Betaald: C.ink,
    Openstaand: C.accent,
    Concept: C.muted,
  };
  return (
    <div className="px-6 py-6">
      <div
        className="flex items-end justify-between gap-4 border-b pb-4"
        style={{ borderColor: C.line }}
      >
        <div>
          <Kicker>05 / Administratie</Kicker>
          <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight">Facturen</h2>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Verstuurde en openstaande facturen.
          </p>
        </div>
        <button
          className="shrink-0 px-4 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          Nieuwe factuur
        </button>
      </div>

      <div className="mt-6 border-t" style={{ borderColor: C.ink }}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: C.line }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-[10px] font-medium uppercase ${
                    i >= 3 ? "text-right" : ""
                  }`}
                  style={{ ...mono, letterSpacing: "0.12em", color: C.faint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr
                key={f.nr}
                className="border-b transition-colors hover:bg-[#fcfcfc]"
                style={{ borderColor: C.lineSoft }}
              >
                <td className="px-4 py-3 text-[12.5px] font-medium" style={mono}>
                  {f.nr}
                </td>
                <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                <td className="px-4 py-3 text-[12.5px]" style={{ ...mono, color: C.muted }}>
                  {f.datum}
                </td>
                <td
                  className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums"
                  style={mono}
                >
                  {f.bedrag}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="text-[11px] font-medium uppercase"
                    style={{
                      ...mono,
                      letterSpacing: "0.1em",
                      color: statusFg[f.status] ?? C.muted,
                    }}
                  >
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Documenten — ruled grid */}
      <section className="mt-8">
        <div className="border-b pb-2" style={{ borderColor: C.ink }}>
          <Kicker>Recente documenten</Kicker>
        </div>
        <div
          className="grid grid-cols-2 border-l border-t sm:grid-cols-4"
          style={{ borderColor: C.line }}
        >
          {DOCUMENTEN.map((d) => {
            const st = statusStyle(d.status);
            return (
              <div key={d.naam} className="border-b border-r p-3.5" style={{ borderColor: C.line }}>
                <div className="flex items-center gap-2">
                  <FileText size={13} aria-hidden="true" style={{ color: C.faint }} />
                  <st.mark size={12} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <p className="mt-2 truncate text-[12px] font-medium">{d.naam}</p>
                <p className="text-[10.5px]" style={{ ...mono, color: C.faint }}>
                  {d.grootte} · {d.bijgewerkt}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
