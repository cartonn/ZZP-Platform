"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage, type MessageState } from "../actions";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const action = sendMessage.bind(null, conversationId);
  const [state, formAction, isPending] = useActionState<MessageState, FormData>(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex items-end gap-2 border-t border-border pt-3"
    >
      <Textarea
        name="body"
        rows={2}
        required
        maxLength={5000}
        placeholder="Schrijf een bericht…"
        className="flex-1"
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "…" : "Versturen"}
      </Button>
      {state?.error && (
        <span role="alert" className="text-sm text-danger">
          {state.error}
        </span>
      )}
    </form>
  );
}
