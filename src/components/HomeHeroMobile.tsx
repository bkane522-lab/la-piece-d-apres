"use client";

import Link from "next/link";
import { useState } from "react";
import { DoorPhoto } from "@/components/DoorPhoto";
import { startCaptureFlow } from "@/lib/startCaptureFlow";

type Stage = "closed" | "opening" | "revealed";

export function HomeHeroMobile() {
  const [stage, setStage] = useState<Stage>("closed");
  const [starting, setStarting] = useState(false);

  function openDoor() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStage("opening");
    window.setTimeout(() => setStage("revealed"), prefersReduced ? 0 : 450);
  }

  async function onPhotographier() {
    setStarting(true);
    try { await startCaptureFlow(); } finally { setStarting(false); }
  }

  return (
    <div className={`home-hero-mobile home-hero-mobile--${stage}`}>
      <div className="home-hero-mobile__arch">
        <DoorPhoto intensified={stage !== "closed"} />
      </div>

      {stage !== "revealed" && (
        <div className="home-hero-mobile__intro">
          <h1>La Pièce d’Après</h1>
          <p>Entrez. Votre intérieur commence ici.</p>
          <button type="button" className="button-primary" onClick={openDoor} disabled={stage === "opening"}>
            Ouvrir la porte
          </button>
        </div>
      )}

      {stage === "revealed" && (
        <div className="home-hero-mobile__choices">
          <button type="button" className="button-primary" onClick={onPhotographier} disabled={starting}>
            {starting ? "…" : "Photographier ma pièce"}
          </button>
          <Link href="/connexion" className="home-hero-mobile__choice-secondary">J’ai déjà un projet</Link>
          <Link href="/connexion" className="home-hero-mobile__choice-secondary">Espace professionnel</Link>
        </div>
      )}
    </div>
  );
}
