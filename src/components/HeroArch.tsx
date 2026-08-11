"use client";

import { useEffect, useRef } from "react";

export function HeroArch() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = rootRef.current;
        if (el) {
          const offset = Math.min(window.scrollY, 600);
          el.style.setProperty("--parallax", String(offset));
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={rootRef} className="hero-arch" style={{ "--parallax": 0 } as React.CSSProperties}>
      <svg viewBox="0 0 300 400" className="hero-arch__glow" role="img" aria-label="Arche lumineuse ouvrant sur un intérieur, symbole de transformation">
        <defs>
          <radialGradient id="archGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="var(--copper)" stopOpacity="0.95" />
            <stop offset="45%" stopColor="var(--bronze)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--chocolate)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="roomGlimpse" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--copper)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--chocolate)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="archFrameOuter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--copper)" />
            <stop offset="100%" stopColor="var(--bronze)" />
          </linearGradient>
        </defs>

        <rect width="300" height="400" fill="url(#archGlow)" className="hero-arch__pulse" />

        {/* aperçu de pièce, légèrement décalé pour l'effet de profondeur/parallax */}
        <g className="hero-arch__room">
          <path d="M78 380 V160 A72 72 0 0 1 222 160 V380 Z" fill="url(#roomGlimpse)" />
          <line x1="95" y1="380" x2="95" y2="230" stroke="var(--warm-ivory)" strokeOpacity="0.12" strokeWidth="1" />
          <line x1="150" y1="380" x2="150" y2="200" stroke="var(--warm-ivory)" strokeOpacity="0.1" strokeWidth="1" />
          <line x1="205" y1="380" x2="205" y2="230" stroke="var(--warm-ivory)" strokeOpacity="0.12" strokeWidth="1" />
        </g>

        {/* cadres concentriques de l'arche */}
        <path d="M40 380 V150 A110 110 0 0 1 260 150 V380" fill="none" stroke="url(#archFrameOuter)" strokeWidth="6" />
        <path d="M58 380 V152 A92 92 0 0 1 242 152 V380" fill="none" stroke="var(--warm-ivory)" strokeOpacity="0.18" strokeWidth="1.5" />
        <path d="M70 380 V155 A80 80 0 0 1 230 155 V380" fill="none" stroke="var(--warm-ivory)" strokeOpacity="0.28" strokeWidth="1.5" />
      </svg>
      <div className="hero-arch__vignette" />
    </div>
  );
}
