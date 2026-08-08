import Link from "next/link";
import { brand } from "@/config/brand";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <strong>{brand.name}</strong>
          <p>{brand.tagline}</p>
        </div>

        <nav aria-label="Navigation du pied de page">
          <Link href="/prestations">Prestations</Link>
          <Link href="/realisations">Réalisations</Link>
          <Link href="/a-propos">À propos</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <nav aria-label="Informations légales">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/conditions-utilisation">Conditions d’utilisation</Link>
        </nav>
      </div>

      <div className="site-footer__bottom">
        © {new Date().getFullYear()} {brand.name}. Tous droits réservés.
      </div>
    </footer>
  );
}
