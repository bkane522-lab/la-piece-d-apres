import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Garantit qu'on dispose d'un id de projet réellement accessible (RLS) avant
 * d'ouvrir la porte ou la caméra. Si le projet demandé n'existe pas ou
 * n'appartient pas à l'utilisateur, un nouveau brouillon est créé
 * silencieusement plutôt que d'afficher une erreur bloquante.
 * Redirige vers /connexion si aucune session valide.
 */
export async function ensureAccessibleProject(requestedId: string): Promise<string | null> {
  const s = getSupabaseBrowserClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) { window.location.href = "/connexion"; return null; }

  const { data: existing } = await s.from("projects").select("id").eq("id", requestedId).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await s.from("projects")
    .insert({ user_id: user.id, title: "Ma pièce", status: "draft" })
    .select("id").single();
  if (error || !created) { window.location.href = "/espace-client/pieces"; return null; }
  return created.id;
}
