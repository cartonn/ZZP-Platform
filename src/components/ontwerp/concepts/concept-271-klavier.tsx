"use client";

// Concept 271 — "Klavier" · Keyboard-first / command-palette control surface (light).
// Signature: the whole platform is driven like a mechanical keyboard. A prominent command
// palette (⌘K) is the central control metaphor; every navigable thing carries a keycap hint.
// Keys are rendered with a subtle 3D emboss (layered shadows + inset borders) and press on
// :active. Monochrome ivory/ink base with a felt-green accent. Mono-forward typography.
// Fonts: Geist (occasional text) + Geist Mono (keycaps, codes, cijfers — the lead voice).

import {
  useState,
  useEffect,
  useCallback,
  type CSSProperties,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  MapPin,
  Wallet,
  Clock,
  Calendar,
  Check,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  FileClock,
  CornerDownLeft,
  Command,
  RefreshCw,
  CircleAlert,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Keyboard,
  X,
  Bookmark,
  BookmarkCheck,
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

// Ivory paper, near-black ink, one felt-green accent. Keycap faces read slightly lighter
// than the page with a bottom shadow so they feel physical.
const C = {
  paper: "#f2efe6",
  paper2: "#f7f4ec",
  key: "#fbf9f3",
  keyShade: "#e7e1d1",
  keyEdge: "#d7d0bd",
  line: "#e2dccc",
  lineSoft: "#ebe6d8",
  ink: "#17150f",
  ink2: "#221f16",
  fg: "#1b1810",
  fgSoft: "#494437",
  muted: "#7b7563",
  faint: "#a8a18d",
  felt: "#1f6f43",
  feltDeep: "#175636",
  feltSoft: "#e2efe6",
  ivory: "#faf8f2",
  // Status vocabulary — always paired with an icon + label, never colour alone.
  verified: "#1f6f43",
  verifiedSoft: "#e2efe6",
  submitted: "#3a5f8a",
  submittedSoft: "#e4ecf5",
  expiring: "#9a5a12",
  expiringSoft: "#f6ecd8",
  rejected: "#a02b3a",
  rejectedSoft: "#f7e2e5",
};

const mono = { fontFamily: "var(--font-lab-geist-mono)" };
const geist = { fontFamily: "var(--font-lab-geist)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f43] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2efe6]";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileClock,
  berichten: Search,
};

// The digit shortcut for each of the six screens (1..6), keyed by position.
const SCREEN_DIGIT: Partial<Record<ScreenKey, string>> = SCREENS.reduce(
  (acc, s, i) => {
    acc[s.key] = String(i + 1);
    return acc;
  },
  {} as Partial<Record<ScreenKey, string>>,
);

// ---- Keycap primitives ------------------------------------------------------
// A single stylesheet drives the emboss + press behaviour so :active can swap the
// shadow (arbitrary multi-shadow Tailwind values are unwieldy). Self-contained, inline.
const KEY_STYLES = `
.kl-cap {
  background: ${C.key};
  border: 1px solid ${C.keyEdge};
  border-bottom-width: 2px;
  border-bottom-color: ${C.keyShade};
  box-shadow: 0 2px 0 ${C.keyShade}, 0 3px 4px rgba(23,21,15,0.10), inset 0 1px 0 rgba(255,255,255,0.85);
  transition: transform 90ms ease, box-shadow 90ms ease, background 120ms ease;
}
.kl-cap:hover { background: ${C.ivory}; }
.kl-cap:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 ${C.keyShade}, 0 1px 2px rgba(23,21,15,0.12), inset 0 1px 2px rgba(23,21,15,0.08);
}
.kl-cap-on {
  background: ${C.felt};
  border-color: ${C.feltDeep};
  border-bottom-color: ${C.feltDeep};
  color: ${C.ivory};
  box-shadow: 0 2px 0 ${C.feltDeep}, 0 3px 5px rgba(31,111,67,0.28), inset 0 1px 0 rgba(255,255,255,0.22);
}
.kl-cap-on:hover { background: ${C.felt}; }
.kl-hint {
  background: ${C.key};
  border: 1px solid ${C.keyEdge};
  border-bottom-width: 2px;
  border-bottom-color: ${C.keyShade};
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
}
.kl-row { transition: background 120ms ease, box-shadow 120ms ease, transform 120ms ease; }
.kl-row:hover { background: ${C.ivory}; box-shadow: 0 2px 0 ${C.keyShade}; transform: translateY(-1px); }
`;

// Static keyboard-shortcut hint (little keycap). Non-interactive by design.
function KeyHint({
  children,
  wide = false,
  tone = "ink",
}: {
  children: ReactNode;
  wide?: boolean;
  tone?: "ink" | "felt";
}) {
  return (
    <kbd
      className={`kl-hint inline-flex h-[18px] items-center justify-center rounded-[5px] text-[10px] font-semibold leading-none ${
        wide ? "px-1.5" : "min-w-[18px] px-1"
      }`}
      style={{ ...mono, color: tone === "felt" ? C.felt : C.fgSoft }}
    >
      {children}
    </kbd>
  );
}

// A pressable keycap acting as a real control (nav, palette trigger, actions).
function Keycap({
  children,
  onClick,
  on = false,
  ariaLabel,
  ariaCurrent,
  ariaPressed,
  className,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  on?: boolean;
  ariaLabel?: string;
  ariaCurrent?: "page" | undefined;
  ariaPressed?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      aria-pressed={ariaPressed}
      className={`kl-cap ${on ? "kl-cap-on" : ""} inline-flex items-center gap-2 rounded-[8px] ${RING} ${className ?? ""}`}
      style={{ ...mono, color: on ? C.ivory : C.fg, ...style }}
    >
      {children}
    </button>
  );
}

function Panel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: C.paper2,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        boxShadow: "0 1px 0 rgba(23,21,15,0.03)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---- Status vocabulary ------------------------------------------------------

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.verified, soft: C.verifiedSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.submitted, soft: C.submittedSoft };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        tone: C.expiring,
        soft: C.expiringSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rejected, soft: C.rejectedSoft };
  }
}

function StatusBadge({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[7px] py-0.5 pl-1 pr-2 text-[11px] font-semibold"
      style={{ ...mono, color: tone, background: soft, border: `1px solid ${tone}22` }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-[4px]"
        style={{ background: tone }}
        aria-hidden="true"
      >
        <Icon size={10} strokeWidth={2.4} color="#fff" />
      </span>
      {label}
    </span>
  );
}

// Match score rendered as a mono figure with a thin felt meter.
function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-[8px] px-2 py-1"
      style={{ background: C.feltSoft, border: `1px solid ${C.felt}22` }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-semibold tabular-nums leading-none ${size === "sm" ? "text-[14px]" : "text-[17px]"}`}
        style={{ ...mono, color: C.felt }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...mono, color: C.felt }}
      >
        match
      </span>
    </div>
  );
}

function Sparkline({ data, tone, height = 30 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 66 - 17;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.09} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last && (
        <circle cx={last[0]} cy={last[1]} r={2.4} fill={tone} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}

function SectionTitle({
  Icon,
  children,
  hint,
}: {
  Icon: LucideIcon;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2
        className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em]"
        style={{ ...mono, color: C.fgSoft }}
      >
        <Icon size={15} strokeWidth={2} style={{ color: C.felt }} aria-hidden="true" />
        {children}
      </h2>
      {hint && <span className="hidden items-center gap-1.5 sm:inline-flex">{hint}</span>}
    </div>
  );
}

function ScreenHead({
  digit,
  eyebrow,
  title,
  sub,
}: {
  digit?: string;
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        {digit && <KeyHint tone="felt">{digit}</KeyHint>}
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.muted }}
        >
          {eyebrow}
        </span>
      </div>
      <h1
        className="text-[27px] font-semibold leading-tight tracking-tight sm:text-[31px]"
        style={{ ...geist, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[14px] leading-relaxed"
          style={{ ...geist, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Command palette overlay (mock, non-functional flows; navigation works) --

type Command = {
  key: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
  run: () => void;
};

function CommandPalette({
  onClose,
  goto,
  onToggleSaveTop,
  topSaved,
}: {
  onClose: () => void;
  goto: (s: ScreenKey) => void;
  onToggleSaveTop: () => void;
  topSaved: boolean;
}) {
  const [q, setQ] = useState("");

  const commands: Command[] = [
    ...SCREENS.map((s) => ({
      key: `go-${s.key}`,
      label: `Ga naar ${s.label}`,
      hint: SCREEN_DIGIT[s.key] ?? "",
      Icon: NAV_ICONS[s.key],
      run: () => {
        goto(s.key);
        onClose();
      },
    })),
    {
      key: "save-top",
      label: topSaved ? "Verwijder beste match uit bewaard" : "Bewaar beste match",
      hint: "S",
      Icon: topSaved ? BookmarkCheck : Bookmark,
      run: () => {
        onToggleSaveTop();
        onClose();
      },
    },
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(23,21,15,0.42)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Opdrachtenpalet"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-[14px]"
        style={{
          background: C.paper2,
          border: `1px solid ${C.line}`,
          boxShadow: "0 24px 60px rgba(23,21,15,0.32), 0 2px 0 " + C.keyShade,
        }}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Command size={16} strokeWidth={2} style={{ color: C.felt }} aria-hidden="true" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Typ een commando of scherm…"
            aria-label="Zoek een commando"
            className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-55"
            style={{ ...mono, color: C.fg }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluit palet"
            className={`kl-cap flex h-7 w-7 items-center justify-center rounded-[7px] ${RING}`}
            style={{ color: C.fgSoft }}
          >
            <X size={14} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <ul className="max-h-[46vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ ...geist, color: C.muted }}
            >
              <Keyboard size={22} strokeWidth={1.8} style={{ color: C.faint }} aria-hidden="true" />
              <span className="text-[13px]">Geen commando voor &ldquo;{q}&rdquo;</span>
            </li>
          ) : (
            filtered.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={c.run}
                  className={`kl-row flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left ${RING}`}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]"
                    style={{ background: C.feltSoft, color: C.felt }}
                    aria-hidden="true"
                  >
                    <c.Icon size={15} strokeWidth={2} />
                  </span>
                  <span
                    className="flex-1 text-[13.5px] font-medium"
                    style={{ ...geist, color: C.fg }}
                  >
                    {c.label}
                  </span>
                  {c.hint && <KeyHint>{c.hint}</KeyHint>}
                </button>
              </li>
            ))
          )}
        </ul>

        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-[11px]"
          style={{ ...mono, color: C.muted, borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span className="inline-flex items-center gap-1.5">
            <KeyHint>↑</KeyHint>
            <KeyHint>↓</KeyHint>
            navigeren
          </span>
          <span className="inline-flex items-center gap-1.5">
            <KeyHint wide>
              <CornerDownLeft size={10} strokeWidth={2.4} aria-hidden="true" />
            </KeyHint>
            kiezen
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <KeyHint wide>Esc</KeyHint>
            sluiten
          </span>
        </div>
      </div>
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen, onOpenPalette }: { onOpen: () => void; onOpenPalette: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <KeyHint tone="felt">1</KeyHint>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.muted }}
            >
              {PROFIEL.plaats} · {PROFIEL.rol}
            </span>
          </div>
          <h1
            className="text-[29px] font-semibold leading-none tracking-tight sm:text-[34px]"
            style={{ ...geist, color: C.fg }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[14px]" style={{ ...geist, color: C.muted }}>
            Alles binnen handbereik — bedien het platform met het toetsenbord.
          </p>
        </div>
        <Keycap onClick={onOpenPalette} className="px-3.5 py-2 text-[12.5px] font-semibold">
          <Command size={14} strokeWidth={2.2} aria-hidden="true" />
          Palet
          <span className="ml-1 flex items-center gap-1">
            <KeyHint wide>⌘</KeyHint>
            <KeyHint>K</KeyHint>
          </span>
        </Keycap>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Panel key={k.label} className="overflow-hidden p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.felt : C.expiring }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none"
                style={{ ...geist, color: C.fg }}
              >
                {k.value}
              </div>
              <div className="mt-2.5">
                <Sparkline data={k.spark} tone={C.felt} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle
            Icon={Store}
            hint={
              <span
                className="inline-flex items-center gap-1.5 text-[11px]"
                style={{ ...mono, color: C.muted }}
              >
                openen <KeyHint wide>↵</KeyHint>
              </span>
            }
          >
            Beste match
          </SectionTitle>
          <button
            type="button"
            onClick={onOpen}
            className={`kl-row group flex w-full items-stretch overflow-hidden rounded-[12px] text-left ${RING}`}
            style={{ background: C.paper2, border: `1px solid ${C.line}` }}
          >
            <span className="w-1.5 shrink-0" style={{ background: C.felt }} aria-hidden="true" />
            <span className="flex flex-1 items-start gap-4 p-5">
              <MatchTag value={top.match} />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[17px] font-semibold leading-tight"
                  style={{ ...geist, color: C.fg }}
                >
                  {top.titel}
                </span>
                <span className="mt-0.5 block text-[13px]" style={{ ...geist, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[7px] px-2 py-0.5 text-[11px]"
                      style={{
                        ...mono,
                        color: C.fgSoft,
                        background: C.paper,
                        border: `1px solid ${C.lineSoft}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.felt }}
                aria-hidden="true"
              />
            </span>
          </button>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OPDRACHTEN.slice(1).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={onOpen}
                className={`kl-row flex flex-col items-start gap-2 rounded-[12px] p-4 text-left ${RING}`}
                style={{ background: C.paper2, border: `1px solid ${C.line}` }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    {o.id}
                  </span>
                  <MatchTag value={o.match} size="sm" />
                </div>
                <span
                  className="text-[14.5px] font-semibold leading-tight"
                  style={{ ...geist, color: C.fg }}
                >
                  {o.titel}
                </span>
                <span className="text-[12.5px]" style={{ ...geist, color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle Icon={ListTodo}>Volgende stappen</SectionTitle>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              const tone = warn ? C.expiring : C.submitted;
              const soft = warn ? C.expiringSoft : C.submittedSoft;
              return (
                <Panel key={a.titel} className="overflow-hidden">
                  <div className="flex">
                    <span
                      className="w-1.5 shrink-0"
                      style={{ background: tone }}
                      aria-hidden="true"
                    />
                    <div className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-[6px]"
                          style={{ background: soft, color: tone }}
                          aria-hidden="true"
                        >
                          {warn ? (
                            <TriangleAlert size={12} strokeWidth={2.2} />
                          ) : (
                            <CircleAlert size={12} strokeWidth={2.2} />
                          )}
                        </span>
                        <span
                          className="text-[12.5px] font-semibold leading-snug"
                          style={{ ...geist, color: C.fg }}
                        >
                          {a.titel}
                        </span>
                      </div>
                      <div
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...geist, color: tone }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </ul>
        </div>
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
    <div>
      <ScreenHead
        digit="2"
        eyebrow="Marktplaats"
        title="Opdrachten, toetsenbord-snel"
        sub="Blader met J/K, open met Enter — we tonen eerlijk waarom een opdracht past."
      />

      <div
        className="mb-5 flex items-center gap-2 rounded-[10px] px-4 py-2.5"
        style={{ background: C.paper2, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.felt }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-55"
          style={{ ...geist, color: C.fg }}
        />
        <span className="hidden items-center gap-1 sm:inline-flex" aria-hidden="true">
          <KeyHint>/</KeyHint>
        </span>
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className={`kl-cap rounded-[7px] px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...mono, color: C.felt }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="flex gap-1.5" aria-hidden="true">
            {["J", "K", "↵"].map((t) => (
              <span
                key={t}
                className="kl-hint flex h-10 w-9 items-center justify-center rounded-[7px] text-[13px] font-semibold"
                style={{ ...mono, color: C.faint, opacity: 0.7 }}
              >
                {t}
              </span>
            ))}
          </div>
          <h3 className="text-[20px] font-semibold" style={{ ...geist, color: C.fg }}>
            Niets gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...geist, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <Keycap onClick={() => setQuery("")} className="mt-1 px-5 py-2 text-[13px] font-semibold">
            Filter wissen
          </Keycap>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            const rowKey = idx === 0 ? "J" : idx === 1 ? "K" : "L";
            return (
              <li key={o.id}>
                <div
                  className="kl-row flex items-stretch overflow-hidden rounded-[12px]"
                  style={{ background: C.paper2, border: `1px solid ${C.line}` }}
                >
                  <div
                    className="hidden w-12 shrink-0 flex-col items-center justify-center gap-1 sm:flex"
                    style={{ borderRight: `1px solid ${C.lineSoft}`, background: C.paper }}
                    aria-hidden="true"
                  >
                    <KeyHint>{rowKey}</KeyHint>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(o)}
                    className={`flex flex-1 items-start gap-4 p-5 text-left ${RING}`}
                  >
                    <MatchTag value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className="text-[10px] tabular-nums"
                          style={{ ...mono, color: C.faint }}
                        >
                          {o.id}
                        </span>
                      </span>
                      <span
                        className="mt-0.5 block text-[16px] font-semibold leading-tight"
                        style={{ ...geist, color: C.fg }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block text-[13px]"
                        style={{ ...geist, color: C.muted }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-[7px] px-2 py-0.5 text-[11px]"
                            style={{
                              ...mono,
                              color: C.fgSoft,
                              background: C.paper,
                              border: `1px solid ${C.lineSoft}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 text-[12px]"
                            style={{ ...geist, color: C.fgSoft }}
                          >
                            <Check
                              size={13}
                              strokeWidth={2.6}
                              style={{ color: C.felt }}
                              aria-hidden="true"
                            />
                            {r}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>
                  <div className="flex items-center pr-4">
                    <button
                      type="button"
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className={`kl-cap flex h-9 w-9 items-center justify-center rounded-[8px] ${RING}`}
                      style={{ color: isSaved ? C.felt : C.fgSoft }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={16} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({
  opdracht,
  saved,
  toggleSave,
  onBack,
}: {
  opdracht: Opdracht;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onBack: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const isSaved = saved.has(opdracht.id);
  return (
    <div>
      <Keycap onClick={onBack} className="mb-5 px-3.5 py-1.5 text-[12px] font-semibold">
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug
        <span className="ml-1">
          <KeyHint wide>Esc</KeyHint>
        </span>
      </Keycap>

      <Panel className="overflow-hidden">
        <div
          className="flex items-center justify-between px-6 pb-3 pt-5"
          style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.paper }}
        >
          <span
            className="text-[10px] font-semibold uppercase tabular-nums tracking-[0.16em]"
            style={{ ...mono, color: C.muted }}
          >
            {opdracht.id}
          </span>
          <MatchTag value={opdracht.match} />
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2
                className="text-[24px] font-semibold leading-tight tracking-tight"
                style={{ ...geist, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...geist, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <Keycap
              onClick={() => toggleSave(opdracht.id)}
              on={isSaved}
              ariaPressed={isSaved}
              className="px-4 py-2 text-[12px] font-semibold"
            >
              {isSaved ? (
                <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
              )}
              {isSaved ? "Bewaard" : "Bewaar"}
            </Keycap>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Start", value: opdracht.start },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-[10px] p-3"
                style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
              >
                <m.Icon size={14} strokeWidth={2} style={{ color: C.felt }} aria-hidden="true" />
                <div
                  className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[7px] px-2 py-0.5 text-[11px]"
                style={{
                  ...mono,
                  color: C.fgSoft,
                  background: C.paper,
                  border: `1px solid ${C.lineSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 pb-2.5 pt-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[7px]"
              style={{ background: C.feltSoft, color: C.felt }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...geist, color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.felt }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 pb-2.5 pt-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[7px]"
              style={{ background: C.expiringSoft, color: C.expiring }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...geist, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.expiring }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Keycap
          onClick={() => setApplied((v) => !v)}
          on={applied}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px] font-semibold"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </Keycap>
        {applied && (
          <span className="text-[12.5px]" style={{ ...geist, color: C.muted }}>
            De opdrachtgever reageert gemiddeld binnen 6 uur.
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
  return (
    <div>
      <ScreenHead
        digit="4"
        eyebrow="Verificatie"
        title="Documenten, per status gemerkt"
        sub="Elke status heeft een eigen icoon én label — herkenbaar zonder op kleur te leunen."
      />

      {/* Legend: the four verification states, each icon + label */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const m = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-[10px] p-3"
              style={{ background: C.paper2, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
                style={{ background: m.soft, color: m.tone }}
                aria-hidden="true"
              >
                <m.Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...geist, color: C.fg }}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel className="mb-6 overflow-hidden">
        <div className="flex items-center gap-4 p-5">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px]"
            style={{ background: C.feltSoft, color: C.felt }}
            aria-hidden="true"
          >
            <ShieldCheck size={24} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ ...geist, color: C.fg }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-0.5 text-[13px]" style={{ ...geist, color: C.fgSoft }}>
              Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const m = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 overflow-hidden">
                <span
                  className="w-1.5 self-stretch"
                  style={{ background: m.tone }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`kl-cap my-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] ${done ? "kl-cap-on" : ""} ${RING}`}
                  style={{ color: done ? C.ivory : "transparent" }}
                >
                  <Check size={15} strokeWidth={2.6} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1 py-3">
                  <div className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...geist, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <div className="pr-4">
                  <StatusBadge status={c.status} />
                </div>
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              <FileClock size={15} strokeWidth={2} style={{ color: C.felt }} aria-hidden="true" />
              Documenten
            </span>
            <button
              type="button"
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`kl-cap flex h-8 w-8 items-center justify-center rounded-[8px] ${RING}`}
              style={{ color: C.felt }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`kl-cap rounded-[8px] px-3 py-1 text-[11px] font-semibold ${feedState === s ? "kl-cap-on" : ""} ${RING}`}
                style={{ color: feedState === s ? C.ivory : C.muted }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-[11px]"
                style={{ background: C.rejectedSoft, color: C.rejected }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...geist, color: C.fg }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...geist, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <Keycap
                onClick={() => setFeedState("ok")}
                className="mt-1 px-4 py-2 text-[12px] font-semibold"
              >
                Opnieuw proberen
              </Keycap>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => {
                const m = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[9px] font-bold"
                      style={{ ...mono, background: m.soft, color: m.tone }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...geist, color: C.fg }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </Panel>
                );
              })}
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
    <div>
      <ScreenHead digit="5" eyebrow="Acties" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-[12px]"
            style={{ background: C.feltSoft, color: C.felt }}
            aria-hidden="true"
          >
            <Check size={26} strokeWidth={2.4} />
          </span>
          <h3 className="text-[20px] font-semibold" style={{ ...geist, color: C.fg }}>
            Alles afgehandeld
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...geist, color: C.muted }}>
            Niets meer te doen vandaag. Een schoon toetsenbord.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-[8px] px-3.5 py-2"
            style={{ background: C.expiringSoft, border: `1px solid ${C.expiring}22` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[12px] font-bold tabular-nums text-white"
              style={{ ...mono, background: C.expiring }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...geist, color: C.expiring }}>
              {openCount} {openCount === 1 ? "actie" : "acties"} open
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              const tone = isDone ? C.felt : warn ? C.expiring : C.submitted;
              const soft = warn ? C.expiringSoft : C.submittedSoft;
              return (
                <Panel key={a.titel} className="flex items-stretch overflow-hidden">
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: tone }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <button
                      type="button"
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`kl-cap flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] ${isDone ? "kl-cap-on" : ""} ${RING}`}
                      style={{ color: isDone ? C.ivory : "transparent" }}
                    >
                      <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-[6px]"
                          style={{ background: soft, color: warn ? C.expiring : C.submitted }}
                          aria-hidden="true"
                        >
                          {warn ? (
                            <TriangleAlert size={12} strokeWidth={2.2} />
                          ) : (
                            <CircleAlert size={12} strokeWidth={2.2} />
                          )}
                        </span>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                          style={{ ...mono, color: warn ? C.expiring : C.submitted }}
                        >
                          {warn ? "Belangrijk" : "Ter info"}
                        </span>
                      </div>
                      <div
                        className="mt-1.5 text-[15px] font-semibold leading-snug"
                        style={{
                          ...geist,
                          color: C.fg,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...geist, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => toggleDone(a.titel)}
                          className={`kl-cap mt-2.5 inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold ${RING}`}
                          style={{ ...geist, color: warn ? C.expiring : C.submitted }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusMetaFor = (
    status: string,
  ): { tone: string; soft: string; Icon: LucideIcon; label: string } =>
    status === "Betaald"
      ? { tone: C.verified, soft: C.verifiedSoft, Icon: Check, label: "Betaald" }
      : status === "Openstaand"
        ? { tone: C.expiring, soft: C.expiringSoft, Icon: Clock, label: "Openstaand" }
        : { tone: C.muted, soft: C.lineSoft, Icon: FileClock, label: "Concept" };

  return (
    <div>
      <ScreenHead
        digit="6"
        eyebrow="Facturen"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.verified },
            { label: "Openstaand", value: "€ 1.350", tone: C.expiring },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Panel key={s.label} className="overflow-hidden p-4">
              <div
                className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[22px] font-semibold tabular-nums"
                style={{ ...geist, color: s.tone }}
              >
                {s.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.felt} height={46} />
        </Panel>
      </div>

      <Panel className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const m = statusMetaFor(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#faf8f2]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...geist, color: C.fg }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[7px] py-0.5 pl-1 pr-2 text-[11px] font-semibold"
                        style={{
                          ...mono,
                          color: m.tone,
                          background: m.soft,
                          border: `1px solid ${m.tone}22`,
                        }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-[4px]"
                          style={{ background: m.tone }}
                          aria-hidden="true"
                        >
                          <m.Icon size={10} strokeWidth={2.4} color="#fff" />
                        </span>
                        {m.label}
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

// ---- Shell ------------------------------------------------------------------

export function Concept271() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<"ok" | "loading" | "error">("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  const topId = OPDRACHTEN[0]?.id ?? "";

  // Keyboard control: digits 1..6 switch screens, ⌘K / Ctrl+K opens the palette,
  // Escape closes it. Interactive keycaps below keep it fully usable without a keyboard.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key >= "1" && e.key <= "6") {
        const idx = Number(e.key) - 1;
        const s = SCREENS[idx];
        if (s) {
          setScreen(s.key);
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const handleShellKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && paletteOpen) setPaletteOpen(false);
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...geist, color: C.fg, background: C.paper }}
      onKeyDown={handleShellKey}
    >
      <style>{KEY_STYLES}</style>

      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="kl-cap flex h-11 w-11 items-center justify-center rounded-[10px]"
              style={{ color: C.felt }}
              aria-hidden="true"
            >
              <Keyboard size={20} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...geist, color: C.fg }}
              >
                Klavier
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Keycap
              onClick={() => setPaletteOpen(true)}
              ariaLabel="Open opdrachtenpalet"
              className="px-3 py-2 text-[12px] font-semibold"
            >
              <Command size={14} strokeWidth={2.2} aria-hidden="true" />
              <span className="hidden sm:inline">Palet</span>
              <span className="flex items-center gap-1">
                <KeyHint wide>⌘</KeyHint>
                <KeyHint>K</KeyHint>
              </span>
            </Keycap>
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...geist, color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...geist, color: C.felt }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[13px] font-bold"
              style={{ ...mono, background: C.felt, color: C.ivory }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            const digit = SCREEN_DIGIT[s.key];
            return (
              <Keycap
                key={s.key}
                onClick={() => setScreen(s.key)}
                on={on}
                ariaCurrent={on ? "page" : undefined}
                className="shrink-0 px-3 py-2 text-[12.5px] font-semibold"
              >
                {digit && (
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-[4px] text-[10px] font-bold tabular-nums"
                    style={{
                      background: on ? "rgba(255,255,255,0.2)" : C.paper,
                      color: on ? C.ivory : C.muted,
                      border: on ? "none" : `1px solid ${C.lineSoft}`,
                    }}
                    aria-hidden="true"
                  >
                    {digit}
                  </span>
                )}
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
                {s.label}
              </Keycap>
            );
          })}
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onOpenPalette={() => setPaletteOpen(true)}
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
              saved={saved}
              toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
          style={{ ...mono, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Command size={12} strokeWidth={2} style={{ color: C.felt }} aria-hidden="true" />
            Druk <KeyHint wide>⌘</KeyHint>
            <KeyHint>K</KeyHint> voor het palet · 1–6 voor schermen
          </span>
          <span>Klavier · v271</span>
        </footer>
      </div>

      {paletteOpen && (
        <CommandPalette
          onClose={closePalette}
          goto={(s) => setScreen(s)}
          topSaved={saved.has(topId)}
          onToggleSaveTop={() => setSaved((s) => toggleSet(s, topId))}
        />
      )}
    </div>
  );
}
