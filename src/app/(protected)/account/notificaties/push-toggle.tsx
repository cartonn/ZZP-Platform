"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// VAPID-sleutel (base64url) → bytes voor pushManager.subscribe (applicationServerKey verwacht een
// BufferSource met een echte ArrayBuffer, vandaar de expliciete buffer-constructie).
function urlBase64ToBytes(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "loading" | "unsupported" | "denied" | "off" | "on" | "busy";

/**
 * Toestel-niveau aan/uit voor web-push (PWA). Verschijnt alleen als de browser het ondersteunt én de
 * server VAPID heeft geconfigureerd; anders rendert het niets. Abonneert via de Push API en
 * registreert het abonnement server-side (/api/push/subscribe). Geen serverstaat in dit component —
 * de bron van waarheid is het abonnement in de browser + de DB.
 */
export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      // Geen actieve service worker (bv. in dev, waar de SW bewust uit staat) → niet tonen.
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      const cfg = await fetch("/api/push/config")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (!cfg?.configured || !cfg.publicKey) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) {
        setPublicKey(cfg.publicKey);
        setStatus(sub ? "on" : "off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    if (!publicKey) return;
    setStatus("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBytes(publicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus(res.ok ? "on" : "off");
    } catch {
      setStatus("off");
    }
  };

  const disable = async () => {
    setStatus("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => null);
        await sub.unsubscribe().catch(() => null);
      }
      setStatus("off");
    } catch {
      setStatus("on");
    }
  };

  if (status === "loading" || status === "unsupported") return null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
          >
            <BellRing className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Pushmeldingen op dit toestel</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {status === "denied"
                ? "Meldingen zijn geblokkeerd in je browserinstellingen. Sta ze daar toe om dit aan te zetten."
                : "Ontvang een melding op dit toestel bij belangrijke gebeurtenissen, ook als de app dicht is."}
            </p>
          </div>
        </div>
        {status !== "denied" && (
          <Button
            size="sm"
            variant={status === "on" ? "secondary" : "primary"}
            disabled={status === "busy"}
            onClick={status === "on" ? disable : enable}
          >
            {status === "busy" ? "Bezig…" : status === "on" ? "Uitzetten" : "Aanzetten"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
