"use client";

// Concept 241 — "Adaptief" · Progressive disclosure & role-adaptive interface.
// The 2026 core pattern: the interface deliberately shows LESS, in the right order.
// A role switch at the top (ZZP'er / Opdrachtgever / Bemiddelaar) reflows the dashboard
// to exactly what that role needs right now. Cards are collapsed summaries that expand
// on demand (chevron + aria-expanded) to reveal depth — never everything at once.
// Calm, premium, warm-neutral palette (off-white, one quiet indigo/teal accent).
// Fonts: Geist (UI) + Geist Mono (labels/numbers).

import { useState, type CSSProperties } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  ChevronDown,
  ChevronRight,
  Search,
  Bookmark,
  BookmarkCheck,
  Check,
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Wallet,
  Calendar,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CircleAlert,
  Inbox,
  FileText,
  MessageSquare,
  User,
  Building2,
  Users,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Warm-neutral palette. One quiet indigo/teal accent; text meets WCAG AA on the canvas.
const C = {
  canvas: "#f6f5f2", // warm off-white
  surface: "#ffffff",
  surfaceAlt: "#fbfaf7",
  line: "#e7e4dd",
  lineSoft: "#efece6",
  ink: "#1f2430", // near-black warm
  inkSoft: "#4a5162",
  muted: "#6d7386",
  faint: "#9a9fae",
  accent: "#4c5bd4", // quiet indigo
  accentSoft: "#eceefb",
  teal: "#0f8f86", // secondary calm teal
  tealSoft: "#e2f3f1",
  amber: "#b5790c",
  amberSoft: "#f7efdb",
  rose: "#c0433f",
  roseSoft: "#f8e7e6",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

type Rol = "zzp" | "opdrachtgever" | "bemiddelaar";

const ROLLEN: { key: Rol; label: string; Icon: LucideIcon; hint: string }[] = [
  { key: "zzp", label: "ZZP'er", Icon: User, hint: "Jouw werk & vertrouwen" },
  {
    key: "opdrachtgever",
    label: "Opdrachtgever",
    Icon: Building2,
    hint: "Kandidaten & compliance",
  },
  { key: "bemiddelaar", label: "Bemiddelaar", Icon: Users, hint: "Pool & bemiddeling" },
];

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageSquare,
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.teal, bg: C.tealSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.accent, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.rose, bg: C.roseSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ ...ui, color: fg, background: bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 82 - 9;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function panelStyle(): CSSProperties {
  return { background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14 };
}

// Reusable progressive-disclosure card — collapsed summary → expand on demand.
function Disclosure({
  Icon,
  title,
  summary,
  badge,
  defaultOpen = false,
  accent = C.accent,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  summary: string;
  badge?: string;
  defaultOpen?: boolean;
  accent?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={panelStyle()} className="overflow-hidden">
      <h3 className="m-0">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--c241-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)] focus-visible:ring-offset-0"
          style={{ ["--c241-hover" as string]: C.surfaceAlt, ["--c241-accent" as string]: accent }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: C.accentSoft, color: accent }}
            aria-hidden="true"
          >
            <Icon size={17} strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>
                {title}
              </span>
              {badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums"
                  style={{ ...mono, background: C.lineSoft, color: C.muted }}
                >
                  {badge}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
              {summary}
            </span>
          </span>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform"
            style={{ color: C.muted, transform: open ? "rotate(0deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          >
            {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
        </button>
      </h3>
      {open && (
        <div className="border-t px-4 py-3.5" style={{ borderColor: C.lineSoft }}>
          {children}
        </div>
      )}
    </section>
  );
}

// ---- Role-adaptive dashboard blocks ---------------------------------------

function MatchesBlock({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  return (
    <ul className="space-y-2">
      {OPDRACHTEN.map((o) => (
        <li key={o.id}>
          <button
            onClick={() => onOpen(o)}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[color:var(--c241-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
            style={{
              ["--c241-hover" as string]: C.surfaceAlt,
              ["--c241-accent" as string]: C.accent,
            }}
          >
            <span
              className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] leading-none"
              style={{ background: C.accentSoft, color: C.accent }}
            >
              <span className="text-[15px] font-bold tabular-nums" style={mono}>
                {o.match}
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-wide">match</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold" style={{ color: C.ink }}>
                {o.titel}
              </span>
              <span className="block truncate text-[12px]" style={{ color: C.muted }}>
                {o.opdrachtgever} · {o.plaats} · {o.tarief}
              </span>
            </span>
            <ChevronRight size={17} style={{ color: C.faint }} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function CredentialsBlock() {
  return (
    <ul className="space-y-2">
      {CREDENTIALS.map((c) => (
        <li
          key={c.naam}
          className="flex items-center justify-between gap-3 rounded-[10px] px-3 py-2.5"
          style={{ background: C.surfaceAlt }}
        >
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold" style={{ color: C.ink }}>
              {c.naam}
            </span>
            <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
              {c.detail}
            </span>
          </span>
          <StatusChip status={c.status} />
        </li>
      ))}
    </ul>
  );
}

function ActiesBlock() {
  return (
    <ul className="space-y-2">
      {ACTIES.map((a) => (
        <li
          key={a.titel}
          className="flex items-start gap-3 rounded-[10px] px-3 py-2.5"
          style={{ background: C.surfaceAlt }}
        >
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ background: a.urgentie === "warning" ? C.amber : C.accent }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold" style={{ color: C.ink }}>
              {a.titel}
            </span>
            <span
              className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold"
              style={{ color: C.accent }}
            >
              {a.cta}
              <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function FacturenBlock() {
  const badgeFg = (s: string): string =>
    s === "Betaald" ? C.teal : s === "Openstaand" ? C.amber : C.muted;
  return (
    <ul className="space-y-2">
      {FACTUREN.map((f) => (
        <li
          key={f.nr}
          className="flex items-center justify-between gap-3 rounded-[10px] px-3 py-2.5"
          style={{ background: C.surfaceAlt }}
        >
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold" style={{ color: C.ink }}>
              {f.klant}
            </span>
            <span className="block text-[11.5px]" style={{ ...mono, color: C.muted }}>
              {f.nr} · {f.datum}
            </span>
          </span>
          <span className="flex flex-col items-end">
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {f.bedrag}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: badgeFg(f.status) }}>
              {f.status}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function BerichtenBlock() {
  return (
    <ul className="space-y-2">
      {BERICHTEN.map((b) => (
        <li
          key={b.van}
          className="flex items-center gap-3 rounded-[10px] px-3 py-2.5"
          style={{ background: C.surfaceAlt }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            {b.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                {b.van}
              </span>
              {b.ongelezen && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              )}
            </span>
            <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
              {b.preview}
            </span>
          </span>
          <span className="shrink-0 text-[11px]" style={{ ...mono, color: C.faint }}>
            {b.tijd}
          </span>
        </li>
      ))}
    </ul>
  );
}

// The role config maps each role to an ordered set of disclosures — deliberately less,
// in the right order for that role right now.
function Dashboard({ rol, onOpen }: { rol: Rol; onOpen: (o: Opdracht) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const openFacturen = FACTUREN.filter((f) => f.status === "Openstaand").length;

  const blocks: Record<
    Rol,
    {
      Icon: LucideIcon;
      title: string;
      summary: string;
      badge?: string;
      open?: boolean;
      body: React.ReactNode;
    }[]
  > = {
    zzp: [
      {
        Icon: Sparkle,
        title: "Beste matches",
        summary: `${OPDRACHTEN.length} opdrachten passen bij jouw profiel`,
        badge: `${OPDRACHTEN[0]?.match}% top`,
        open: true,
        body: <MatchesBlock onOpen={onOpen} />,
      },
      {
        Icon: ShieldCheck,
        title: "Jouw certificaten",
        summary: `${verified} van ${CREDENTIALS.length} geverifieerd · 1 verloopt binnenkort`,
        badge: `${verified}/${CREDENTIALS.length}`,
        body: <CredentialsBlock />,
      },
      {
        Icon: ListChecks,
        title: "Volgende acties",
        summary: `${ACTIES.length} taken vragen om aandacht`,
        badge: `${ACTIES.length}`,
        body: <ActiesBlock />,
      },
    ],
    opdrachtgever: [
      {
        Icon: Users,
        title: "Voorgestelde kandidaten",
        summary: `${OPDRACHTEN.length} ZZP'ers matchen op je open opdracht`,
        badge: `${OPDRACHTEN[0]?.match}% top`,
        open: true,
        body: <MatchesBlock onOpen={onOpen} />,
      },
      {
        Icon: ShieldCheck,
        title: "Compliance & vertrouwen",
        summary: `${verified} geverifieerd · controleer verlopende documenten`,
        badge: `${verified}/${CREDENTIALS.length}`,
        body: <CredentialsBlock />,
      },
      {
        Icon: Receipt,
        title: "Facturen te controleren",
        summary: `${openFacturen} openstaand · rest afgehandeld`,
        badge: `${openFacturen} open`,
        body: <FacturenBlock />,
      },
    ],
    bemiddelaar: [
      {
        Icon: MessageSquare,
        title: "Pool-activiteit",
        summary: `${BERICHTEN.filter((b) => b.ongelezen).length} ongelezen berichten in de pool`,
        badge: `${BERICHTEN.length}`,
        open: true,
        body: <BerichtenBlock />,
      },
      {
        Icon: ListChecks,
        title: "Bemiddeling in behandeling",
        summary: `${ACTIES.length} openstaande acties over kandidaten`,
        badge: `${ACTIES.length}`,
        body: <ActiesBlock />,
      },
      {
        Icon: Receipt,
        title: "Facturatie pool",
        summary: `${openFacturen} openstaand · ${FACTUREN.length} totaal`,
        badge: `${FACTUREN.length}`,
        body: <FacturenBlock />,
      },
    ],
  };

  const active = ROLLEN.find((r) => r.key === rol);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[19px] font-semibold" style={{ color: C.ink }}>
            Dashboard
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
            Aangepast aan rol{" "}
            <span className="font-semibold" style={{ color: C.accent }}>
              {active?.label}
            </span>{" "}
            — alleen wat nu telt.
          </p>
        </div>
      </div>

      {/* Compact KPI strip — always the top-level signal */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tones = [C.accent, C.teal, C.teal, C.amber];
          const tone = tones[i % tones.length] ?? C.accent;
          return (
            <div key={k.label} className="p-3.5" style={panelStyle()}>
              <div className="flex items-center justify-between gap-2">
                <span
                  className="truncate text-[11px] font-semibold uppercase tracking-wide"
                  style={{ ...mono, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                  style={{ ...mono, color: k.up ? C.teal : C.amber }}
                >
                  <Trend size={11} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1 text-[22px] font-semibold tabular-nums leading-none"
                style={{ color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <Spark data={k.spark} tone={tone} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progressive disclosure stack — reflows per role */}
      <div className="space-y-3">
        {blocks[rol].map((b) => (
          <Disclosure
            key={b.title}
            Icon={b.Icon}
            title={b.title}
            summary={b.summary}
            badge={b.badge}
            defaultOpen={b.open}
          >
            {b.body}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}

function Marktplaats({
  query,
  setQuery,
  saved,
  toggleSave,
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onOpen: (o: Opdracht) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q) ||
      o.opdrachtgever.toLowerCase().includes(q) ||
      o.plaats.toLowerCase().includes(q) ||
      o.tags.some((t) => t.toLowerCase().includes(q)),
  );
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[19px] font-semibold" style={{ color: C.ink }}>
          Marktplaats
        </div>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          Klap een kaart uit voor de volledige onderbouwing.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-[12px] px-3.5 py-2.5" style={panelStyle()}>
        <Search size={17} className="shrink-0" style={{ color: C.faint }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of skill…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[color:var(--c241-faint)]"
          style={{ ...ui, color: C.ink, ["--c241-faint" as string]: C.faint }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
            style={{
              color: C.accent,
              background: C.accentSoft,
              ["--c241-accent" as string]: C.accent,
            }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={2} />
          </span>
          <h3 className="text-[16px] font-semibold" style={{ color: C.ink }}>
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen opdracht voor &ldquo;{query}&rdquo;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-full px-4 py-2 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <MarktRow
              key={o.id}
              o={o}
              saved={saved.has(o.id)}
              toggleSave={() => toggleSave(o.id)}
              onOpen={() => onOpen(o)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// Marketplace row is itself progressive disclosure: summary → expand for reasons.
function MarktRow({
  o,
  saved,
  toggleSave,
  onOpen,
}: {
  o: Opdracht;
  saved: boolean;
  toggleSave: () => void;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li style={panelStyle()} className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[11px] leading-none"
          style={{ background: C.accentSoft, color: C.accent }}
        >
          <span className="text-[16px] font-bold tabular-nums" style={mono}>
            {o.match}
          </span>
          <span className="text-[8px] font-semibold uppercase tracking-wide">match</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-semibold" style={{ color: C.ink }}>
            {o.titel}
          </div>
          <div className="truncate text-[12.5px]" style={{ color: C.muted }}>
            {o.opdrachtgever} · {o.plaats} · {o.tarief}
          </div>
        </div>
        <button
          onClick={toggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
          style={{
            color: saved ? C.accent : C.faint,
            background: saved ? C.accentSoft : "transparent",
            ["--c241-accent" as string]: C.accent,
          }}
        >
          {saved ? (
            <BookmarkCheck size={17} aria-hidden="true" />
          ) : (
            <Bookmark size={17} aria-hidden="true" />
          )}
        </button>
      </div>
      <div
        className="flex items-center gap-2 border-t px-4 py-2"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors hover:bg-[color:var(--c241-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
          style={{
            color: C.inkSoft,
            ["--c241-hover" as string]: C.surfaceAlt,
            ["--c241-accent" as string]: C.accent,
          }}
        >
          {open ? (
            <ChevronDown size={15} aria-hidden="true" />
          ) : (
            <ChevronRight size={15} aria-hidden="true" />
          )}
          {open ? "Toon minder" : "Waarom deze match"}
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent }}
        >
          Open opdracht
          <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div
          className="grid grid-cols-1 gap-3 border-t px-4 py-3.5 sm:grid-cols-2"
          style={{ borderColor: C.lineSoft, background: C.surfaceAlt }}
        >
          <div>
            <div
              className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ ...mono, color: C.teal }}
            >
              Waarom dit past
            </div>
            <ul className="space-y-1.5">
              {o.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[12.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={14}
                    strokeWidth={2.6}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.teal }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div
              className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ ...mono, color: C.amber }}
            >
              Let op
            </div>
            <ul className="space-y-1.5">
              {o.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[12.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <TriangleAlert
                    size={14}
                    strokeWidth={2.4}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:col-span-2">
            {o.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.lineSoft, color: C.inkSoft }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

function OpdrachtDetail({
  opdracht,
  saved,
  toggleSave,
  onBack,
}: {
  opdracht: Opdracht;
  saved: boolean;
  toggleSave: () => void;
  onBack: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const [showMin, setShowMin] = useState(false);
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[color:var(--c241-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
        style={{
          color: C.inkSoft,
          background: C.surface,
          border: `1px solid ${C.line}`,
          ["--c241-hover" as string]: C.surfaceAlt,
          ["--c241-accent" as string]: C.accent,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <div className="p-5 sm:p-6" style={panelStyle()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[13px] leading-none"
              style={{ background: C.accentSoft, color: C.accent }}
            >
              <span className="text-[19px] font-bold tabular-nums" style={mono}>
                {opdracht.match}
              </span>
              <span className="text-[8.5px] font-semibold uppercase tracking-wide">match</span>
            </span>
            <div>
              <h2 className="text-[22px] font-semibold leading-tight" style={{ color: C.ink }}>
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={toggleSave}
            aria-pressed={saved}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
            style={{
              color: saved ? C.accent : C.inkSoft,
              background: saved ? C.accentSoft : C.surfaceAlt,
              ["--c241-accent" as string]: C.accent,
            }}
          >
            {saved ? (
              <BookmarkCheck size={15} aria-hidden="true" />
            ) : (
              <Bookmark size={15} aria-hidden="true" />
            )}
            {saved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="rounded-[11px] p-3" style={{ background: C.surfaceAlt }}>
              <m.Icon size={15} style={{ color: C.accent }} aria-hidden="true" />
              <dt
                className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </dt>
              <dd className="text-[14px] font-semibold" style={{ color: C.ink }}>
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
              style={{ background: C.lineSoft, color: C.inkSoft }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="p-5" style={panelStyle()}>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: C.tealSoft, color: C.teal }}
            aria-hidden="true"
          >
            <Plus size={13} strokeWidth={2.8} />
          </span>
          <span className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
            Waarom dit past
          </span>
        </div>
        <ul className="space-y-2">
          {opdracht.redenen.plus.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
              <Check
                size={15}
                strokeWidth={2.6}
                className="mt-0.5 shrink-0"
                style={{ color: C.teal }}
                aria-hidden="true"
              />
              {r}
            </li>
          ))}
        </ul>

        {/* Aandachtspunten stay hidden until requested — progressive disclosure */}
        <button
          onClick={() => setShowMin((v) => !v)}
          aria-expanded={showMin}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[color:var(--c241-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
          style={{
            color: C.amber,
            background: C.amberSoft,
            ["--c241-hover" as string]: C.surfaceAlt,
            ["--c241-accent" as string]: C.accent,
          }}
        >
          {showMin ? (
            <ChevronDown size={15} aria-hidden="true" />
          ) : (
            <ChevronRight size={15} aria-hidden="true" />
          )}
          {showMin
            ? "Verberg aandachtspunten"
            : `Toon ${opdracht.redenen.min.length} aandachtspunt(en)`}
        </button>
        {showMin && (
          <ul className="mt-2.5 space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: C.inkSoft }}
              >
                <Minus
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: applied ? C.teal : C.accent }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ color: C.muted }}>
            Gemiddelde reactietijd opdrachtgever: 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

function Verificatie({
  checked,
  toggleCheck,
  feedState,
  setFeedState,
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
  feedState: "ok" | "loading" | "error";
  setFeedState: (s: "ok" | "loading" | "error") => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[19px] font-semibold" style={{ color: C.ink }}>
          Verificatie
        </div>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          {verified} van {CREDENTIALS.length} geverifieerd · {PROFIEL.trust}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam} className="flex items-center gap-3 p-4" style={panelStyle()}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
                  style={{
                    border: `1.5px solid ${done ? C.accent : C.line}`,
                    background: done ? C.accent : "transparent",
                    color: "#fff",
                    ["--c241-accent" as string]: C.accent,
                  }}
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[14.5px] font-semibold"
              style={{ color: C.ink }}
            >
              <FileText
                size={16}
                strokeWidth={2.2}
                style={{ color: C.accent }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--c241-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
              style={{
                color: C.accent,
                border: `1px solid ${C.line}`,
                ["--c241-hover" as string]: C.surfaceAlt,
                ["--c241-accent" as string]: C.accent,
              }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className="rounded-full px-3 py-1 text-[11.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
                style={{
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.accent : C.surfaceAlt,
                  border: `1px solid ${feedState === s ? C.accent : C.line}`,
                  ["--c241-accent" as string]: C.accent,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3" style={panelStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={panelStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.roseSoft, color: C.rose }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12px]" style={{ color: C.muted }}>
                Kon de documentenkluis niet bereiken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.accent }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={panelStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[9px] font-bold"
                    style={{ background: C.accentSoft, color: C.accent }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                      {d.naam}
                    </div>
                    <div className="text-[11px]" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusChip status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[19px] font-semibold" style={{ color: C.ink }}>
          Acties
        </div>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          {openCount === 0 ? "Alles afgerond." : `${openCount} openstaande acties.`}
        </p>
      </div>

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.tealSoft, color: C.teal }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.4} />
          </span>
          <h3 className="text-[16px] font-semibold" style={{ color: C.ink }}>
            Wachtrij leeg
          </h3>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Je hebt alle acties afgerond. Nieuwe taken verschijnen hier vanzelf.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ACTIES.map((a) => {
            const isDone = done.has(a.titel);
            return (
              <li key={a.titel} className="flex items-start gap-4 p-5" style={panelStyle()}>
                <button
                  onClick={() => toggleDone(a.titel)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c241-accent)]"
                  style={{
                    border: `1.5px solid ${isDone ? C.teal : C.line}`,
                    background: isDone ? C.teal : "transparent",
                    color: "#fff",
                    ["--c241-accent" as string]: C.accent,
                  }}
                >
                  {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-semibold leading-snug"
                    style={{
                      color: C.ink,
                      textDecoration: isDone ? "line-through" : "none",
                      opacity: isDone ? 0.55 : 1,
                    }}
                  >
                    {a.titel}
                  </div>
                  <p
                    className="mt-1 text-[12.5px]"
                    style={{ color: C.muted, opacity: isDone ? 0.55 : 1 }}
                  >
                    {a.detail}
                  </p>
                  {!isDone && (
                    <span
                      className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{
                        color: a.urgentie === "warning" ? C.amber : C.accent,
                        background: a.urgentie === "warning" ? C.amberSoft : C.accentSoft,
                      }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  )}
                </div>
                {a.urgentie === "warning" && !isDone && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ color: C.amber, background: C.amberSoft }}
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                    Urgent
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Facturen() {
  const badgeFg = (s: string): string =>
    s === "Betaald" ? C.teal : s === "Openstaand" ? C.amber : C.muted;
  const badgeBg = (s: string): string =>
    s === "Betaald" ? C.tealSoft : s === "Openstaand" ? C.amberSoft : C.lineSoft;
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[19px] font-semibold" style={{ color: C.ink }}>
          Facturen
        </div>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          Overzicht van je facturen en hun status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.teal },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <div key={s.label} className="p-4" style={panelStyle()}>
            <div
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div className="mt-1 text-[22px] font-semibold tabular-nums" style={{ color: s.tone }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden" style={panelStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide"
                    style={{ ...mono, color: C.muted }}
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
                  className="transition-colors hover:bg-[color:var(--c241-hover)]"
                  style={
                    {
                      borderBottom: `1px solid ${C.lineSoft}`,
                      ["--c241-hover" as string]: C.surfaceAlt,
                    } as CSSProperties
                  }
                >
                  <td
                    className="px-4 py-3 text-[12.5px] font-semibold"
                    style={{ ...mono, color: C.accent }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ ...mono, color: C.muted }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-[13px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                      style={{ color: badgeFg(f.status), background: badgeBg(f.status) }}
                    >
                      {f.status === "Betaald" ? (
                        <Check size={11} strokeWidth={3} aria-hidden="true" />
                      ) : f.status === "Openstaand" ? (
                        <Clock size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <FileText size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept241() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [rol, setRol] = useState<Rol>("zzp");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<"ok" | "loading" | "error">("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[12px] text-white"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              <Sparkle size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div className="text-[18px] font-semibold" style={{ color: C.ink }}>
                Adaptief
              </div>
              <div className="text-[11px] font-medium" style={{ color: C.muted }}>
                Rustig · toont alleen wat telt
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px] font-medium"
                style={{ color: C.teal }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold"
              style={{ background: C.accentSoft, color: C.accent }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Role switch — reflows the dashboard to what this role needs now */}
        <div className="mb-5" role="group" aria-label="Kies rol-weergave">
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
            style={{ ...mono, color: C.muted }}
          >
            Bekijk als
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLLEN.map((r) => {
              const on = r.key === rol;
              return (
                <button
                  key={r.key}
                  onClick={() => {
                    setRol(r.key);
                    setScreen("dashboard");
                  }}
                  aria-pressed={on}
                  className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: on ? C.accent : C.surface,
                    border: `1px solid ${on ? C.accent : C.line}`,
                    color: on ? "#fff" : C.inkSoft,
                  }}
                >
                  <r.Icon
                    size={17}
                    strokeWidth={2.2}
                    aria-hidden="true"
                    style={{ color: on ? "#fff" : C.accent }}
                  />
                  <span className="leading-tight">
                    <span className="block text-[13px] font-semibold">{r.label}</span>
                    <span
                      className="block text-[11px]"
                      style={{ color: on ? "rgba(255,255,255,0.82)" : C.muted }}
                    >
                      {r.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <nav className="mb-6 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.ink : C.surface,
                  border: `1px solid ${on ? C.ink : C.line}`,
                }}
              >
                <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <main>
          {screen === "dashboard" && (
            <Dashboard
              rol={rol}
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
          {screen === "marktplaats" && (
            <Marktplaats
              query={query}
              setQuery={setQuery}
              saved={saved}
              toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
          {screen === "opdracht" && (
            <OpdrachtDetail
              opdracht={active}
              saved={saved.has(active.id)}
              toggleSave={() => setSaved((s) => toggleSet(s, active.id))}
              onBack={() => setScreen("marktplaats")}
            />
          )}
          {screen === "verificatie" && (
            <Verificatie
              checked={checked}
              toggleCheck={(naam) => setChecked((s) => toggleSet(s, naam))}
              feedState={feedState}
              setFeedState={setFeedState}
            />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11.5px]"
          style={{ borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare
              size={13}
              strokeWidth={2.2}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen · {ACTIES.length} acties
          </span>
          <span>Progressive disclosure · minder ruis, meer focus</span>
        </footer>
      </div>
    </div>
  );
}
