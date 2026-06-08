"use client";

import { useEffect } from "react";

/**
 * Registreert de service worker (alleen in productie, na 'load' zodat het de eerste paint niet
 * vertraagt). Faalt stil — een ontbrekende SW mag de app nooit breken. In dev bewust uit, om HMR
 * niet te hinderen.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
