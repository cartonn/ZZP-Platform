"use client";

// Concept 339 — "Kompres" · database-canvas in de geest van Notion/Airtable (light).
// Een spreadsheet-/database-native werkomgeving: strakke tabellen met kleur-getagde select-chips,
// inline-bewerkbare cellen (visueel), kolom-headers met type-iconen, een groepeer-/filter-balk en
// een Airtable-achtig zijpaneel dat een record opent. Ultra-productief, licht, dicht maar geordend.
// Een subtiele command-/filter-balk bovenaan houdt alles bereikbaar. Statuschips: altijd label +
// icoon. Fonts: --font-lab-inter (UI/tekst) + --font-lab-plex-mono (veldwaarden, ID's, cijfers).

import { useEffect, useMemo, useState } from "react";
import {
  Table2,
  Store,
  FileText,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Filter,
  ArrowUpDown,
  Group,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Type,
  Hash,
  Calendar,
  Tags,
  MapPin,
  CircleUser,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Check,
  Command,
  EyeOff,
  RotateCcw,
  CircleAlert,
  Percent,
  Link2,
  Sparkle,
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

/* ---------- Palet (licht, database-canvas) ---------- */

const C = {
  canvas: "#f7f8fa",
  surface: "#ffffff",
  surfaceAlt: "#fafbfc",
  rowHover: "#f4f6f9",
  rowSel: "#eef4ff",
  ink: "#1a1d24",
  inkSoft: "#3d4350",
  sub: "#6b7280",
  faint: "#9aa1ac",
  line: "#e7e9ee",
  lineSoft: "#eef0f4",
  accent: "#2f6bff", // Airtable-achtig blauw
  accentSoft: "#e9f0ff",
  ok: "#0f7a3d",
  okSoft: "#e3f5ea",
  info: "#2563c9",
  infoSoft: "#e7f0fd",
  warn: "#a45a06",
  warnSoft: "#fbefdc",
  alert: "#c22d2d",
  alertSoft: "#fbe7e6",
};

// Kleurpalet voor select-chips (kleur-getagde velden — Airtable-gevoel).
const TAGCOLORS = [
  { fg: "#7a4bd0", soft: "#f0e9fc" },
  { fg: "#0f7a3d", soft: "#e3f5ea" },
  { fg: "#c26a00", soft: "#fbeed8" },
  { fg: "#2563c9", soft: "#e7f0fd" },
  { fg: "#b23b6d", soft: "#fbe8f0" },
  { fg: "#0e8a86", soft: "#dcf4f2" },
  { fg: "#8a6d0e", soft: "#f6efd6" },
];

function tagColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TAGCOLORS[h % TAGCOLORS.length]!;
}

const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-plex-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-1 focus-visible:ring-offset-white";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): Tone {
  if (status === "Betaald") return { label: "Betaald", fg: C.ok, soft: C.okSoft, Icon: Check };
  if (status === "Openstaand")
    return { label: "Openstaand", fg: C.warn, soft: C.warnSoft, Icon: Clock };
  return { label: "Concept", fg: C.faint, soft: C.lineSoft, Icon: FileText };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Table2,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

/* ---------- Kleine bouwstenen ---------- */

function StatusChip({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ ...body, color: t.fg, background: t.soft }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

function SelectChip({ label }: { label: string }) {
  const c = tagColor(label);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ ...body, color: c.fg, background: c.soft }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} aria-hidden="true" />
      {label}
    </span>
  );
}

// Kolom-header met type-icoon (Airtable-veldtypes).
function ColHead({
  icon: Icon,
  children,
  className = "",
  align = "left",
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2 text-[11px] font-semibold ${className}`}
      style={{ color: C.sub }}
    >
      <span
        className={`inline-flex items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        <Icon size={12} strokeWidth={2} style={{ color: C.faint }} aria-hidden="true" />
        {children}
      </span>
    </th>
  );
}

// Match-percentage als compacte databalk (Airtable "progress"-veld).
function PercentBar({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="relative block h-1.5 w-16 overflow-hidden rounded-full"
        style={{ background: C.lineSoft }}
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${value}%`,
            background: value >= 90 ? C.ok : value >= 80 ? C.accent : C.warn,
          }}
        />
      </span>
      <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.inkSoft }}>
        {value}%
      </span>
    </span>
  );
}

function ToolbarBtn({
  icon: Icon,
  children,
  onClick,
  active,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#f4f6f9] ${RING}`}
      style={{
        color: active ? C.accent : C.inkSoft,
        background: active ? C.accentSoft : "transparent",
      }}
    >
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
      {children}
    </button>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept339() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [recordOpen, setRecordOpen] = useState<Opdracht | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 320);
    return () => window.clearTimeout(t);
  }, [screen]);

  // Command-menu op ⌘K / Ctrl+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setRecordOpen(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="relative flex min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`@keyframes ko-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ko-pulse{0%,100%{opacity:.55}50%{opacity:.9}}
      @keyframes ko-slide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>

      {/* Zijbalk — database-navigator */}
      <aside
        className="hidden w-52 shrink-0 flex-col border-r md:flex"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <div
          className="flex h-12 items-center gap-2 border-b px-3.5"
          style={{ borderColor: C.line }}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold text-white"
            style={{ background: C.accent }}
            aria-hidden="true"
          >
            Z
          </span>
          <span className="text-[13.5px] font-semibold tracking-tight">Kompres</span>
        </div>
        <div className="px-2.5 pb-1 pt-3">
          <p
            className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            Werkruimte
          </p>
          <nav className="space-y-0.5" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12.5px] transition-colors hover:bg-[#f4f6f9] ${RING}`}
                  style={{
                    color: on ? C.ink : C.inkSoft,
                    background: on ? C.rowSel : "transparent",
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                    style={{ color: on ? C.accent : C.faint }}
                  />
                  <span className="flex-1 text-left">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto border-t p-2.5" style={{ borderColor: C.line }}>
          <button
            onClick={() => setCmdOpen(true)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-[#f4f6f9] ${RING}`}
            style={{ color: C.sub }}
          >
            <Command size={13} aria-hidden="true" /> Zoeken
            <span
              className="ml-auto rounded border px-1 py-0.5 text-[10px]"
              style={{ ...mono, borderColor: C.line, color: C.faint }}
            >
              ⌘K
            </span>
          </button>
        </div>
      </aside>

      {/* Hoofdkolom */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbalk */}
        <header
          className="flex h-12 items-center gap-2 border-b px-3"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="flex items-center gap-2 md:hidden">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold text-white"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              Z
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[13px] font-semibold capitalize">
              {SCREENS.find((s) => s.key === screen)?.label}
            </span>
            <span
              className="hidden rounded px-1.5 py-0.5 text-[10.5px] font-medium sm:inline"
              style={{ background: C.surfaceAlt, color: C.faint, ...mono }}
            >
              tabel
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setCmdOpen(true)}
              className={`hidden items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px] sm:flex ${RING}`}
              style={{ borderColor: C.line, color: C.sub, background: C.surfaceAlt }}
            >
              <Search size={13} aria-hidden="true" /> Zoek of spring naar…
              <span
                className="rounded border px-1 py-0.5 text-[10px]"
                style={{ ...mono, borderColor: C.line, color: C.faint }}
              >
                ⌘K
              </span>
            </button>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: C.ink }}
              aria-hidden="true"
              title={PROFIEL.naam}
            >
              {PROFIEL.initialen}
            </div>
          </div>
        </header>

        {/* Mobiele scherm-tabs */}
        <nav
          className="flex gap-1 overflow-x-auto border-b px-2 py-1.5 md:hidden"
          style={{ borderColor: C.line, background: C.surface }}
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-[12px] transition-colors ${RING}`}
                style={{
                  color: on ? C.accent : C.sub,
                  background: on ? C.accentSoft : "transparent",
                  fontWeight: on ? 600 : 500,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main key={screen} className="min-w-0 flex-1" style={{ animation: "ko-fade 0.3s ease" }}>
          {!ready ? (
            <TableSkeleton />
          ) : (
            <>
              {screen === "dashboard" && (
                <Dashboard onOpenRecord={setRecordOpen} onGo={setScreen} onOpen={openOpdracht} />
              )}
              {screen === "marktplaats" && (
                <Marktplaats onOpenRecord={setRecordOpen} onOpen={openOpdracht} />
              )}
              {screen === "opdracht" && (
                <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
              )}
              {screen === "verificatie" && <Verificatie />}
              {screen === "acties" && <Acties onGo={setScreen} />}
              {screen === "facturen" && <Facturen />}
            </>
          )}
        </main>
      </div>

      {/* Record-zijpaneel (Airtable-detail) */}
      {recordOpen && (
        <RecordPanel
          opdracht={recordOpen}
          onClose={() => setRecordOpen(null)}
          onOpen={() => {
            openOpdracht(recordOpen.id);
            setRecordOpen(null);
          }}
        />
      )}

      {/* Command-menu */}
      {cmdOpen && (
        <CommandMenu
          onClose={() => setCmdOpen(false)}
          onPick={(k) => {
            setScreen(k);
            setCmdOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Skeleton ---------- */

function TableSkeleton() {
  return (
    <div className="p-4" role="status" aria-live="polite">
      <span className="sr-only">Tabel wordt geladen…</span>
      <div
        className="h-8 w-full rounded-md"
        style={{ background: C.surface, animation: "ko-pulse 1.3s infinite" }}
      />
      <div
        className="mt-3 overflow-hidden rounded-lg border"
        style={{ borderColor: C.line, background: C.surface }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b px-3 py-3"
            style={{ borderColor: C.lineSoft }}
          >
            {[40, 24, 16, 20].map((w, j) => (
              <span
                key={j}
                className="h-3 rounded"
                style={{
                  width: `${w}%`,
                  background: C.lineSoft,
                  animation: "ko-pulse 1.3s infinite",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Groepeer-/filter-balk ---------- */

function DataToolbar({
  count,
  q,
  onQ,
  right,
}: {
  count: number;
  q: string;
  onQ: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b px-3 py-2"
      style={{ borderColor: C.line, background: C.surface }}
    >
      <ToolbarBtn icon={Filter}>Filter</ToolbarBtn>
      <ToolbarBtn icon={Group} active>
        Groepeer
      </ToolbarBtn>
      <ToolbarBtn icon={ArrowUpDown}>Sorteer</ToolbarBtn>
      <ToolbarBtn icon={EyeOff}>Velden</ToolbarBtn>
      <span className="mx-1 h-4 w-px" style={{ background: C.line }} aria-hidden="true" />
      <div
        className="flex items-center gap-1.5 rounded-md px-2 py-1"
        style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
      >
        <Search size={13} style={{ color: C.faint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Zoek in weergave…"
          aria-label="Zoek in weergave"
          className="w-36 bg-transparent text-[12px] outline-none sm:w-48"
          style={{ color: C.ink }}
        />
      </div>
      <span className="ml-auto flex items-center gap-2">
        <span className="text-[11.5px]" style={{ color: C.faint }}>
          {count} record{count === 1 ? "" : "s"}
        </span>
        {right}
      </span>
    </div>
  );
}

/* ---------- Dashboard (overzicht-database) ---------- */

function Dashboard({
  onOpenRecord,
  onGo,
  onOpen: _onOpen,
}: {
  onOpenRecord: (o: Opdracht) => void;
  onGo: (k: ScreenKey) => void;
  onOpen: (id?: string) => void;
}) {
  const [group, setGroup] = useState(true);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const openFacturen = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div>
      {/* KPI-strip als samenvattingsvelden */}
      <div
        className="grid grid-cols-2 gap-px border-b bg-[#e7e9ee] lg:grid-cols-4"
        style={{ borderColor: C.line }}
      >
        {KPIS.map((k) => (
          <div key={k.label} className="px-4 py-3.5" style={{ background: C.surface }}>
            <p
              className="flex items-center gap-1.5 text-[11px] font-medium"
              style={{ color: C.sub }}
            >
              <Hash size={11} style={{ color: C.faint }} aria-hidden="true" />
              {k.label}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-[20px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.ok : C.warn }}
              >
                {k.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <DataToolbar
        count={OPDRACHTEN.length}
        q=""
        onQ={() => {}}
        right={
          <button
            onClick={() => setGroup((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium ${RING}`}
            style={{ color: C.accent, background: C.accentSoft }}
          >
            {group ? "Gegroepeerd" : "Vlak"} <ChevronDown size={12} aria-hidden="true" />
          </button>
        }
      />

      {/* Opdrachten-database (gegroepeerd op status) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
          <thead>
            <tr style={{ background: C.surfaceAlt }}>
              <ColHead icon={Type} className="border-b">
                Opdracht
              </ColHead>
              <ColHead icon={CircleUser} className="border-b">
                Opdrachtgever
              </ColHead>
              <ColHead icon={MapPin} className="border-b">
                Plaats
              </ColHead>
              <ColHead icon={Percent} className="border-b">
                Match
              </ColHead>
              <ColHead icon={Hash} className="border-b">
                Tarief
              </ColHead>
              <ColHead icon={Tags} className="border-b">
                Labels
              </ColHead>
            </tr>
          </thead>
          <tbody>
            {group && (
              <tr>
                <td colSpan={6} className="px-3 py-1.5" style={{ background: C.rowSel }}>
                  <span
                    className="flex items-center gap-1.5 text-[11.5px] font-semibold"
                    style={{ color: C.accent }}
                  >
                    <ChevronDown size={13} aria-hidden="true" />
                    Aanbevolen matches
                    <span
                      className="rounded-full px-1.5 text-[10.5px]"
                      style={{ ...mono, background: C.surface, color: C.sub }}
                    >
                      {OPDRACHTEN.length}
                    </span>
                  </span>
                </td>
              </tr>
            )}
            {OPDRACHTEN.map((o) => (
              <tr
                key={o.id}
                className="group cursor-pointer transition-colors hover:bg-[#f4f6f9]"
                onClick={() => onOpenRecord(o)}
              >
                <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                  <span className="flex items-center gap-2">
                    <span
                      className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ background: C.accentSoft }}
                      aria-hidden="true"
                    >
                      <ChevronRight size={12} style={{ color: C.accent }} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[13px] font-medium"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span className="text-[10.5px]" style={{ ...mono, color: C.faint }}>
                        {o.id}
                      </span>
                    </span>
                  </span>
                </td>
                <td
                  className="border-b px-3 py-2.5 text-[12.5px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                >
                  {o.opdrachtgever}
                </td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                  <SelectChip label={o.plaats} />
                </td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                  <PercentBar value={o.match} />
                </td>
                <td
                  className="border-b px-3 py-2.5 text-[12.5px] tabular-nums"
                  style={{ ...mono, borderColor: C.lineSoft, color: C.ink }}
                >
                  {o.tarief}
                </td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                  <span className="flex flex-wrap gap-1">
                    {o.tags.slice(0, 2).map((t) => (
                      <SelectChip key={t} label={t} />
                    ))}
                  </span>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} className="px-3 py-2">
                <button
                  onClick={() => onGo("marktplaats")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-[#f4f6f9] ${RING}`}
                  style={{ color: C.sub }}
                >
                  <Plus size={13} aria-hidden="true" /> Nieuwe reactie
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Onderste rij: verificatie- + facturen-samenvatting als mini-databases */}
      <div
        className="grid grid-cols-1 gap-px border-t bg-[#e7e9ee] lg:grid-cols-2"
        style={{ borderColor: C.line }}
      >
        <div style={{ background: C.surface }} className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3
              className="flex items-center gap-1.5 text-[12.5px] font-semibold"
              style={{ color: C.ink }}
            >
              <ShieldCheck size={14} style={{ color: C.accent }} aria-hidden="true" /> Verificatie
            </h3>
            <button
              onClick={() => onGo("verificatie")}
              className={`text-[11.5px] font-medium ${RING}`}
              style={{ color: C.accent }}
            >
              Open tabel
            </button>
          </div>
          <p className="text-[11.5px]" style={{ color: C.sub }}>
            {verified} van {CREDENTIALS.length} bewijsstukken geverifieerd.
          </p>
          <ul className="mt-2 space-y-1.5">
            {CREDENTIALS.slice(0, 3).map((c) => (
              <li key={c.naam} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: C.inkSoft }}>
                  {c.naam}
                </span>
                <StatusChip status={c.status} />
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: C.surface }} className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3
              className="flex items-center gap-1.5 text-[12.5px] font-semibold"
              style={{ color: C.ink }}
            >
              <Receipt size={14} style={{ color: C.accent }} aria-hidden="true" /> Facturen
            </h3>
            <button
              onClick={() => onGo("facturen")}
              className={`text-[11.5px] font-medium ${RING}`}
              style={{ color: C.accent }}
            >
              Open tabel
            </button>
          </div>
          <p className="text-[11.5px]" style={{ color: C.sub }}>
            {openFacturen} openstaande factu{openFacturen === 1 ? "ur" : "ren"} · actie vereist.
          </p>
          <ul className="mt-2 space-y-1.5">
            {FACTUREN.slice(0, 3).map((f) => {
              const t = factuurTone(f.status);
              return (
                <li key={f.nr} className="flex items-center gap-2">
                  <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    {f.nr}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-[12px]"
                    style={{ color: C.inkSoft }}
                  >
                    {f.klant}
                  </span>
                  <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.ink }}>
                    {f.bedrag}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-semibold"
                    style={{ color: t.fg, background: t.soft }}
                  >
                    <t.Icon size={10} aria-hidden="true" />
                    {t.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Volgende actie als banner */}
      {ACTIES[0] && (
        <div
          className="flex flex-wrap items-center gap-3 border-t px-4 py-3"
          style={{ borderColor: C.line, background: C.warnSoft }}
          role="status"
        >
          <AlertTriangle size={15} style={{ color: C.warn }} aria-hidden="true" />
          <span className="text-[12.5px]" style={{ color: C.ink }}>
            <span className="font-semibold">{ACTIES[0].titel}</span> — {ACTIES[0].detail}
          </span>
          <button
            onClick={() => onGo("acties")}
            className={`ml-auto inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-white ${RING}`}
            style={{ background: C.warn }}
          >
            {ACTIES[0].cta} <ChevronRight size={13} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Marktplaats (grote database + filter) ---------- */

function Marktplaats({
  onOpenRecord,
  onOpen: _onOpen,
}: {
  onOpenRecord: (o: Opdracht) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()) ||
          o.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())),
      ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief))),
    [q, sort],
  );

  return (
    <div>
      <DataToolbar
        count={filtered.length}
        q={q}
        onQ={setQ}
        right={
          <span
            className="inline-flex items-center gap-0.5 rounded-md p-0.5"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
          >
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium ${RING}`}
                  style={{
                    background: on ? C.surface : "transparent",
                    color: on ? C.ink : C.sub,
                    boxShadow: on ? `0 0 0 1px ${C.line}` : "none",
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </span>
        }
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={18} style={{ color: C.faint }} />
          </span>
          <p className="mt-3 text-[14px] font-semibold" style={{ color: C.ink }}>
            Geen records gevonden
          </p>
          <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
            Geen enkel record voldoet aan het filter “{q}”. Pas je zoekopdracht aan.
          </p>
          <button
            onClick={() => setQ("")}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium ${RING}`}
            style={{ borderColor: C.line, color: C.ink }}
          >
            <RotateCcw size={12} aria-hidden="true" /> Filter wissen
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left">
            <thead>
              <tr style={{ background: C.surfaceAlt }}>
                <th
                  className="w-8 border-b px-3 py-2 text-[11px] font-semibold"
                  style={{ color: C.faint, borderColor: C.line }}
                >
                  #
                </th>
                <ColHead icon={Type} className="border-b">
                  Opdracht
                </ColHead>
                <ColHead icon={CircleUser} className="border-b">
                  Opdrachtgever
                </ColHead>
                <ColHead icon={Percent} className="border-b">
                  Match
                </ColHead>
                <ColHead icon={Hash} className="border-b">
                  Tarief
                </ColHead>
                <ColHead icon={Calendar} className="border-b">
                  Start
                </ColHead>
                <ColHead icon={Tags} className="border-b">
                  Labels
                </ColHead>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr
                  key={o.id}
                  className="group cursor-pointer transition-colors hover:bg-[#f4f6f9]"
                  onClick={() => onOpenRecord(o)}
                >
                  <td
                    className="border-b px-3 py-2.5 text-[11px] tabular-nums"
                    style={{ ...mono, borderColor: C.lineSoft, color: C.faint }}
                  >
                    {i + 1}
                  </td>
                  <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                    <span className="block text-[13px] font-medium" style={{ color: C.ink }}>
                      {o.titel}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10.5px]"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id} · <MapPin size={9} aria-hidden="true" /> {o.plaats}
                    </span>
                  </td>
                  <td
                    className="border-b px-3 py-2.5 text-[12.5px]"
                    style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                  >
                    {o.opdrachtgever}
                  </td>
                  <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                    <PercentBar value={o.match} />
                  </td>
                  <td
                    className="border-b px-3 py-2.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, borderColor: C.lineSoft, color: C.ink }}
                  >
                    {o.tarief}
                  </td>
                  <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                    <SelectChip label={o.start} />
                  </td>
                  <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                    <span className="flex flex-wrap gap-1">
                      {o.tags.map((t) => (
                        <SelectChip key={t} label={t} />
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Record-zijpaneel ---------- */

function RecordPanel({
  opdracht,
  onClose,
  onOpen,
}: {
  opdracht: Opdracht;
  onClose: () => void;
  onOpen: () => void;
}) {
  const fields: { icon: LucideIcon; label: string; value: React.ReactNode }[] = [
    { icon: CircleUser, label: "Opdrachtgever", value: opdracht.opdrachtgever },
    { icon: MapPin, label: "Plaats", value: <SelectChip label={opdracht.plaats} /> },
    { icon: Hash, label: "Tarief", value: opdracht.tarief },
    { icon: Calendar, label: "Omvang", value: opdracht.uren },
    { icon: Calendar, label: "Start", value: <SelectChip label={opdracht.start} /> },
    { icon: Percent, label: "Match", value: <PercentBar value={opdracht.match} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={opdracht.titel}
    >
      <button
        className="absolute inset-0 bg-[#1a1d24]/25"
        onClick={onClose}
        aria-label="Sluiten"
        tabIndex={-1}
      />
      <div
        className="relative flex h-full w-full max-w-md flex-col border-l shadow-xl"
        style={{ borderColor: C.line, background: C.surface, animation: "ko-slide 0.24s ease" }}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: C.line }}>
          <span
            className="text-[10.5px] font-medium tabular-nums"
            style={{ ...mono, color: C.faint }}
          >
            {opdracht.id}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <button
              onClick={onClose}
              className={`rounded-md p-1.5 transition-colors hover:bg-[#f4f6f9] ${RING}`}
              style={{ color: C.sub }}
              aria-label="Sluiten"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <h2 className="text-[18px] font-semibold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h2>

          <dl className="mt-4 space-y-0">
            {fields.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 border-b py-2.5"
                style={{ borderColor: C.lineSoft }}
              >
                <dt
                  className="flex w-32 shrink-0 items-center gap-1.5 text-[12px]"
                  style={{ color: C.sub }}
                >
                  <f.icon size={13} style={{ color: C.faint }} aria-hidden="true" />
                  {f.label}
                </dt>
                <dd className="min-w-0 flex-1 text-[13px]" style={{ ...mono, color: C.ink }}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Verklaarbare match als velden */}
          <div className="mt-5">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: C.sub }}
            >
              <Sparkle size={12} style={{ color: C.accent }} aria-hidden="true" /> Waarom deze match
            </p>
            <div className="mt-2 space-y-2">
              {opdracht.redenen.plus.map((r) => (
                <div
                  key={r}
                  className="flex items-start gap-2 text-[12.5px]"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={14}
                    strokeWidth={2.6}
                    style={{ color: C.ok }}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </div>
              ))}
              {opdracht.redenen.min.map((r) => (
                <div
                  key={r}
                  className="flex items-start gap-2 text-[12.5px]"
                  style={{ color: C.sub }}
                >
                  <AlertTriangle
                    size={14}
                    strokeWidth={2.4}
                    style={{ color: C.warn }}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </div>
              ))}
            </div>
          </div>

          {/* Gekoppelde credentials (linked records) */}
          <div className="mt-5">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: C.sub }}
            >
              <Link2 size={12} style={{ color: C.accent }} aria-hidden="true" /> Gekoppelde
              credentials
            </p>
            <div className="mt-2 space-y-1.5">
              {CREDENTIALS.slice(0, 3).map((c) => (
                <div
                  key={c.naam}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5"
                  style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
                >
                  <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: C.ink }}>
                    {c.naam}
                  </span>
                  <StatusChip status={c.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t px-4 py-3" style={{ borderColor: C.line }}>
          <button
            onClick={onOpen}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-semibold text-white transition-colors ${RING}`}
            style={{ background: C.accent }}
          >
            Open volledig record <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail (volledig record) ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 800);
  };

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-[#f4f6f9] ${RING}`}
          style={{ color: C.sub }}
        >
          <ChevronRight size={13} className="rotate-180" aria-hidden="true" /> Marktplaats
        </button>
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
          / {opdracht.id}
        </span>
        <button
          onClick={react}
          disabled={state !== "idle"}
          className={`ml-auto inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors disabled:opacity-90 ${RING}`}
          style={{ background: state === "sent" ? C.ok : C.accent }}
        >
          {state === "idle" && "Reageren"}
          {state === "sending" && "Versturen…"}
          {state === "sent" && (
            <>
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Verstuurd
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight" style={{ color: C.ink }}>
              {opdracht.titel}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.sub }}>
              <CircleUser size={14} aria-hidden="true" /> {opdracht.opdrachtgever}
              <span aria-hidden="true">·</span>
              <MapPin size={13} aria-hidden="true" /> {opdracht.plaats}
            </p>
          </div>

          {/* Kern-velden als database-cellen */}
          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: C.line, background: C.surface }}
          >
            {[
              { icon: Hash, l: "Tarief", v: opdracht.tarief },
              { icon: Calendar, l: "Omvang", v: opdracht.uren },
              { icon: Calendar, l: "Startdatum", v: opdracht.start },
              { icon: Percent, l: "Match-score", v: `${opdracht.match}%` },
            ].map((m, i) => (
              <div
                key={m.l}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex w-40 shrink-0 items-center gap-1.5 text-[12px]"
                  style={{ color: C.sub }}
                >
                  <m.icon size={13} style={{ color: C.faint }} aria-hidden="true" /> {m.l}
                </span>
                <span className="text-[13px] tabular-nums" style={{ ...mono, color: C.ink }}>
                  {m.v}
                </span>
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <h3 className="text-[14px] font-semibold" style={{ color: C.ink }}>
              Waarom deze match
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: C.ok }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2 space-y-1.5">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.ok }}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: C.warn }}
                >
                  <AlertTriangle size={12} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2 space-y-1.5">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.warn }}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Zijkolom: labels + compliance */}
        <div className="space-y-4">
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: C.sub }}
            >
              <Tags size={12} style={{ color: C.accent }} aria-hidden="true" /> Labels
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <SelectChip key={t} label={t} />
              ))}
            </div>
          </div>
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: C.sub }}
            >
              <ShieldCheck size={12} style={{ color: C.accent }} aria-hidden="true" /> Vereiste
              credentials
            </p>
            <ul className="mt-2 space-y-2">
              {CREDENTIALS.slice(0, 3).map((c) => (
                <li key={c.naam} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: C.ink }}>
                    {c.naam}
                  </span>
                  <StatusChip status={c.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie (credential-database) ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");

  return (
    <div>
      <div
        className="grid grid-cols-3 gap-px border-b bg-[#e7e9ee]"
        style={{ borderColor: C.line }}
      >
        {[
          { l: "Geverifieerd", v: `${verified}/${CREDENTIALS.length}`, c: C.ok },
          {
            l: "In beoordeling",
            v: CREDENTIALS.filter((c) => c.status === "SUBMITTED").length,
            c: C.info,
          },
          {
            l: "Verloopt",
            v: CREDENTIALS.filter((c) => c.status === "EXPIRING").length,
            c: C.warn,
          },
        ].map((s) => (
          <div key={s.l} className="px-4 py-3" style={{ background: C.surface }}>
            <p className="text-[11px] font-medium" style={{ color: C.sub }}>
              {s.l}
            </p>
            <p
              className="mt-0.5 text-[18px] font-semibold tabular-nums"
              style={{ ...mono, color: s.c }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {expiring && (
        <div
          className="flex flex-wrap items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: C.line, background: C.warnSoft }}
          role="alert"
        >
          <AlertTriangle size={15} style={{ color: C.warn }} aria-hidden="true" />
          <span className="text-[12.5px]" style={{ color: C.ink }}>
            <span className="font-semibold">{expiring.naam}</span> — {expiring.detail}. Vernieuw op
            tijd.
          </span>
        </div>
      )}

      <DataToolbar count={CREDENTIALS.length} q="" onQ={() => {}} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
          <thead>
            <tr style={{ background: C.surfaceAlt }}>
              <ColHead icon={Type} className="border-b">
                Bewijsstuk
              </ColHead>
              <ColHead icon={FileText} className="border-b">
                Detail
              </ColHead>
              <ColHead icon={Tags} className="border-b">
                Status
              </ColHead>
            </tr>
          </thead>
          <tbody>
            {CREDENTIALS.map((c) => (
              <tr key={c.naam} className="transition-colors hover:bg-[#f4f6f9]">
                <td
                  className="border-b px-3 py-2.5 text-[13px] font-medium"
                  style={{ borderColor: C.lineSoft, color: C.ink }}
                >
                  {c.naam}
                </td>
                <td
                  className="border-b px-3 py-2.5 text-[12.5px]"
                  style={{ borderColor: C.lineSoft, color: C.sub }}
                >
                  {c.detail}
                </td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                  <StatusChip status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Documenten als bijlagen-tabel */}
      <div className="border-t px-4 py-3" style={{ borderColor: C.line }}>
        <p
          className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: C.sub }}
        >
          <FileText size={12} style={{ color: C.accent }} aria-hidden="true" /> Bijlagen
        </p>
        <div className="flex flex-wrap gap-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <span
                key={d.naam}
                className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                style={{ borderColor: C.line, background: C.surface }}
              >
                <FileText size={14} style={{ color: t.fg }} aria-hidden="true" />
                <span className="text-[12px]" style={{ color: C.ink }}>
                  {d.naam}
                </span>
                <span className="text-[10.5px]" style={{ ...mono, color: C.faint }}>
                  {d.grootte}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties (takenlijst-database) ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [errored, setErrored] = useState(false);

  return (
    <div>
      <DataToolbar
        count={ACTIES.length}
        q=""
        onQ={() => {}}
        right={
          <button
            onClick={() => setErrored((v) => !v)}
            className={`text-[11.5px] font-medium ${RING}`}
            style={{ color: C.faint }}
          >
            {errored ? "Herstel" : "Synchroniseer"}
          </button>
        }
      />

      {errored ? (
        <div
          className="flex flex-col items-center justify-center px-6 py-16 text-center"
          role="alert"
        >
          <CircleAlert size={22} style={{ color: C.alert }} aria-hidden="true" />
          <p className="mt-2 text-[14px] font-semibold" style={{ color: C.ink }}>
            Kon acties niet synchroniseren
          </p>
          <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
            De verbinding werd onderbroken. Probeer het opnieuw.
          </p>
          <button
            onClick={() => setErrored(false)}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium ${RING}`}
            style={{ borderColor: C.line, color: C.ink }}
          >
            <RotateCcw size={12} aria-hidden="true" /> Opnieuw
          </button>
        </div>
      ) : (
        <ul>
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const checked = !!done[i];
            return (
              <li
                key={a.titel}
                className="flex items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-[#f4f6f9]"
                style={{ borderColor: C.lineSoft }}
              >
                <button
                  onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                  aria-pressed={checked}
                  aria-label={checked ? "Markeer als open" : "Markeer als klaar"}
                  className={`h-4.5 w-4.5 mt-0.5 flex shrink-0 items-center justify-center rounded border transition-colors ${RING}`}
                  style={{
                    width: 18,
                    height: 18,
                    borderColor: checked ? C.ok : C.line,
                    background: checked ? C.ok : C.surface,
                  }}
                >
                  {checked && (
                    <Check size={12} strokeWidth={3} className="text-white" aria-hidden="true" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: warn ? C.warn : C.info,
                        background: warn ? C.warnSoft : C.infoSoft,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sparkle size={10} aria-hidden="true" />
                      )}
                      {warn ? "Waarschuwing" : "Kans"}
                    </span>
                    <p
                      className="text-[13.5px] font-medium"
                      style={{
                        color: checked ? C.faint : C.ink,
                        textDecoration: checked ? "line-through" : "none",
                      }}
                    >
                      {a.titel}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-semibold ${RING}`}
                  style={{ color: C.accent, background: C.accentSoft }}
                >
                  {a.cta} <ChevronRight size={12} aria-hidden="true" />
                </button>
              </li>
            );
          })}
          <li className="px-4 py-2.5">
            <span
              className="inline-flex items-center gap-1.5 text-[12px]"
              style={{ color: C.faint }}
            >
              <Plus size={13} aria-hidden="true" /> Nieuwe actie
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}

/* ---------- Facturen (financiële database) ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );

  return (
    <div>
      <div
        className="grid grid-cols-2 gap-px border-b bg-[#e7e9ee] sm:grid-cols-3"
        style={{ borderColor: C.line }}
      >
        {[
          { l: "Ontvangen", v: `€ ${betaald.toLocaleString("nl-NL")}`, c: C.ok },
          { l: "Openstaand", v: `€ ${open.toLocaleString("nl-NL")}`, c: C.warn },
          { l: "Records", v: FACTUREN.length, c: C.ink },
        ].map((s) => (
          <div key={s.l} className="px-4 py-3" style={{ background: C.surface }}>
            <p className="text-[11px] font-medium" style={{ color: C.sub }}>
              {s.l}
            </p>
            <p
              className="mt-0.5 text-[18px] font-semibold tabular-nums"
              style={{ ...mono, color: s.c }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <DataToolbar
        count={FACTUREN.length}
        q=""
        onQ={() => {}}
        right={
          <button
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-semibold text-white ${RING}`}
            style={{ background: C.accent }}
          >
            <Plus size={12} aria-hidden="true" /> Nieuw
          </button>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
          <thead>
            <tr style={{ background: C.surfaceAlt }}>
              <ColHead icon={Hash} className="border-b">
                Nummer
              </ColHead>
              <ColHead icon={CircleUser} className="border-b">
                Klant
              </ColHead>
              <ColHead icon={Calendar} className="border-b">
                Datum
              </ColHead>
              <ColHead icon={Hash} className="border-b" align="right">
                Bedrag
              </ColHead>
              <ColHead icon={Tags} className="border-b">
                Status
              </ColHead>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const t = factuurTone(f.status);
              return (
                <tr key={f.nr} className="transition-colors hover:bg-[#f4f6f9]">
                  <td
                    className="border-b px-3 py-2.5 text-[12px] tabular-nums"
                    style={{ ...mono, borderColor: C.lineSoft, color: C.sub }}
                  >
                    {f.nr}
                  </td>
                  <td
                    className="border-b px-3 py-2.5 text-[13px]"
                    style={{ borderColor: C.lineSoft, color: C.ink }}
                  >
                    {f.klant}
                  </td>
                  <td
                    className="border-b px-3 py-2.5 text-[12px] tabular-nums"
                    style={{ ...mono, borderColor: C.lineSoft, color: C.faint }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="border-b px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...mono, borderColor: C.lineSoft, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="border-b px-3 py-2.5" style={{ borderColor: C.lineSoft }}>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                      style={{ color: t.fg, background: t.soft }}
                    >
                      <t.Icon size={11} aria-hidden="true" />
                      {t.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Command-menu ---------- */

function CommandMenu({ onClose, onPick }: { onClose: () => void; onPick: (k: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const items = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Command-menu"
    >
      <button
        className="absolute inset-0 bg-[#1a1d24]/30"
        onClick={onClose}
        aria-label="Sluiten"
        tabIndex={-1}
      />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
        style={{ borderColor: C.line, background: C.surface, animation: "ko-fade 0.18s ease" }}
      >
        <div
          className="flex items-center gap-2 border-b px-3.5 py-3"
          style={{ borderColor: C.line }}
        >
          <Search size={16} style={{ color: C.faint }} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Spring naar tabel of zoek…"
            aria-label="Command-menu zoeken"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: C.ink }}
          />
          <span
            className="rounded border px-1.5 py-0.5 text-[10px]"
            style={{ ...mono, borderColor: C.line, color: C.faint }}
          >
            esc
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12.5px]" style={{ color: C.faint }}>
              Geen resultaten voor “{q}”.
            </p>
          ) : (
            items.map((s) => {
              const Icon = NAV_ICONS[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => onPick(s.key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#f4f6f9] ${RING}`}
                  style={{ color: C.ink }}
                >
                  <Icon size={15} style={{ color: C.accent }} aria-hidden="true" />
                  <span className="flex-1">Ga naar {s.label}</span>
                  <ChevronRight size={13} style={{ color: C.faint }} aria-hidden="true" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
