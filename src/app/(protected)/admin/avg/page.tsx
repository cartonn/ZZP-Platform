import { type Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/authz";
import {
  LEGAL_BASES,
  LEGAL_BASIS_LABEL,
  PROCESSING_REGISTER,
  PROCESSING_REGISTER_DISCLAIMER,
  RETENTION_SCHEDULE,
  filterByLegalBasis,
  summarizeRegister,
  type LegalBasis,
} from "@/lib/compliance/processing-register";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Verwerkingsregister · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminAvgPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const grond = first(sp.grond);

  const isValidBasis = (v: string): v is LegalBasis =>
    (LEGAL_BASES as readonly string[]).includes(v);

  const activeBasis: LegalBasis | null = grond && isValidBasis(grond) ? grond : null;

  const summary = summarizeRegister();
  const filtered = filterByLegalBasis(PROCESSING_REGISTER, activeBasis);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Verwerkingsregister</h1>
        <p className="text-sm text-muted-foreground">
          Overzicht van verwerkingsactiviteiten conform art. 30 AVG, inclusief bewaartermijnen. Dit
          register is een signalerend en administratief hulpmiddel — geen juridisch advies.
        </p>
      </header>

      {PROCESSING_REGISTER.length === 0 ? (
        <>
          <Card>
            <EmptyState
              icon={ShieldCheck}
              title="Geen verwerkingsactiviteiten"
              description="Er zijn momenteel geen verwerkingsactiviteiten geregistreerd."
            />
          </Card>
          <p className="text-xs text-muted-foreground">{PROCESSING_REGISTER_DISCLAIMER}</p>
        </>
      ) : (
        <>
          {/* Filter-pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/avg"
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                !activeBasis
                  ? "border-border bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              Alle ({summary.total})
            </Link>
            {LEGAL_BASES.map((basis) => (
              <Link
                key={basis}
                href={activeBasis === basis ? "/admin/avg" : `/admin/avg?grond=${basis}`}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeBasis === basis
                    ? "border-border bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {LEGAL_BASIS_LABEL[basis]} ({summary.byLegalBasis[basis]})
              </Link>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground">{PROCESSING_REGISTER_DISCLAIMER}</p>

          {/* Export-link */}
          <div>
            <a
              href="/admin/avg/export"
              className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              Exporteer (CSV)
            </a>
          </div>

          {/* Registerlijst */}
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen verwerkingen op deze grondslag.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((activity) => (
                <Card key={activity.key}>
                  <CardContent className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{activity.name}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="muted">{LEGAL_BASIS_LABEL[activity.legalBasis]}</Badge>
                        {activity.sensitive && <Badge variant="danger">Gevoelig (art. 9/10)</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.purpose}</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Betrokkenen:</span>{" "}
                        {activity.dataSubjects.join(", ")}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Gegevens:</span>{" "}
                        {activity.dataCategories.join(", ")}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Ontvangers:</span>{" "}
                        {activity.recipients.join(", ")}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Bewaartermijn:</span>{" "}
                        {activity.retention}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Beveiliging:</span>{" "}
                        {activity.securityMeasures.join(", ")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Bewaartermijnen */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Bewaartermijnen</h2>
            <div className="space-y-2">
              {RETENTION_SCHEDULE.map((rule) => (
                <Card key={rule.key}>
                  <CardContent className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium">{rule.category}</p>
                      <span className="text-xs font-medium text-muted-foreground">
                        {rule.period}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rule.rationale}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
