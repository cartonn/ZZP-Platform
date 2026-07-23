"use client";

// Concept 453 — "Luik" · Progressive disclosure / kalme inklapbaarheid.
// Alles start ingeklapt tot één samenvattende regel; panelen vouwen open op verzoek (echte
// useState-toggle, met chevron-rotatie + hoogte-transitie). Het hele scherm is een rustige stapel
// inklapbare ledger-rijen die complexiteit verbergen tot je 'm nodig hebt. Warm-neutraal, veel
// lucht, hairline-dividers, één kalm groen-accent. Low-stimulation, "toon alleen wat telt".
// Animaties respecteren prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Search,
  ShieldCheck,
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

// — Palet: warm-neutraal zand, kalm groen-accent, veel lucht —
const C = {
  bg: "#f3f0e8",
  surface: "#faf8f2",
  surfaceSoft: "#f6f3ea",
  ink: "#2b2820",
  inkSoft: "#565043",
  inkMute: "#847c6b",
  inkFaint: "#aaa08b",
  line: "rgba(43,40,32,0.13)",
  lineSoft: "rgba(43,40,32,0.07)",
  hover: "rgba(43,40,32,0.03)",
  // kalm groen-accent
  accent: "#4f7a5e",
  accentDeep: "#3c6249",
  accentSoft: "#7ba488",
  accentWash: "rgba(79,122,94,0.1)",
  accentMist: "rgba(79,122,94,0.05)",
  // status (gedempt, groen als kern)
  ok: "#4f7a5e",
  okInk: "#3c6249",
  okWash: "rgba(79,122,94,0.12)",
  warn: "#b07d2a",
  warnInk: "#8a611c",
  warnWash: "rgba(176,125,42,0.13)",
  info: "#4a6b86",
  infoInk: "#3a556c",
  infoWash: "rgba(74,107,134,0.12)",
  bad: "#a44a3f",
  badInk: "#843a31",
  badWash: "rgba(164,74,63,0.12)",
};

const display = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  letterSpacing: "-0.015em",
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function calmBg(): React.CSSProperties {
  return {
    backgroundColor: C.bg,
    backgroundImage:
      "radial-gradient(100% 60% at 100% 0%, rgba(79,122,94,0.05), transparent 55%)," +
      "linear-gradient(180deg, #f5f2ea, #efece3)",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

function Chip({
  children,
  tone,
  ink,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}44`, ...bodyFont }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7a5e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f0e8] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: C.accent,
        border: `1px solid ${C.accentDeep}`,
        boxShadow: "0 2px 6px -3px rgba(60,98,73,0.5)",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7a5e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f0e8] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.accentDeep : C.inkSoft,
        background: active ? C.accentWash : C.surface,
        border: `1px solid ${active ? C.accent + "66" : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function SectieKop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2
        className="text-[12px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: C.inkMute, ...bodyFont }}
      >
        {children}
      </h2>
      {sub && (
        <span className="text-[11.5px]" style={{ color: C.inkFaint, ...num }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// — De kern-primitive: een inklapbare rij. Ingeklapt = één samenvattende regel; geopend vouwt de
//   inhoud uit met chevron-rotatie + hoogte-transitie. Dit is het hart van "Luik". —
function Luik({
  id,
  open,
  onToggle,
  icon,
  titel,
  samenvatting,
  meta,
  accentColor = C.accent,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  titel: string;
  samenvatting: string;
  meta?: React.ReactNode;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-[14px] transition-colors motion-reduce:transition-none"
      style={{
        background: C.surface,
        border: `1px solid ${open ? accentColor + "44" : C.line}`,
        boxShadow: open ? "0 6px 20px -12px rgba(43,40,32,0.28)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`luik-${id}`}
        className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[rgba(43,40,32,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4f7a5e] motion-reduce:transition-none"
      >
        <span className="flex items-center gap-3.5">
          {icon && (
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
              style={{
                background: open ? C.accentWash : C.surfaceSoft,
                border: `1px solid ${open ? accentColor + "44" : C.lineSoft}`,
                color: open ? C.accentDeep : C.inkMute,
              }}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span
            className="block truncate text-[15.5px] font-semibold"
            style={{ color: C.ink, ...display }}
          >
            {titel}
          </span>
          <span
            className="mt-0.5 block truncate text-[12.5px]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            {samenvatting}
          </span>
        </span>
        <span className="flex items-center gap-3">
          {meta}
          <ChevronDown
            size={18}
            aria-hidden="true"
            className="shrink-0 transition-transform duration-300 motion-reduce:transition-none"
            style={{ color: C.inkFaint, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </span>
      </button>
      <div
        id={`luik-${id}`}
        className="duration-400 grid transition-all ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="pt-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meter({ value, tone = C.accent }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: C.lineSoft }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-semibold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

function RedenBlok({
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
    <div
      className="rounded-[10px] p-4"
      style={{ background: C.surfaceSoft, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...bodyFont }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
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

export function Concept453() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...calmBg() }}
    >
      <style>{`
        @keyframes lkRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .lk-rise { animation: lkRise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .duration-400 { transition-duration: 400ms; }
        @media (prefers-reduced-motion: reduce) {
          .lk-rise { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto max-w-4xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="lk-rise pt-7">
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
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-[11px]"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.accent }}
          aria-hidden="true"
        >
          <ChevronDown size={18} />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
          >
            Luik
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.plaats} · toon alleen wat telt
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.okInk,
            border: `1px solid ${C.ok}44`,
            background: C.okWash,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
              style={{ background: C.accent, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{
            background: C.accentWash,
            border: `1px solid ${C.accent}44`,
            color: C.accentDeep,
            ...bodyFont,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-[12px] p-1.5"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7a5e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f2] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.inkMute,
                background: on ? C.accent : "transparent",
                ...bodyFont,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  // Elk blok start ingeklapt tot één regel; alleen het eerste (belangrijkste) staat open.
  const [open, setOpen] = useState<string>("actie");
  const toggle = (k: string) => setOpen((cur) => (cur === k ? "" : k));
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-[26px] font-semibold leading-tight sm:text-[30px]"
          style={{ color: C.ink, ...display }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles staat rustig ingeklapt. Vouw open wat je nodig hebt — de rest blijft uit het zicht
          tot je erom vraagt.
        </p>
      </div>

      <section aria-label="Vandaag" className="space-y-3">
        <SectieKop sub={`${verified}/${CREDENTIALS.length} certificaten op orde`}>
          Vandaag
        </SectieKop>

        <Luik
          id="actie"
          open={open === "actie"}
          onToggle={() => toggle("actie")}
          icon={<AlertTriangle size={17} />}
          titel={primair.titel}
          samenvatting="Je belangrijkste actie van vandaag"
          accentColor={C.warn}
          meta={
            <span
              className="hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
              style={{
                color: C.warnInk,
                background: C.warnWash,
                border: `1px solid ${C.warn}44`,
                ...bodyFont,
              }}
            >
              Urgent
            </span>
          }
        >
          <p className="max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-4">
            <PrimaryButton onClick={onActies}>
              {primair.cta}
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
          </div>
        </Luik>

        <Luik
          id="cijfers"
          open={open === "cijfers"}
          onToggle={() => toggle("cijfers")}
          icon={
            <span className="text-[13px] font-bold" style={{ ...num }}>
              €
            </span>
          }
          titel="Kerncijfers deze maand"
          samenvatting="Omzet € 8.240 · match 92% · 7 open reacties"
          meta={<Meter value={92} tone={C.accent} />}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-[10px] p-3.5"
                style={{ background: C.surfaceSoft, border: `1px solid ${C.lineSoft}` }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {k.label}
                </p>
                <p
                  className="mt-2 text-[20px] font-semibold leading-none"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <p
                  className="mt-1.5 text-[10px] font-semibold"
                  style={{ color: k.up ? C.okInk : C.warnInk, ...num }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </p>
              </div>
            ))}
          </div>
        </Luik>

        <Luik
          id="opdrachten"
          open={open === "opdrachten"}
          onToggle={() => toggle("opdrachten")}
          icon={<Search size={16} />}
          titel="Open opdrachten"
          samenvatting={`${OPDRACHTEN.length} matches · beste ${OPDRACHTEN[0]?.match}%`}
          meta={
            <span
              className="hidden text-[11.5px] font-semibold sm:inline"
              style={{ color: C.accentDeep, ...num }}
            >
              {OPDRACHTEN.length}
            </span>
          }
        >
          <ul className="-my-1">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 py-3 text-left transition-colors hover:bg-[rgba(43,40,32,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4f7a5e] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-8 w-10 items-center justify-center rounded-[8px] text-[11.5px] font-bold"
                    style={{
                      background: o.match >= 90 ? C.accentWash : C.surfaceSoft,
                      color: o.match >= 90 ? C.accentDeep : C.inkMute,
                      ...num,
                    }}
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[13.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span className="block truncate text-[11.5px]" style={{ color: C.inkMute }}>
                      {o.opdrachtgever} · {o.tarief}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.inkFaint }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </Luik>

        <Luik
          id="certificaten"
          open={open === "certificaten"}
          onToggle={() => toggle("certificaten")}
          icon={<ShieldCheck size={16} />}
          titel="Certificaten"
          samenvatting={`${verified} geverifieerd · 1 verloopt binnenkort`}
          meta={<Meter value={ratio} tone={C.accent} />}
        >
          <ul className="space-y-1">
            {CREDENTIALS.map((c, i) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 py-2"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: st.wash, border: `1px solid ${st.tone}44`, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: C.inkMute }}>
                      {st.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Luik>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<string | null>(OPDRACHTEN[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold leading-none" style={{ color: C.ink, ...display }}>
          Marktplaats
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten · tik een rij open voor de
          match-redenen
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[10px] px-4 py-3"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#aaa08b]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="rounded-[14px] p-5"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                <div className="h-4 w-2/3 rounded" style={{ background: C.lineSoft }} />
                <div className="h-3 w-1/2 rounded" style={{ background: C.lineSoft }} />
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-[14px] p-6"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div className="flex flex-col items-center py-12 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.surfaceSoft, border: `1px solid ${C.line}`, color: C.inkMute }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[20px] font-semibold" style={{ color: C.ink, ...display }}>
              Niets om open te vouwen
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en de lijst vult
              zich weer.
            </p>
            <div className="mt-5">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const strong = o.match >= 90;
            const isOpen = open === o.id;
            return (
              <li key={o.id}>
                <Luik
                  id={o.id}
                  open={isOpen}
                  onToggle={() => setOpen(isOpen ? null : o.id)}
                  icon={
                    <span className="text-[12px] font-bold" style={{ ...num }}>
                      {o.match}
                    </span>
                  }
                  titel={o.titel}
                  samenvatting={`${o.opdrachtgever} · ${o.plaats} · ${o.tarief}`}
                  meta={
                    <span
                      className="hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex"
                      style={{
                        color: strong ? C.okInk : C.warnInk,
                        background: strong ? C.okWash : C.warnWash,
                        border: `1px solid ${strong ? C.ok : C.warn}44`,
                        ...bodyFont,
                      }}
                    >
                      {strong ? "Sterke match" : "Goede match"}
                    </span>
                  }
                >
                  <div className="flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                        style={{
                          color: C.inkSoft,
                          background: C.surfaceSoft,
                          border: `1px solid ${C.lineSoft}`,
                          ...bodyFont,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <RedenBlok
                      titel="Voor jou"
                      tone={C.okInk}
                      Icon={Check}
                      items={o.redenen.plus}
                    />
                    <RedenBlok
                      titel="Let op"
                      tone={C.warnInk}
                      Icon={AlertTriangle}
                      items={o.redenen.min}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {o.uren} · start {o.start.toLowerCase()}
                    </span>
                    <PrimaryButton onClick={onOpen}>
                      Open opdracht <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </Luik>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [open, setOpen] = useState<string>("redenen");
  const toggle = (k: string) => setOpen((cur) => (cur === k ? "" : k));
  const strong = opdracht.match >= 90;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7a5e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f0e8]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.surface,
          ...bodyFont,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <div
        className="rounded-[14px] p-6 sm:p-8"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ background: C.accent, ...bodyFont }}
              >
                <Check size={11} aria-hidden="true" />
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight sm:text-[32px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <PrimaryButton>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <div
            className="flex flex-col items-center rounded-[12px] px-6 py-5"
            style={{ background: C.accentWash, border: `1px solid ${C.accent}44` }}
          >
            <span
              className="text-[38px] font-semibold leading-none"
              style={{ color: C.accentDeep, ...num }}
            >
              {opdracht.match}%
            </span>
            <span
              className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.accentDeep, ...bodyFont }}
            >
              match
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectieKop>Details · vouw open wat je wilt zien</SectieKop>

        <Luik
          id="kern"
          open={open === "kern"}
          onToggle={() => toggle("kern")}
          icon={<FileText size={16} />}
          titel="Kerngegevens"
          samenvatting={`${opdracht.tarief} · ${opdracht.uren} · start ${opdracht.start.toLowerCase()}`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-[10px] p-3.5"
                style={{ background: C.surfaceSoft, border: `1px solid ${C.lineSoft}` }}
              >
                <p
                  className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {m.l}
                </p>
                <p className="mt-1.5 text-[16px] font-semibold" style={{ color: C.ink, ...num }}>
                  {m.v}
                </p>
              </div>
            ))}
          </div>
        </Luik>

        <Luik
          id="redenen"
          open={open === "redenen"}
          onToggle={() => toggle("redenen")}
          icon={<Check size={16} />}
          titel="Verklaarbare matching"
          samenvatting={`${opdracht.redenen.plus.length} punten voor jou · ${opdracht.redenen.min.length} om op te letten`}
          meta={<Meter value={opdracht.match} tone={strong ? C.accent : C.warn} />}
        >
          <p className="mb-3 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            Afgelezen van je geverifieerde profiel — transparant en zonder verborgen score.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Voor jou" tone={C.okInk} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </Luik>

        <Luik
          id="werkgever"
          open={open === "werkgever"}
          onToggle={() => toggle("werkgever")}
          icon={<ShieldCheck size={16} />}
          titel="Over de opdrachtgever"
          samenvatting={`${opdracht.opdrachtgever} · geverifieerde organisatie`}
        >
          <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {opdracht.opdrachtgever} is een geverifieerde organisatie in {opdracht.plaats}. Reacties
            worden doorgaans binnen 6 uur beantwoord. Je gegevens worden pas gedeeld nadat je zelf
            reageert.
          </p>
        </Luik>
      </div>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(
    CREDENTIALS.find((c) => c.status === "EXPIRING")?.naam ?? CREDENTIALS[0]?.naam ?? null,
  );
  const [docsOpen, setDocsOpen] = useState(false);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5">
      <div
        className="rounded-[14px] p-6 sm:p-7"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-md">
            <h1
              className="text-[24px] font-semibold leading-tight sm:text-[28px]"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.accentDeep }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} geverifieerd. Eén verloopt binnenkort. Documenten
              blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.accent} />
            </div>
          </div>
          <div
            className="flex flex-col items-center rounded-[12px] px-6 py-5"
            style={{ background: C.accentWash, border: `1px solid ${C.accent}44` }}
          >
            <span
              className="text-[34px] font-semibold leading-none"
              style={{ color: C.accentDeep, ...num }}
            >
              {ratio}%
            </span>
            <span
              className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.accentDeep, ...bodyFont }}
            >
              op orde
            </span>
          </div>
        </div>
      </div>

      <section aria-label="Certificaten" className="space-y-3">
        <SectieKop sub="tik open voor details">Certificaten</SectieKop>
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <Luik
              key={c.naam}
              id={c.naam}
              open={isOpen}
              onToggle={() => setOpen(isOpen ? null : c.naam)}
              icon={<st.Icon size={16} />}
              titel={c.naam}
              samenvatting={c.detail}
              accentColor={st.tone}
              meta={
                <span className="hidden sm:flex">
                  <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                  </Chip>
                </span>
              }
            >
              <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                toestemming gedeeld met een opdrachtgever.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <PrimaryButton>{c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}</PrimaryButton>
                <GhostButton>Historie</GhostButton>
              </div>
            </Luik>
          );
        })}
      </section>

      <section aria-label="Documentenkast" className="space-y-3">
        <SectieKop>Documentenkast</SectieKop>
        <Luik
          id="docs"
          open={docsOpen}
          onToggle={() => setDocsOpen((v) => !v)}
          icon={<FileText size={16} />}
          titel="Bewaarde documenten"
          samenvatting={`${DOCUMENTEN.length} bestanden · versleuteld opgeslagen`}
          meta={
            <span
              className="hidden text-[11.5px] font-semibold sm:inline"
              style={{ color: C.accentDeep, ...num }}
            >
              {DOCUMENTEN.length}
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DOCUMENTEN.map((d) => {
              const st = statusMeta(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3 rounded-[10px] p-3"
                  style={{ background: C.surfaceSoft, border: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[8px]"
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.line}`,
                      color: C.inkSoft,
                    }}
                    aria-hidden="true"
                  >
                    <FileText size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[12.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {d.naam}
                    </span>
                    <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </span>
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-semibold"
                    style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}44` }}
                  >
                    <st.Icon size={10} aria-hidden="true" />
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Luik>
      </section>
    </div>
  );
}

function Acties() {
  const [open, setOpen] = useState<string>(ACTIES[0]?.titel ?? "");
  const toggle = (k: string) => setOpen((cur) => (cur === k ? "" : k));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold leading-none" style={{ color: C.ink, ...display }}>
          Wat nu telt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie, rustig ingeklapt. Vouw een actie open om verder te gaan.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.accent;
          const ink = warn ? C.warnInk : C.accentDeep;
          const wash = warn ? C.warnWash : C.accentWash;
          const isOpen = open === a.titel;
          return (
            <li key={a.titel}>
              <Luik
                id={`actie-${i}`}
                open={isOpen}
                onToggle={() => toggle(a.titel)}
                accentColor={tone}
                icon={
                  <span className="text-[13px] font-bold" style={{ ...num }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                }
                titel={a.titel}
                samenvatting={warn ? "Urgent — vraagt vandaag actie" : "Aanbevolen deze week"}
                meta={
                  <span
                    className="hidden items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
                    style={{
                      color: ink,
                      background: wash,
                      border: `1px solid ${tone}44`,
                      ...bodyFont,
                    }}
                  >
                    {warn ? (
                      <AlertTriangle size={10} aria-hidden="true" />
                    ) : (
                      <Check size={10} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                }
              >
                <p className="max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                  {a.detail}
                </p>
                <div className="mt-4">
                  <PrimaryButton>
                    {a.cta}
                    <ArrowRight
                      size={13}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </PrimaryButton>
                </div>
              </Luik>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.inkMute, wash: C.hover, tone: C.line, Icon: FileText };
}

function Facturen() {
  const [open, setOpen] = useState<string | null>("FAC-2025-118");
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-[26px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
          >
            Facturen
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
            Totaal betaald € 8.622 · 1 openstaand
          </p>
        </div>
        <PrimaryButton>Nieuwe factuur</PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-[12px] p-5"
            style={{
              background: C.surface,
              border: `1px solid ${s.alarm ? C.warn + "44" : C.line}`,
            }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <AlertTriangle size={13} aria-hidden="true" style={{ color: C.warnInk }} />
              )}
            </div>
            <p
              className="mt-2 text-[24px] font-semibold"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <section aria-label="Facturenlijst" className="space-y-3">
        <SectieKop sub="tik een factuur open">Facturen</SectieKop>
        {FACTUREN.map((f) => {
          const ft = factuurTone(f.status);
          const isOpen = open === f.nr;
          return (
            <Luik
              key={f.nr}
              id={f.nr}
              open={isOpen}
              onToggle={() => setOpen(isOpen ? null : f.nr)}
              accentColor={ft.tone}
              icon={ft.Icon ? <ft.Icon size={16} /> : <FileText size={16} />}
              titel={f.klant}
              samenvatting={`${f.nr} · ${f.datum}`}
              meta={
                <span className="flex items-center gap-2.5">
                  <span
                    className="hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}44`,
                      ...bodyFont,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={10} aria-hidden="true" />}
                    {f.status}
                  </span>
                  <span
                    className="text-[14px] font-bold"
                    style={{ color: f.status === "Openstaand" ? C.warnInk : C.ink, ...num }}
                  >
                    {f.bedrag}
                  </span>
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { l: "Nummer", v: f.nr },
                  { l: "Klant", v: f.klant },
                  { l: "Datum", v: f.datum },
                  { l: "Bedrag", v: f.bedrag },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-[10px] p-3"
                    style={{ background: C.surfaceSoft, border: `1px solid ${C.lineSoft}` }}
                  >
                    <p
                      className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: C.inkMute, ...bodyFont }}
                    >
                      {m.l}
                    </p>
                    <p
                      className="mt-1 truncate text-[13px] font-semibold"
                      style={{ color: C.ink, ...num }}
                    >
                      {m.v}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {f.status === "Openstaand" ? (
                  <PrimaryButton>
                    Herinnering sturen <ArrowRight size={13} aria-hidden="true" />
                  </PrimaryButton>
                ) : f.status === "Concept" ? (
                  <PrimaryButton>
                    Versturen <ArrowRight size={13} aria-hidden="true" />
                  </PrimaryButton>
                ) : (
                  <GhostButton>Bekijk factuur</GhostButton>
                )}
                <GhostButton>Download pdf</GhostButton>
              </div>
            </Luik>
          );
        })}
        <div
          className="flex items-baseline justify-between rounded-[12px] px-5 py-4"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </section>
    </div>
  );
}
