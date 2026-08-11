"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EntryGate({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  function enter() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEntering(true);
    router.prefetch(`/capturer/${projectId}`);
    window.setTimeout(() => { router.push(`/capturer/${projectId}`); }, prefersReduced ? 0 : 900);
  }

  return (
    <main className={`entry-gate${entering ? " is-entering" : ""}`}>
      <svg viewBox="0 0 300 400" className="entry-gate__arch" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="entryGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="var(--copper)" stopOpacity="0.95" />
            <stop offset="50%" stopColor="var(--bronze)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--chocolate)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="entryFrame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--copper)" />
            <stop offset="100%" stopColor="var(--bronze)" />
          </linearGradient>
        </defs>
        <rect width="300" height="400" fill="url(#entryGlow)" className="entry-gate__glow" />
        <path d="M40 380 V150 A110 110 0 0 1 260 150 V380" fill="none" stroke="url(#entryFrame)" strokeWidth="6" />
        <path d="M70 380 V155 A80 80 0 0 1 230 155 V380" fill="none" stroke="var(--warm-ivory)" strokeOpacity="0.3" strokeWidth="1.5" />
      </svg>

      <div className="entry-gate__content">
        <h1>Votre pièce peut devenir autre chose.</h1>
        <button type="button" className="button-primary" onClick={enter} disabled={entering}>
          {entering ? "…" : "Entrer dans ma pièce"}
        </button>
      </div>
    </main>
  );
}
