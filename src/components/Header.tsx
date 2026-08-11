"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { brand } from "@/config/brand";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo" aria-label={brand.name} onClick={() => setOpen(false)}>
          <Image src={brand.logo.primary} alt={brand.name} width={180} height={90} priority />
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
          <Link href="/inscription" className="button-primary">Démarrer mon projet</Link>
        </div>

        <button type="button" className="site-header__burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </div>

      {open && (
        <div className="site-header__mobile-panel">
          <Link href="/" onClick={() => setOpen(false)}>Accueil</Link>
          <Link href="/prestations" onClick={() => setOpen(false)}>Prestations</Link>
          <Link href="/realisations" onClick={() => setOpen(false)}>Réalisations</Link>
          <Link href="/comment-ca-marche" onClick={() => setOpen(false)}>Comment ça marche</Link>
          <Link href="/a-propos" onClick={() => setOpen(false)}>À propos</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
          <hr />
          <Link href="/connexion" onClick={() => setOpen(false)}>Connexion</Link>
          <Link href="/inscription" className="button-primary" onClick={() => setOpen(false)}>Démarrer mon projet</Link>
        </div>
      )}
    </header>
  );
}
