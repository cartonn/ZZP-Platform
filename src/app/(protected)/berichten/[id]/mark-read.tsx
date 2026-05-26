"use client";

import { useEffect } from "react";
import { markConversationRead } from "../actions";

/** Markeert het gesprek als gelezen zodra de thread geopend is (werkt de bel-teller bij). */
export function MarkRead({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);
  return null;
}
