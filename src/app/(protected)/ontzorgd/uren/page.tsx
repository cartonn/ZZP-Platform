import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock, Lock } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { userHasEntitlement } from "@/lib/entitlement-guard";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  INDIRECT_HOUR_CATEGORY_LABEL,
  sumIndirectHours,
  groupIndirectHoursByCategory,
  type IndirectHourCategory,
} from "@/lib/tax/indirect-hours";
import { getHoursCriterionSummary } from "@/lib/tax/hours-criterion-summary";
import { UrencriteriumProgress } from "@/components/tax/urencriterium-progress";
import { IndirectHoursForm } from "./indirect-hours-form";
import { deleteIndirectHours } from "./actions";

export const metadata: Metadata = { title: "Indirecte uren · Handslag" };

export default async function IndirectUrenPage() {
  const actor = await requireActor();

  // Alleen voor ZZP'ers.
  if (actor.role !== "FREELANCER") redirect("/financien");

  // Betaalde feature: IB_VOORBEREIDING-entitlement vereist.
  if (!(await userHasEntitlement(actor.id, "IB_VOORBEREIDING"))) {
    return (
      <div className="space-y-6">
        <Card>
          <EmptyState
            icon={Lock}
            title="Indirecte uren bijhouden zit in een betaald plan"
            description="Upgrade naar Zelf-doen of hoger om indirecte uren te registreren voor het urencriterium."
            action={{ label: "Bekijk abonnementen", href: "/abonnement" }}
          />
        </Card>
      </div>
    );
  }

  const now = new Date();
  const year = now.getUTCFullYear();

  // Voortgang richting het 1.225-uur criterium (directe + indirecte uren, server-side geteld) en de
  // dit jaar geregistreerde indirecte regels (gebonden met take=200 — vangrail voor unbounded-queries).
  const [criterion, entries] = await Promise.all([
    getHoursCriterionSummary(actor.id, now),
    prisma.indirectHoursEntry.findMany({
      where: {
        userId: actor.id,
        workedOn: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
        },
      },
      orderBy: { workedOn: "desc" },
      take: 200,
    }),
  ]);

  const totalHours = sumIndirectHours(entries);
  const grouped = groupIndirectHoursByCategory(
    entries.map((e) => ({ category: e.category as IndirectHourCategory, hours: e.hours })),
  );

  return (
    <div className="space-y-6">
      {/* Terug-link */}
      <Link
        href="/financien?tab=ontzorgd"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Terug naar Ontzorgd
      </Link>

      {/* Kop */}
      <header className="space-y-1">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-primary">
          Administratie
        </p>
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-primary" aria-hidden />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Indirecte uren</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Uren besteed aan acquisitie, administratie, scholing en reistijd tellen mee voor het
          1.225-uur urencriterium (zelfstandigenaftrek). Registreer ze hier.
        </p>
      </header>

      {/* Voortgang richting het urencriterium (directe + indirecte uren samen). Toont op de
          registratiepagina zelf hoe dicht de aftrek in zicht is — geen omweg via /inzicht. */}
      {criterion && (
        <Card>
          <CardContent className="py-4">
            <div className="mb-3 space-y-0.5">
              <h2 className="text-sm font-semibold">Voortgang urencriterium</h2>
              <p className="text-xs text-muted-foreground">
                Directe (goedgekeurde) uren plus de indirecte uren hieronder tellen samen mee voor
                de zelfstandigenaftrek.
              </p>
            </div>
            <UrencriteriumProgress summary={criterion} />
          </CardContent>
        </Card>
      )}

      {/* Totaal en subtotalen per categorie */}
      {totalHours > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{totalHours}</span>
              <span className="text-sm text-muted-foreground">uur geregistreerd in {year}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {grouped.map((g) => (
                <span
                  key={g.category}
                  className="rounded-full border border-border bg-muted/40 px-3 py-0.5 text-xs tabular-nums"
                >
                  {g.label} — {g.hours} u
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoerformulier */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Uren registreren</h2>
        <Card>
          <CardContent className="py-5">
            <IndirectHoursForm />
          </CardContent>
        </Card>
      </section>

      {/* Lijst van regels */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Geregistreerde uren {year}</h2>
        {entries.length === 0 ? (
          <Card>
            <EmptyState
              icon={Clock}
              title="Nog geen indirecte uren"
              description="Voeg hierboven je eerste indirecte uren toe."
            />
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {entries.map((row) => {
                const deleteAction = deleteIndirectHours.bind(null, row.id);
                return (
                  <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">
                          {row.workedOn.toLocaleDateString("nl-NL", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {INDIRECT_HOUR_CATEGORY_LABEL[row.category as IndirectHourCategory]}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {row.hours} u
                        </span>
                      </div>
                      {row.note ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.note}</p>
                      ) : null}
                    </div>
                    <form action={deleteAction}>
                      <button
                        type="submit"
                        className="shrink-0 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        aria-label={`Verwijder regel van ${row.workedOn.toLocaleDateString("nl-NL")}`}
                      >
                        Verwijder
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
