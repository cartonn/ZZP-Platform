"use client";

// Concept 534 — "Onzichtbaar" · Invisible logic / command-first. De complexiteit verdwijnt naar de
// achtergrond: minimale chrome, veel rust en witruimte, subtiel monochroom met één ingetogen accent.
// Een prominent command-menu (⌘K) is de spil — alles is één toetsaanslag ver. Details onthullen zich
// pas op hover of expand (progressive disclosure). Keyboard-first: overal kbd-chips en focus-ringen.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  CornerDownLeft,
  FileText,
  Hash,
  Inbox,
  LayoutGrid,
  ListChecks,
  Loader2,
  Minus,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  TriangleAlert,
  X,
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

// ————————————————————————————— Palet — bijna-monochroom, één ingetogen accent —————————————————————————————
const C = {
  bg: "#fcfcfb",
  surface: "#ffffff",
  sink: "#f5f5f3",
  sinkDeep: "#efefec",
  hair: "#e8e8e4",
  hairSoft: "#f1f1ee",
  ink: "#17160f",
  inkSoft: "#42403a",
  inkMute: "#77756c",
  inkFaint: "#a9a79d",
  accent: "#4f46e5",
  accentSoft: "#eef0fe",
  accentDeep: "#312c9c",
  ok: "#3f7a52",
  okSoft: "#eaf2ec",
  warn: "#946318",
  warnSoft: "#f6eede",
  danger: "#9f3628",
  dangerSoft: "#f6e6e2",
};

const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfcfb]";

// ————————————————————————————— Status-taal (altijd label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { base: C.ok, soft: C.okSoft, label: "Geverifieerd", Icon: BadgeCheck, alarm: false };
    case "SUBMITTED":
      return {
        base: C.accent,
        soft: C.accentSoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.warn,
        soft: C.warnSoft,
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.danger, soft: C.dangerSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.ok, soft: C.okSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  return { base: C.accent, soft: C.accentSoft, label: "Concept", Icon: FileText };
}

function parseEUR(s: string): number {
  const d = s.replace(/[^\d]/g, "");
  return d ? parseInt(d, 10) : 0;
}
const eur0 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Hash,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Inbox,
};

// ————————————————————————————— Primitives —————————————————————————————
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1.5 text-[10.5px] font-semibold"
      style={{
        background: C.surface,
        color: C.inkMute,
        border: `1px solid ${C.hair}`,
        boxShadow: `0 1px 0 ${C.hair}`,
        ...mono,
      }}
    >
      {children}
    </kbd>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  tone = C.accent,
  ariaLabel,
  ariaExpanded,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  tone?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-[9px] font-semibold tracking-[-0.01em] transition-all duration-150 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: tone, color: "#fff", border: `1px solid ${tone}`, ...sans }
      : variant === "outline"
        ? { background: C.surface, color: C.inkSoft, border: `1px solid ${C.hair}`, ...sans }
        : { background: "transparent", color: C.inkMute, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "outline"
        ? "hover:bg-[#f5f5f3]"
        : "hover:bg-[#f1f1ee]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: base, background: soft, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (aandacht vereist)</span>}
    </span>
  );
}

function Card({
  children,
  className = "",
  as: Tag = "div",
  hoverLift = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  hoverLift?: boolean;
}) {
  return (
    <Tag
      className={`rounded-[14px] ${hoverLift ? "oz-lift" : ""} ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.hair}` }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.inkFaint }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.025em] md:text-[32px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept534() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [cmdOpen, setCmdOpen] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  const go = (s: ScreenKey) => {
    setScreen(s);
    setCmdOpen(false);
  };

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.bg }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Rail screen={screen} setScreen={setScreen} onCmd={() => setCmdOpen(true)} />
        <div className="min-w-0 flex-1">
          <TopBar onCmd={() => setCmdOpen(true)} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="oz-fade px-5 pb-24 pt-8 sm:px-8 md:px-12">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
                onVerif={() => setScreen("verificatie")}
                onCmd={() => setCmdOpen(true)}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && (
              <Acties
                onMarkt={() => setScreen("marktplaats")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      {cmdOpen && <CommandMenu onClose={() => setCmdOpen(false)} go={go} />}

      <style>{`
        @keyframes ozFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .oz-fade { animation: ozFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes ozScale { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
        .oz-pop { animation: ozScale 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .oz-row { transition: background 0.16s ease; }
        .oz-row:hover { background: ${C.sink}; }
        .oz-lift { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .oz-lift:hover { transform: translateY(-2px); box-shadow: 0 14px 40px -28px rgba(23,22,15,0.5); border-color: ${C.hairSoft}; }
        .oz-reveal { max-height: 0; opacity: 0; transition: max-height 0.28s ease, opacity 0.22s ease; overflow: hidden; }
        .group\\/it:hover .oz-reveal, .group\\/it:focus-within .oz-reveal { max-height: 120px; opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .oz-fade, .oz-pop { animation: none !important; }
          .oz-lift, .oz-row, .oz-reveal { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Command-menu (de spil) ——————————————————————————————————————
type Cmd = {
  id: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
  group: string;
  run: () => void;
};

function CommandMenu({ onClose, go }: { onClose: () => void; go: (s: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const cmds = useMemo<Cmd[]>(() => {
    const nav: Cmd[] = SCREENS.map((s) => ({
      id: `nav-${s.key}`,
      label: `Ga naar ${s.label}`,
      hint: "Navigatie",
      Icon: NAV_ICON[s.key],
      group: "Navigatie",
      run: () => go(s.key),
    }));
    const acts: Cmd[] = ACTIES.map((a, i) => ({
      id: `act-${i}`,
      label: a.cta,
      hint: a.titel,
      Icon: a.urgentie === "warning" ? TriangleAlert : Sparkles,
      group: "Snelle acties",
      run: () => go("acties"),
    }));
    const quick: Cmd[] = [
      {
        id: "q-new",
        label: "Nieuwe factuur opstellen",
        hint: "Facturen",
        Icon: Plus,
        group: "Snelle acties",
        run: () => go("facturen"),
      },
      {
        id: "q-msg",
        label: "Berichten openen",
        hint: `${BERICHTEN.filter((b) => b.ongelezen).length} ongelezen`,
        Icon: Inbox,
        group: "Navigatie",
        run: () => go("acties"),
      },
    ];
    return [...nav, ...quick, ...acts];
  }, [go]);

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    if (!n) return cmds;
    return cmds.filter(
      (c) => c.label.toLowerCase().includes(n) || c.hint.toLowerCase().includes(n),
    );
  }, [q, cmds]);

  const groups = useMemo(() => {
    const map = new Map<string, Cmd[]>();
    filtered.forEach((c) => {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const flat = filtered;
  const clampedActive = Math.min(active, Math.max(0, flat.length - 1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(23,22,15,0.28)", backdropFilter: "blur(3px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Command-menu"
      onClick={onClose}
    >
      <div
        className="oz-pop w-full max-w-lg overflow-hidden rounded-[16px]"
        style={{
          background: C.surface,
          border: `1px solid ${C.hair}`,
          boxShadow: "0 32px 90px -30px rgba(23,22,15,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.hairSoft}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, flat.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                flat[clampedActive]?.run();
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Typ een opdracht of zoek een scherm…"
            aria-label="Zoek een actie of scherm"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#a9a79d]"
            style={{ color: C.ink }}
          />
          <Kbd>esc</Kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <Search size={22} aria-hidden="true" style={{ color: C.inkFaint }} />
              <p className="mt-3 text-[13.5px] font-semibold" style={{ color: C.inkSoft }}>
                Niets gevonden voor “{q}”
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
                Probeer een schermnaam of een actie.
              </p>
            </div>
          ) : (
            groups.map(([groupName, items]) => (
              <div key={groupName} className="mb-1">
                <p
                  className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: C.inkFaint }}
                >
                  {groupName}
                </p>
                <ul>
                  {items.map((c) => {
                    const idx = flat.indexOf(c);
                    const on = idx === clampedActive;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(idx)}
                          onClick={c.run}
                          className={`flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left ${RING}`}
                          style={{ background: on ? C.sink : "transparent" }}
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
                            style={{
                              background: on ? C.accentSoft : C.sink,
                              color: on ? C.accent : C.inkMute,
                            }}
                            aria-hidden="true"
                          >
                            <c.Icon size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate text-[13.5px] font-semibold"
                              style={{ color: C.ink }}
                            >
                              {c.label}
                            </span>
                            <span
                              className="block truncate text-[11.5px]"
                              style={{ color: C.inkMute }}
                            >
                              {c.hint}
                            </span>
                          </span>
                          {on && (
                            <span className="shrink-0" aria-hidden="true">
                              <CornerDownLeft size={14} style={{ color: C.inkFaint }} />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div
          className="flex items-center justify-between px-4 py-2.5 text-[11px]"
          style={{ borderTop: `1px solid ${C.hairSoft}`, color: C.inkMute, background: C.sink }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigeren
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd> openen
          </span>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————————— Rail (sidebar) ——————————————————————————————————————
function Rail({
  screen,
  setScreen,
  onCmd,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
  onCmd: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col md:flex"
      style={{ background: C.bg, borderRight: `1px solid ${C.hairSoft}` }}
    >
      <div className="flex items-center gap-2.5 px-5 py-6">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[9px]"
          style={{ background: C.ink, color: "#fff" }}
          aria-hidden="true"
        >
          <Minus size={16} strokeWidth={2.5} />
        </span>
        <span className="text-[14.5px] font-semibold tracking-[-0.02em]" style={{ color: C.ink }}>
          Onzichtbaar
        </span>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onCmd}
          className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 ${RING}`}
          style={{ background: C.surface, border: `1px solid ${C.hair}`, color: C.inkMute }}
        >
          <Search size={15} aria-hidden="true" />
          <span className="text-[12.5px]">Zoek of spring…</span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-[13px] font-medium transition-colors ${RING}`}
                  style={on ? { background: C.sink, color: C.ink } : { color: C.inkMute }}
                >
                  <Icon
                    size={16}
                    aria-hidden="true"
                    style={{ color: on ? C.accent : C.inkFaint }}
                  />
                  <span className="flex-1">{s.label}</span>
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-5">
        <div className="mb-4 flex items-center gap-2 text-[11.5px]" style={{ color: C.inkMute }}>
          <ShieldCheck size={13} aria-hidden="true" style={{ color: C.ok }} />
          <span>
            <span className="font-semibold" style={{ color: C.ink }}>
              {ratio}%
            </span>{" "}
            geverifieerd
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: C.sink, color: C.inkSoft, ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span className="block truncate text-[10.5px]" style={{ color: C.inkFaint }}>
              {PROFIEL.rol}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ onCmd }: { onCmd: () => void }) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3.5 sm:px-8 md:hidden md:px-12"
      style={{
        background: `${C.bg}e8`,
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${C.hairSoft}`,
      }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-[8px]"
        style={{ background: C.ink, color: "#fff" }}
        aria-hidden="true"
      >
        <Minus size={15} strokeWidth={2.5} />
      </span>
      <span className="text-[14px] font-semibold" style={{ color: C.ink }}>
        Onzichtbaar
      </span>
      <button
        type="button"
        onClick={onCmd}
        aria-label="Command-menu openen"
        className={`ml-auto flex h-9 w-9 items-center justify-center rounded-[9px] ${RING}`}
        style={{ background: C.surface, border: `1px solid ${C.hair}`, color: C.inkMute }}
      >
        <Search size={16} aria-hidden="true" />
      </button>
    </header>
  );
}

function MobileNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav
      aria-label="Schermen"
      className="flex gap-1.5 overflow-x-auto px-5 py-2.5 sm:px-8 md:hidden"
      style={{ borderBottom: `1px solid ${C.hairSoft}`, background: C.bg }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${RING}`}
            style={
              on ? { background: C.ink, color: "#fff" } : { color: C.inkMute, background: C.sink }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
  onVerif,
  onCmd,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
  onVerif: () => void;
  onCmd: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-10">
      <ScreenHead
        eyebrow="Overzicht"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Alles wat aandacht vraagt staat vooraan. De rest wacht rustig op de achtergrond tot je het nodig hebt."
        right={
          <Btn variant="outline" size="sm" onClick={onCmd}>
            <Search size={13} aria-hidden="true" /> Spring naar…
            <span className="ml-1 hidden items-center gap-1 sm:inline-flex">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </Btn>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-5" hoverLift>
            <p className="text-[11.5px] font-medium" style={{ color: C.inkMute }}>
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[27px] font-semibold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold"
                style={{ color: k.up ? C.ok : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <TriangleAlert size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <span className="inline-flex h-6 items-end gap-[3px]" aria-hidden="true">
                {k.spark.map((d, j) => {
                  const max = Math.max(...k.spark);
                  const min = Math.min(...k.spark);
                  const h = 3 + ((d - min) / (max - min || 1)) * 18;
                  const last = j === k.spark.length - 1;
                  return (
                    <span
                      key={j}
                      className="w-[3px] rounded-full"
                      style={{ height: h, background: last ? C.accent : C.hair }}
                    />
                  );
                })}
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: C.ink }}>
              Beste matches
            </h2>
            <button
              type="button"
              onClick={onMarkt}
              className={`inline-flex items-center gap-1 rounded-[6px] px-1 text-[12px] font-semibold ${RING}`}
              style={{ color: C.accent }}
            >
              Alle opdrachten <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
          <ul className="space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <li key={o.id} className="group/it">
                <button
                  type="button"
                  onClick={onOpen}
                  className={`oz-lift w-full rounded-[13px] px-4 py-4 text-left ${RING}`}
                  style={{ background: C.surface, border: `1px solid ${C.hair}` }}
                >
                  <div className="flex items-center gap-4">
                    <MatchDot value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span
                        className="block text-[14px] font-semibold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span className="text-[10px]" style={{ color: C.inkFaint }}>
                        per uur
                      </span>
                    </span>
                    <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
                  </div>
                  <div className="oz-reveal">
                    <div
                      className="mt-3 flex flex-wrap gap-1.5 pt-1"
                      style={{ borderTop: `1px solid ${C.hairSoft}` }}
                    >
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: C.okSoft, color: C.ok }}
                        >
                          <Check size={11} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>Verificatie</Eyebrow>
              <button
                type="button"
                onClick={onVerif}
                className={`rounded-[6px] px-1 text-[12px] font-semibold ${RING}`}
                style={{ color: C.accent }}
              >
                Beheer
              </button>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-[34px] font-semibold leading-none tracking-[-0.03em]"
                style={{ color: C.ink, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                compleet
              </span>
            </div>
            <div className="mt-3.5 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: t.base }}
                  />
                );
              })}
            </div>
            <ul className="mt-4 space-y-2.5">
              {CREDENTIALS.filter((c) => c.status !== "VERIFIED").map((c) => {
                const t = credTone(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <t.Icon size={14} aria-hidden="true" style={{ color: t.base }} />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                      style={{ color: C.inkSoft }}
                    >
                      {c.naam}
                    </span>
                    <StatusTag {...t} />
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-5">
            <Eyebrow tone={C.warn}>Vraagt actie</Eyebrow>
            <h3 className="mt-2.5 text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkMute }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MatchDot({ value }: { value: number }) {
  const tone = value >= 90 ? C.ok : C.accent;
  return (
    <span
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ background: `${tone}12` }}
      aria-label={`Match ${value} procent`}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="17" fill="none" stroke={C.hair} strokeWidth="2.5" />
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke={tone}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 106.8} 106.8`}
        />
      </svg>
      <span className="relative text-[11.5px] font-semibold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match" ? b.match - a.match : parseEUR(b.tarief) - parseEUR(a.tarief),
    );
  }, [q, sort]);

  return (
    <div className="space-y-7">
      <ScreenHead
        eyebrow="Marktplaats"
        title="Opdrachten voor jou"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[11px] px-3.5 py-2.5"
          style={{ background: C.surface, border: `1px solid ${C.hair}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a9a79d]"
            style={{ color: C.ink }}
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekopdracht wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-[5px] ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              <Kbd>/</Kbd>
            </span>
          )}
        </div>
        <div
          className="inline-flex items-center gap-1 rounded-[11px] p-1"
          role="group"
          aria-label="Sorteren"
          style={{ background: C.sink }}
        >
          {(["match", "tarief"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`rounded-[8px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
              style={sort === s ? { background: C.surface, color: C.ink } : { color: C.inkMute }}
            >
              {s === "match" ? "Match" : "Tarief"}
            </button>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.sinkDeep }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.sink }}
                />
              </Card>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.danger}
          titel="Er ging iets mis"
          tekst="De opdrachten konden even niet geladen worden. Probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.accent}
          titel="Geen resultaten"
          tekst={`Niets gevonden voor ${q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht.`}
          cta="Zoekopdracht wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3.5">
          {rows.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className={`rounded text-[10.5px] font-semibold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-[14px]"
        style={{ color: tone, background: `${tone}14` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-4 text-[18px] font-semibold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
        {tekst}
      </p>
      <Btn variant="solid" tone={tone} className="mt-5" onClick={onCta}>
        {cta}
      </Btn>
    </Card>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <Card as="article" className="overflow-hidden" hoverLift>
      <div className="flex items-start gap-4 p-5">
        <MatchDot value={opdracht.match} />
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10.5px] font-medium"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
            {strong && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                style={{ background: C.okSoft, color: C.ok, ...sans }}
              >
                Sterke match
              </span>
            )}
          </div>
          <h3
            className="mt-1 text-[16px] font-semibold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.inkSoft }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-semibold" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${C.hairSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-[6px] px-1 text-[12px] font-semibold ${RING}`}
          style={{ color: C.inkSoft }}
        >
          <ChevronRight
            size={14}
            aria-hidden="true"
            style={{
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
          Waarom deze match?
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={12} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.hairSoft}` }}
          >
            <RedenKolom
              titel="Spreekt voor je"
              tone={C.ok}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.warn}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenKolom({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
            />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Start", v: opdracht.start, s: "beschikbaar" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-7">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Card className="overflow-hidden">
        <div className="p-6 md:p-8">
          <div
            className="flex items-center gap-2 text-[11px] font-medium"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span>match {opdracht.match}%</span>
          </div>
          <h1
            className="mt-2.5 max-w-2xl text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[30px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.inkSoft }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid">
              Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">Bewaren</Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.hairSoft}` }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderRight: i < 3 ? `1px solid ${C.hairSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.hairSoft}` : "none",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkFaint }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <Eyebrow>Navolgbare match — geen verborgen score</Eyebrow>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
          Afgezet tegen je geverifieerde profiel. Wat voor je spreekt en wat je vooraf wilt weten —
          alles zichtbaar.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenDetail
            titel="Spreekt voor je"
            tone={C.ok}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Goed om te weten"
            tone={C.warn}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <ShieldCheck size={22} aria-hidden="true" style={{ color: C.ok }} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
            Compliance in orde
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            Je BIG-registratie en diploma dekken de vereiste certificaten voor deze opdracht.
          </p>
        </div>
        <StatusTag {...credTone("VERIFIED")} />
      </Card>
    </div>
  );
}

function RedenDetail({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <Icon
              size={15}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <ScreenHead
        eyebrow="Verificatie"
        title="Je certificaten"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div className="text-right">
            <p
              className="text-[28px] font-semibold leading-none tracking-[-0.02em]"
              style={{ color: C.ok, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint }}
            >
              compleet
            </p>
          </div>
        }
      />

      <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
          const t = credTone(st);
          const count = CREDENTIALS.filter((c) => c.status === st).length;
          return (
            <span key={st} className="inline-flex items-center gap-2">
              <span className="text-[16px] font-semibold" style={{ color: t.base, ...mono }}>
                {count}
              </span>
              <StatusTag {...t} />
            </span>
          );
        })}
      </Card>

      <ul className="space-y-2.5">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card as="article" className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: t.soft, color: t.base }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: t.alarm ? t.base : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-5 pb-4 sm:pl-[74px]"
                      style={{ borderTop: `1px solid ${C.hairSoft}`, paddingTop: 12 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en alleen na jouw
                        toestemming ingezien door een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid" tone={t.alarm ? t.base : C.accent}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline">
                          Details
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-7">
      <ScreenHead
        eyebrow="Acties"
        title="Wat vraagt je aandacht"
        sub="Op volgorde van urgentie. Eén focuspunt per keer — de rest wacht op de achtergrond."
      />
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.accent;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Card className="flex items-start gap-4 p-5" hoverLift>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: `${tone}14`, color: tone }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={18} /> : <Sparkles size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Eyebrow tone={tone}>{warn ? "Urgent" : "Aanbevolen"}</Eyebrow>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: C.inkFaint, ...mono }}
                    >
                      {String(i + 1).padStart(2, "0")} / {String(ACTIES.length).padStart(2, "0")}
                    </span>
                  </div>
                  <h2
                    className="mt-1.5 text-[15.5px] font-semibold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.inkMute }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      tone={tone}
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Loader2
            size={15}
            aria-hidden="true"
            style={{ color: C.inkFaint }}
            className="motion-safe:animate-spin"
          />
          <p className="text-[12.5px]" style={{ color: C.inkMute }}>
            Nieuwe acties verschijnen hier zodra ze relevant worden. Je hoeft niets te verversen.
          </p>
        </div>
      </Card>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");

  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort((a, b) => parseEUR(b.bedrag) - parseEUR(a.bedrag));
  }, [sort]);

  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);

  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div className="space-y-7">
      <ScreenHead
        eyebrow="Facturen"
        title="Je facturatie"
        sub="Selecteer een regel om de opbouw te bekijken."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.ok, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.warn,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.accent,
            Icon: FileText,
          },
        ].map((s) => (
          <Card key={s.l} className="p-5" hoverLift>
            <div className="flex items-center justify-between">
              <Eyebrow tone={s.tone}>{s.l}</Eyebrow>
              <s.Icon size={15} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-2 text-[23px] font-semibold leading-none"
              style={{ color: C.ink, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.hairSoft}` }}
          >
            <Eyebrow>Facturen</Eyebrow>
            <div
              className="inline-flex items-center gap-1 rounded-[9px] p-1"
              role="group"
              aria-label="Facturen sorteren"
              style={{ background: C.sink }}
            >
              {(["datum", "bedrag"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  aria-pressed={sort === s}
                  className={`rounded-[7px] px-3 py-1 text-[12px] font-semibold transition-colors ${RING}`}
                  style={
                    sort === s ? { background: C.surface, color: C.ink } : { color: C.inkMute }
                  }
                >
                  {s === "datum" ? "Datum" : "Bedrag"}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 460 }}>
              <caption className="sr-only">Overzicht van facturen</caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const t = factuurTone(f.status);
                  const on = f.nr === sel;
                  return (
                    <tr
                      key={f.nr}
                      className={`oz-row cursor-pointer ${RING}`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={on}
                      onClick={() => setSel(f.nr)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSel(f.nr);
                        }
                      }}
                      style={{
                        borderTop: `1px solid ${C.hairSoft}`,
                        background: on ? C.sink : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-semibold"
                        style={{ color: on ? C.accent : C.inkSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-semibold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                          style={{ color: t.base }}
                        >
                          <t.Icon size={12} aria-hidden="true" /> {t.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {selected && <Opbouw factuur={selected} />}
      </div>
    </div>
  );
}

function Opbouw({ factuur }: { factuur: (typeof FACTUREN)[number] }) {
  const total = parseEUR(factuur.bedrag);
  const subtotal = Math.round(total / 1.21);
  const btw = total - subtotal;
  const t = factuurTone(factuur.status);
  return (
    <Card as="article" className="overflow-hidden">
      <div className="p-5" style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
        <Eyebrow tone={t.base}>Opbouw factuur</Eyebrow>
        <p className="mt-1 text-[17px] font-semibold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span style={{ color: C.inkMute }}>Status</span>
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ color: t.base }}
          >
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.hairSoft }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: C.hair }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full tone={t.base}>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm">
            PDF
          </Btn>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="min-w-0 flex-1 self-end border-b border-dotted"
        style={{ borderColor: C.hair }}
        aria-hidden="true"
      />
      <span
        className="shrink-0 text-right font-semibold"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
