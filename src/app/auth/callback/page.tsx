"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Validation de votre connexion…");
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        window.location.replace(url.searchParams.get("next") || "/espace-client");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Connexion impossible.");
      }
    })();
  }, []);
  return <main className="account-page"><div className="shell narrow"><h1>Connexion</h1><p>{message}</p></div></main>;
}
