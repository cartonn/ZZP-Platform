"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Cosmetic touch feedback only; native scrolling, zoom and activation stay in charge. */
export function WorkspaceFeedback() {
  const pathname = usePathname();
  useEffect(() => {
    let pressed: HTMLElement | null = null;
    let pointerId = -1;
    let startX = 0;
    let startY = 0;
    const clear = () => {
      pressed?.removeAttribute("data-hs-pressed");
      pressed = null;
      pointerId = -1;
    };
    const down = (event: PointerEvent) => {
      clear();
      if (!event.isPrimary || event.pointerType === "mouse" || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest<HTMLElement>(
        'a[href], button, summary, [role="tab"], [role="menuitem"]',
      );
      if (
        !control?.closest(".hs-app, .hs-overlay") ||
        control.closest(
          '[inert], [aria-disabled="true"], [data-disabled], [data-hs-feedback="none"]',
        ) ||
        control.matches(":disabled")
      )
        return;
      pressed = control;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      control.setAttribute("data-hs-pressed", "");
    };
    const move = (event: PointerEvent) => {
      if (
        event.pointerId === pointerId &&
        Math.hypot(event.clientX - startX, event.clientY - startY) > 8
      )
        clear();
    };
    const options = { capture: true, passive: true };
    document.addEventListener("pointerdown", down, options);
    document.addEventListener("pointermove", move, options);
    document.addEventListener("pointerup", clear, options);
    document.addEventListener("pointercancel", clear, options);
    document.addEventListener("scroll", clear, options);
    document.addEventListener("visibilitychange", clear);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", clear, true);
      document.removeEventListener("pointercancel", clear, true);
      document.removeEventListener("scroll", clear, true);
      document.removeEventListener("visibilitychange", clear);
      window.removeEventListener("blur", clear);
    };
  }, [pathname]);
  return null;
}
