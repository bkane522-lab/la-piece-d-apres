"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ConfirmSignup() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.replace(/\s+/g, "").trim(),
        type: "email",
      });
      if (error) throw error;
      setSuccess(true);
      setMessage("Votre adresse e-mail est confirmée. Redirection vers votre espace…");
      window.setTimeout(() => window.location.replace("/espace-client"), 900);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (/expired/i.test(raw)) {
        setMessage("Ce code a expiré. Utilisez le bouton « Renvoyer un code » ci-dessous.");
      } else if (/invalid|token/i.test(raw)) {
        setMessage("Code invalide. Vérifiez le code reçu dans votre dernier e-mail.");
      } else {
        setMessage(raw || "Confirmation impossible pour le moment.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email.trim()) {
      setMessage("Saisissez d’abord votre adresse e-mail.");
      return;
    }
    setResending(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (error) throw error;
      setMessage("Un nouveau code vient d’être envoyé. Utilisez uniquement le dernier e-mail reçu.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Impossible de renvoyer le code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="account-page">
      <div className="shell narrow">
        <p className="eyebrow">Inscription</p>
        <h1>Confirmer votre e-mail</h1>
        <p>
          Saisissez votre adresse e-mail et le code de confirmation reçu. Cette méthode évite les liens de confirmation
          qui peuvent être ouverts automatiquement par certains services de messagerie.
        </p>

        <form className="form-card" onSubmit={confirm}>
          <label>
            Adresse e-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Code de confirmation
            <input
              inputMode="numeric"
              required
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              autoComplete="one-time-code"
              placeholder="Code reçu par e-mail"
            />
          </label>

          {message && <p className="form-message">{message}</p>}

          <button className="button-primary" type="submit" disabled={busy || success}>
            {busy ? "Confirmation…" : success ? "Adresse confirmée" : "Confirmer mon compte"}
          </button>

          {!success && (
            <button className="button-secondary" type="button" onClick={resend} disabled={resending}>
              {resending ? "Envoi…" : "Renvoyer un code"}
            </button>
          )}

          <div className="form-links">
            <Link href="/connexion">Déjà confirmé ? Se connecter</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
