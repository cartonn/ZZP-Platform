"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SUPPORT_STATUS_LABEL, statusVariant } from "@/lib/support/labels";
import { type SupportTicketStatus, type SupportAuthorKind } from "@/lib/enums";

export interface TicketMessageRow {
  authorKind: SupportAuthorKind;
  body: string;
}

export interface TicketRow {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  userName: string;
  categoryLabel: string;
  updatedLabel: string;
  ageLabel: string;
  messages: TicketMessageRow[];
}

/**
 * Compacte triage-lijst: één regel per ticket (status, onderwerp, van, bijgewerkt, leeftijd).
 * De conversatie + acties klappen pas uit bij selectie — zo overzie je de hele wachtrij in één blik.
 * De acties (antwoorden/oplossen) zijn ongewijzigd overgenomen; alleen de server-actions muteren
 * (auth → rol → audit blijft server-side).
 */
export function TicketList({
  tickets,
  authorLabels,
  adminReply,
  adminResolve,
}: {
  tickets: TicketRow[];
  authorLabels: Record<SupportAuthorKind, string>;
  adminReply: (id: string, formData: FormData) => Promise<void>;
  adminResolve: (id: string) => Promise<void>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {tickets.map((t) => {
          const open = openId === t.id;
          return (
            <div key={t.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : t.id)}
                aria-expanded={open}
                className={cn(
                  "focus-ring flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                  open && "bg-muted/40",
                )}
              >
                {open ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <Badge variant={statusVariant(t.status)}>{SUPPORT_STATUS_LABEL[t.status]}</Badge>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.subject}</span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {t.userName}
                </span>
                <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
                  {t.categoryLabel}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{t.ageLabel}</span>
              </button>

              {open && (
                <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-4">
                  <p className="text-xs text-muted-foreground">
                    {t.userName} · {t.categoryLabel} · bijgewerkt {t.updatedLabel}
                  </p>
                  {t.messages.length > 0 && (
                    <div className="space-y-2">
                      {t.messages.map((m, i) => (
                        <div key={i} className="rounded-md bg-background px-3 py-2 text-sm">
                          <span className="text-xs font-medium text-muted-foreground">
                            {authorLabels[m.authorKind]}:{" "}
                          </span>
                          <span className="whitespace-pre-wrap">{m.body}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <form action={adminReply.bind(null, t.id)} className="space-y-2">
                    <textarea
                      name="body"
                      rows={2}
                      required
                      className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                      placeholder="Antwoord van de helpdesk…"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" size="sm">
                        Antwoord versturen
                      </Button>
                    </div>
                  </form>
                  <form action={adminResolve.bind(null, t.id)}>
                    <Button type="submit" variant="secondary" size="sm">
                      Markeer als opgelost
                    </Button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
