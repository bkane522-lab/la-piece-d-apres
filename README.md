# La Pièce d’Après

Application web de décoration et d’aménagement intérieur : site public, comptes clients, suivi de projets, espace administrateur et intégration Supabase.

## Démarrage

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Copier `.env.example` vers `.env.local` et renseigner les variables Supabase avant de tester l’authentification et les données.

## Variables Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement, ne jamais exposer)
- `NEXT_PUBLIC_SITE_URL`

## Supabase

Le dossier `/supabase` contient le schéma de référence. Le projet Supabase déjà configuré dans le dashboard reste la source de vérité pour les tables et policies réellement appliquées.

## Important

Les coordonnées légales et de contact ne sont pas inventées. Compléter `src/config/brand.ts` avant la mise en production commerciale.
