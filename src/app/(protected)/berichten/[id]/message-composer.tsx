"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuickReplies } from "@/components/messaging/quick-replies";
import { type QuickReply } from "@/lib/quick-replies";
import { sendMessage, type MessageState } from "../actions";
import { FormStatus } from "@/components/ui/form-status";

export function MessageComposer({
  conversationId,
  quickReplies = [],
}: {
  conversationId: string;
  quickReplies?: QuickReply[];
}) {
  const action = sendMessage.bind(null, conversationId);
  const [state, formAction, isPending] = useActionState<MessageState, FormData>(action, undefined);
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.ok) setBody("");
  }, [state]);

  // Plaats een gekozen snelle antwoord in het veld: leeg → zet; anders netjes aanvullen.
  // Daarna focus + cursor naar het einde zodat de gebruiker direct verder kan typen.
  function insertQuickReply(text: string) {
    setBody((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text));
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <QuickReplies replies={quickReplies} onPick={insertQuickReply} disabled={isPending} />
      <form action={formAction} className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          name="body"
          rows={2}
          required
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Schrijf een bericht…"
          aria-label="Bericht"
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
        {/* Het bericht verschijnt zelf in de thread; alleen voor screenreaders aankondigen. */}
        <FormStatus success={state?.ok && "Bericht verzonden."} srOnly />
      </form>
    </div>
  );
}
