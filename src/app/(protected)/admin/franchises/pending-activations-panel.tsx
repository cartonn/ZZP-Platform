import { Inbox } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { listPendingActivations } from "@/lib/franchise/pending-activations";
import { ActivationForm } from "./activation-form";

/**
 * "Wacht op activatie": bureaus die zich zelf hebben aangemeld (tenant PENDING) en op een
 * beslissing wachten. Laadt zijn eigen data met een eigen rolcheck (defense-in-depth, zoals elk
 * ander admin-paneel): de lijst bevat contactgegevens van aanmelders.
 */
export async function PendingActivationsPanel() {
  await requireRole("ADMIN");
  const pending = await listPendingActivations();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Wacht op activatie</h2>
        {pending.length > 0 && (
          <Badge variant="warning">{plural(pending.length, "aanmelding", "aanmeldingen")}</Badge>
        )}
      </div>

      {pending.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="Geen wachtende aanmeldingen"
            description="Bureaus die zich via het registratieformulier aanmelden, verschijnen hier."
          />
        </Card>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {pending.map((t) => (
            <li key={t.id} className="space-y-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">{t.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {t.contactName ?? "Onbekend"} · {t.contactEmail}
                  {t.contactPhone ? ` · ${t.contactPhone}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  KvK {t.kvkNumber ?? "onbekend"}
                  {t.region ? ` · ${t.region}` : ""} · aangemeld op {formatDateShortNl(t.createdAt)}
                </p>
              </div>
              <ActivationForm tenantId={t.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
