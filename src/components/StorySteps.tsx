"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  ["Photographier", "Le client capture sa pièce en quelques minutes, guidé pas à pas."],
  ["Comprendre", "L’application structure automatiquement besoins, contraintes et envies."],
  ["Inspirer", "Un copilote IA privé propose des pistes de départ pour le professionnel."],
  ["Concevoir", "Le décorateur construit sa proposition à partir d’un dossier déjà clair."],
];

export function StorySteps() {
  const [visible, setVisible] = useState<boolean[]>(STEPS.map(() => false));
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setVisible(STEPS.map(() => true)); return; }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.stepIndex);
            setVisible((prev) => (prev[idx] ? prev : prev.map((v, i) => (i === idx ? true : v))));
          }
        });
      },
      { threshold: 0.35 }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="story-steps">
      {STEPS.map(([title, text], i) => (
        <article
          key={title}
          ref={(el) => { refs.current[i] = el; }}
          data-step-index={i}
          className={`story-step${visible[i] ? " is-visible" : ""}`}
          style={{ transitionDelay: visible[i] ? `${i * 90}ms` : "0ms" }}
        >
          <div className="story-step__number">{String(i + 1).padStart(2, "0")}</div>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}
