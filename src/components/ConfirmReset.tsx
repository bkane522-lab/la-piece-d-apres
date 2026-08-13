"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ConfirmReset() {
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
        type: "recovery",
      });
      if (error) throw error;
      setSuccess(true);
      setMessage("Code vérifié. Redirection…");
      window.setTimeout(() => window.location.replace("/reinitialisation-mot-de-passe"), 700);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (/expired/i.test(raw)) {
        setMessage("Ce code a expiré. Utilisez le bouton « Renvoyer un code » ci-dessous.");
      } else if (/invalid|token/i.test(raw)) {
        setMessage("Code invalide. Vérifiez le code reçu dans votre dernier e-mail.");
      } else {
        setMessage(raw || "Vérification impossible pour le moment.");
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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
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
        <p className="eyebrow">Sécurité</p>
        <h1>Réinitialiser votre mot de passe</h1>
        <p>
          Saisissez votre adresse e-mail et le code reçu. Cette méthode évite les liens qui peuvent être
          modifiés en cours de route par certains services d’envoi d’e-mail.
        </p>

        <form className="form-card" onSubmit={confirm}>
          <label>
            Adresse e-mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>

          <label>
            Code reçu par e-mail
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
            {busy ? "Vérification…" : success ? "Code vérifié" : "Continuer"}
          </button>

          {!success && (
            <button className="button-secondary" type="button" onClick={resend} disabled={resending}>
              {resending ? "Envoi…" : "Renvoyer un code"}
            </button>
          )}

          <div className="form-links">
            <Link href="/connexion">Se connecter</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
