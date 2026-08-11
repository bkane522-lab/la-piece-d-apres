import Link from "next/link";

import { brand } from "@/config/brand";
import { services } from "@/config/project";
import { HeroArch } from "@/components/HeroArch";
import { StorySteps } from "@/components/StorySteps";

const benefits = [
  ["Gagnez du temps", "Moins de collecte, moins d’échanges dispersés, un dossier prêt à l’emploi."],
  ["Des projets plus sereins", "Le client est guidé, le professionnel travaille sur une base claire."],
  ["L’expertise augmentée", "Un copilote IA privé pour démarrer plus vite, sans jamais remplacer votre œil."],
];

export default function Home() {
  return (
    <main>
      {/* HERO IMMERSIF */}
      <section className="relative overflow-hidden bg-[var(--chocolate)] py-24 text-[var(--warm-ivory)] lg:py-32">
        <div className="shell relative z-10 grid items-center gap-12 lg:grid-cols-[1fr_.85fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.32em] text-[var(--copper)]">
              Décoration & aménagement intérieur
            </p>

            <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[1.05] text-[var(--warm-ivory)] md:text-7xl">
              {brand.name}
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--warm-ivory)]/75">
              L’app qui transforme vos intérieurs. Et votre temps.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/inscription" className="button-primary">
                Photographier ma pièce
              </Link>
              <Link
                href="/connexion"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--warm-ivory)]/25 bg-transparent px-5 py-3 font-medium text-[var(--warm-ivory)]"
              >
                Je suis décorateur·rice
              </Link>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-3">
              {benefits.map(([title, text]) => (
                <div key={title}>
                  <p className="font-serif text-xl text-[var(--copper)]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--warm-ivory)]/65">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
            <HeroArch />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--chocolate)] via-transparent to-transparent" />
      </section>

      {/* STORYTELLING */}
      <section className="bg-[var(--warm-ivory)] py-20">
        <div className="shell">
          <p className="text-xs font-bold uppercase tracking-[.28em] text-[var(--terracotta)]">
            Comment ça marche
          </p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl text-[var(--walnut)]">
            De la photo à l’inspiration, un seul fil.
          </h2>

          <div className="mt-10">
            <StorySteps />
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
            {[
              "Un accompagnement adapté à votre quotidien",
              "Un dossier centralisé et facile à suivre",
              "Des échanges clairs tout au long du projet",
              "Une approche sensible, fonctionnelle et personnalisée",
            ].map((benefit) => (
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
      <section className="bg-[var(--chocolate)] py-20 text-[var(--warm-ivory)]">
        <div className="shell grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[var(--copper)]">
              Votre espace privé
            </p>

            <h2 className="mt-3 font-serif text-4xl text-[var(--warm-ivory)]">
              Tout votre projet, au même endroit.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-[var(--warm-ivory)]/70">
              Retrouvez vos informations, fichiers, rendez-vous, messages et
              avancées depuis un espace sécurisé.
            </p>
          </div>

          <div className="grid gap-3 text-[var(--warm-ivory)]/80 sm:grid-cols-2">
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
            Photographier ma pièce
          </Link>
        </div>
      </section>
    </main>
  );
}
