"use client";

import Image from "next/image";
import { useState } from "react";
import { brand } from "@/config/brand";
import { DoorPhoto } from "@/components/DoorPhoto";
import { startCaptureFlow } from "@/lib/startCaptureFlow";

export function HomeHeroMobile() {
  const [opening, setOpening] = useState(false);
  const [starting, setStarting] = useState(false);

  async function enter() {
    if (starting) return;
    setOpening(true);
    setStarting(true);
    try {
      const minAnimation = new Promise<void>((resolve) => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(resolve, reduced ? 0 : 420);
      });
      await Promise.all([startCaptureFlow(), minAnimation]);
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className={`app-entry app-entry--minimal${opening ? " is-opening" : ""}`}>
      <DoorPhoto intensified={opening} />
      <div className="app-entry__shade" aria-hidden="true" />

      <div className="app-entry__brandmark">
        <Image
          src={brand.logo.primary}
          alt={brand.name}
          width={210}
          height={105}
          priority
          className="app-entry__logo"
        />
      </div>

      <section className="app-entry__content" aria-label="Entrée de l’application">
        <h1>Votre pièce.<br />Autrement.</h1>
        <p className="app-entry__lead">Imaginez la pièce d’après.</p>

        <button type="button" className="app-entry__primary" onClick={enter} disabled={starting}>
          <span>{starting ? "Ouverture…" : "Commencer"}</span>
          <span className="app-entry__arrow" aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
}
