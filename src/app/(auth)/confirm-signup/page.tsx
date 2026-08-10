"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { EmailOtpType } from "@supabase/supabase-js";

type Status = "ready" | "missing_token" | "verifying" | "success" | "error";

export default function ConfirmSignupPage() {
  const [status, setStatus] = useState<Status>("ready");
  const [message, setMessage] = useState("");
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [type, setType] = useState<EmailOtpType | null>(null);
  const [next, setNext] = useState("/espace-client");

  useEffect(() => {
    const url = new URL(window.location.href);
    const th = url.searchParams.get("token_hash");
    const t = url.searchParams.get("type") as EmailOtpType | null;
    setTokenHash(th);
    setType(t);
    setNext(url.searchParams.get("next") || "/espace-client");
    if (!th || !t) {
      setStatus("missing_token");
      setMessage("Ce lien de confirmation est incomplet ou invalide.");
    }
  }, []);

  async function confirm() {
    if (!tokenHash || !type) return;
    setStatus("verifying");
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) throw error;
      setStatus("success");
      setMessage("Votre adresse e-mail est confirmée.");
      setTimeout(() => window.location.replace(next), 1500);
    } catch (err) {
      setStatus("error");
      const raw = err instanceof Error ? err.message : "";
      if (/expired/i.test(raw)) {
        setMessage("Ce lien a expiré. Connectez-vous pour en recevoir un nouveau, ou recommencez l'inscription.");
      } else if (/invalid|already|used/i.test(raw)) {
        setMessage("Ce lien est invalide ou a déjà été utilisé. Votre compte est peut-être déjà confirmé : essayez de vous connecter.");
      } else {
        setMessage(raw || "Confirmation impossible pour le moment.");
      }
    }
  }

  return (
    <main className="account-page">
      <div className="shell narrow">
        <p className="eyebrow">Inscription</p>
        <h1>Confirmer votre e-mail</h1>

        {status === "ready" && (
          <>
            <p>Pour activer votre compte, confirmez votre adresse e-mail.</p>
            <button className="button-primary" onClick={confirm}>Confirmer mon compte</button>
          </>
        )}

        {status === "verifying" && <p>Confirmation en cours…</p>}

        {status === "success" && <p className="form-message">{message} Redirection…</p>}

        {(status === "error" || status === "missing_token") && (
          <>
            <p className="form-message">{message}</p>
            <div className="form-links">
              <Link href="/connexion">Se connecter</Link>
              <Link href="/inscription">Créer un nouveau compte</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

