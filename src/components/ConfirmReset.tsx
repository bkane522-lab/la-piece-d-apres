"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ConfirmReset() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const remembered = window.sessionStorage.getItem("lpda_recovery_email");
    if (remembered) setEmail(remembered);
  }, []);

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedToken = token.replace(/\s+/g, "").trim();
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedToken,
        type: "recovery",
      });
      if (error) throw error;

      window.sessionStorage.setItem("lpda_recovery_email", normalizedEmail);
      setSuccess(true);
      setMessage("Code vérifié. Ouverture de l’écran sécurisé…");
      window.setTimeout(() => {
        window.location.replace("/reinitialisation-mot-de-passe");
      }, 350);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (/expired/i.test(raw)) {
        setMessage("Ce code a expiré. Demandez-en un nouveau ci-dessous.");
      } else if (/invalid|token|otp/i.test(raw)) {
        setMessage("Code invalide. Utilisez le code du dernier e-mail reçu.");
      } else {
        setMessage(raw || "Vérification impossible pour le moment.");
      }
      setBusy(false);
    }
  }

  async function resend() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage("Saisissez d’abord votre adresse e-mail.");
      return;
    }

    setResending(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) throw error;
      window.sessionStorage.setItem("lpda_recovery_email", normalizedEmail);
      setToken("");
      setMessage("Un nouveau code vient d’être envoyé. Utilisez uniquement le dernier code reçu.");
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
        <h1>Entrez le code reçu</h1>
        <p>
          Aucun lien à ouvrir : saisissez simplement le code reçu par e-mail. Cette méthode évite les
          problèmes de liens réécrits par les services de messagerie.
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
            Code de réinitialisation
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
            <Link href="/connexion">Retour à la connexion</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
