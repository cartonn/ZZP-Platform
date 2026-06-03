"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { sendMessage, type MessageState } from "@/app/(protected)/berichten/actions";
import { cn } from "@/lib/utils";

// Kleine inline-antwoordcomposer voor de drawer: toont de laatste berichten als context en stuurt
// het antwoord via de bestaande sendMessage-actie. Na een geslaagd bericht vuurt onResolved
// (drawer sluiten + doorvloeien). De berichten-thread is alleen-lezen context.
export function ReplyComposer({
  conversationId,
  messages,
  onResolved,
}: {
  conversationId: string;
  messages: { id: string; mine: boolean; body: string }[];
  onResolved?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<MessageState, FormData>(
    sendMessage.bind(null, conversationId),
    undefined,
  );
  useEffect(() => {
    if (state?.ok) onResolved?.();
  }, [state, onResolved]);

  return (
    <div className="space-y-4">
      {messages.length > 0 ? (
        <ul className="space-y-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.mine ? "ml-auto bg-primary/10" : "mr-auto bg-muted",
              )}
            >
              {m.body}
            </li>
          ))}
        </ul>
      ) : null}

      <form action={formAction} className="space-y-2">
        <textarea
          name="body"
          required
          maxLength={5000}
          rows={4}
          placeholder="Schrijf een antwoord…"
          aria-label="Antwoord"
          className="focus-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        {state?.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Versturen…" : "Versturen"}
        </Button>
      </form>
    </div>
  );
}
