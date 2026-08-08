import Image from "next/image";
import Link from "next/link";

import { brand } from "@/config/brand";
import { services } from "@/config/project";

const steps = [
  [
    "01",
    "Racontez-nous votre intérieur",
    "Décrivez votre pièce, vos besoins, vos envies et votre façon de vivre l’espace.",
  ],
  [
    "02",
    "Partagez vos éléments",
    "Photos, mesures, plans, documents et inspirations sont réunis dans un seul dossier.",
  ],
  [
    "03",
    "Construisons la pièce d’après",
    "Suivez les rendez-vous, les demandes de complément et l’évolution de votre projet depuis votre espace privé.",
  ],
];

const benefits = [
  "Un accompagnement adapté à votre quotidien",
  "Un dossier centralisé et facile à suivre",
  "Des échanges clairs tout au long du projet",
  "Une approche sensible, fonctionnelle et personnalisée",
];

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="shell grid min-h-[74vh] items-center gap-12 py-12 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.28em] text-[var(--terracotta)]">
            Décoration & aménagement intérieur
          </p>

          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.03] text-[var(--walnut)] md:text-7xl">
            Imaginez
            <br />
            la pièce d’après.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--ink)]/70">
            Nous imaginons avec vous un intérieur qui vous ressemble, pensé
            pour votre quotidien, vos envies et votre manière d’habiter.
          </p>

          <p className="mt-4 max-w-xl font-serif text-xl italic text-[var(--walnut)]">
            {brand.tagline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/inscription" className="button-primary">
              Démarrer mon projet
            </Link>

            <Link
              href="/prestations"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--walnut)]/25 bg-[var(--off-white)] px-5 py-3 font-medium text-[var(--walnut)]"
            >
              Découvrir les prestations
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden p-4">
          <Image
            src={brand.logo.primary}
            alt={brand.name}
            width={1024}
            height={1024}
            className="aspect-square w-full rounded-xl object-cover"
            priority
          />
        </div>
      </section>

      {/* PARCOURS */}
      <section className="bg-[var(--off-white)] py-20">
        <div className="shell">
          <p className="text-xs font-bold uppercase tracking-[.28em] text-[var(--terracotta)]">
            Un parcours simple
          </p>

          <h2 className="mt-3 max-w-3xl font-serif text-4xl text-[var(--walnut)]">
            Votre projet avance étape par étape, sans surcharge.
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <article className="card p-7" key={number}>
                <div className="text-sm font-semibold text-[var(--terracotta)]">
                  {number}
                </div>

                <h3 className="mt-5 font-serif text-2xl text-[var(--walnut)]">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-[var(--ink)]/65">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PRESTATIONS */}
      <section className="shell py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[var(--terracotta)]">
              Prestations
            </p>

            <h2 className="mt-3 max-w-3xl font-serif text-4xl text-[var(--walnut)]">
              Un accompagnement pensé pour chaque intérieur.
            </h2>
          </div>

          <Link
            className="hidden text-sm font-medium text-[var(--walnut)] underline md:block"
            href="/prestations"
          >
            Voir toutes les prestations
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.slice(0, 8).map((service) => (
            <div
              key={service}
              className="rounded-2xl border border-[var(--walnut)]/10 bg-[var(--linen)]/45 p-5 font-medium text-[var(--walnut)]"
            >
              {service}
            </div>
          ))}
        </div>
      </section>

      {/* APPROCHE */}
      <section className="bg-[var(--linen)]/55 py-20">
        <div className="shell grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[var(--terracotta)]">
              Notre approche
            </p>

            <h2 className="mt-3 font-serif text-4xl text-[var(--walnut)]">
              Un intérieur plus juste, plus beau, plus personnel.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-[var(--ink)]/70">
              Chaque projet commence par votre réalité : les volumes, les
              contraintes, les usages, les habitudes et ce que vous souhaitez
              réellement changer.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-2xl border border-[var(--walnut)]/10 bg-[var(--off-white)] p-6 text-[var(--walnut)]"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUIVI CLIENT */}
      <section className="bg-[var(--forest)] py-20 text-[var(--ivory)]">
        <div className="shell grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[var(--linen)]">
              Votre espace privé
            </p>

            <h2 className="mt-3 font-serif text-4xl text-[var(--ivory)]">
              Tout votre projet, au même endroit.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-[var(--ivory)]/70">
              Retrouvez vos informations, fichiers, rendez-vous, messages et
              avancées depuis un espace sécurisé.
            </p>
          </div>

          <div className="grid gap-3 text-[var(--ivory)]/80 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-5">
              Photos et documents privés
            </div>

            <div className="rounded-2xl border border-white/10 p-5">
              Questionnaire progressif
            </div>

            <div className="rounded-2xl border border-white/10 p-5">
              Rendez-vous liés au projet
            </div>

            <div className="rounded-2xl border border-white/10 p-5">
              Chronologie et messages
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="shell py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-[.28em] text-[var(--terracotta)]">
          Votre intérieur mérite son après
        </p>

        <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl text-[var(--walnut)] md:text-5xl">
          Prêt à imaginer la pièce d’après ?
        </h2>

        <p className="mx-auto mt-5 max-w-2xl leading-7 text-[var(--ink)]/65">
          Commencez votre projet en quelques étapes et rassemblez toutes les
          informations nécessaires dans votre espace personnel.
        </p>

        <div className="mt-8">
          <Link href="/inscription" className="button-primary">
            Démarrer mon projet
          </Link>
        </div>
      </section>
    </main>
  );
}
