"use client";
import React from "react";
import { clamp, deckPosition, cardPose, storyMode } from "./handslag-motion.mjs";
import Image from "next/image";
import HeroQuote from "./hero-quote";

// Fixed cap-height size; stroke matches the 0 stem in Open Sans 700 (307.5/2048 em).
// Tight bounds keep the visible bottom on the text baseline.
function LogoHand({ fixedStroke = false }) {
  return (
    <svg
      className="hs-section-hand"
      data-logo-hand="lower"
      viewBox="18.535 19.135 20.73 17.73"
      width="19.4"
      height="16.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.73"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4"
        strokeWidth={fixedStroke ? 2 : undefined}
        vectorEffect={fixedStroke ? "non-scaling-stroke" : undefined}
      />
    </svg>
  );
}

function cssStyle(value) {
  return Object.fromEntries(
    value
      .split(";")
      .filter(Boolean)
      .map((declaration) => {
        const colon = declaration.indexOf(":");
        const name = declaration
          .slice(0, colon)
          .trim()
          .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return [name, declaration.slice(colon + 1).trim()];
      }),
  );
}

export default class HandslagV5 extends React.Component {
  state = { audience: "professional", open: null };
  _navs = [];
  _sticks = [];
  _stickState = [];
  _roleStep = null;

  // tabs are physical keys: a solid bottom edge that collapses when pressed
  tab(active) {
    const base =
      "padding:11px clamp(16px,1.8vw,24px);border-radius:999px;font-size:clamp(14px,1.3vw,15px);font-weight:700;line-height:1.2;transition:background 180ms cubic-bezier(0.22,0.61,0.36,1), color 180ms, box-shadow 180ms cubic-bezier(0.22,0.61,0.36,1), transform 180ms cubic-bezier(0.22,0.61,0.36,1);";
    return active
      ? base +
          "background:#0076A8;border:1.5px solid #0076A8;color:#fff;box-shadow:0 3px 0 #004F73, 0 8px 18px rgba(0,58,84,0.22);"
      : base +
          "background:#fff;border:1.5px solid #C7CED6;color:#004F73;box-shadow:0 3px 0 #E1E4E8, 0 6px 14px rgba(0,58,84,0.07);";
  }

  pick(key) {
    return (event) => {
      event?.preventDefault();
      this.setState({ audience: key }, () => {
        this.measure();
        this._roleStory?.scrollIntoView({
          behavior: this._reduce ? "instant" : "smooth",
          block: "start",
        });
        this.schedule();
      });
    };
  }

  toggle(i) {
    return () => this.setState((s) => ({ open: s.open === i ? null : i }));
  }

  schedule = () => {
    if (this._raf || document.hidden) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = null;
      if (this._layoutDirty) this.measure();
      this.sample();
    });
  };

  measure() {
    this._layoutDirty = false;
    this._viewport = window.innerHeight;
    this._headerHeight = this._header?.offsetHeight || 78;
    this._pinTop = this._headerHeight + 20;
    this._root?.style.setProperty("--handslag-header", `${this._headerHeight}px`);
    const story = this._roleStory;
    if (!story || !this._roleInner) return;
    this._panels = [...story.querySelectorAll("[data-panel]")];
    this._steps = [...story.querySelectorAll("[data-step]")];
    this._roleLine = story.querySelector("[data-roleline]");
    this._sections = ["voor-jou", "zo-werkt-het", "vragen"].map((id) =>
      document.getElementById(id),
    );
    this._band = this._sections[1];
    this._stage = this._panels[0]?.parentElement;
    this._stage?.setAttribute("data-deck", "");
    if (this._stage) this._stage.style.height = "";
    this._panels.forEach((panel, i) => {
      panel.style.cssText = `--panel-index:${i}`;
      panel.removeAttribute("aria-hidden");
    });
    // Measure a compact desktop stage, natural document heights on smaller screens.
    story.dataset.storyMode = window.innerWidth >= 900 && !this._reduce ? "pinned" : "flow";
    story.style.height = "";
    // Enlarged text must grow the stage instead of clipping a document.
    if (story.dataset.storyMode === "pinned" && this._stage) {
      const required = Math.max(0, ...this._panels.map((panel) => panel.scrollHeight));
      if (required > this._stage.clientHeight) this._stage.style.height = `${required + 24}px`;
    }
    const content = this._roleInner.offsetHeight;
    const tallestCard = Math.max(0, ...this._panels.map((panel) => panel.offsetHeight));
    this._mode = storyMode({
      width: window.innerWidth,
      viewport: this._viewport,
      header: this._headerHeight,
      content,
      tallestCard,
      reduced: this._reduce,
    });
    story.dataset.storyMode = this._mode;
    if (this._mode !== "pinned" && this._stage) this._stage.style.height = "";
    if (this._mode === "pinned") {
      story.style.height = `${content + Math.max(480, this._viewport * 0.7) * 2}px`;
    }
    this._roleStep = null;
    this._lastPosition = null;
    this._sticks.forEach((el) => {
      if (!el?.parentElement) return;
      const cols = getComputedStyle(el.parentElement).gridTemplateColumns.split(" ").length;
      const fits = el.offsetHeight < this._viewport - this._pinTop - 24;
      el.style.position = cols > 1 && fits ? "sticky" : "static";
      el.style.top = `${this._pinTop}px`;
    });
  }

  applyStack(position) {
    if (this._lastPosition === position) return;
    this._lastPosition = position;
    this._panels.forEach((panel, index) => {
      const pose = cardPose(position, index);
      panel.style.transform = `translate3d(0,${pose.y.toFixed(2)}px,0) scale(${pose.scale.toFixed(4)}) rotate(${pose.rotate.toFixed(2)}deg)`;
      panel.style.opacity = String(pose.opacity);
      panel.style.zIndex = String(pose.zIndex);
      panel.style.pointerEvents = pose.opacity < 0.05 ? "none" : "auto";
      panel.setAttribute("aria-hidden", String(pose.opacity < 0.05));
    });
  }

  sample() {
    const top = Math.max(0, window.scrollY);
    const vh = this._viewport || window.innerHeight;
    const progress = clamp(top / Math.max(1, document.documentElement.scrollHeight - vh));
    if (this._bar) this._bar.style.transform = `scaleX(${progress})`;
    // A stable header height avoids moving the page while iOS browser chrome collapses.
    const elevated = top > 12;
    if (elevated !== this._condensed) {
      this._condensed = elevated;
      if (this._header) this._header.dataset.elevated = String(elevated);
    }
    const rects = (this._sections || []).map((section) => section?.getBoundingClientRect());
    let nav = -1;
    rects.forEach((rect, i) => {
      if (rect && rect.top <= this._pinTop + 40) nav = i;
    });
    if (nav !== this._nav) {
      this._nav = nav;
      this._navs.forEach((link, i) => {
        if (!link) return;
        link.style.color = nav === i ? "#0076A8" : "#004F73";
        link.style.borderColor = nav === i ? "#D97757" : "transparent";
        if (nav === i) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    const storyRect = rects[0];
    if (storyRect && this._panels?.length) {
      let step = 0;
      let lineProgress = 1;
      if (this._mode === "pinned") {
        const span = Math.max(1, storyRect.height - this._roleInner.offsetHeight);
        const q = clamp((this._pinTop - storyRect.top) / span);
        const position = deckPosition(q);
        step = Math.round(position);
        lineProgress = (1 + position) / 3;
        this.applyStack(position);
      } else {
        this._panels.forEach((panel, i) => {
          if (panel.getBoundingClientRect().top < this._pinTop + vh * 0.3) step = i;
        });
        lineProgress = (step + 1) / 3;
      }
      if (this._roleLine) this._roleLine.style.transform = `scaleY(${lineProgress})`;
      if (step !== this._roleStep) {
        this._roleStep = step;
        this._steps.forEach((li, i) => {
          li.dataset.current = String(i === step);
          li.dataset.complete = String(i < step);
        });
      }
    }
    const bandRect = rects[1];
    if (this._stepLine && bandRect) {
      const q = clamp((vh * 0.85 - bandRect.top) / (bandRect.height + vh * 0.35));
      this._stepLine.style.transform = `scaleX(${q})`;
    }
    if (this._photo && !this._reduce) {
      const rect = this._photo.parentElement.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < vh) {
        const shift = (clamp((vh - rect.top) / (vh + rect.height)) - 0.5) * 20;
        this._photo.style.transform = `scale(1.06) translate3d(0,${shift.toFixed(2)}px,0)`;
      }
    }
    if (this._topBtn) {
      const show = top > vh * 1.1;
      if (show !== this._topShown) {
        this._topShown = show;
        this._topBtn.style.opacity = show ? "1" : "0";
        this._topBtn.style.transform = show ? "none" : "translateY(10px)";
        this._topBtn.style.pointerEvents = show ? "auto" : "none";
        this._topBtn.tabIndex = show ? 0 : -1;
        this._topBtn.setAttribute("aria-hidden", String(!show));
      }
    }
  }

  componentDidUpdate(_previousProps, previousState) {
    if (previousState.audience !== this.state.audience) this._layoutDirty = true;
    this.schedule();
  }

  componentDidMount() {
    this._motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this._reduce = this._motionQuery.matches;
    this._layoutDirty = true;
    this._onMotion = () => {
      this._reduce = this._motionQuery.matches;
      this._layoutDirty = true;
      if (this._reduce) {
        this._io?.disconnect();
        this._reveals?.forEach((el) => {
          el.dataset.revealed = "true";
        });
        if (this._photo) this._photo.style.transform = "none";
      }
      this.schedule();
    };
    this._onResize = () => {
      // iOS URL-bar resizing should not repeatedly rebuild the document stack.
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width !== this._measuredWidth || Math.abs(height - (this._measuredHeight || 0)) > 140) {
        this._measuredWidth = width;
        this._measuredHeight = height;
        this._layoutDirty = true;
      }
      this._viewport = height;
      this.schedule();
    };
    this._onVisibility = () => {
      if (!document.hidden) {
        this._layoutDirty = true;
        this.schedule();
      }
    };
    window.addEventListener("scroll", this.schedule, { passive: true });
    window.addEventListener("resize", this._onResize, { passive: true });
    document.addEventListener("visibilitychange", this._onVisibility);
    this._motionQuery.addEventListener("change", this._onMotion);
    this._measuredWidth = window.innerWidth;
    this._measuredHeight = window.innerHeight;
    this._ro = new ResizeObserver(() => {
      this._layoutDirty = true;
      this.schedule();
    });
    if (this._header) this._ro.observe(this._header);
    // Only observe content, never the animated section's own height.
    if (this._roleInner?.firstElementChild) this._ro.observe(this._roleInner.firstElementChild);
    this.schedule();
    document.fonts?.ready.then(() => {
      if (!this._unmounted) {
        this._layoutDirty = true;
        this.schedule();
      }
    });
    this._reveals = [...document.querySelectorAll(".handslag-v5 [data-reveal]")];
    if (this._reduce || !("IntersectionObserver" in window)) return;
    this._io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.dataset.revealed = "true";
            this._io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -24px 0px", threshold: 0.06 },
    );
    this._reveals.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight - 24) return;
      el.dataset.revealed = "false";
      el.style.setProperty(
        "--reveal-delay",
        `${Math.min(2, (Number(el.dataset.reveal) || 1) - 1) * 55}ms`,
      );
      this._io.observe(el);
    });
  }

  componentWillUnmount() {
    this._unmounted = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener("scroll", this.schedule);
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("visibilitychange", this._onVisibility);
    this._motionQuery?.removeEventListener("change", this._onMotion);
    this._ro?.disconnect();
    this._io?.disconnect();
  }

  renderVals() {
    const a = this.state.audience;
    const o = this.state.open;
    const accent = this.props.accentBadges ?? true;
    const vals = {
      showPhoto: this.props.showPhoto ?? true,
      showSectionNumbers: this.props.showSectionNumbers ?? true,
      badgeBg: accent ? "#D97757" : "#D0E7F2",
      badgeFg: accent ? "#40170B" : "#004F73",
      isPro: a === "professional",
      isOrg: a === "organisation",
      isInt: a === "intermediary",
      pickPro: this.pick("professional"),
      pickOrg: this.pick("organisation"),
      pickInt: this.pick("intermediary"),
      barRef: (el) => {
        this._bar = el;
      },
      headerRef: (el) => {
        this._header = el;
      },
      headerRowRef: (el) => {
        this._headerRow = el;
      },
      nav0Ref: (el) => {
        this._navs[0] = el;
      },
      nav1Ref: (el) => {
        this._navs[1] = el;
      },
      nav2Ref: (el) => {
        this._navs[2] = el;
      },
      stick0Ref: (el) => {
        this._sticks[0] = el;
      },
      stick1Ref: (el) => {
        this._sticks[1] = el;
      },
      stepLineRef: (el) => {
        this._stepLine = el;
      },
      roleStoryRef: (el) => {
        this._roleStory = el;
      },
      roleInnerRef: (el) => {
        this._roleInner = el;
      },
      photoRef: (el) => {
        this._photo = el;
      },
      topBtnRef: (el) => {
        this._topBtn = el;
      },
    };
    vals.tabPro = this.tab(vals.isPro);
    vals.tabOrg = this.tab(vals.isOrg);
    vals.tabInt = this.tab(vals.isInt);
    for (let i = 0; i < 5; i++) {
      vals["q" + i] = o === i;
      vals["nq" + i] = o !== i;
      vals["tq" + i] = this.toggle(i);
    }
    return vals;
  }

  render() {
    const v = this.renderVals();
    return (
      <div
        className="handslag-v5"
        ref={(el) => {
          this._root = el;
        }}
      >
        <a className="hs-landing-skip" href="#inhoud">
          Naar inhoud
        </a>
        <div className="hv5-1">
          <div className="hv5-2" aria-hidden="true">
            <span className="hv5-3" ref={v.barRef}></span>
          </div>

          <header className="hv5-4" ref={v.headerRef}>
            <div className="hv5-5" ref={v.headerRowRef}>
              <a
                className="hv5-6"
                data-interaction="link"
                href="#"
                aria-label="handslag, naar boven"
              >
                <svg
                  width="32"
                  height="26"
                  viewBox="8 11 32 26"
                  fill="none"
                  stroke="#D97757"
                  strokeWidth="4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M10.6 13h7a10 10 0 0 1 10 10v4"></path>
                  <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4"></path>
                </svg>
                <span className="hv5-7">
                  {"handslag"}
                  <span className="hv5-8"></span>
                </span>
              </a>
              <nav className="hv5-9" aria-label="Hoofdnavigatie">
                <a className="hv5-10" data-interaction="link" ref={v.nav0Ref} href="#voor-jou">
                  {"Voor jou"}
                </a>
                <a className="hv5-11" data-interaction="link" ref={v.nav1Ref} href="#zo-werkt-het">
                  {"Zo werkt het"}
                </a>
                <a className="hv5-12" data-interaction="link" ref={v.nav2Ref} href="#vragen">
                  {"Veelgestelde vragen"}
                </a>
              </nav>
              <a className="hv5-13" data-interaction="surface" href="/login">
                {"Inloggen"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 7h10v10"></path>
                  <path d="M7 17 17 7"></path>
                </svg>
              </a>
            </div>
          </header>

          <main id="inhoud" tabIndex={-1}>
            <section className="hv5-14" data-screen-label="Hero">
              <div className="hv5-15" aria-hidden="true"></div>
              <div className="hv5-16">
                <div className="hv5-17">
                  <span className="hv5-18" data-reveal="1">
                    <span className="hv5-19"></span>
                    {"Het platform voor samenwerking"}
                  </span>
                  <HeroQuote />
                  <div className="hv5-23" data-reveal="3">
                    <span className="hv5-24" aria-hidden="true"></span>
                    <p className="hv5-25">
                      {
                        "Bemiddelaars, opdrachtgevers en zzp’ers. Van opdracht tot afronding, samen op één platform."
                      }
                    </p>
                  </div>
                  <p className="hv5-26" data-reveal="4">
                    {"Zzp’ers · opdrachtgevers · bemiddelaars"}
                  </p>
                </div>

                {v.showPhoto && (
                  <>
                    <div className="hv5-27" data-reveal="3">
                      <div className="hv5-28">
                        <Image
                          width={1800}
                          height={1273}
                          priority
                          sizes="(max-width: 760px) 100vw, 48vw"
                          className="hv5-29"
                          ref={v.photoRef}
                          src="https://handslag-v5-preview-production.up.railway.app/assets/hero-samenwerken.jpg"
                          alt="Twee mensen overleggen samen op een bank"
                        />
                      </div>
                      <span className="hv5-30">
                        <span className="hv5-31">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                        </span>
                        {"Ruimte voor wat ertoe doet."}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="hv5-32" data-screen-label="Handslag voor">
              <div className="hv5-33">
                <a
                  className="hv5-34"
                  data-interaction="surface"
                  data-reveal="1"
                  href="#voor-jou"
                  onClick={v.pickPro}
                >
                  <small className="hv5-35">{"Handslag voor"}</small>
                  <span className="hv5-36">
                    {"Zzp’ers"}
                    <span className="hv5-37">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </span>
                  </span>
                </a>
                <a
                  className="hv5-38"
                  data-interaction="surface"
                  data-reveal="2"
                  href="#voor-jou"
                  onClick={v.pickOrg}
                >
                  <small className="hv5-39">{"Handslag voor"}</small>
                  <span className="hv5-40">
                    {"Opdrachtgevers"}
                    <span className="hv5-41">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </span>
                  </span>
                </a>
                <a
                  className="hv5-42"
                  data-interaction="surface"
                  data-reveal="3"
                  href="#voor-jou"
                  onClick={v.pickInt}
                >
                  <small className="hv5-43">{"Handslag voor"}</small>
                  <span className="hv5-44">
                    {"Bemiddelaars"}
                    <span className="hv5-45">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </span>
                  </span>
                </a>
              </div>
            </section>

            <section
              className="hv5-46"
              id="voor-jou"
              data-story-mode="flow"
              data-screen-label="Voor jou"
              ref={v.roleStoryRef}
            >
              <div className="hv5-47" ref={v.roleInnerRef}>
                <div className="hv5-48">
                  <div className="hv5-49">
                    <div className="hv5-50">
                      {v.showSectionNumbers && (
                        <>
                          <p className="hv5-51">
                            <span className="hv5-52">
                              <LogoHand />
                            </span>
                            {"01 / Een goede match begint hier"}
                          </p>
                        </>
                      )}
                      <h2 className="hv5-53">{"Drie partijen. Eén plek."}</h2>
                    </div>
                    <div className="hv5-54" role="group" aria-label="Kies je rol">
                      <button
                        className="hv5-55"
                        data-interaction="surface"
                        style={cssStyle(v.tabPro)}
                        type="button"
                        onClick={v.pickPro}
                        aria-pressed={v.isPro}
                      >
                        {"Zzp’er"}
                      </button>
                      <button
                        className="hv5-56"
                        data-interaction="surface"
                        style={cssStyle(v.tabOrg)}
                        type="button"
                        onClick={v.pickOrg}
                        aria-pressed={v.isOrg}
                      >
                        {"Opdrachtgever"}
                      </button>
                      <button
                        className="hv5-57"
                        data-interaction="surface"
                        style={cssStyle(v.tabInt)}
                        type="button"
                        onClick={v.pickInt}
                        aria-pressed={v.isInt}
                      >
                        {"Bemiddelaar"}
                      </button>
                    </div>
                  </div>

                  <div className="hv5-58">
                    {v.isPro && (
                      <>
                        <div className="hv5-59">
                          <div className="hv5-60">
                            <h3 className="hv5-61">
                              {"Van passende opdracht naar afgerond werk."}
                            </h3>
                            <p className="hv5-62">
                              {
                                "Bekijk opdrachten van opdrachtgevers en bemiddelaars. Kies wat bij je past, accepteer de opdracht en houd je werk bij tot de afronding."
                              }
                            </p>
                            <div className="hv5-63">
                              <div className="hv5-64" aria-hidden="true">
                                <span className="hv5-65" data-roleline="1"></span>
                              </div>
                              <ol className="hv5-66">
                                <li className="hv5-67" data-step="0">
                                  <span className="hv5-68" data-dot="1"></span>
                                  {"Vind opdrachten van opdrachtgevers en bemiddelaars"}
                                </li>
                                <li className="hv5-69" data-step="1">
                                  <span className="hv5-70" data-dot="1"></span>
                                  {"Accepteer een opdracht met duidelijke afspraken"}
                                </li>
                                <li className="hv5-71" data-step="2">
                                  <span className="hv5-72" data-dot="1"></span>
                                  {"Voer het werk uit en rond je uren en administratie af"}
                                </li>
                              </ol>
                            </div>
                          </div>

                          <div className="hv5-73">
                            <div className="hv5-74" data-panel="0">
                              <div className="hv5-75">
                                <span className="hv5-76">{"Openstaande opdrachten"}</span>
                                <span className="hv5-77">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-78">
                                <div className="hv5-79">
                                  <span className="hv5-80">{"Avonddienst wijkzorg"}</span>
                                  <span className="hv5-81">
                                    <span className="hv5-82">{"€ 62,50"}</span>
                                    <span className="hv5-83">{"Open"}</span>
                                  </span>
                                </div>
                                <div className="hv5-84">
                                  <span className="hv5-85">{"Begeleiding dagbesteding"}</span>
                                  <span className="hv5-86">
                                    <span className="hv5-87">{"€ 58,00"}</span>
                                    <span className="hv5-88">{"Open"}</span>
                                  </span>
                                </div>
                                <div className="hv5-89">
                                  <span className="hv5-90">{"Weekenddienst thuiszorg"}</span>
                                  <span className="hv5-91">
                                    <span className="hv5-92">{"€ 71,25"}</span>
                                    <span className="hv5-93">{"Open"}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="hv5-94" data-panel="1">
                              <div className="hv5-95">
                                <span className="hv5-96">{"Avonddienst wijkzorg"}</span>
                                <span className="hv5-97">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-98">
                                <div className="hv5-99">
                                  <span className="hv5-100">{"Zzp’er"}</span>
                                  <span className="hv5-101">{"Akkoord"}</span>
                                </div>
                                <div className="hv5-102">
                                  <span className="hv5-103">{"Opdrachtgever"}</span>
                                  <span className="hv5-104">{"Akkoord"}</span>
                                </div>
                              </div>
                              <div className="hv5-105">
                                <svg
                                  className="hv5-106"
                                  width="24"
                                  height="19"
                                  viewBox="8 11 32 26"
                                  fill="none"
                                  stroke="#D97757"
                                  strokeWidth="4.5"
                                  strokeLinecap="round"
                                  aria-hidden="true"
                                >
                                  <path d="M10.6 13h7a10 10 0 0 1 10 10v4"></path>
                                  <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4"></path>
                                </svg>
                                <span className="hv5-107">{"Bekrachtigd"}</span>
                                <span className="hv5-108">{"10 sep 2026, 14:12"}</span>
                              </div>
                              <div className="hv5-109">
                                <div className="hv5-110">
                                  <span className="hv5-111">{"Tarief"}</span>
                                  <span className="hv5-112">{"€ 62,50 per uur"}</span>
                                </div>
                              </div>
                            </div>
                            <div className="hv5-113" data-panel="2">
                              <div className="hv5-114">
                                <span className="hv5-115">{"Uren en afronding"}</span>
                                <span className="hv5-116">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-117">
                                <div className="hv5-118">
                                  <span className="hv5-119">{"8 sep 2026"}</span>
                                  <span className="hv5-120">{"8,00 uur"}</span>
                                </div>
                                <div className="hv5-121">
                                  <span className="hv5-122">{"9 sep 2026"}</span>
                                  <span className="hv5-123">{"6,50 uur"}</span>
                                </div>
                                <div className="hv5-124">
                                  <span className="hv5-125">{"Totaal"}</span>
                                  <span className="hv5-126">{"€ 906,25"}</span>
                                </div>
                              </div>
                              <div className="hv5-127">
                                <span className="hv5-128">{"Factuur 2026-0148"}</span>
                                <span className="hv5-129">{"Goedgekeurd"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {v.isOrg && (
                      <>
                        <div className="hv5-130">
                          <div className="hv5-131">
                            <h3 className="hv5-132">
                              {"Van openstaande opdracht naar ingevuld werk."}
                            </h3>
                            <p className="hv5-133">
                              {
                                "Breng je opdrachten onder de aandacht van zzp’ers en bemiddelaars. Maak afspraken over de uitvoering en houd overzicht over de voortgang."
                              }
                            </p>
                            <div className="hv5-134">
                              <div className="hv5-135" aria-hidden="true">
                                <span className="hv5-136" data-roleline="1"></span>
                              </div>
                              <ol className="hv5-137">
                                <li className="hv5-138" data-step="0">
                                  <span className="hv5-139" data-dot="1"></span>
                                  {"Breng je opdrachten en verwachtingen in beeld"}
                                </li>
                                <li className="hv5-140" data-step="1">
                                  <span className="hv5-141" data-dot="1"></span>
                                  {"Werk samen met zzp’ers en bemiddelaars"}
                                </li>
                                <li className="hv5-142" data-step="2">
                                  <span className="hv5-143" data-dot="1"></span>
                                  {"Volg de uitvoering en afronding van opdrachten"}
                                </li>
                              </ol>
                            </div>
                          </div>

                          <div className="hv5-144">
                            <div className="hv5-145" data-panel="0">
                              <div className="hv5-146">
                                <span className="hv5-147">{"Jouw opdrachten"}</span>
                                <span className="hv5-148">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-149">
                                <div className="hv5-150">
                                  <span className="hv5-151">{"Avonddienst wijkzorg"}</span>
                                  <span className="hv5-152">
                                    <span className="hv5-153">{"€ 62,50"}</span>
                                    <span className="hv5-154">{"Geplaatst"}</span>
                                  </span>
                                </div>
                                <div className="hv5-155">
                                  <span className="hv5-156">{"Begeleiding dagbesteding"}</span>
                                  <span className="hv5-157">
                                    <span className="hv5-158">{"€ 58,00"}</span>
                                    <span className="hv5-159">{"Geplaatst"}</span>
                                  </span>
                                </div>
                                <div className="hv5-160">
                                  <span className="hv5-161">{"Ondersteuning intake"}</span>
                                  <span className="hv5-162">
                                    <span className="hv5-163">{"€ 55,00"}</span>
                                    <span className="hv5-164">{"Concept"}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="hv5-165" data-panel="1">
                              <div className="hv5-166">
                                <span className="hv5-167">{"Avonddienst wijkzorg"}</span>
                                <span className="hv5-168">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-169">
                                <div className="hv5-170">
                                  <span className="hv5-171">{"Opdrachtgever"}</span>
                                  <span className="hv5-172">{"Akkoord"}</span>
                                </div>
                                <div className="hv5-173">
                                  <span className="hv5-174">{"Zzp’er"}</span>
                                  <span className="hv5-175">{"Akkoord"}</span>
                                </div>
                              </div>
                              <div className="hv5-176">
                                <svg
                                  className="hv5-177"
                                  width="24"
                                  height="19"
                                  viewBox="8 11 32 26"
                                  fill="none"
                                  stroke="#D97757"
                                  strokeWidth="4.5"
                                  strokeLinecap="round"
                                  aria-hidden="true"
                                >
                                  <path d="M10.6 13h7a10 10 0 0 1 10 10v4"></path>
                                  <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4"></path>
                                </svg>
                                <span className="hv5-178">{"Bekrachtigd"}</span>
                                <span className="hv5-179">{"10 sep 2026, 14:12"}</span>
                              </div>
                              <div className="hv5-180">
                                <div className="hv5-181">
                                  <span className="hv5-182">{"Uitvoering"}</span>
                                  <span className="hv5-183">{"8 – 22 sep 2026"}</span>
                                </div>
                              </div>
                            </div>
                            <div className="hv5-184" data-panel="2">
                              <div className="hv5-185">
                                <span className="hv5-186">{"Facturen"}</span>
                                <span className="hv5-187">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-188">
                                <div className="hv5-189">
                                  <span className="hv5-190">{"2026-0148"}</span>
                                  <span className="hv5-191">
                                    <span className="hv5-192">{"€ 906,25"}</span>
                                    <span className="hv5-193">{"Goedgekeurd"}</span>
                                  </span>
                                </div>
                                <div className="hv5-194">
                                  <span className="hv5-195">{"2026-0151"}</span>
                                  <span className="hv5-196">
                                    <span className="hv5-197">{"€ 464,00"}</span>
                                    <span className="hv5-198">{"Ter controle"}</span>
                                  </span>
                                </div>
                                <div className="hv5-199">
                                  <span className="hv5-200">{"Totaal deze maand"}</span>
                                  <span className="hv5-201">{"€ 1.370,25"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {v.isInt && (
                      <>
                        <div className="hv5-202">
                          <div className="hv5-203">
                            <h3 className="hv5-204">{"Breng je netwerk aan het werk."}</h3>
                            <p className="hv5-205">
                              {
                                "Verbind opdrachtgevers aan passende zzp’ers. Houd opdrachten, afspraken en de afhandeling bij elkaar, zodat alle betrokkenen weten wat de volgende stap is."
                              }
                            </p>
                            <div className="hv5-206">
                              <div className="hv5-207" aria-hidden="true">
                                <span className="hv5-208" data-roleline="1"></span>
                              </div>
                              <ol className="hv5-209">
                                <li className="hv5-210" data-step="0">
                                  <span className="hv5-211" data-dot="1"></span>
                                  {"Breng vraag en aanbod binnen je netwerk samen"}
                                </li>
                                <li className="hv5-212" data-step="1">
                                  <span className="hv5-213" data-dot="1"></span>
                                  {"Begeleid de match tussen opdrachtgever en zzp’er"}
                                </li>
                                <li className="hv5-214" data-step="2">
                                  <span className="hv5-215" data-dot="1"></span>
                                  {"Houd overzicht van acceptatie tot afronding"}
                                </li>
                              </ol>
                            </div>
                          </div>

                          <div className="hv5-216">
                            <div className="hv5-217" data-panel="0">
                              <div className="hv5-218">
                                <span className="hv5-219">{"Vraag en aanbod"}</span>
                                <span className="hv5-220">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-221">
                                <div className="hv5-222">
                                  <span className="hv5-223">{"Avonddienst wijkzorg"}</span>
                                  <span className="hv5-224">
                                    <span className="hv5-225">{"3 kandidaten"}</span>
                                    <span className="hv5-226">{"Open"}</span>
                                  </span>
                                </div>
                                <div className="hv5-227">
                                  <span className="hv5-228">{"Begeleiding dagbesteding"}</span>
                                  <span className="hv5-229">
                                    <span className="hv5-230">{"1 kandidaat"}</span>
                                    <span className="hv5-231">{"Open"}</span>
                                  </span>
                                </div>
                                <div className="hv5-232">
                                  <span className="hv5-233">{"Weekenddienst thuiszorg"}</span>
                                  <span className="hv5-234">
                                    <span className="hv5-235">{"4 kandidaten"}</span>
                                    <span className="hv5-236">{"Open"}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="hv5-237" data-panel="1">
                              <div className="hv5-238">
                                <span className="hv5-239">{"Voorgestelde match"}</span>
                                <span className="hv5-240">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-241">
                                <div className="hv5-242">
                                  <span className="hv5-243">{"Opdrachtgever"}</span>
                                  <span className="hv5-244">{"Akkoord"}</span>
                                </div>
                                <div className="hv5-245">
                                  <span className="hv5-246">{"Zzp’er"}</span>
                                  <span className="hv5-247">{"Akkoord"}</span>
                                </div>
                              </div>
                              <div className="hv5-248">
                                <svg
                                  className="hv5-249"
                                  width="24"
                                  height="19"
                                  viewBox="8 11 32 26"
                                  fill="none"
                                  stroke="#D97757"
                                  strokeWidth="4.5"
                                  strokeLinecap="round"
                                  aria-hidden="true"
                                >
                                  <path d="M10.6 13h7a10 10 0 0 1 10 10v4"></path>
                                  <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4"></path>
                                </svg>
                                <span className="hv5-250">{"Bekrachtigd"}</span>
                                <span className="hv5-251">{"10 sep 2026, 14:12"}</span>
                              </div>
                              <div className="hv5-252">
                                <div className="hv5-253">
                                  <span className="hv5-254">{"Bemiddeld door"}</span>
                                  <span className="hv5-255">{"Jouw netwerk"}</span>
                                </div>
                              </div>
                            </div>
                            <div className="hv5-256" data-panel="2">
                              <div className="hv5-257">
                                <span className="hv5-258">{"Lopende opdrachten"}</span>
                                <span className="hv5-259">{"Voorbeeldweergave"}</span>
                              </div>
                              <div className="hv5-260">
                                <div className="hv5-261">
                                  <span className="hv5-262">{"Avonddienst wijkzorg"}</span>
                                  <span className="hv5-263">{"Afgerond"}</span>
                                </div>
                                <div className="hv5-264">
                                  <span className="hv5-265">{"Begeleiding dagbesteding"}</span>
                                  <span className="hv5-266">{"In uitvoering"}</span>
                                </div>
                                <div className="hv5-267">
                                  <span className="hv5-268">{"Weekenddienst thuiszorg"}</span>
                                  <span className="hv5-269">{"Bekrachtigd"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="hv5-270" id="zo-werkt-het" data-screen-label="Zo werkt het">
              <div className="hv5-271">
                <div className="hv5-272">
                  <div className="hv5-273" data-reveal="1">
                    {v.showSectionNumbers && (
                      <>
                        <p className="hv5-274">
                          <span className="hv5-275">
                            <LogoHand />
                          </span>
                          {"02 / Van opdracht tot afronding"}
                        </p>
                      </>
                    )}
                    <h2 className="hv5-276">
                      {"Vinden. Accepteren."}
                      <br />
                      {"Aan de slag."}
                    </h2>
                  </div>
                  <p className="hv5-277" data-reveal="2">
                    {"De zzp’er voert het werk uit. Alle betrokkenen houden overzicht."}
                  </p>
                </div>

                <div className="hv5-278" aria-hidden="true">
                  <span className="hv5-279" ref={v.stepLineRef}></span>
                </div>

                <div className="hv5-280">
                  <article className="hv5-281" data-reveal="1">
                    <span
                      className="hv5-282"
                      style={cssStyle(
                        "display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:" +
                          v.badgeBg +
                          ";color:" +
                          v.badgeFg +
                          ";font-size:16px;font-weight:800",
                      )}
                    >
                      {"01"}
                    </span>
                    <h3 className="hv5-283">{"Vind je opdracht."}</h3>
                    <p className="hv5-284">
                      {
                        "Bekijk het aanbod van opdrachtgevers en bemiddelaars. Lees wat de opdracht inhoudt, welke ervaring nodig is en welke afspraken gelden."
                      }
                    </p>
                  </article>
                  <article className="hv5-285" data-reveal="2">
                    <span
                      className="hv5-286"
                      style={cssStyle(
                        "display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:" +
                          v.badgeBg +
                          ";color:" +
                          v.badgeFg +
                          ";font-size:16px;font-weight:800",
                      )}
                    >
                      {"02"}
                    </span>
                    <h3 className="hv5-287">{"Accepteer het werk."}</h3>
                    <p className="hv5-288">
                      {
                        "Past de opdracht bij jou? Stem de afspraken af en accepteer de opdracht. Zo weet iedereen wie het werk gaat uitvoeren."
                      }
                    </p>
                  </article>
                  <article className="hv5-289" data-reveal="3">
                    <span
                      className="hv5-290"
                      style={cssStyle(
                        "display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:" +
                          v.badgeBg +
                          ";color:" +
                          v.badgeFg +
                          ";font-size:16px;font-weight:800",
                      )}
                    >
                      {"03"}
                    </span>
                    <h3 className="hv5-291">{"Rond het af."}</h3>
                    <p className="hv5-292">
                      {
                        "Voer de opdracht uit en werk je uren bij. Rond de opdracht en bijbehorende administratie af, met overzicht voor de betrokken partijen."
                      }
                    </p>
                  </article>
                </div>

                <div className="hv5-293">
                  <span>{"De samenwerking is van jullie."}</span>
                  <span>{"Het overzicht vind je hier."}</span>
                </div>
              </div>
            </section>

            <section className="hv5-294" id="vragen" data-screen-label="Veelgestelde vragen">
              <div className="hv5-295">
                <div className="hv5-296" ref={v.stick1Ref}>
                  {v.showSectionNumbers && (
                    <>
                      <p className="hv5-297">
                        <span className="hv5-298">
                          <LogoHand />
                        </span>
                        {"03 / Wel zo helder"}
                      </p>
                    </>
                  )}
                  <h2 className="hv5-299">
                    {"Even"}
                    <br />
                    {"afstemmen."}
                  </h2>
                  <p className="hv5-300">
                    {"Goede samenwerking begint met weten waar je aan toe bent."}
                  </p>
                </div>

                <div className="hv5-301" data-reveal="1">
                  <div className="hv5-302">
                    <h3 className="hv5-303">
                      <button
                        className="hv5-304"
                        data-interaction="faq"
                        type="button"
                        onClick={v.tq0}
                        aria-expanded={v.q0}
                      >
                        {"Wat is Handslag?"}
                        <span className="hv5-305">
                          {v.q0 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                          {v.nq0 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M12 5v14"></path>
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </h3>
                    {v.q0 && (
                      <>
                        <p className="hv5-306">
                          {
                            "Handslag brengt bemiddelaars, opdrachtgevers en zzp’ers bij elkaar. Zzp’ers kunnen opdrachten vinden, accepteren, uitvoeren en afronden. Het platform helpt om opdrachten, afspraken, uren en facturen op één plek bij te houden."
                          }
                        </p>
                      </>
                    )}
                  </div>
                  <div className="hv5-307">
                    <h3 className="hv5-308">
                      <button
                        className="hv5-309"
                        data-interaction="faq"
                        type="button"
                        onClick={v.tq1}
                        aria-expanded={v.q1}
                      >
                        {"Hoe verlopen de betalingen?"}
                        <span className="hv5-310">
                          {v.q1 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                          {v.nq1 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M12 5v14"></path>
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </h3>
                    {v.q1 && (
                      <>
                        <p className="hv5-311">
                          {
                            "De opdrachtgever betaalt de zorgprofessional rechtstreeks, buiten Handslag om. In het platform houd je facturen en hun status bij. Handslag biedt geen vooruitbetaling of betalingsgarantie. Leg het tarief en de betaaltermijn vooraf samen vast."
                          }
                        </p>
                      </>
                    )}
                  </div>
                  <div className="hv5-312">
                    <h3 className="hv5-313">
                      <button
                        className="hv5-314"
                        data-interaction="faq"
                        type="button"
                        onClick={v.tq2}
                        aria-expanded={v.q2}
                      >
                        {"Wat is de rol van een bemiddelaar?"}
                        <span className="hv5-315">
                          {v.q2 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                          {v.nq2 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M12 5v14"></path>
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </h3>
                    {v.q2 && (
                      <>
                        <p className="hv5-316">
                          {
                            "Een bemiddelaar brengt opdrachten en zzp’ers samen en begeleidt de samenwerking met de opdrachtgever. Handslag biedt de gezamenlijke plek om opdrachten en de afhandeling ervan te organiseren. De afspraken tussen de betrokken partijen bepalen wie welke verantwoordelijkheid heeft."
                          }
                        </p>
                      </>
                    )}
                  </div>
                  <div className="hv5-317">
                    <h3 className="hv5-318">
                      <button
                        className="hv5-319"
                        data-interaction="faq"
                        type="button"
                        onClick={v.tq3}
                        aria-expanded={v.q3}
                      >
                        {"Bepaalt Handslag mijn tarief?"}
                        <span className="hv5-320">
                          {v.q3 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                          {v.nq3 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M12 5v14"></path>
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </h3>
                    {v.q3 && (
                      <>
                        <p className="hv5-321">
                          {
                            "Je maakt als zorgprofessional zelf afspraken met je opdrachtgever over het tarief, de opdracht en de voorwaarden. Bespreek die afspraken voordat je begint."
                          }
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <h3 className="hv5-322">
                      <button
                        className="hv5-323"
                        data-interaction="faq"
                        type="button"
                        onClick={v.tq4}
                        aria-expanded={v.q4}
                      >
                        {"Kan ik nu al aan de slag?"}
                        <span className="hv5-324">
                          {v.q4 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                          {v.nq4 && (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                              >
                                <path d="M12 5v14"></path>
                                <path d="M5 12h14"></path>
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </h3>
                    {v.q4 && (
                      <>
                        <p className="hv5-325">
                          {
                            "Handslag wordt gefaseerd in gebruik genomen. Je kunt een account aanmaken om kennis te maken. Controleer vóór een echte samenwerking welke dienstverlening en voorwaarden voor jou beschikbaar zijn."
                          }
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="hv5-326" data-screen-label="Kennismaken">
              <div className="hv5-327" data-reveal="1">
                <div className="hv5-328" aria-hidden="true"></div>
                <div className="hv5-329">
                  <p className="hv5-330">
                    <span className="hv5-331">
                      <LogoHand fixedStroke />
                    </span>
                    {"Zullen we kennismaken?"}
                  </p>
                  <div className="hv5-332">
                    <h2 className="hv5-333">
                      {"Dat begint"}
                      <br />
                      {"met een handslag."}
                    </h2>
                    <a
                      className="hv5-334"
                      data-interaction="surface"
                      href="/register"
                      aria-label="Account aanmaken bij Handslag"
                    >
                      <svg
                        className="hv5-335"
                        width="54"
                        height="44"
                        viewBox="8 11 32 26"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M10.6 13h7a10 10 0 0 1 10 10v4"></path>
                        <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4"></path>
                      </svg>
                    </a>
                  </div>
                  <p className="hv5-336">{"Voor mensen die goed werk willen doen. Samen."}</p>
                </div>
              </div>
            </section>
          </main>

          <a
            className="hv5-337"
            data-interaction="surface"
            ref={v.topBtnRef}
            href="#"
            aria-label="Terug naar boven"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5"></path>
              <path d="m5 12 7-7 7 7"></path>
            </svg>
          </a>

          <footer className="hv5-338">
            <div className="hv5-339">
              <div className="hv5-340">
                <a className="hv5-341" data-interaction="link" href="#">
                  <svg
                    width="28"
                    height="23"
                    viewBox="8 11 32 26"
                    fill="none"
                    stroke="#D97757"
                    strokeWidth="4"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M10.6 13h7a10 10 0 0 1 10 10v4"></path>
                    <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4"></path>
                  </svg>
                  <span className="hv5-342">
                    {"handslag"}
                    <span className="hv5-343"></span>
                  </span>
                </a>
                <span className="hv5-344">{"Zzp’ers. Opdrachtgevers. Bemiddelaars."}</span>
                <a className="hv5-345" data-interaction="link" href="#">
                  {"Terug naar boven ↑"}
                </a>
              </div>
              <div className="hv5-346">
                <span>{"© 2026 Handslag"}</span>
                <nav className="hs-landing-legal" aria-label="Juridische informatie">
                  <a href="/privacy">Privacy</a>
                  <a href="/voorwaarden">Voorwaarden</a>
                  <a href="/cookies">Cookies</a>
                </nav>
                <span>{"Fotografie: Age Cymru / Unsplash"}</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }
}
