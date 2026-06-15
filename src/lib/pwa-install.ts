// Beslislogica voor de install-nudge (PWA "toevoegen aan beginscherm"). Puur en getest; de
// client-component levert alleen de browsersignalen aan (beforeinstallprompt, display-mode, UA).
// Rustig conform DESIGN.md: de nudge verschijnt hooguit één keer en is altijd wegklikbaar.

export type InstallPlatform = "prompt" | "ios" | "none";

export const INSTALL_DISMISSED_KEY = "pwa-install-dismissed";

// iOS (iPhone/iPad/iPod) ondersteunt geen `beforeinstallprompt`; daar tonen we een korte
// "Deel → Zet op beginscherm"-instructie. iPadOS doet zich sinds iPadOS 13 voor als een Mac, dus
// herken die via een Macintosh-UA mét touch. Alleen relevant als signaal voor de iOS-instructie —
// installeren kan op iOS hoe dan ook alleen vanuit Safari (de enige browser met dat deelmenu-item).
export function isIosSafari(ua: string, hasTouch: boolean): boolean {
  const s = ua.toLowerCase();
  const iDevice = /iphone|ipad|ipod/.test(s);
  const iPadOsAsMac = /macintosh/.test(s) && hasTouch;
  if (!iDevice && !iPadOsAsMac) return false;
  // Sluit de in-app-/Chrome-webviews uit waar het deelmenu de A2HS-optie niet biedt.
  const isWebkitBrowser = !/(crios|fxios|edgios)/.test(s);
  return isWebkitBrowser;
}

// Welke install-route geldt: een gevangen `beforeinstallprompt` → "prompt" (Android/desktop Chromium);
// iOS Safari → "ios" (handmatige instructie); anders geen route.
export function installPlatform(input: { canPrompt: boolean; isIos: boolean }): InstallPlatform {
  if (input.canPrompt) return "prompt";
  if (input.isIos) return "ios";
  return "none";
}

// Toon de nudge alleen als er een route is, de app niet al als geïnstalleerde PWA (standalone) draait,
// en de gebruiker 'm niet eerder heeft weggeklikt.
export function shouldOfferInstall(input: {
  platform: InstallPlatform;
  standalone: boolean;
  dismissed: boolean;
}): boolean {
  return input.platform !== "none" && !input.standalone && !input.dismissed;
}
