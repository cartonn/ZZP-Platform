"use client";

// Concept 543 — "Kwartier" · Timeline-spine / Temporal OS. Het hele platform is georganiseerd
// rond een tijd-ruggengraat: een verticale tijdrail waarlangs opdrachten, diensten,
// verloopdata van certificaten en facturen chronologisch geplot staan. Agenda-native, het
// ritme van de week is de eerste dimensie. 2026-trends: spatial/temporal canvas, kalm
// high-density minimalism, expressieve maar rustige micro-interacties, scherpe focus-states.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Compass,
  FileText,
  Filter,
  Hourglass,
  ListChecks,
  MapPin,
  Milestone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  TriangleAlert,
  Users,
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

// ————————————————————————————————— Palet — warm tijdpapier —————————————————————————————————
const C = {
  bg: "#f6f5f1", // zacht papier
  panel: "#ffffff",
  panelSoft: "#faf9f6",
  rail: "#e7e4db", // tijdrail lijn
  line: "#e9e6df",
  lineSoft: "#f1efe9",
  ink: "#221f1a",
  inkSoft: "#5c574d",
  inkFaint: "#8f897c",
  accent: "#5b4bd6", // tijd / heden — indigo
  accentSoft: "#efedfd",
  accentInk: "#372c94",
  amber: "#b57314", // markering / vandaag
  amberSoft: "#fbf1de",
  ok: "#2f7d51",
  okSoft: "#e6f2ea",
  warn: "#b57314",
  warnSoft: "#fbf1de",
  danger: "#c0392f",
  dangerSoft: "#fbeae7",
  info: "#2563a8",
  infoSoft: "#e7f0fa",
};

// ————————————————————————————————— Status-taal (label + icoon) —————————————————————————————————
type StatusMeta = { label: string; icon: LucideIcon; fg: string; bg: string };
function credMeta(status: CredStatus): StatusMeta {
  switch (status) {
    case "VERIFIED":
      return { label: "Geverifieerd", icon: ShieldCheck, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", icon: Hourglass, fg: C.info, bg: C.infoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", icon: X, fg: C.danger, bg: C.dangerSoft };
  }
}

function factuurMeta(status: string): StatusMeta {
  switch (status) {
    case "Betaald":
      return { label: "Betaald", icon: Check, fg: C.ok, bg: C.okSoft };
    case "Openstaand":
      return { label: "Openstaand", icon: Clock, fg: C.warn, bg: C.warnSoft };
    default:
      return { label: "Concept", icon: FileText, fg: C.inkFaint, bg: C.lineSoft };
  }
}

// ————————————————————————————————— Kleine primitives —————————————————————————————————
function Chip({
  children,
  meta,
  size = "md",
}: {
  children: ReactNode;
  meta: StatusMeta;
  size?: "sm" | "md";
}) {
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        borderRadius: 999,
        background: meta.bg,
        color: meta.fg,
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 600,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={size === "sm" ? 12 : 13} aria-hidden="true" strokeWidth={2.2} />
      {children}
    </span>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 6,
        background: C.panelSoft,
        border: `1px solid ${C.line}`,
        color: C.inkSoft,
        fontSize: 11.5,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 68;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * w : 0;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MatchRing({ value }: { value: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  const tone = value >= 90 ? C.ok : value >= 82 ? C.accent : C.amber;
  return (
    <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
      <svg width={40} height={40} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" stroke={C.line} strokeWidth={3.5} />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={3.5}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: 11.5,
          fontWeight: 700,
          color: C.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ————————————————————————————————— Tijdrail-node —————————————————————————————————
type RailTone = "accent" | "amber" | "ok" | "danger" | "info" | "muted";
const toneColor: Record<RailTone, { dot: string; soft: string }> = {
  accent: { dot: C.accent, soft: C.accentSoft },
  amber: { dot: C.amber, soft: C.amberSoft },
  ok: { dot: C.ok, soft: C.okSoft },
  danger: { dot: C.danger, soft: C.dangerSoft },
  info: { dot: C.info, soft: C.infoSoft },
  muted: { dot: C.inkFaint, soft: C.lineSoft },
};

function RailItem({
  when,
  tone,
  icon: Icon,
  now = false,
  last = false,
  children,
}: {
  when: string;
  tone: RailTone;
  icon: LucideIcon;
  now?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  const t = toneColor[tone];
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "72px 24px 1fr",
        gap: 0,
        position: "relative",
      }}
    >
      <div
        style={{
          textAlign: "right",
          paddingRight: 12,
          paddingTop: 2,
          fontSize: 11.5,
          fontWeight: 600,
          color: now ? C.amber : C.inkFaint,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {when}
      </div>
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        {!last && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 22,
              bottom: -14,
              width: 2,
              background: C.rail,
              borderRadius: 2,
            }}
          />
        )}
        <span
          aria-hidden="true"
          className="k543-node"
          style={{
            position: "relative",
            zIndex: 1,
            width: 24,
            height: 24,
            borderRadius: 999,
            background: t.soft,
            color: t.dot,
            display: "grid",
            placeItems: "center",
            border: `1.5px solid ${t.dot}`,
            boxShadow: now ? `0 0 0 4px ${C.amberSoft}` : "none",
          }}
        >
          <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </div>
      <div style={{ paddingLeft: 14, paddingBottom: 18 }}>{children}</div>
    </li>
  );
}

// ————————————————————————————————— Hoofdcomponent —————————————————————————————————
export function Concept543() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [openOpdracht, setOpenOpdracht] = useState<Opdracht | null>(OPDRACHTEN[0] ?? null);
  const [zoek, setZoek] = useState("");
  const [alleenTop, setAlleenTop] = useState(false);
  const [dataState, setDataState] = useState<"ok" | "loading" | "error">("ok");
  const [expandActie, setExpandActie] = useState<number | null>(0);

  const navScreens = SCREENS;
  const navIcon: Record<ScreenKey, LucideIcon> = {
    dashboard: CalendarDays,
    marktplaats: Store,
    opdracht: Milestone,
    verificatie: ShieldCheck,
    documenten: FileText,
    facturen: Banknote,
    berichten: Bell,
    acties: ListChecks,
  };

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return OPDRACHTEN.filter((o) => {
      if (alleenTop && o.match < 88) return false;
      if (!q) return true;
      return (
        o.titel.toLowerCase().includes(q) ||
        o.opdrachtgever.toLowerCase().includes(q) ||
        o.plaats.toLowerCase().includes(q) ||
        o.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [zoek, alleenTop]);

  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  function openDetail(o: Opdracht) {
    setOpenOpdracht(o);
    setScreen("opdracht");
  }

  return (
    <div
      className="k543"
      style={{
        background: C.bg,
        color: C.ink,
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        minHeight: 640,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${C.line}`,
        display: "grid",
        gridTemplateColumns: "240px 1fr",
      }}
    >
      <style>{k543css}</style>

      {/* ————— Zij-navigatie (agenda-context) ————— */}
      <nav
        aria-label="Hoofdnavigatie"
        className="k543-side"
        style={{
          background: C.panel,
          borderRight: `1px solid ${C.line}`,
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 18px" }}>
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: C.accent,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 2px 8px rgba(91,75,214,.35)",
            }}
          >
            <Compass size={18} strokeWidth={2.2} />
          </span>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.2 }}>Kwartier</div>
            <div style={{ fontSize: 11, color: C.inkFaint, fontWeight: 500 }}>tijd-native</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "0 4px 14px",
            padding: "9px 11px",
            borderRadius: 10,
            background: C.amberSoft,
            border: `1px solid ${C.amber}22`,
          }}
        >
          <CalendarClock size={15} color={C.amber} aria-hidden="true" />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink }}>Vandaag · di 10 aug</div>
            <div style={{ fontSize: 10.5, color: C.inkSoft }}>week 33 · Q3</div>
          </div>
        </div>

        {navScreens.map((s) => {
          const Icon = navIcon[s.key];
          const active = screen === s.key || (s.key === "opdracht" && screen === "opdracht");
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={screen === s.key ? "page" : undefined}
              className="k543-navbtn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 11px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                background: active ? C.accentSoft : "transparent",
                color: active ? C.accentInk : C.inkSoft,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                position: "relative",
              }}
            >
              {active && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: -14,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 3,
                    background: C.accent,
                  }}
                />
              )}
              <Icon size={16} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              {s.label}
              {s.key === "acties" && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: C.amber,
                    background: C.amberSoft,
                    borderRadius: 999,
                    padding: "1px 7px",
                  }}
                >
                  {ACTIES.length}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ marginTop: "auto", paddingTop: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 8px",
              borderRadius: 10,
              border: `1px solid ${C.line}`,
              background: C.panelSoft,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.accent,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {PROFIEL.initialen}
            </span>
            <div style={{ lineHeight: 1.2, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {PROFIEL.naam}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: C.inkFaint,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <ShieldCheck size={11} color={C.ok} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ————— Hoofdgebied ————— */}
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          className="k543-topbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 22px",
            borderBottom: `1px solid ${C.line}`,
            background: C.panel,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3, margin: 0 }}>
              {navScreens.find((s) => s.key === screen)?.label ?? "Dashboard"}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.inkFaint }}>
              {screen === "dashboard" && "Je week op de tijdrail — wat komt eraan?"}
              {screen === "marktplaats" && "Opdrachten geplot op startdatum"}
              {screen === "opdracht" && "Opdracht in de tijd — van start tot factuur"}
              {screen === "verificatie" && "Certificaten op de verloop-tijdlijn"}
              {screen === "acties" && "Wat vraagt nu je aandacht, chronologisch"}
              {screen === "facturen" && "Facturen langs de betaal-tijdlijn"}
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="k543-icobtn"
              aria-label={`Berichten, ${ongelezen} ongelezen`}
              style={icoBtn}
            >
              <Bell size={16} aria-hidden="true" />
              {ongelezen > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: C.amber,
                    border: `1.5px solid ${C.panel}`,
                  }}
                />
              )}
            </button>
            <button
              onClick={() => setScreen("marktplaats")}
              className="k543-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                background: C.accent,
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              <Search size={14} aria-hidden="true" />
              Nieuwe match
            </button>
          </div>
        </header>

        <div style={{ padding: 22, overflow: "auto", flex: 1 }}>
          {screen === "dashboard" && <Dashboard onOpen={openDetail} setScreen={setScreen} />}
          {screen === "marktplaats" && (
            <Marktplaats
              zoek={zoek}
              setZoek={setZoek}
              alleenTop={alleenTop}
              setAlleenTop={setAlleenTop}
              dataState={dataState}
              setDataState={setDataState}
              items={gefilterd}
              onOpen={openDetail}
            />
          )}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={openOpdracht} onTerug={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && (
            <Acties expand={expandActie} setExpand={setExpandActie} setScreen={setScreen} />
          )}
          {screen === "facturen" && <Facturen />}
        </div>
      </main>
    </div>
  );
}

const icoBtn: CSSProperties = {
  position: "relative",
  width: 34,
  height: 34,
  borderRadius: 9,
  border: `1px solid ${C.line}`,
  background: C.panel,
  color: C.inkSoft,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

// ————————————————————————————————— Kaart-wrapper —————————————————————————————————
function Card({
  title,
  icon: Icon,
  right,
  children,
  pad = 18,
}: {
  title?: string;
  icon?: LucideIcon;
  right?: ReactNode;
  children: ReactNode;
  pad?: number;
}) {
  return (
    <section
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "13px 18px",
            borderBottom: `1px solid ${C.lineSoft}`,
          }}
        >
          {Icon && <Icon size={15} color={C.accent} aria-hidden="true" />}
          <h2 style={{ fontSize: 13, fontWeight: 700, margin: 0, letterSpacing: -0.1 }}>{title}</h2>
          {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </section>
  );
}

// ————————————————————————————————— Dashboard —————————————————————————————————
function Dashboard({
  onOpen,
  setScreen,
}: {
  onOpen: (o: Opdracht) => void;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* KPI-strip */}
      <div className="k543-kpis">
        {KPIS.map((k) => (
          <div
            key={k.label}
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: 15,
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                color: C.inkFaint,
                fontWeight: 600,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {k.label}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  color: k.up ? C.ok : C.warn,
                  fontWeight: 700,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{k.value}</span>
              <Sparkline data={k.spark} color={k.up ? C.ok : C.amber} />
            </div>
          </div>
        ))}
      </div>

      <div className="k543-splitmain">
        {/* Tijdrail — de ruggengraat */}
        <Card
          title="Deze week op de tijdrail"
          icon={CalendarClock}
          right={
            <span style={{ fontSize: 11.5, color: C.inkFaint, fontWeight: 600 }}>
              di 10 → zo 15 aug
            </span>
          }
        >
          <ol style={{ listStyle: "none", margin: 0, padding: "4px 0 0" }}>
            <RailItem when="Nu · 14:00" tone="amber" icon={Clock} now>
              <RailCard
                titel="Avonddienst — Thuiszorg De Linde"
                sub="Wijkverpleging · Utrecht · tot 22:00"
                chip={
                  <Chip
                    meta={{ label: "Bevestigd", icon: Check, fg: C.ok, bg: C.okSoft }}
                    size="sm"
                  >
                    Bevestigd
                  </Chip>
                }
              />
            </RailItem>
            <RailItem when="Wo 11 aug" tone="accent" icon={Users}>
              <RailCard
                titel="Intakegesprek — Zorggroep Almere"
                sub="Kennismaking VIG-opdracht · 10:30"
                chip={
                  <Chip
                    meta={{ label: "Gepland", icon: CalendarDays, fg: C.info, bg: C.infoSoft }}
                    size="sm"
                  >
                    Gepland
                  </Chip>
                }
              />
            </RailItem>
            <RailItem when="Do 12 aug" tone="info" icon={Banknote}>
              <RailCard
                titel="Factuur FAC-2025-118 — betaaltermijn"
                sub="Thuiszorg De Linde · € 1.350"
                chip={
                  <Chip meta={factuurMeta("Openstaand")} size="sm">
                    Openstaand
                  </Chip>
                }
              />
            </RailItem>
            <RailItem when="Vr 13 aug" tone="danger" icon={TriangleAlert} last>
              <RailCard
                titel="VOG verloopt binnenkort"
                sub="Verklaring Omtrent Gedrag · nog 23 dagen"
                chip={
                  <Chip meta={credMeta("EXPIRING")} size="sm">
                    Verloopt binnenkort
                  </Chip>
                }
              />
            </RailItem>
          </ol>
        </Card>

        {/* Zijkolom: top-match van vandaag + acties */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card title="Beste match nu" icon={Sparkles}>
            {OPDRACHTEN[0] && (
              <button
                onClick={() => onOpen(OPDRACHTEN[0] as Opdracht)}
                className="k543-rowbtn"
                style={{
                  display: "flex",
                  gap: 12,
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <MatchRing value={OPDRACHTEN[0].match} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>
                    {OPDRACHTEN[0].titel}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>
                    {OPDRACHTEN[0].opdrachtgever} · {OPDRACHTEN[0].plaats}
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: C.accentInk, fontWeight: 700, marginTop: 6 }}
                  >
                    {OPDRACHTEN[0].tarief} · {OPDRACHTEN[0].start}
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  color={C.inkFaint}
                  aria-hidden="true"
                  style={{ marginLeft: "auto", alignSelf: "center" }}
                />
              </button>
            )}
          </Card>

          <Card
            title="Vraagt aandacht"
            icon={ListChecks}
            right={
              <button onClick={() => setScreen("acties")} className="k543-link" style={linkBtn}>
                Alles <ArrowRight size={12} aria-hidden="true" />
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ACTIES.slice(0, 2).map((a) => {
                const tone = a.urgentie === "warning" ? C.amber : C.info;
                const soft = a.urgentie === "warning" ? C.amberSoft : C.infoSoft;
                return (
                  <div key={a.titel} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span
                      aria-hidden="true"
                      style={{
                        marginTop: 1,
                        width: 26,
                        height: 26,
                        flexShrink: 0,
                        borderRadius: 7,
                        background: soft,
                        color: tone,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {a.urgentie === "warning" ? (
                        <TriangleAlert size={14} />
                      ) : (
                        <CircleAlert size={14} />
                      )}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>
                        {a.titel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RailCard({ titel, sub, chip }: { titel: string; sub: string; chip?: ReactNode }) {
  return (
    <div
      className="k543-railcard"
      style={{
        background: C.panelSoft,
        border: `1px solid ${C.line}`,
        borderRadius: 11,
        padding: "11px 13px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{titel}</div>
          <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3 }}>{sub}</div>
        </div>
        {chip}
      </div>
    </div>
  );
}

const linkBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  border: "none",
  background: "transparent",
  color: C.accent,
  fontSize: 11.5,
  fontWeight: 700,
  cursor: "pointer",
  padding: "2px 4px",
  borderRadius: 6,
};

// ————————————————————————————————— Marktplaats —————————————————————————————————
function Marktplaats({
  zoek,
  setZoek,
  alleenTop,
  setAlleenTop,
  dataState,
  setDataState,
  items,
  onOpen,
}: {
  zoek: string;
  setZoek: (v: string) => void;
  alleenTop: boolean;
  setAlleenTop: (v: boolean) => void;
  dataState: "ok" | "loading" | "error";
  setDataState: (v: "ok" | "loading" | "error") => void;
  items: Opdracht[];
  onOpen: (o: Opdracht) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filterbalk */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <Search
            size={15}
            color={C.inkFaint}
            aria-hidden="true"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op titel, opdrachtgever, plaats of tag…"
            aria-label="Zoek opdrachten"
            className="k543-input"
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: 9,
              border: `1px solid ${C.line}`,
              background: C.panelSoft,
              fontSize: 13,
              color: C.ink,
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={() => setAlleenTop(!alleenTop)}
          aria-pressed={alleenTop}
          className="k543-toggle"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 13px",
            borderRadius: 9,
            border: `1px solid ${alleenTop ? C.accent : C.line}`,
            background: alleenTop ? C.accentSoft : C.panel,
            color: alleenTop ? C.accentInk : C.inkSoft,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Filter size={14} aria-hidden="true" />
          Alleen top-match (88%+)
        </button>

        {/* Demo-schakelaars voor states */}
        <div
          role="group"
          aria-label="Weergavestatus demonstreren"
          style={{
            display: "inline-flex",
            gap: 4,
            marginLeft: "auto",
            background: C.panelSoft,
            borderRadius: 9,
            padding: 3,
            border: `1px solid ${C.line}`,
          }}
        >
          {(["ok", "loading", "error"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setDataState(s)}
              aria-pressed={dataState === s}
              className="k543-seg"
              style={{
                padding: "6px 11px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 700,
                background: dataState === s ? C.panel : "transparent",
                color: dataState === s ? C.ink : C.inkFaint,
                boxShadow: dataState === s ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              }}
            >
              {s === "ok" ? "Data" : s === "loading" ? "Laden" : "Fout"}
            </button>
          ))}
        </div>
      </div>

      {/* Resultaten */}
      {dataState === "loading" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
          aria-busy="true"
          aria-live="polite"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="k543-skel"
              style={{
                height: 92,
                borderRadius: 12,
                border: `1px solid ${C.line}`,
                background: `linear-gradient(90deg, ${C.panelSoft} 25%, ${C.lineSoft} 37%, ${C.panelSoft} 63%)`,
                backgroundSize: "400% 100%",
              }}
            />
          ))}
        </div>
      )}

      {dataState === "error" && (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "44px 20px",
            background: C.panel,
            border: `1px solid ${C.dangerSoft}`,
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: C.dangerSoft,
              color: C.danger,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircleAlert size={22} aria-hidden="true" />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Opdrachten konden niet worden geladen
            </div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 3 }}>
              Er ging iets mis bij het ophalen van de tijdlijn. Probeer het opnieuw.
            </div>
          </div>
          <button
            onClick={() => setDataState("ok")}
            className="k543-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 16px",
              borderRadius: 9,
              border: "none",
              background: C.accent,
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Opnieuw proberen
          </button>
        </div>
      )}

      {dataState === "ok" && items.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "48px 20px",
            background: C.panel,
            border: `1px dashed ${C.rail}`,
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: C.lineSoft,
              color: C.inkFaint,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Search size={22} aria-hidden="true" />
          </span>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Geen opdrachten gevonden</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, maxWidth: 320 }}>
            Pas je zoekopdracht aan of zet de filter uit om meer resultaten op de tijdrail te zien.
          </div>
          <button
            onClick={() => {
              setZoek("");
              setAlleenTop(false);
            }}
            className="k543-ghost"
            style={ghostBtn}
          >
            Filters wissen
          </button>
        </div>
      )}

      {dataState === "ok" && items.length > 0 && (
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((o, i) => (
            <li
              key={o.id}
              style={{
                display: "grid",
                gridTemplateColumns: "84px 24px 1fr",
                position: "relative",
              }}
            >
              <div
                style={{
                  textAlign: "right",
                  paddingRight: 12,
                  paddingTop: 16,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: C.accentInk,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {o.start}
              </div>
              <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                {i < items.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 30,
                      bottom: -2,
                      width: 2,
                      background: C.rail,
                    }}
                  />
                )}
                <span
                  aria-hidden="true"
                  style={{
                    marginTop: 16,
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: C.panel,
                    border: `2.5px solid ${C.accent}`,
                  }}
                />
              </div>
              <div style={{ paddingLeft: 14, paddingBottom: 14 }}>
                <button
                  onClick={() => onOpen(o)}
                  className="k543-oppkaart"
                  style={{
                    display: "flex",
                    gap: 14,
                    width: "100%",
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 12,
                    border: `1px solid ${C.line}`,
                    background: C.panel,
                    cursor: "pointer",
                  }}
                >
                  <MatchRing value={o.match} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>
                        {o.titel}
                      </span>
                      <span style={{ fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>
                        {o.id}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.inkSoft,
                        marginTop: 3,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Users size={12} aria-hidden="true" /> {o.opdrachtgever}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} aria-hidden="true" /> {o.plaats}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} aria-hidden="true" /> {o.uren}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                      {o.tags.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.accentInk }}>
                      {o.tarief}
                    </div>
                    <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 2 }}>tarief</div>
                  </div>
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const ghostBtn: CSSProperties = {
  padding: "8px 15px",
  borderRadius: 9,
  border: `1px solid ${C.line}`,
  background: C.panel,
  color: C.inkSoft,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

// ————————————————————————————————— Opdracht-detail —————————————————————————————————
function OpdrachtDetail({ opdracht, onTerug }: { opdracht: Opdracht | null; onTerug: () => void }) {
  if (!opdracht) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.inkSoft }}>
        Geen opdracht geselecteerd.
      </div>
    );
  }
  const o = opdracht;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button
        onClick={onTerug}
        className="k543-link"
        style={{ ...linkBtn, alignSelf: "flex-start" }}
      >
        <ArrowRight size={13} style={{ transform: "rotate(180deg)" }} aria-hidden="true" /> Terug
        naar marktplaats
      </button>

      <div className="k543-detailgrid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card pad={18}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <MatchRing value={o.match} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: -0.4,
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {o.titel}
                </h2>
                <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 5 }}>
                  {o.opdrachtgever} · {o.plaats}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {o.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            </div>

            {/* Tijdlijn van de opdracht */}
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.lineSoft}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.inkFaint, marginBottom: 12 }}>
                Opdracht in de tijd
              </div>
              <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                <RailItem when="Reageren" tone="accent" icon={ArrowUpRight}>
                  <RailCard
                    titel="Reactie versturen"
                    sub="Gemiddelde reactietijd opdrachtgever: 6 uur"
                  />
                </RailItem>
                <RailItem when={o.start} tone="amber" icon={CalendarDays}>
                  <RailCard titel="Startdatum opdracht" sub={`${o.uren} · ${o.tarief}`} />
                </RailItem>
                <RailItem when="Lopend" tone="ok" icon={Clock}>
                  <RailCard
                    titel="Diensten & registratie"
                    sub="Uren loggen per dienst op de tijdrail"
                  />
                </RailItem>
                <RailItem when="Na afloop" tone="info" icon={Banknote} last>
                  <RailCard
                    titel="Factureren"
                    sub="Automatisch voorstel op basis van gelogde uren"
                  />
                </RailItem>
              </ol>
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Waarom deze match" icon={Sparkles}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {o.redenen.plus.map((r) => (
                <div key={r} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ marginTop: 1, color: C.ok, flexShrink: 0 }}>
                    <Check size={15} aria-hidden="true" strokeWidth={2.6} />
                  </span>
                  <span style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.4 }}>{r}</span>
                </div>
              ))}
              {o.redenen.min.map((r) => (
                <div key={r} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ marginTop: 1, color: C.warn, flexShrink: 0 }}>
                    <TriangleAlert size={15} aria-hidden="true" strokeWidth={2.4} />
                  </span>
                  <span style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.4 }}>{r}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Kerngegevens" icon={Milestone}>
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Feit label="Tarief" waarde={o.tarief} />
              <Feit label="Uren" waarde={o.uren} />
              <Feit label="Start" waarde={o.start} />
              <Feit label="Plaats" waarde={o.plaats} />
            </dl>
            <button
              className="k543-primary"
              style={{
                marginTop: 16,
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 16px",
                borderRadius: 10,
                border: "none",
                background: C.accent,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ArrowUpRight size={15} aria-hidden="true" />
              Reageer op deze opdracht
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Feit({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div>
      <dt style={{ fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>{label}</dt>
      <dd style={{ margin: "3px 0 0", fontSize: 13.5, fontWeight: 700, color: C.ink }}>{waarde}</dd>
    </div>
  );
}

// ————————————————————————————————— Verificatie (tijdlijn van verloop) —————————————————————————————————
function Verificatie() {
  const order: Record<CredStatus, number> = { EXPIRING: 0, SUBMITTED: 1, REJECTED: 2, VERIFIED: 3 };
  const gesorteerd = [...CREDENTIALS].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card
        title="Certificaten op de verloop-tijdlijn"
        icon={ShieldCheck}
        right={
          <span style={{ fontSize: 11.5, color: C.inkFaint, fontWeight: 600 }}>
            {PROFIEL.trust}
          </span>
        }
      >
        <p style={{ margin: "0 0 16px", fontSize: 12.5, color: C.inkSoft }}>
          Chronologisch op urgentie — wat het eerst verloopt of aandacht vraagt, staat bovenaan.
        </p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {gesorteerd.map((c, i) => {
            const m = credMeta(c.status);
            const tone: RailTone =
              c.status === "VERIFIED"
                ? "ok"
                : c.status === "EXPIRING"
                  ? "amber"
                  : c.status === "REJECTED"
                    ? "danger"
                    : "info";
            const t = toneColor[tone];
            const Icon = m.icon;
            return (
              <li
                key={c.naam}
                style={{ display: "grid", gridTemplateColumns: "24px 1fr", position: "relative" }}
              >
                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  {i < gesorteerd.length - 1 && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: 26,
                        bottom: -2,
                        width: 2,
                        background: C.rail,
                      }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    style={{
                      marginTop: 4,
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: t.soft,
                      color: t.dot,
                      border: `1.5px solid ${t.dot}`,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon size={12} strokeWidth={2.4} />
                  </span>
                </div>
                <div style={{ paddingLeft: 14, paddingBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      background: C.panelSoft,
                      border: `1px solid ${C.line}`,
                      borderRadius: 11,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.naam}</div>
                      <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>
                        {c.detail}
                      </div>
                    </div>
                    <Chip meta={m}>{m.label}</Chip>
                    {(c.status === "EXPIRING" || c.status === "REJECTED") && (
                      <button className="k543-ghost" style={ghostBtn}>
                        {c.status === "EXPIRING" ? "Vernieuwen" : "Opnieuw indienen"}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}

// ————————————————————————————————— Acties (next-action, chronologisch) —————————————————————————————————
function Acties({
  expand,
  setExpand,
  setScreen,
}: {
  expand: number | null;
  setExpand: (v: number | null) => void;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
      {ACTIES.map((a, i) => {
        const open = expand === i;
        const warn = a.urgentie === "warning";
        const tone = warn ? C.amber : C.info;
        const soft = warn ? C.amberSoft : C.infoSoft;
        return (
          <div
            key={a.titel}
            style={{
              background: C.panel,
              border: `1px solid ${open ? tone + "66" : C.line}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setExpand(open ? null : i)}
              aria-expanded={open}
              className="k543-accord"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  borderRadius: 9,
                  background: soft,
                  color: tone,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {warn ? <TriangleAlert size={17} /> : <CircleAlert size={17} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{a.titel}</span>
                {!open && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: C.inkFaint,
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.detail}
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: tone,
                  background: soft,
                  borderRadius: 999,
                  padding: "3px 9px",
                  flexShrink: 0,
                }}
              >
                {warn ? "Urgent" : "Info"}
              </span>
            </button>
            {open && (
              <div style={{ padding: "0 16px 16px 63px" }} className="k543-reveal">
                <p style={{ margin: "0 0 12px", fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
                  {a.detail}
                </p>
                <button
                  onClick={() => setScreen(warn ? "verificatie" : "marktplaats")}
                  className="k543-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 15px",
                    borderRadius: 9,
                    border: "none",
                    background: tone,
                    color: "#fff",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {a.cta}
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ————————————————————————————————— Facturen (betaal-tijdlijn) —————————————————————————————————
function Facturen() {
  const totaalOpen = "€ 1.350";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="k543-kpis">
        <MiniStat label="Betaald (mnd)" waarde="€ 5.552" tone={C.ok} icon={Check} />
        <MiniStat label="Openstaand" waarde={totaalOpen} tone={C.warn} icon={Clock} />
        <MiniStat label="Concept" waarde="€ 880" tone={C.inkFaint} icon={FileText} />
        <MiniStat
          label="Facturen"
          waarde={String(FACTUREN.length)}
          tone={C.accent}
          icon={Banknote}
        />
      </div>

      <Card title="Betaal-tijdlijn" icon={CalendarClock}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {FACTUREN.map((f, i) => {
            const m = factuurMeta(f.status);
            const Icon = m.icon;
            return (
              <li
                key={f.nr}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 24px 1fr",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    textAlign: "right",
                    paddingRight: 12,
                    paddingTop: 14,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: C.inkFaint,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {f.datum}
                </div>
                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  {i < FACTUREN.length - 1 && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: 26,
                        bottom: -2,
                        width: 2,
                        background: C.rail,
                      }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    style={{
                      marginTop: 4,
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: m.bg,
                      color: m.fg,
                      border: `1.5px solid ${m.fg}`,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon size={12} strokeWidth={2.4} />
                  </span>
                </div>
                <div style={{ paddingLeft: 14, paddingBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      background: C.panelSoft,
                      border: `1px solid ${C.line}`,
                      borderRadius: 11,
                      padding: "11px 14px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{f.nr}</div>
                      <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>
                        {f.klant}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: C.ink,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {f.bedrag}
                    </span>
                    <Chip meta={m}>{m.label}</Chip>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}

function MiniStat({
  label,
  waarde,
  tone,
  icon: Icon,
}: {
  label: string;
  waarde: string;
  tone: string;
  icon: LucideIcon;
}) {
  return (
    <div
      style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 15 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 11.5,
          color: C.inkFaint,
          fontWeight: 600,
        }}
      >
        <Icon size={14} color={tone} aria-hidden="true" />
        {label}
      </div>
      <div
        style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginTop: 8, color: C.ink }}
      >
        {waarde}
      </div>
    </div>
  );
}

// ————————————————————————————————— Scoped CSS —————————————————————————————————
const k543css = `
.k543 * { box-sizing: border-box; }
.k543 button, .k543 input { font-family: inherit; }
.k543 :focus-visible {
  outline: 2px solid ${C.accent};
  outline-offset: 2px;
  border-radius: 8px;
}
.k543 .k543-navbtn:hover { background: ${C.lineSoft}; color: ${C.ink}; }
.k543 .k543-navbtn { transition: background .15s ease, color .15s ease; }
.k543 .k543-icobtn:hover { background: ${C.panelSoft}; color: ${C.ink}; border-color: ${C.rail}; }
.k543 .k543-primary { transition: transform .12s ease, box-shadow .18s ease, filter .15s ease; }
.k543 .k543-primary:hover { filter: brightness(1.06); box-shadow: 0 3px 10px rgba(91,75,214,.28); }
.k543 .k543-primary:active { transform: translateY(1px); }
.k543 .k543-oppkaart { transition: border-color .15s ease, box-shadow .18s ease, transform .12s ease; }
.k543 .k543-oppkaart:hover { border-color: ${C.accent}88; box-shadow: 0 4px 16px rgba(34,31,26,.07); transform: translateY(-1px); }
.k543 .k543-railcard { transition: border-color .15s ease, box-shadow .18s ease; }
.k543 .k543-railcard:hover { border-color: ${C.rail}; box-shadow: 0 2px 10px rgba(34,31,26,.05); }
.k543 .k543-rowbtn:hover .k543-arrow { transform: translateX(3px); }
.k543 .k543-input:focus { border-color: ${C.accent}; background: ${C.panel}; }
.k543 .k543-toggle:hover { border-color: ${C.rail}; }
.k543 .k543-seg:hover { color: ${C.ink}; }
.k543 .k543-ghost:hover { background: ${C.panelSoft}; border-color: ${C.rail}; color: ${C.ink}; }
.k543 .k543-link { transition: opacity .15s ease; }
.k543 .k543-link:hover { opacity: .7; }
.k543 .k543-accord:hover { background: ${C.panelSoft}; }
.k543 .k543-node { transition: transform .18s ease; }
.k543 .k543-reveal { animation: k543fade .22s ease; }
.k543 .k543-skel { animation: k543shimmer 1.3s ease-in-out infinite; }
.k543 .k543-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.k543 .k543-splitmain { display: grid; grid-template-columns: 1.55fr 1fr; gap: 18px; align-items: start; }
.k543 .k543-detailgrid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; align-items: start; }
@keyframes k543fade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }
@keyframes k543shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
@media (max-width: 1040px) {
  .k543 .k543-kpis { grid-template-columns: repeat(2, 1fr); }
  .k543 .k543-splitmain { grid-template-columns: 1fr; }
  .k543 .k543-detailgrid { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .k543 { grid-template-columns: 1fr !important; }
  .k543 .k543-side {
    flex-direction: row; overflow-x: auto; align-items: center;
    padding: 10px 12px; gap: 6px;
  }
  .k543 .k543-side > div:first-child { padding-bottom: 0; }
}
@media (max-width: 560px) {
  .k543 .k543-kpis { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .k543 *, .k543 *::before, .k543 *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
`;
