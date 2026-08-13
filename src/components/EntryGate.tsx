"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAccessibleProject } from "@/lib/ensureAccessibleProject";
import { DoorPhoto } from "@/components/DoorPhoto";

export function EntryGate({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    // Vérifié en arrière-plan pendant que l'utilisateur regarde l'écran :
    // aucun temps d'attente ajouté, jamais de "projet inaccessible".
    let cancelled = false;
    ensureAccessibleProject(projectId).then(id => {
      if (cancelled || !id) return;
      setResolvedId(id);
      router.prefetch(`/capturer/${id}`);
    });
    return () => { cancelled = true; };
  }, [projectId, router]);

  function enter() {
    // Le projet doit être réellement résolu avant toute entrée — jamais de repli
    // vers l'ancien projectId non vérifié (source du bug "Projet inaccessible").
    if (!resolvedId) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEntering(true);
    window.setTimeout(() => { router.push(`/capturer/${resolvedId}`); }, prefersReduced ? 0 : 450);
  }

  return (
    <main className={`entry-gate${entering ? " is-entering" : ""}`}>
      <DoorPhoto intensified={entering} />

      <div className="entry-gate__content">
        <h1>Votre pièce peut devenir autre chose.</h1>
        <button type="button" className="button-primary" onClick={enter} disabled={entering || !resolvedId}>
          {entering ? "…" : resolvedId ? "Entrer dans ma pièce" : "Préparation…"}
        </button>
      </div>
    </main>
  );
}
