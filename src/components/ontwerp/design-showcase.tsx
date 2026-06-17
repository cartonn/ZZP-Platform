import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Users,
  FileText,
  Settings,
  Search,
  Bell,
  TrendingUp,
  Wallet,
  CheckCircle2,
} from "lucide-react";

/**
 * Themaonafhankelijke "mini-app"-compositie voor het ontwerp-lab. Gebruikt uitsluitend
 * semantische tokens (bg-card, text-foreground, border-border, …) zodat de hele mock
 * herthemed wordt door een ouder-element dat de CSS-variabelen overschrijft
 * (`[data-ontwerp="n"]`). Puur presentationeel; geen echte data of links.
 */
export function DesignShowcase() {
  return (
    <div className="flex min-h-[560px] overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm">
      {/* Zijbalk-rail */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-card p-3 sm:flex">
        <div className="flex h-10 items-center gap-2 px-1">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            Z
          </span>
          <span className="font-display text-sm font-semibold">ZorgBemiddeling</span>
        </div>
        <nav className="mt-4 flex flex-col gap-0.5">
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: Inbox, label: "Acties", badge: "6" },
            { icon: BarChart3, label: "Inzicht" },
            { icon: Users, label: "ZZP'ers" },
            { icon: FileText, label: "Administratie" },
            { icon: Settings, label: "Configuratie" },
          ].map((it) => (
            <span
              key={it.label}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                it.active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              <it.icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{it.label}</span>
              {it.badge && (
                <span className="rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                  {it.badge}
                </span>
              )}
            </span>
          ))}
        </nav>
      </aside>

      {/* Hoofdkolom */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-5">
          <div className="flex items-center gap-2 rounded-lg border border-input px-3 py-1.5 text-sm text-muted-foreground">
            <Search className="size-4" aria-hidden />
            <span>Zoeken…</span>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" aria-hidden />
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
              Bemiddelaar
            </span>
          </div>
        </header>

        {/* Inhoud */}
        <div className="flex-1 space-y-5 overflow-hidden p-5">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">Inzicht</h1>
            <p className="text-sm text-muted-foreground">
              De cijfers van je bemiddeling — omzet, vulgraad en samenwerkingen.
            </p>
          </div>

          {/* KPI-tegels */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                icon: Wallet,
                label: "Betaald",
                value: "€ 56.714",
                tone: "text-success",
                trend: "+12%",
              },
              { icon: TrendingUp, label: "Openstaand", value: "€ 8.240", tone: "text-foreground" },
              { icon: Users, label: "Inzetbaar", value: "24", tone: "text-foreground" },
              { icon: CheckCircle2, label: "Vulgraad", value: "82%", tone: "text-success" },
            ].map((k) => (
              <div key={k.label} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <k.icon className="size-4" aria-hidden />
                  </span>
                  {k.trend && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      {k.trend}
                    </span>
                  )}
                </div>
                <p className={`mt-3 font-mono text-2xl font-semibold tracking-tight ${k.tone}`}>
                  {k.value}
                </p>
                <p className="mt-1 text-sm font-medium">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Chart + tabel/donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Staafdiagram */}
            <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Omzet per maand</span>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  +8%
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex h-32 items-end gap-3">
                  {[40, 55, 48, 70, 62, 92].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t ${i === 5 ? "bg-primary" : "bg-primary/30"}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex gap-3">
                  {["jan", "feb", "mrt", "apr", "mei", "jun"].map((m) => (
                    <span
                      key={m}
                      className="flex-1 text-center text-[10px] uppercase text-muted-foreground"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Donut + legenda */}
            <div className="rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-medium">Samenwerkingen</span>
              <div className="mt-3 flex items-center gap-4">
                <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
                  <circle
                    cx="42"
                    cy="42"
                    r="34"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="14"
                  />
                  <circle
                    cx="42"
                    cy="42"
                    r="34"
                    fill="none"
                    stroke="hsl(var(--success))"
                    strokeWidth="14"
                    strokeDasharray="107 214"
                    transform="rotate(-90 42 42)"
                  />
                  <circle
                    cx="42"
                    cy="42"
                    r="34"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="14"
                    strokeDasharray="54 214"
                    strokeDashoffset="-107"
                    transform="rotate(-90 42 42)"
                  />
                </svg>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-success" /> Actief · 50%
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-primary" /> Afgerond · 25%
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-warning" /> Voorgesteld · 25%
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Knoppen + badges + tabel-rij */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                Nieuwe opdracht
              </button>
              <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground">
                Exporteren
              </button>
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                Geverifieerd
              </span>
              <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                In behandeling
              </span>
              <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
                Afgewezen
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Match 94%
              </span>
            </div>
            <div className="mt-3 divide-y divide-border">
              {[
                { naam: "Iris Hendriks", rol: "Verzorgende IG", bedrag: "€ 496,00" },
                { naam: "Mark Jansen", rol: "Verpleegkundige", bedrag: "€ 1.240,00" },
              ].map((r) => (
                <div key={r.naam} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium">{r.naam}</span>
                  <span className="text-muted-foreground">{r.rol}</span>
                  <span className="font-mono tabular-nums">{r.bedrag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
