import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Garantit qu'on dispose d'un id de projet réellement accessible (RLS + filtre
 * explicite user_id) avant d'ouvrir la porte. Réutilisé uniquement à l'entrée
 * initiale du parcours (EntryGate) — ce n'est PAS un mécanisme général de
 * récupération d'erreur : ne pas l'appeler après l'ouverture de la caméra.
 * Réutilise un brouillon récent existant plutôt que d'en créer un nouveau à
 * chaque appel. Redirige vers /connexion si aucune session valide.
 */
export async function ensureAccessibleProject(requestedId: string): Promise<string | null> {
  const s = getSupabaseBrowserClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) { window.location.href = "/connexion"; return null; }

  const { data: existing } = await s.from("projects").select("id").eq("id", requestedId).eq("user_id", user.id).maybeSingle();
  if (existing) return existing.id;

  // Éviter les brouillons dupliqués : reprendre un brouillon récent existant
  // plutôt que d'en créer un nouveau à chaque appel.
  const { data: recentDraft } = await s.from("projects")
    .select("id").eq("user_id", user.id).eq("status", "draft")
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (recentDraft) return recentDraft.id;

  const { data: created, error } = await s.from("projects")
    .insert({ user_id: user.id, title: "Ma pièce", status: "draft" })
    .select("id").single();
  if (error || !created) { window.location.href = "/espace-client/pieces"; return null; }
  return created.id;
}
