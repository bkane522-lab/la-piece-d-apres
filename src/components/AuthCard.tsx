"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/espace-client";
    } catch (e) { setMessage(e instanceof Error ? e.message : "Connexion impossible."); }
    finally { setBusy(false); }
  }

  return <form className="form-card" onSubmit={submit}>
    <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></label>
    <label>Mot de passe<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" /></label>
    {message && <p className="form-message">{message}</p>}
    <button className="button-primary" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button>
    <div className="form-links"><Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link><Link href="/inscription">Créer un compte</Link></div>
  </form>;
}

export function SignupCard() {
  const [firstName,setFirstName]=useState(""); const [lastName,setLastName]=useState("");
  const [email,setEmail]=useState(""); const [phone,setPhone]=useState(""); const [password,setPassword]=useState("");
  const [accepted,setAccepted]=useState(false); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault(); if(!accepted){setMessage("Vous devez accepter les conditions d’utilisation.");return;} setBusy(true);setMessage("");
    try { const supabase=getSupabaseBrowserClient();
      const {error}=await supabase.auth.signUp({email,password,options:{data:{first_name:firstName,last_name:lastName,phone}}}); if(error)throw error;
      setMessage("Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.");
    } catch(e){setMessage(e instanceof Error?e.message:"Inscription impossible.");} finally{setBusy(false);} }
  return <form className="form-card" onSubmit={submit}>
    <div className="form-grid"><label>Prénom<input required value={firstName} onChange={e=>setFirstName(e.target.value)} /></label><label>Nom<input required value={lastName} onChange={e=>setLastName(e.target.value)} /></label></div>
    <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></label>
    <label>Téléphone<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} /></label>
    <label>Mot de passe<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" /></label>
    <label className="check-row"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} /> <span>J’accepte les <Link href="/conditions-utilisation">conditions d’utilisation</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.</span></label>
    {message && <p className="form-message">{message}</p>}
    <button className="button-primary" disabled={busy}>{busy?"Création…":"Créer mon compte"}</button>
    <div className="form-links"><Link href="/auth/confirm-signup">J’ai déjà reçu mon code</Link></div>
  </form>;
}

export function ResetRequestCard(){const[email,setEmail]=useState("");const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{const s=getSupabaseBrowserClient();const{error}=await s.auth.resetPasswordForEmail(email);if(error)throw error;setMessage("Si cette adresse existe, un code de réinitialisation vient d’être envoyé.");}catch(e){setMessage(e instanceof Error?e.message:"Envoi impossible.");}finally{setBusy(false)}}
 return <form className="form-card" onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>{message&&<p className="form-message">{message}</p>}<button className="button-primary" disabled={busy}>{busy?"Envoi…":"Recevoir le code"}</button><div className="form-links"><Link href="/auth/reset-password">J’ai déjà reçu mon code</Link></div></form>}

export function NewPasswordCard(){const[password,setPassword]=useState("");const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{const s=getSupabaseBrowserClient();const{error}=await s.auth.updateUser({password});if(error)throw error;setMessage("Votre mot de passe a été mis à jour. Vous pouvez vous connecter.");}catch(e){setMessage(e instanceof Error?e.message:"Mise à jour impossible.");}finally{setBusy(false)}}
 return <form className="form-card" onSubmit={submit}><label>Nouveau mot de passe<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} /></label>{message&&<p className="form-message">{message}</p>}<button className="button-primary" disabled={busy}>{busy?"Mise à jour…":"Enregistrer"}</button></form>}
