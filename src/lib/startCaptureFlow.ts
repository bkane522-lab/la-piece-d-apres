import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Point d’entrée unique de la capture.
 * L’accueil montre déjà la porte : on ne renvoie donc plus vers /entree/[id],
 * afin d’éviter une deuxième porte / un deuxième clic.
 */
export async function startCaptureFlow(): Promise<void> {
  const s = getSupabaseBrowserClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) {
    window.location.href = "/connexion";
    return;
  }

  const { data: active } = await s
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (active?.id) {
    window.location.href = `/capturer/${active.id}`;
    return;
  }

  const { data: created, error } = await s
    .from("projects")
    .insert({ user_id: user.id, title: "Ma pièce", status: "draft" })
    .select("id")
    .single();

  if (error || !created?.id) {
    window.location.href = "/espace-client/pieces";
    return;
  }

  window.location.href = `/capturer/${created.id}`;
}
