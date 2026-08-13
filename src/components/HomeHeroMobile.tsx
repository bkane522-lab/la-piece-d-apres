"use client";

import Image from "next/image";
import Link from "next/link";
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
    <main className={`app-entry${opening ? " is-opening" : ""}`}>
      <DoorPhoto intensified={opening} />
      <div className="app-entry__shade" aria-hidden="true" />

      <div className="app-entry__topbar">
        <Image
          src={brand.logo.primary}
          alt={brand.name}
          width={180}
          height={90}
          priority
          className="app-entry__logo"
        />
        <Link href="/connexion" className="app-entry__login">Connexion</Link>
      </div>

      <section className="app-entry__content" aria-label="Entrée de l’application">
        <p className="app-entry__eyebrow">Décoration intérieure, simplifiée</p>
        <h1>Votre pièce.<br />Votre prochain intérieur.</h1>
        <p className="app-entry__lead">
          Photographiez. L’application structure. Votre décorateur conçoit.
        </p>

        <button type="button" className="app-entry__primary" onClick={enter} disabled={starting}>
          <span className="app-entry__primary-icon" aria-hidden="true">⌁</span>
          <span>{starting ? "Ouverture…" : "Ouvrir la porte"}</span>
        </button>

        <div className="app-entry__secondary">
          <Link href="/connexion">J’ai déjà un projet</Link>
          <span aria-hidden="true">•</span>
          <Link href="/connexion">Espace professionnel</Link>
        </div>
      </section>

      <p className="app-entry__microcopy">Une seule entrée. Pas de formulaire interminable.</p>
    </main>
  );
}
