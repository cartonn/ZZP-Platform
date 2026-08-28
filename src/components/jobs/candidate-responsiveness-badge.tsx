import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type CandidateInviteResponsiveness } from "@/lib/candidate-invite-responsiveness";

/**
 * Positief reactiesnelheid-signaal op de kandidatenlijst van een opdracht: toont "Reageert snel op
 * uitnodigingen" wanneer een voorgestelde ZZP'er aantoonbaar snel én vaak op uitnodigingen reageert,
 * zodat de opdrachtgever die kandidaat als eerste kan uitnodigen. Geen badge = geen signaal (nooit
 * een negatief label). De onderbouwing zit in de tooltip.
 */
export function CandidateResponsivenessBadge({
  responsiveness,
  className,
}: {
  responsiveness: CandidateInviteResponsiveness | undefined;
  className?: string;
}) {
  if (!responsiveness?.fast || !responsiveness.label) return null;
  return (
    <Badge variant="success" className={className} title={responsiveness.detail ?? undefined}>
      <Zap className="mr-1 size-3" aria-hidden /> {responsiveness.label}
    </Badge>
  );
}
