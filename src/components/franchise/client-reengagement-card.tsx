import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientHealthLabel } from "@/lib/franchise/client-health";
import { type ClientReengagement } from "@/lib/franchise/client-reengagement";

/**
 * Relatiegezondheid + re-engagement-hint op de klant-detailpagina van de bemiddelaar. Presentationeel:
 * status, toon en tekst komen uit `clientReengagement` (server-side). Bij een stilgevallen klant
 * (`attention`) biedt de kaart een levende volgende stap — een nieuwe dienst uitzetten — via de
 * bestaande onboarding-flow (geen dode knop).
 */
export function ClientReengagementCard({
  reengagement,
  companyId,
}: {
  reengagement: ClientReengagement;
  companyId: string;
}) {
  const badge = clientHealthLabel(reengagement.status);
  const showCta = reengagement.status === "attention";

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Relatiegezondheid</h2>
            <Badge variant={badge.tone}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{reengagement.headline}</p>
          {reengagement.suggestion && (
            <p className="text-sm text-muted-foreground">{reengagement.suggestion}</p>
          )}
        </div>
        {showCta && (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/franchise/opdrachtgevers/nieuw?stap=diensten&company=${companyId}`}>
              Nieuwe dienst voorstellen
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
