"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  INSTALL_DISMISSED_KEY,
  installPlatform,
  isIosSafari,
  shouldOfferInstall,
  type InstallPlatform,
} from "@/lib/pwa-install";

// Het `beforeinstallprompt`-event zit niet in de standaard TS-lib; minimale typering.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Rustige, wegklikbare install-nudge ("toevoegen aan beginscherm"). Verschijnt alleen wanneer de app
 * écht installeerbaar is en niet al als PWA (standalone) draait, en hooguit tot de gebruiker 'm
 * wegklikt (onthouden in localStorage). Op Android/desktop-Chromium gebruikt het het gevangen
 * `beforeinstallprompt`-event; op iOS Safari (dat dat event niet kent) toont het de deel→beginscherm-
 * instructie. Beslislogica staat puur en getest in `@/lib/pwa-install`.
 */
export function InstallPrompt() {
  const [platform, setPlatform] = useState<InstallPlatform>("none");
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
    } catch {
      // localStorage kan geblokkeerd zijn (privémodus) — dan tonen we de nudge gewoon.
    }
    if (dismissed) return;

    const isIos = isIosSafari(navigator.userAgent, (navigator.maxTouchPoints ?? 0) > 0);

    const recompute = (canPrompt: boolean) => {
      const next = installPlatform({ canPrompt, isIos });
      if (shouldOfferInstall({ platform: next, standalone: false, dismissed: false })) {
        setPlatform(next);
      }
    };

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // onderdruk de standaard mini-infobalk; we bieden 'm zelf aan
      deferred.current = e as BeforeInstallPromptEvent;
      recompute(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setPlatform("none");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    recompute(false); // iOS toont direct; andere browsers wachten op het event

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const persistDismiss = () => {
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    } catch {
      // negeren — niet kunnen onthouden mag de UI niet breken
    }
  };

  const dismiss = () => {
    persistDismiss();
    setPlatform("none");
  };

  const install = async () => {
    const prompt = deferred.current;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice.catch(() => null);
    deferred.current = null;
    dismiss(); // ongeacht de keuze: niet blijven herhalen
  };

  if (platform === "none") return null;

  return (
    <div
      role="dialog"
      aria-label="App installeren"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(28rem,calc(100%-1.5rem))]"
    >
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg">
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
        >
          <Download className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-card-foreground">Installeer Handslag</p>
          {platform === "prompt" ? (
            <>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Voeg de app toe aan je beginscherm voor sneller toegang en een schermvullende
                weergave.
              </p>
              <div className="mt-3">
                <Button size="sm" onClick={install}>
                  Installeren
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-0.5 inline-flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              Tik in Safari op{" "}
              <span className="inline-flex items-center gap-1 font-medium text-card-foreground">
                Delen <Share className="size-3.5" aria-hidden />
              </span>{" "}
              en kies <span className="font-medium text-card-foreground">‘Zet op beginscherm’</span>
              .
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Sluiten"
          className="focus-ring -m-1 shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
