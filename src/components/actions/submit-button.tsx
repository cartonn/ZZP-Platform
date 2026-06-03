"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Verzendknop die zichzelf uitschakelt zolang de bijbehorende server-actie loopt (useFormStatus).
 * Voorkomt dubbel indienen en geeft directe feedback — verder een gewone Button. Moet als kind van
 * een <form> staan (form action = server-actie); de rest van de inbox blijft server-gerenderd.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
