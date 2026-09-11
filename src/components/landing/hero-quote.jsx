"use client";
import React, { useLayoutEffect, useRef } from "react";
import {
  bound,
  quoteFrame,
  quoteAnchors,
  HERO_QUOTE_DURATION,
  HERO_QUOTE_HOLD,
} from "./hero-quote-motion.mjs";

const QUOTE_WORDS = ["Een", "goede", "opdracht", "begint", "bij", "handslag"];

export default function HeroQuote() {
  const root = useRef(null);
  const lower = useRef(null);
  const upper = useRef(null);
  const words = useRef([]);

  useLayoutEffect(() => {
    const el = root.current;
    el.dataset.quoteState = "pending";
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame,
      observer,
      resize,
      geometry,
      progress = 0,
      started = false,
      disposed = false;
    let elapsed = 0,
      lastTime = null;

    const paint = () => {
      if (!geometry) return;
      const current = quoteFrame(progress, geometry.layouts, geometry.handWidth);
      for (const [name, ref] of [
        ["lower", lower],
        ["upper", upper],
      ]) {
        ref.current.style.left = "0";
        ref.current.style.top = "0";
        ref.current.style.transform = `translate3d(${current[name].x}px,${current[name].y}px,0)`;
      }
      words.current.forEach((word, i) => {
        const original = geometry.original[i];
        const pose = current.words[i];
        word.style.opacity = String(pose.opacity);
        word.style.transform = `translate3d(${pose.x - original.x}px,${pose.y - original.y}px,0)`;
      });
      const group = words.current[0].parentElement;
      const { left, right, top, bottom } = current.clip;
      const x = group.offsetLeft;
      const y = group.offsetTop;
      group.style.clipPath =
        progress >= 1
          ? "none"
          : `polygon(${left - x}px ${top - y}px,${right - x}px ${top - y}px,${right - x}px ${bottom - y}px,${left - x}px ${bottom - y}px)`;
    };

    const measure = () => {
      const group = words.current[0].parentElement;
      const original = words.current.map((word) => ({
        x: word.offsetLeft,
        y: word.offsetTop,
        width: word.offsetWidth,
        height: word.offsetHeight,
      }));
      const first = original[0];
      const last = original.at(-1);
      const right = Math.max(...original.map((word) => word.x + word.width));
      const centerX = (first.x + right) / 2;
      const centerY = (first.y + last.y + last.height) / 2;
      const handWidth = lower.current.getBoundingClientRect().width;
      const unit = handWidth / 21;
      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const gap = Math.max(3, fontSize * 0.06);
      const context = document.createElement("canvas").getContext("2d");
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const g = context.measureText(QUOTE_WORDS[0][0]);
      const dot = context.measureText(".");
      const probe = document.createElement("span");
      probe.className = "hs-hero-measure";
      probe.setAttribute("aria-hidden", "true");
      const baseline = document.createElement("i");
      baseline.style.cssText =
        "display:inline-block;width:0;height:0;padding:0;border:0;vertical-align:baseline";
      probe.append(document.createTextNode(QUOTE_WORDS[0][0] + "."), baseline);
      el.appendChild(probe);
      const type = {
        baseline: baseline.getBoundingClientRect().top - probe.getBoundingClientRect().top,
        firstCenterOffset: -(g.actualBoundingBoxAscent - g.actualBoundingBoxDescent) / 2,
        dotCenterOffset: -(dot.actualBoundingBoxAscent - dot.actualBoundingBoxDescent) / 2,
      };
      probe.remove();
      const layouts = [
        {
          upper: { x: centerX - 15.4 * unit, y: centerY - 13 * unit },
          lower: { x: centerX - 5.6 * unit, y: centerY - 5 * unit },
          words: [],
          bounds: { left: centerX, right: centerX, top: centerY, bottom: centerY },
        },
      ];
      // Measure the natural wrapping of each prefix without changing the visible layout.
      const ruler = document.createElement("span");
      ruler.className = "hs-hero-measure";
      ruler.setAttribute("aria-hidden", "true");
      ruler.style.width = `${group.clientWidth}px`;
      el.appendChild(ruler);
      for (let count = 1; count <= QUOTE_WORDS.length; count++) {
        ruler.replaceChildren();
        for (let i = 0; i < count; i++) {
          if (i) ruler.appendChild(document.createTextNode(" "));
          const word = document.createElement("span");
          word.className = "hs-hero-measure-word";
          word.textContent = words.current[i].textContent;
          ruler.appendChild(word);
        }
        const boxes = [...ruler.children].map((word) => ({
          x: word.offsetLeft,
          y: word.offsetTop,
          width: word.offsetWidth,
          height: word.offsetHeight,
        }));
        const width = Math.max(...boxes.map((word) => word.x + word.width));
        const height = Math.max(...boxes.map((word) => word.y + word.height));
        const positions =
          count === QUOTE_WORDS.length
            ? original
            : boxes.map((word) => ({
                ...word,
                x: centerX - width / 2 + word.x,
                y: centerY - height / 2 + word.y,
              }));
        const opening = positions[0];
        const closing = positions[count - 1];
        layouts.push({
          words: positions,
          ...quoteAnchors(opening, closing, handWidth, gap, type),
          bounds: {
            left: Math.min(...positions.map((word) => word.x)),
            right: Math.max(...positions.map((word) => word.x + word.width)),
            top: Math.min(...positions.map((word) => word.y)),
            bottom: Math.max(...positions.map((word) => word.y + word.height)),
          },
        });
      }
      ruler.remove();
      geometry = { layouts, original, handWidth };
      paint();
    };

    const tick = (now) => {
      frame = null;
      if (disposed || document.hidden) {
        lastTime = null;
        return;
      }
      if (lastTime !== null) elapsed += now - lastTime;
      lastTime = now;
      progress = bound((elapsed - HERO_QUOTE_HOLD) / HERO_QUOTE_DURATION);
      paint();
      if (progress < 1) frame = requestAnimationFrame(tick);
      else el.dataset.quoteState = "complete";
    };
    const finish = () => {
      started = true;
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      progress = 1;
      measure();
      el.dataset.quoteState = "complete";
    };
    const start = () => {
      if (started || disposed) return;
      started = true;
      observer?.disconnect();
      el.dataset.quoteState = "playing";
      frame = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame);
        frame = null;
        lastTime = null;
      } else if (started && progress < 1 && !frame) frame = requestAnimationFrame(tick);
    };
    const onMotion = () => {
      if (media.matches) finish();
    };
    if (media.matches) progress = 1;
    measure();
    resize = new ResizeObserver(measure);
    resize.observe(el);
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener("change", onMotion);
    const ready = async () => {
      await document.fonts?.ready;
      if (disposed) return;
      measure();
      if (media.matches) {
        finish();
        return;
      }
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) start();
          },
          { threshold: 0.35 },
        );
        observer.observe(el);
      } else start();
    };
    ready();
    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      resize?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      media.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <h1 ref={root} className="hv5-20 hs-hero-quote" aria-label={QUOTE_WORDS.join(" ") + "."}>
      <span className="hs-hero-words" aria-hidden="true">
        {QUOTE_WORDS.map((word, i) => (
          <React.Fragment key={word}>
            {i > 0 && " "}
            <span
              ref={(node) => {
                words.current[i] = node;
              }}
              className={`hs-hero-word${i >= QUOTE_WORDS.length - 2 ? " hs-hero-word-dark" : ""}`}
            >
              {word}
              {i === QUOTE_WORDS.length - 1 && <span className="hs-hero-period">.</span>}
            </span>
          </React.Fragment>
        ))}
      </span>
      <svg
        ref={lower}
        className="hs-hero-hand hs-hero-hand-lower"
        viewBox="18.4 19 21 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4" />
      </svg>
      <svg
        ref={upper}
        className="hs-hero-hand hs-hero-hand-upper"
        viewBox="8.6 11 21 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M10.6 13h7a10 10 0 0 1 10 10v4" />
      </svg>
    </h1>
  );
}
