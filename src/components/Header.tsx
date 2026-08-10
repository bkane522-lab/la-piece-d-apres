import Link from "next/link";
import Image from "next/image";
import { brand } from "@/config/brand";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo" aria-label={brand.name}>
          <Image
            src={brand.logo.primary}
            alt={brand.name}
            width={180}
            height={90}
            priority
          />
        </Link>

        <nav className="site-nav" aria-label="Navigation principale">
          <Link href="/">Accueil</Link>
          <Link href="/prestations">Prestations</Link>
          <Link href="/realisations">Réalisations</Link>
          <Link href="/comment-ca-marche">Comment ça marche</Link>
          <Link href="/a-propos">À propos</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="site-header__actions">
          <Link href="/connexion">Connexion</Link>
          <Link href="/inscription" className="button-primary">
            Démarrer mon projet
          </Link>
        </div>
      </div>
    </header>
  );
}
