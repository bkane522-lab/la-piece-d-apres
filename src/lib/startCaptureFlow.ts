import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export async function startCaptureFlow(): Promise<void> {
  const s = getSupabaseBrowserClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) { window.location.href = "/connexion"; return; }
  const { data: active } = await s.from("projects").select("id").eq("status", "draft").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (active) { window.location.href = `/entree/${active.id}`; return; }
  const { data: created, error } = await s.from("projects").insert({ user_id: user.id, title: "Ma pièce", status: "draft" }).select("id").single();
  if (error) { window.location.href = "/espace-client/pieces"; return; }
  window.location.href = `/entree/${created.id}`;
}
