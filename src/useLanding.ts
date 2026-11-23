import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { translate, type Lang } from "./i18n";

const ACCENT = "#C6F24E";
const MAP_KEYS = ["hyper", "continental", "castrol", "kia"] as const;
const STEP_LABELS = ["Add car", "Schedule", "Find a center", "Book a service"];

const readPref = <T extends string>(key: string, fallback: T, allowed: readonly T[]): T => {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
};
const writePref = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
};

/** All state and behaviour of the landing page: hero steps, reveal on scroll, map rotation, menu, theme, language. */
export function useLanding() {
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [dark, setDark] = useState(() => readPref("cc-theme", "light", ["light", "dark"] as const) === "dark");
  const [lang, setLangState] = useState<Lang>(() => readPref<Lang>("cc-lang", "en", ["en", "az"]));
  const [menu, setMenu] = useState(false);
  const [mapBrand, setMapBrand] = useState<(typeof MAP_KEYS)[number]>("hyper");
  const [mapHold, setMapHold] = useState(false);
  const holdRef = useRef(false);
  const stepTimer = useRef<number>();

  // draggable partner map: the layer is 140% of the frame, so it can pan 20% each way
  const mapRef = useRef<HTMLDivElement>(null);
  const pan = useRef({ x: 0, y: 0 });
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const applyPan = () => {
    const el = mapRef.current;
    if (el) el.style.transform = `translate3d(${pan.current.x}px, ${pan.current.y}px, 0)`;
  };
  const moved = useRef(false);
  const mapDrag = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      moved.current = false;
      drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pan.current.x, oy: pan.current.y };
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      // only start dragging after a small move, so taps on a pin still open Google Maps
      if (!moved.current) {
        if (Math.hypot(dx, dy) < 6) return;
        moved.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.classList.add("dragging");
      }
      const el = e.currentTarget;
      const mx = el.offsetWidth / 7;
      const my = el.offsetHeight / 7;
      pan.current = { x: Math.max(-mx, Math.min(mx, d.ox + dx)), y: Math.max(-my, Math.min(my, d.oy + dy)) };
      applyPan();
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      drag.current = null;
      e.currentTarget.classList.remove("dragging");
    },
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => {
      drag.current = null;
      e.currentTarget.classList.remove("dragging");
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (moved.current) {
        e.preventDefault();
        e.stopPropagation();
        moved.current = false;
      }
    },
    onDoubleClick: () => {
      pan.current = { x: 0, y: 0 };
      applyPan();
    },
  };

  const t = useMemo(() => translate(lang), [lang]);

  // hero steps every 3.6s
  const startSteps = useCallback(() => {
    window.clearInterval(stepTimer.current);
    stepTimer.current = window.setInterval(() => setStep((s) => (s + 1) % 4), 3600);
  }, []);
  useEffect(() => {
    startSteps();
    return () => window.clearInterval(stepTimer.current);
  }, [startSteps]);

  // partner map rotates every 10s unless a card is hovered/focused
  useEffect(() => {
    const id = window.setInterval(() => {
      if (holdRef.current) return;
      setMapBrand((cur) => MAP_KEYS[(MAP_KEYS.indexOf(cur) + 1) % MAP_KEYS.length]);
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  // reveal sections when they scroll into view
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rv]"));
    const reveal = (key: string | null) => key && setSeen((s) => (s[key] ? s : { ...s, [key]: true }));
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => reveal(el.getAttribute("data-rv")));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target.getAttribute("data-rv"));
            io.unobserve(e.target);
          }
        }),
      { threshold: [0, 0.05], rootMargin: "0px 0px 120px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // theme + language side effects
  useEffect(() => {
    writePref("cc-theme", dark ? "dark" : "light");
    document.body.style.background = dark ? "#0b0b0c" : "#ffffff";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    writePref("cc-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // close the mobile menu with Escape or when growing to desktop
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    const onResize = () => window.innerWidth > 760 && setMenu(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menu]);

  const nwScroll = useCallback((d: number) => {
    const track = document.querySelector<HTMLElement>(".nw-track");
    if (!track) return;
    const card = track.querySelector("a");
    const w = card ? card.getBoundingClientRect().width + 24 : track.clientWidth;
    const max = track.scrollWidth - track.clientWidth;
    if (d > 0 && track.scrollLeft >= max - 4) return track.scrollTo({ left: 0, behavior: "smooth" });
    if (d < 0 && track.scrollLeft <= 4) return track.scrollTo({ left: max, behavior: "smooth" });
    track.scrollBy({ left: d * w, behavior: "smooth" });
  }, []);

  const on = (c: string, i: number) => c + (step === i ? " on" : "");
  const rv = (k: string) => "rv" + (seen[k] ? " in" : "");
  const themeLabel = t(dark ? "Switch to light mode" : "Switch to dark mode");

  const mapVals: Record<string, unknown> = {
    hvOff: () => {
      holdRef.current = false;
      setMapHold(false);
    },
  };
  MAP_KEYS.forEach((k) => {
    mapVals["pc_" + k] = "mp-pin" + (mapBrand === k ? " on" : " off");
    mapVals["cc_" + k] = "mp-card" + (mapBrand === k ? " on" : " dim") + (mapHold ? " hold" : "");
    mapVals["hv_" + k] = () => {
      holdRef.current = true;
      setMapHold(true);
      setMapBrand(k);
    };
  });

  const v = {
    accent: ACCENT,
    mapRef,
    mapDrag,
    lang,
    setLang: (l: Lang) => setLangState(l),
    rootCls: "cc-root" + (dark ? " dark" : ""),
    menuOpen: menu,
    menuClosed: !menu,
    burgerCls: "hd-mob hd-burger" + (menu ? " open" : ""),
    panelCls: "hd-mob hd-panel" + (menu ? " open" : ""),
    menuLabel: t(menu ? "Close menu" : "Open menu"),
    toggleMenu: () => setMenu((m) => !m),
    closeMenu: () => setMenu(false),
    isDark: dark,
    isLight: !dark,
    themeLabel,
    toggleDark: () => setDark((d) => !d),
    rv_partners: rv("partners"),
    rv_brands: rv("brands"),
    rv_insta: rv("insta"),
    rv_how: rv("how"),
    rv_features: rv("features"),
    rv_centers: rv("centers"),
    rv_news: rv("news"),
    rv_team: rv("team"),
    nwPrev: () => nwScroll(-1),
    nwNext: () => nwScroll(1),
    c0: on("cc-scr", 0),
    c1: on("cc-scr cc-modal", 1),
    c2: on("cc-scr", 2),
    c3: on("cc-scr", 3),
    f0a: on("cc-fl", 0),
    f0b: on("cc-fl cc-b", 0),
    f1a: on("cc-fl", 1),
    f1b: on("cc-fl cc-b", 1),
    f2a: on("cc-fl", 2),
    f2b: on("cc-fl cc-b", 2),
    f3a: on("cc-fl", 3),
    f3b: on("cc-fl cc-b", 3),
    steps: STEP_LABELS.map((label, i) => ({
      label: t(label),
      cls: on("cc-step", i),
      pick: () => {
        setStep(i);
        startSteps();
      },
    })),
    ...mapVals,
  } as Record<string, any>;

  return { v, t };
}
