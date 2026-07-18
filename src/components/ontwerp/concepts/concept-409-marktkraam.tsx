"use client";

// Concept 409 — "Marktkraam" · Streekmarkt & luifel, ambachtelijk-warm handel.
// De opdrachtenmarktplaats als levendige streekmarkt: gestreepte luifel-koppen (awning-stripes
// als spaarzaam accent), krijtbord-prijskaartjes, ambachtelijke warme kleuren en handels-energie —
// maar strak en leesbaar. Speels-professioneel: matching leest als "de beste kraam kiezen".
// Palet: crème #f7f1e4, inkt #221a12, marktrood #d1462f, groen/oker secundair.
// Fonts: Bricolage Grotesque (display) + Space Grotesk-gevoel (body), tabulaire cijfers.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  Tag,
  Store,
  Bell,
  ShoppingBasket,
  Sparkles,
  Receipt,
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

// — Palet: crème, inkt, marktrood, groen en oker —
const C = {
  cream: "#f7f1e4",
  creamHi: "#fdfaf1",
  creamAlt: "#efe6d2",
  creamDeep: "#e4d8bd",
  paper: "#fefcf6",
  ink: "#221a12",
  inkSoft: "#3f342a",
  inkMute: "#736450",
  inkFaint: "#9a8a72",
  line: "rgba(34,26,18,0.14)",
  lineSoft: "rgba(34,26,18,0.08)",
  red: "#d1462f",
  redDeep: "#a5321f",
  redWash: "rgba(209,70,47,0.12)",
  green: "#4f7a3a",
  greenDeep: "#3b5c2b",
  greenWash: "rgba(79,122,58,0.14)",
  ocre: "#c68a2e",
  ocreDeep: "#9a691c",
  ocreWash: "rgba(198,138,46,0.16)",
  chalk: "#2b2620",
  chalkLine: "rgba(247,241,228,0.5)",
  ok: "#4f7a3a",
  okInk: "#3b5c2b",
  okWash: "rgba(79,122,58,0.14)",
  warn: "#c68a2e",
  warnInk: "#8a5c18",
  warnWash: "rgba(198,138,46,0.16)",
  info: "#c25a2e",
  infoInk: "#93401d",
  infoWash: "rgba(194,90,46,0.14)",
  bad: "#c14a3a",
  badInk: "#8a2f22",
  badWash: "rgba(193,74,58,0.14)",
};

const display = {
  fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const bodyF = {
  fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Space Grotesk', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

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

// — Luifel-strepen: spaarzaam accent bovenaan een paneel of kop —
function Awning({ tone = C.red, className = "" }: { tone?: string; className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, ${tone} 0, ${tone} 14px, ${C.creamHi} 14px, ${C.creamHi} 28px)`,
      }}
    />
  );
}

// — Krijtbord-prijskaartje: donker paneel met krijtwitte tekst —
function Chalkboard({
  amount,
  label,
  className = "",
}: {
  amount: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex flex-col items-center justify-center rounded-lg px-3 py-1.5 ${className}`}
      style={{
        background: C.chalk,
        border: `1px solid ${C.chalkLine}`,
        boxShadow: "0 4px 10px rgba(34,26,18,0.22)",
      }}
    >
      <span className="text-[15px] font-bold leading-none" style={{ color: C.creamHi, ...display }}>
        {amount}
      </span>
      <span
        className="mt-0.5 text-[7.5px] uppercase tracking-[0.18em]"
        style={{ color: C.chalkLine, ...bodyF }}
      >
        {label}
      </span>
    </span>
  );
}

function Panel({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: `0 1px 0 ${C.lineSoft}, 0 10px 26px rgba(34,26,18,0.06)`,
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.redDeep }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...bodyF }}
    >
      <Store size={13} aria-hidden="true" />
      {children}
    </p>
  );
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
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...bodyF }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition-all duration-200 hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1462f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e4] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.creamHi,
        background: `linear-gradient(160deg, ${C.red}, ${C.redDeep})`,
        boxShadow: `0 6px 14px rgba(165,50,31,0.28)`,
        ...display,
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1462f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e4] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.creamHi : C.inkSoft,
        background: active ? C.redDeep : C.creamHi,
        border: `1px solid ${active ? C.redDeep : C.line}`,
        ...display,
      }}
    >
      {children}
    </button>
  );
}

function BarChart({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {data.map((d, i) => {
        const h = 22 + ((d - min) / span) * 78;
        return (
          <span
            key={`${id}-${i}`}
            className="flex-1 rounded-t-sm"
            style={{ height: `${h}%`, background: tone, opacity: i === data.length - 1 ? 1 : 0.4 }}
          />
        );
      })}
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.red : value >= 85 ? C.green : C.ocreDeep;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: C.creamDeep }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept409() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...bodyF,
        color: C.ink,
        background: `radial-gradient(120% 80% at 82% -8%, ${C.creamHi}, ${C.cream} 55%, ${C.creamAlt})`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-6">
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
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl"
          style={{
            background: C.redDeep,
            color: C.creamHi,
            boxShadow: "0 6px 14px rgba(165,50,31,0.28)",
          }}
          aria-hidden="true"
        >
          <Awning className="absolute inset-x-0 top-0 h-2.5" tone={C.ocre} />
          <Store size={19} className="mt-1" />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...display }}
          >
            Marktkraam
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkFaint, ...bodyF }}>
            De streekmarkt voor opdrachten · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...bodyF }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.creamHi, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.red, color: C.creamHi, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.ink, ...display }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkFaint, ...bodyF }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold"
          style={{
            background: C.greenWash,
            border: `1px solid ${C.green}`,
            color: C.greenDeep,
            ...display,
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="overflow-hidden rounded-xl"
        style={{ border: `1px solid ${C.line}`, background: C.creamHi }}
      >
        <Awning className="h-2" tone={C.red} />
        <div className="flex items-center gap-1 overflow-x-auto p-1.5">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1462f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfaf1] motion-reduce:transition-none"
                style={{
                  color: on ? C.creamHi : C.inkMute,
                  background: on ? C.redDeep : "transparent",
                  ...display,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel>
          <Awning className="h-3" tone={C.red} />
          <div className="p-6 md:p-7">
            <Eyebrow>Vandaag op de markt</Eyebrow>
            <div className="mt-4 flex items-start justify-between gap-4">
              <h1
                className="text-[30px] font-semibold leading-[1.06] tracking-[-0.02em] md:text-[38px]"
                style={{ color: C.ink, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <ShoppingBasket
                size={28}
                aria-hidden="true"
                style={{ color: C.inkFaint }}
                className="hidden sm:block"
              />
            </div>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              De kramen staan uitgestald. Kies vandaag de beste opdracht zoals je de beste kraam
              kiest — transparant, met een eerlijke prijs aan het krijtbord.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <PrimaryButton onClick={onActies}>
                Volgende actie
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </PrimaryButton>
              <GhostButton onClick={onOpen}>Loop de markt af</GhostButton>
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <Sparkles size={20} aria-hidden="true" style={{ color: C.ocreDeep }} />
          </div>
          <h2
            className="mt-4 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
            <p className="text-[11.5px]" style={{ color: C.inkMute, ...num }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>De weegschaal · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute, ...bodyF }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <BarChart data={k.spark} tone={k.up ? C.red : C.ocre} id={`kpi-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Kramen · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1462f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e4]"
              style={{ color: C.redDeep, ...bodyF }}
            >
              Alle kramen →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#f7f1e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d1462f] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background: i === 0 ? C.redWash : C.creamAlt,
                        border: `1px solid ${i === 0 ? C.red : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.redDeep : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...display }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <MatchMeter value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Panel className="p-4">
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

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
    <div className="space-y-6">
      <div>
        <Eyebrow>De markt · open opdrachten</Eyebrow>
        <h1
          className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Loop de kramen af
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} kramen open
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3"
          style={{ background: C.creamHi, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a8a72]"
            style={{ color: C.ink, ...bodyF }}
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
              {s === "match" ? "Beste kraam" : "Prijs"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.redWash, border: `1px solid ${C.red}`, color: C.redDeep }}
              aria-hidden="true"
            >
              <ShoppingBasket size={26} />
            </span>
            <p className="mt-5 text-[18px] font-semibold" style={{ color: C.ink, ...display }}>
              Geen kraam gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              kramen te zien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const tone = strong ? C.red : C.green;
  const toneDeep = strong ? C.redDeep : C.greenDeep;
  return (
    <Panel>
      <Awning className="h-2.5" tone={tone} />
      <div className="p-5">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                Kraam {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: C.inkMute, ...num }}>
                {opdracht.id}
              </span>
            </div>
            <h3
              className="mt-2 text-[17px] font-semibold leading-snug"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h3>
            <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
              {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                  style={{
                    color: C.inkSoft,
                    background: C.creamAlt,
                    border: `1px solid ${C.line}`,
                    ...bodyF,
                  }}
                >
                  <Tag size={9} aria-hidden="true" style={{ color: C.ocreDeep }} />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Chalkboard
              amount={opdracht.tarief.replace(" / uur", "").replace("/ uur", "")}
              label="per uur"
            />
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ color: toneDeep, background: strong ? C.redWash : C.greenWash, ...num }}
            >
              {opdracht.match}% match
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1462f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fefcf6]"
            style={{ color: C.redDeep, border: `1px solid ${C.line}`, ...display }}
          >
            {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
            Waarom deze kraam
          </button>
          <div className="ml-auto">
            <PrimaryButton onClick={onOpen}>
              Reageer <ArrowRight size={13} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </div>
        <div
          className="grid transition-all duration-300 motion-reduce:transition-none"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RedenBlok
                titel="Goede koop"
                tone={C.okInk}
                Icon={Check}
                items={opdracht.redenen.plus}
              />
              <RedenBlok
                titel="Bekijk goed"
                tone={C.warnInk}
                Icon={AlertTriangle}
                items={opdracht.redenen.min}
              />
            </div>
          </div>
        </div>
      </div>
    </Panel>
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
      className="rounded-xl p-4"
      style={{ background: C.cream, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...bodyF }}
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

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1462f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e4]"
        style={{
          color: C.inkSoft,
          background: C.creamHi,
          border: `1px solid ${C.line}`,
          ...display,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar de markt
      </button>

      <Panel>
        <Awning className="h-3" tone={strong ? C.red : C.green} />
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              {opdracht.id}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ color: C.creamHi, background: strong ? C.redDeep : C.greenDeep, ...display }}
            >
              <ShieldCheck size={11} aria-hidden="true" /> {strong ? "Topkraam" : "Goede kraam"} ·{" "}
              {opdracht.match}%
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1
              className="max-w-2xl text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[38px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <Chalkboard
              amount={opdracht.tarief.replace(" / uur", "").replace("/ uur", "")}
              label="per uur"
              className="shrink-0"
            />
          </div>
          <p className="mt-2 text-[14px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <PrimaryButton>
              Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
            <GhostButton>Bewaren</GhostButton>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyF }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Waarom deze kraam</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Eerlijk aan het krijtbord: wat een goede koop maakt én waar je goed naar moet kijken,
          afgelezen van je geverifieerde profiel — geen verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...bodyF }}
              >
                Goede koop
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...bodyF }}
              >
                Bekijk goed
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Panel>
        <Awning className="h-3" tone={C.green} />
        <div className="p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-md">
              <Eyebrow tone={C.greenDeep}>Verificatie · keurmerk</Eyebrow>
              <h1
                className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em]"
                style={{ color: C.ink, ...display }}
              >
                Jouw keurmerk
              </h1>
              <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                <span className="font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.trust}.
                </span>{" "}
                {verified} van {CREDENTIALS.length} certificaten dragen het keurmerk. Eén verloopt
                binnenkort en vraagt om vernieuwing.
              </p>
            </div>
            <span
              className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-2xl"
              style={{ background: C.greenWash, border: `1.5px solid ${C.green}` }}
            >
              <span
                className="text-[26px] font-bold leading-none"
                style={{ color: C.greenDeep, ...num }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyF }}
              >
                % keurmerk
              </span>
            </span>
          </div>
        </div>
      </Panel>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...bodyF }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f7f1e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d1462f] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...display }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[68px]">
                      <div
                        className="rounded-xl p-4"
                        style={{ background: C.cream, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
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
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · voor de markt sluit</Eyebrow>
        <h1
          className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.inkMute }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.red;
          const ink = warn ? C.warnInk : C.redDeep;
          const wash = warn ? C.warnWash : C.redWash;
          return (
            <li key={a.titel}>
              <Panel className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[15px] font-bold"
                    style={{ background: wash, border: `1.5px solid ${tone}`, color: ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${tone}`,
                        ...bodyF,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Store size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[16px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Panel>
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
  return { ink: C.inkMute, wash: C.creamAlt, tone: C.line, Icon: Receipt };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · de kassa</Eyebrow>
          <h1
            className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: C.ink, ...display }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute, ...bodyF }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...bodyF }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#f7f1e4] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13.5px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...display }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      ...bodyF,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...bodyF }}
          >
            <Receipt size={12} aria-hidden="true" style={{ color: C.redDeep }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
