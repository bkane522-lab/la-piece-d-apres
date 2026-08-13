"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Status = "ready" | "missing_token" | "verifying" | "error";

export function ConfirmReset({ tokenHash }: { tokenHash: string }) {
  const cleanToken = decodeURIComponent(tokenHash || "").trim();
  const [status, setStatus] = useState<Status>(cleanToken ? "ready" : "missing_token");
  const [message, setMessage] = useState(cleanToken ? "" : "Ce lien de réinitialisation est incomplet ou invalide.");

  async function confirm() {
    setStatus("verifying");
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: cleanToken, type: "recovery" });
      if (error) throw error;
      window.location.replace("/reinitialisation-mot-de-passe");
    } catch (err) {
      setStatus("error");
      const raw = err instanceof Error ? err.message : "";
      if (/expired/i.test(raw)) setMessage("Ce lien a expiré. Redemandez une réinitialisation.");
      else if (/invalid|already|used/i.test(raw)) setMessage("Ce lien est invalide ou a déjà été utilisé.");
      else setMessage(raw || "Confirmation impossible pour le moment.");
    }
  }

  return (
    <main className="account-page">
      <div className="shell narrow">
        <p className="eyebrow">Sécurité</p>
        <h1>Réinitialiser votre mot de passe</h1>

        {status === "ready" && (
          <>
            <p>Cliquez pour confirmer et choisir un nouveau mot de passe.</p>
            <button className="button-primary" onClick={confirm}>Continuer</button>
          </>
        )}

        {status === "verifying" && <p>Vérification en cours…</p>}

        {(status === "error" || status === "missing_token") && (
          <>
            <p className="form-message">{message}</p>
            <div className="form-links">
              <Link href="/mot-de-passe-oublie">Redemander un lien</Link>
              <Link href="/connexion">Se connecter</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
