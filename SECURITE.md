# Sécurité

- Les droits de données reposent sur les policies RLS Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être placée dans un fichier public, GitHub ou une variable `NEXT_PUBLIC_*`.
- L’API `/api/upload` vérifie le token utilisateur, la propriété du projet, le type et la taille du fichier avant d’utiliser la clé service côté serveur.
- Buckets attendus : `project-images`, `project-documents`, `avatars`, tous privés.
- Les rôles administrateur sont vérifiés depuis `profiles.role`, pas depuis les métadonnées modifiables par le client.
