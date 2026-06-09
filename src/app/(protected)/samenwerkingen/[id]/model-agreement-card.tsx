import { CheckCircle2, Circle, FileSignature, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MODEL_AGREEMENT_TYPES,
  MODEL_AGREEMENT_LABELS,
  type ModelAgreementType,
  type ModelAgreementRecommendation,
} from "@/lib/model-agreement";
import { formatDateShortNl } from "@/lib/format-date";
import { setAgreementTypeAction, signModelAgreementAction } from "./actions";

interface SignRow {
  role: string;
  name: string;
  signedAt: Date | null;
}

interface Props {
  collaborationId: string;
  agreementType: ModelAgreementType;
  recommendation: ModelAgreementRecommendation;
  rows: SignRow[];
  /** Mag de inloggende partij nu zelf akkoord geven? (en is dat nog niet gebeurd) */
  canSign: boolean;
  /** Mag de inloggende gebruiker de overeenkomstvorm kiezen? (opdrachtgever/admin, nog niet getekend) */
  canChooseType: boolean;
}

export function ModelAgreementCard({
  collaborationId,
  agreementType,
  recommendation,
  rows,
  canSign,
  canChooseType,
}: Props) {
  const bothSigned = rows.every((r) => r.signedAt);

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <FileSignature className="size-4 text-muted-foreground" />
            Modelovereenkomst
          </span>
          <Badge variant={bothSigned ? "success" : "muted"}>
            {bothSigned ? "Ondertekend" : MODEL_AGREEMENT_LABELS[agreementType]}
          </Badge>
        </div>

        {recommendation.recommended && recommendation.reasons.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Aanbevolen vorm op basis van de opdracht: {recommendation.reasons[0]}
          </p>
        )}

        {canChooseType && (
          <form
            action={setAgreementTypeAction.bind(null, collaborationId)}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Overeenkomstvorm
              <select
                name="agreementType"
                defaultValue={agreementType}
                className="focus-ring rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
              >
                {MODEL_AGREEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MODEL_AGREEMENT_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="secondary" size="sm">
              Vorm vastleggen
            </Button>
          </form>
        )}

        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.role} className="flex items-center gap-2 text-sm">
              {r.signedAt ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="font-medium">{r.role}</span>
              <span className="text-muted-foreground">
                {r.signedAt
                  ? `akkoord op ${formatDateShortNl(r.signedAt)}`
                  : "nog niet ondertekend"}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button asChild variant="ghost" size="sm">
            <a
              href={`/api/samenwerkingen/${collaborationId}/modelovereenkomst`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="size-4" />
              Overeenkomst (pdf)
            </a>
          </Button>
          {canSign && (
            <form action={signModelAgreementAction.bind(null, collaborationId)}>
              <Button type="submit" size="sm">
                Akkoord geven
              </Button>
            </form>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{recommendation.note}</p>
      </CardContent>
    </Card>
  );
}
