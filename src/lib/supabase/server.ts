import { createClient } from "@supabase/supabase-js";

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Variables Supabase publiques manquantes.");
  return { url, key };
}

export function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase serveur manquantes.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function getSupabaseAnonServerClient() {
  const { url, key } = getPublicSupabaseConfig();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Client serveur agissant avec le JWT de l’utilisateur : RLS + Storage restent actifs. */
export function getSupabaseUserServerClient(token: string) {
  const { url, key } = getPublicSupabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function getOpenAIKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("La clé OPENAI_API_KEY n’est pas configurée dans les variables d’environnement Vercel.");
  return key;
}
