# Audit final — La Pièce d’Après

## Corrections appliquées lors de cet audit technique (dernière passe)

Cette passe a été faite par audit de code réel (lecture fichier par fichier, résolution de tous les imports, exécution de scripts de vérification), pas par relecture de la documentation précédente. Les points ci-dessous étaient **faux ou cassés** dans le ZIP reçu, malgré ce qu'affirmaient les rapports précédents :

- **Bug bloquant** : `src/app/api/upload/page.tsx` (fichier vide) coexistait avec `src/app/api/upload/route.ts` dans le même segment de route. Next.js interdit `page` et `route` sur le même chemin ⇒ le build aurait échoué. Fichier vide supprimé, `route.ts` conservé.
- **Bug bloquant** : même conflit sur `src/app/auth/callback/` (`page.tsx` réel + `route.ts` vide). `route.ts` vide supprimé, `page.tsx` conservé.
- **Bug fonctionnel majeur** : `src/app/espace-client/page.tsx` était **vide**. Le composant `ClientSpace` (vue projets, création de brouillon) existait bien dans `src/components/` mais n'était jamais monté sur la route — `/espace-client` n'affichait donc rien. Corrigé (le fichier importe et rend désormais `ClientSpace`).
- **Faux dans COMPTE-RENDU-MIGRATION.md / MIGRATION-MARQUE.md** : ces documents affirmaient que `lemontree.png` et `lemontree-dark.png` avaient été retirés du livrable. Ils étaient toujours présents dans `public/brand/`. Supprimés.
- **Fichier orphelin** : `src/app/(public)/globals.css` (261 lignes) n'était importé nulle part — seul `src/app/globals.css` (277 lignes, plus complet) est chargé par le root layout. L'orphelin était une version plus ancienne et incomplète, source de confusion. Supprimé.
- **`npm test` cassé** : `package.json` référence `node tests/smoke.mjs`, mais ce fichier n'existait pas dans le ZIP — `npm test` échouait immédiatement (`MODULE_NOT_FOUND`), contrairement à ce qu'affirmait la version précédente de ce document. Le script a été réécrit et vérifie maintenant réellement : root layout unique avec `<html>`/`<body>`, absence de conflit page/route, absence de page ou route essentielle vide, absence de référence textuelle à l'ancienne marque dans le code, convention unique `SUPABASE_SERVICE_ROLE_KEY` dans `.env.example`, absence de clé `service_role` dans un fichier `"use client"`, et un seul module serveur centralisant cette clé.
- Fichiers `gitkeep` sans point (donc non traités comme fichiers cachés par convention) normalisés en `.gitkeep`, et les `gitkeep` devenus inutiles (dossiers publics ayant désormais un vrai `page.tsx`) supprimés.

## Points déjà corrects, vérifiés à nouveau ici (aucun changement)

- `src/app/layout.tsx` est bien l'unique root layout avec `<html>`/`<body>` ; aucun layout imbriqué ne le redéfinit.
- Toutes les pages publiques existent avec un contenu réel (accueil, prestations, à propos, comment ça marche, contact, réalisations).
- Les pages d'authentification utilisent Supabase côté navigateur.
- L'espace admin vérifie `profiles.role === 'admin'` avant d'afficher les projets.
- `/api/upload` vérifie le token, la propriété du projet, le type MIME et la taille avant l'upload.
- La marque reste centralisée dans `src/config/brand.ts`, sans donnée d'entreprise inventée.
- `supabase/policies.sql` : RLS activée sur toutes les tables concernées, via une fonction `is_admin()` `security definer` propre — cohérent avec les schémas.
- Convention unique `SUPABASE_SERVICE_ROLE_KEY`, lue depuis un seul module serveur (`src/lib/supabase/server.ts`).

## Ce qui a été réellement vérifié dans cet environnement d'audit (et comment)

- **Résolution de tous les imports locaux** (`@/...` et relatifs) sur les 35 fichiers `.ts`/`.tsx` du dossier `src/` : tous résolvent vers un fichier existant.
- **Analyse syntaxique complète** des 35 fichiers `.ts`/`.tsx` via le parseur TypeScript (`ts.createSourceFile`) : 0 erreur de syntaxe. Ce n'est **pas** un typecheck complet (les types des dépendances comme `next`, `react`, `@supabase/supabase-js` ne sont pas vérifiés, faute d'accès registre npm dans cet environnement), seulement une garantie que chaque fichier est syntaxiquement valide.
- **`npm test`** : exécuté avec succès après réécriture de `tests/smoke.mjs` (0 dépendance requise).
- **Recherche exhaustive** des anciennes références "lemontree" / "Lemon Tree" dans le code applicatif (`.ts`, `.tsx`, `.css`, `.json`, manifest) : aucune trouvée.

## Ce qui n'a PAS pu être vérifié ici (à faire avant mise en production)

`npm install` échoue dans cet environnement (`403 Forbidden` sur `registry.npmjs.org` — accès réseau désactivé côté audit), donc **`npm run typecheck`, `npm run build` et `npm run lint` n'ont pas pu être exécutés** avec les vraies dépendances (`next`, `react`, `@supabase/supabase-js`, `zod`, `lucide-react`, `typescript`). Cela ne prouve ni un succès ni un échec du build réel — ces trois commandes doivent être lancées sur un poste avec accès npm normal, ou laissées à Vercel, avant toute mise en production. Aucun test d'exécution réelle (auth Supabase, upload de fichier, rendu dans un navigateur) n'a été fait — seule l'analyse statique du code source a été possible ici.

## Avant production

Renseigner dans Vercel :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Puis compléter `src/config/brand.ts` avec les coordonnées légales et de contact réelles de l’entreprise.
