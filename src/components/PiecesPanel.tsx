"use client";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { services, budgetRanges } from "@/config/project";

type Project = { id: string; title: string; status: string; service_type: string | null; city: string | null; updated_at: string };
type FileCounts = Record<string, number>;
const labels: Record<string, string> = { draft: "Brouillon", submitted: "Dossier envoyé", received: "Dossier reçu", to_review: "À vérifier", waiting_for_information: "Informations attendues", under_analysis: "Analyse en cours", appointment_required: "Rendez-vous à programmer", appointment_confirmed: "Rendez-vous confirmé", proposal_in_progress: "Proposition en préparation", proposal_available: "Proposition disponible", changes_requested: "Modifications demandées", approved: "Projet validé", completed: "Projet terminé", archived: "Archivé" };

export function PiecesPanel() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [service, setService] = useState<(typeof services)[number]>(services[0]);
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState<(typeof budgetRanges)[number]>(budgetRanges[6]);
  const [message, setMessage] = useState("");
  const [fileCounts, setFileCounts] = useState<FileCounts>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function load() {
    try {
      const s = getSupabaseBrowserClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) { window.location.href = "/connexion"; return; }
      const { data, error } = await s.from("projects").select("id,title,status,service_type,city,updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      setProjects(data || []);
      const { data: files } = await s.from("project_files").select("project_id");
      const counts: FileCounts = {};
      (files || []).forEach(f => { counts[f.project_id] = (counts[f.project_id] || 0) + 1; });
      setFileCounts(counts);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Chargement impossible."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function uploadPhoto(projectId: string, file: File) {
    setUploadingId(projectId); setMessage("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: { session } } = await s.auth.getSession();
      if (!session) throw new Error("Session expirée.");
      const body = new FormData();
      body.append("file", file); body.append("projectId", projectId); body.append("bucket", "project-images");
      const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible.");
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Envoi impossible."); }
    finally { setUploadingId(null); }
  }

  async function create(e: FormEvent) {
    e.preventDefault(); setMessage("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) throw new Error("Session expirée.");
      const { error } = await s.from("projects").insert({ user_id: user.id, title, service_type: service, city: city || null, budget_range: budget, status: "draft" });
      if (error) throw error;
      setTitle(""); setCity(""); setShow(false); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Création impossible."); }
  }

  if (loading) return <div className="dashboard-state">Chargement de vos pièces…</div>;
  return (
    <main className="app-page">
      <div className="shell">
        <div className="app-page-head">
          <div><p className="eyebrow">Vos dossiers</p><h1>Mes pièces</h1></div>
          <button className="button-primary" onClick={() => setShow(!show)}>+ Nouveau projet</button>
        </div>
        {message && <p className="form-message">{message}</p>}
        {show && (
          <form className="form-card compact" onSubmit={create}>
            <h2>Nouveau projet</h2>
            <label>Nom du projet<input required placeholder="Ex. Salon — maison familiale" value={title} onChange={e => setTitle(e.target.value)} /></label>
            <div className="form-grid">
              <label>Prestation<select value={service} onChange={e => setService(e.target.value as typeof service)}>{services.map(s => <option key={s}>{s}</option>)}</select></label>
              <label>Ville<input value={city} onChange={e => setCity(e.target.value)} /></label>
            </div>
            <label>Budget indicatif<select value={budget} onChange={e => setBudget(e.target.value as typeof budget)}>{budgetRanges.map(b => <option key={b}>{b}</option>)}</select></label>
            <button className="button-primary">Créer le brouillon</button>
          </form>
        )}
        <div className="project-list">
          {projects.length === 0 ? (
            <div className="empty-card"><h2>Aucun projet pour le moment</h2><p>Créez votre premier dossier pour commencer.</p></div>
          ) : projects.map(p => (
            <article className="project-row clickable" key={p.id} onClick={() => { window.location.href = `/espace-client/projets/${p.id}`; }}>
              <div>
                <span className="status-pill">{labels[p.status] || p.status}</span>
                <h2>{p.title}</h2>
                <p>{[p.service_type, p.city].filter(Boolean).join(" · ") || "Projet en préparation"}</p>
                <label className="text-button-inline file-upload-label" onClick={e => e.stopPropagation()}>
                  {uploadingId === p.id ? "Envoi…" : `Ajouter une photo (${fileCounts[p.id] || 0})`}
                  <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={uploadingId === p.id}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(p.id, f); e.target.value = ""; }} style={{ display: "none" }} />
                </label>
              </div>
              <time>{new Date(p.updated_at).toLocaleDateString("fr-FR")}</time>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
