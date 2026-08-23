"use client";

import { Button } from "@/components/ui/button";
import { type QuickReply } from "@/lib/quick-replies";

/**
 * Chip-rij met gecureerde standaardzinnen boven de berichten-composer. Een klik plaatst de zin
 * in het invoerveld (de ZZP'er/opdrachtgever/bemiddelaar kan hem nog aanpassen vóór verzenden).
 * Puur presentationeel: geen eigen mutatie, geen dode knop — de zin gaat door de normale
 * verstuur-actie. Rendert niets wanneer er geen suggesties zijn.
 */
export function QuickReplies({
  replies,
  onPick,
  disabled,
}: {
  replies: QuickReply[];
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  if (replies.length === 0) return null;
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Snelle antwoorden"
      data-testid="quick-replies"
    >
      {replies.map((reply) => (
        <Button
          key={reply.id}
          type="button"
          variant="secondary"
          size="xs"
          disabled={disabled}
          onClick={() => onPick(reply.text)}
          title={reply.text}
        >
          {reply.label}
        </Button>
      ))}
    </div>
  );
}
