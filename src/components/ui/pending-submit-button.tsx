"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Submit-knop voor server-action-forms met pending-status én watchdog (issue #329):
 * in productie kan de action-response blijven hangen terwijl de mutatie server-side
 * slaagde — de knop bleef dan eeuwig op "bezig" staan. Komt er binnen `watchdogMs`
 * geen antwoord, dan herladen we de pagina; de verse GET toont gegarandeerd de
 * werkelijke status. Gebruik binnen een <form action={serverAction}>.
 */
export function PendingSubmitButton({
  children,
  watchdogMs = 5000,
  variant,
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  watchdogMs?: number;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const { pending } = useFormStatus();
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => window.location.reload(), watchdogMs);
    return () => clearTimeout(t);
  }, [pending, watchdogMs]);
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending}>
      {children}
    </Button>
  );
}
