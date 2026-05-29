import { type Metadata } from "next";
import { CalendarClock, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { summarizeAvailability, upcomingWindows } from "@/lib/availability";
import { type AvailabilityWindowType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AvailabilityForm } from "./availability-form";
import { deleteAvailabilityWindow } from "./actions";

export const metadata: Metadata = { title: "Beschikbaarheid · ZZP Platform" };

const TYPE: Record<AvailabilityWindowType, { label: string; variant: "success" | "warning" | "muted" }> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
};
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export default async function BeschikbaarheidPage() {
  const actor = await requireRole("FREELANCER");
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId: actor.id }, select: { id: true } });
  const rows = profile
    ? await prisma.availabilityWindow.findMany({ where: { freelancerProfileId: profile.id }, orderBy: { startDate: "asc" } })
    : [];
  const windows = rows.map((w) => ({ ...w, type: w.type as AvailabilityWindowType }));
  const upcoming = upcomingWindows(windows);
  const summary = summarizeAvailability(windows);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Beschikbaarheid</h1>
        <p className="text-sm text-muted-foreground">
          Leg je beschikbaarheid vast in periodes. {summary ? `Status: ${summary}.` : "Nog geen inzetbare periode."}
        </p>
      </header>

      <AvailabilityForm />

      {upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nog geen periodes"
          description="Nog geen (aankomende) periodes."
        />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {upcoming.map((w) => {
            const t = TYPE[w.type];
            return (
              <div key={w.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium tabular-nums">{fmt(w.startDate)} — {fmt(w.endDate)}</p>
                    <Badge variant={t.variant}>{t.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {w.hoursPerWeek != null ? `${w.hoursPerWeek} u/week` : "uren n.v.t."}
                    {w.note ? ` · ${w.note}` : ""}
                  </p>
                </div>
                <form action={deleteAvailabilityWindow.bind(null, w.id)}>
                  <Button type="submit" variant="ghost" size="sm" aria-label="Periode verwijderen">
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
