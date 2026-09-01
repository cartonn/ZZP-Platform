"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  type BeginState,
  type ConfirmState,
  type DisableState,
} from "./actions";

export function TwoFactorPanel({
  status,
  otpauthUri,
  secret,
}: {
  status: "off" | "pending" | "on";
  otpauthUri?: string;
  secret?: string;
}) {
  if (status === "pending") {
    return <PendingPanel otpauthUri={otpauthUri} secret={secret} />;
  }
  if (status === "on") {
    return <OnPanel />;
  }
  return <OffPanel />;
}

function OffPanel() {
  const [state, formAction, isPending] = useActionState<BeginState | undefined, FormData>(
    beginTwoFactorSetup,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tweestapsverificatie aanzetten</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Met tweestapsverificatie vraagt het platform bij het inloggen naast je wachtwoord om een
          eenmalige code uit een authenticator-app. Zo blijft je account beschermd, ook als je
          wachtwoord uitlekt.
        </p>
        {state?.error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        <form action={formAction}>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Bezig…" : "Tweestapsverificatie aanzetten"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PendingPanel({ otpauthUri, secret }: { otpauthUri?: string; secret?: string }) {
  const [state, formAction, isPending] = useActionState<ConfirmState | undefined, FormData>(
    confirmTwoFactorSetup,
    undefined,
  );

  // Na een geslaagde bevestiging levert de actie de herstelcodes precies één keer aan.
  if (state?.recoveryCodes && state.recoveryCodes.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bewaar je herstelcodes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Bewaar deze herstelcodes veilig — je ziet ze maar één keer. Elke code werkt eenmalig
              als je je app kwijt bent.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/40 p-3 font-mono text-sm">
            {state.recoveryCodes.map((code) => (
              <li key={code} className="select-all tracking-wide">
                {code}
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary">
            <Link href="/account">Terug naar account</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Koppel je authenticator-app</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Voeg dit toe aan je authenticator-app (bijv. Google Authenticator of 1Password) door de
            onderstaande sleutel of koppel-URL in te voeren.
          </li>
          <li>Vul daarna de 6-cijferige code in die de app toont om de koppeling te bevestigen.</li>
        </ol>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Sleutel</p>
          {secret ? (
            <p className="select-all break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-lg tracking-widest">
              {secret}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Geen sleutel beschikbaar.</p>
          )}
        </div>

        {otpauthUri && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Koppel-URL (otpauth)</p>
            <p className="select-all break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
              {otpauthUri}
            </p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <Field
            label="6-cijferige code"
            htmlFor="token"
            error={state?.error}
            hint="De actuele code uit je authenticator-app."
            required
          >
            <Input
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
          </Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Bevestigen…" : "Koppeling bevestigen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function OnPanel() {
  const [state, formAction, isPending] = useActionState<DisableState | undefined, FormData>(
    disableTwoFactor,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tweestapsverificatie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>Tweestapsverificatie staat aan.</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Wil je tweestapsverificatie uitzetten? Bevestig met je wachtwoord én een verificatiecode.
          Je bestaande herstelcodes vervallen dan.
        </p>
        <form action={formAction} className="space-y-4">
          {/* Eén foutmelding op formulierniveau: de action geeft één `error` terug voor zowel een
              fout wachtwoord als een foute/ontbrekende factor, dus koppel 'm niet aan één veld
              (anders staat "Wachtwoord klopt niet." onder het codeveld). */}
          {state?.error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          <Field label="Wachtwoord" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <Field
            label="Verificatiecode"
            htmlFor="token"
            hint="De actuele code uit je authenticator-app, of een ongebruikte herstelcode."
            required
          >
            <Input
              id="token"
              name="token"
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
          </Field>
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? "Bezig…" : "Tweestapsverificatie uitzetten"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
