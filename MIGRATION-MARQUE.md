# Migration de marque

Migration effectuée de l’ancienne identité « The Lemon Tree » vers **La Pièce d’Après**.

## Identité active
- Nom : La Pièce d’Après
- Signature : Intérieur sur mesure, espaces qui vous ressemblent.
- Logo principal : `public/brand/logo-primary.png`
- Configuration centrale : `src/config/brand.ts`
- Palette : voir `src/config/brand.ts` et `src/app/(public)/globals.css`

## Nettoyage effectué
- anciennes références textuelles à The Lemon Tree supprimées ;
- anciens noms de package et de cache PWA remplacés ;
- ancien chemin `lemontree.png` supprimé du service worker ;
- anciens fichiers de logo Lemon Tree retirés du livrable ;
- tous les emplacements de logo utilisent le logo validé actuel.

Le nom du dépôt GitHub et les noms de projets Supabase/Vercel doivent être renommés manuellement dans les interfaces correspondantes si nécessaire.
