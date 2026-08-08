# Configuration Supabase

1. Créer un projet Supabase dédié à La Pièce d’Après.
2. Exécuter les fichiers SQL du dossier `supabase/` dans l’ordre documenté.
3. Vérifier que les buckets `project-images`, `project-documents`, `avatars`, `ai-inspirations` sont privés.
4. Activer la confirmation e-mail selon la politique choisie.
5. Créer le premier administrateur manuellement après inscription d’un compte réel de la propriétaire.

## Premier administrateur
Après création du compte via Supabase Auth, exécuter depuis le SQL Editor avec l’UUID correct :

```sql
update public.profiles set role='admin' where id='UUID_DU_COMPTE';
```

Ne jamais intégrer cet UUID ou un mot de passe au dépôt.
