"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { statusLabels, meetingTypeLabels, appointmentStatusLabels, questionnaireSections } from "@/config/project";

type ProjectRow = {
  id: string; title: string; status: string; service_type: string | null; property_type: string | null;
  room_type: string | null; city: string | null; address: string | null; surface: number | null; surface_unit: string;
  description: string | null; budget_range: string | null; desired_date: string | null; urgency: string | null;
  created_at: string; updated_at: string;
};

const TABS = [
  { key: "overview", label: "Vue d’ensemble" },
  { key: "questionnaire", label: "Questionnaire" },
  { key: "measurements", label: "Mesures" },
  { key: "files", label: "Photos et documents" },
  { key: "appointments", label: "Rendez-vous" },
  { key: "messages", label: "Messages" },
  { key: "status", label: "Suivi" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function ProjectDetail({ projectId }: { projectId: string }) {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    (async () => {
      try {
        const s = getSupabaseBrowserClient();
        const { data: { user } } = await s.auth.getUser();
        if (!user) { window.location.href = "/connexion"; return; }
        const { data, error } = await s.from("projects")
          .select("id,title,status,service_type,property_type,room_type,city,address,surface,surface_unit,description,budget_range,desired_date,urgency,created_at,updated_at")
          .eq("id", projectId).maybeSingle();
        if (error) throw error;
        if (!data) { setState("denied"); return; }
        setProject(data);
        setState("ready");
      } catch { setState("denied"); }
    })();
  }, [projectId]);

  if (state === "loading") return <div className="dashboard-state">Chargement du dossier…</div>;
  if (state === "denied" || !project) return (
    <main className="account-page"><div className="shell narrow">
      <h1>Dossier introuvable</h1>
      <p>Ce projet n’existe pas ou vous n’y avez pas accès.</p>
      <Link href="/espace-client" className="back-link">← Retour à mes projets</Link>
    </div></main>
  );

  return (
    <div className="dashboard">
      <aside className="dashboard-side">
        <div><p className="eyebrow">Dossier</p><strong>{project.title}</strong></div>
        <nav className="project-detail-nav">
          {TABS.map(t => (
            <button key={t.key} className={`tab-link${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </nav>
        <Link href="/espace-client" className="text-button">← Mes projets</Link>
      </aside>
      <section className="dashboard-main">
        <div className="dashboard-head">
          <div><p className="eyebrow">{statusLabels[project.status] || project.status}</p><h1>{project.title}</h1></div>
        </div>
        {tab === "overview" && <OverviewTab project={project} />}
        {tab === "questionnaire" && <QuestionnaireTab projectId={project.id} />}
        {tab === "measurements" && <MeasurementsTab projectId={project.id} />}
        {tab === "files" && <FilesTab projectId={project.id} />}
        {tab === "appointments" && <AppointmentsTab projectId={project.id} />}
        {tab === "messages" && <MessagesTab projectId={project.id} />}
        {tab === "status" && <StatusTab projectId={project.id} currentStatus={project.status} />}
      </section>
    </div>
  );
}

function OverviewTab({ project }: { project: ProjectRow }) {
  const rows: [string, string | null][] = [
    ["Prestation", project.service_type],
    ["Type de logement", project.property_type],
    ["Pièce concernée", project.room_type],
    ["Ville", project.city],
    ["Adresse", project.address],
    ["Surface", project.surface ? `${project.surface} ${project.surface_unit}` : null],
    ["Budget indicatif", project.budget_range],
    ["Date souhaitée", project.desired_date ? new Date(project.desired_date).toLocaleDateString("fr-FR") : null],
    ["Urgence", project.urgency],
  ];
  const filled = rows.filter(([, v]) => v);
  return (
    <div className="detail-card">
      <h2>Vue d’ensemble</h2>
      {project.description && <p className="page-lead">{project.description}</p>}
      {filled.length > 0 && <dl className="detail-grid">{filled.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
      {filled.length === 0 && !project.description && <p>Aucune information complémentaire renseignée.</p>}
    </div>
  );
}

function QuestionnaireTab({ projectId }: { projectId: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const s = getSupabaseBrowserClient();
        const { data, error } = await s.from("project_answers").select("section,question_key,answer_json").eq("project_id", projectId);
        if (error) throw error;
        const map: Record<string, string> = {};
        (data || []).forEach(r => { map[`${r.section}:${r.question_key}`] = (r.answer_json as { value?: string })?.value || ""; });
        setAnswers(map);
      } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible."); }
      finally { setLoading(false); }
    })();
  }, [projectId]);

  async function save(section: string, key: string, value: string) {
    const id = `${section}:${key}`;
    setSavingKey(id);
    try {
      const s = getSupabaseBrowserClient();
      const { error } = await s.from("project_answers")
        .upsert({ project_id: projectId, section, question_key: key, answer_json: { value } }, { onConflict: "project_id,section,question_key" });
      if (error) throw error;
    } catch (e) { setMsg(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { setSavingKey(null); }
  }

  if (loading) return <p>Chargement…</p>;
  return (
    <div className="detail-card">
      <h2>Questionnaire</h2>
      <p className="page-lead">Vos réponses sont enregistrées automatiquement.</p>
      {msg && <p className="form-message">{msg}</p>}
      {questionnaireSections.map(sec => (
        <div key={sec.section} className="questionnaire-section">
          <h3>{sec.label}</h3>
          {sec.questions.map(q => {
            const id = `${sec.section}:${q.key}`;
            return (
              <label key={id}>
                {q.label}
                {q.type === "textarea"
                  ? <textarea rows={3} value={answers[id] || ""} onChange={e => setAnswers(a => ({ ...a, [id]: e.target.value }))} onBlur={e => save(sec.section, q.key, e.target.value)} />
                  : <input value={answers[id] || ""} onChange={e => setAnswers(a => ({ ...a, [id]: e.target.value }))} onBlur={e => save(sec.section, q.key, e.target.value)} />}
                {savingKey === id && <span className="saving-hint">Enregistrement…</span>}
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type Measurement = { id: string; label: string; value: number; unit: string; category: string };

function MeasurementsTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState(""); const [value, setValue] = useState(""); const [unit, setUnit] = useState("cm"); const [category, setCategory] = useState("longueur");

  async function load() {
    try {
      const s = getSupabaseBrowserClient();
      const { data, error } = await s.from("project_measurements").select("id,label,value,unit,category").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      setItems(data || []);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [projectId]);

  function startEdit(m: Measurement) { setEditingId(m.id); setLabel(m.label); setValue(String(m.value)); setUnit(m.unit); setCategory(m.category); }
  function resetForm() { setEditingId(null); setLabel(""); setValue(""); setUnit("cm"); setCategory("longueur"); }

  async function submit(e: FormEvent) {
    e.preventDefault(); setMsg("");
    const numeric = Number(value);
    if (!label || Number.isNaN(numeric) || numeric < 0) { setMsg("Merci de renseigner un libellé et une valeur valide."); return; }
    try {
      const s = getSupabaseBrowserClient();
      if (editingId) { const { error } = await s.from("project_measurements").update({ label, value: numeric, unit, category }).eq("id", editingId); if (error) throw error; }
      else { const { error } = await s.from("project_measurements").insert({ project_id: projectId, label, value: numeric, unit, category }); if (error) throw error; }
      resetForm(); await load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Enregistrement impossible."); }
  }

  async function remove(id: string) {
    try { const s = getSupabaseBrowserClient(); const { error } = await s.from("project_measurements").delete().eq("id", id); if (error) throw error; await load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Suppression impossible."); }
  }

  if (loading) return <p>Chargement…</p>;
  return (
    <div className="detail-card">
      <h2>Mesures</h2>
      {msg && <p className="form-message">{msg}</p>}
      <div className="project-list">
        {items.length === 0 && <p>Aucune mesure enregistrée.</p>}
        {items.map(m => (
          <article className="project-row" key={m.id}>
            <div><h2>{m.label}</h2><p>{m.value} {m.unit} · {m.category}</p></div>
            <div className="row-actions">
              <button className="text-button-inline" onClick={() => startEdit(m)}>Modifier</button>
              <button className="text-button-inline" onClick={() => remove(m.id)}>Supprimer</button>
            </div>
          </article>
        ))}
      </div>
      <form className="form-card compact" onSubmit={submit}>
        <h3>{editingId ? "Modifier la mesure" : "Ajouter une mesure"}</h3>
        <div className="form-grid">
          <label>Libellé<input required value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex. Longueur du mur nord" /></label>
          <label>Valeur<input required type="number" min="0" step="0.1" value={value} onChange={e => setValue(e.target.value)} /></label>
        </div>
        <div className="form-grid">
          <label>Unité<select value={unit} onChange={e => setUnit(e.target.value)}><option value="cm">cm</option><option value="m">m</option><option value="m²">m²</option></select></label>
          <label>Catégorie<select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="longueur">Longueur</option><option value="largeur">Largeur</option><option value="hauteur">Hauteur</option>
            <option value="porte">Porte</option><option value="fenetre">Fenêtre</option><option value="radiateur">Radiateur</option>
            <option value="meuble">Meuble conservé</option><option value="autre">Autre</option>
          </select></label>
        </div>
        <div className="row-actions">
          <button className="button-primary">{editingId ? "Enregistrer" : "Ajouter"}</button>
          {editingId && <button type="button" className="text-button-inline" onClick={resetForm}>Annuler</button>}
        </div>
      </form>
    </div>
  );
}

type FileRow = { id: string; file_type: string; storage_bucket: string; storage_path: string; original_name: string; mime_type: string };

function FilesTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<FileRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const s = getSupabaseBrowserClient();
      const { data, error } = await s.from("project_files").select("id,file_type,storage_bucket,storage_path,original_name,mime_type").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      setItems(data || []);
      const entries = await Promise.all((data || []).map(async f => {
        try { const { data: signed } = await s.storage.from(f.storage_bucket).createSignedUrl(f.storage_path, 3600); return [f.id, signed?.signedUrl || ""] as const; }
        catch { return [f.id, ""] as const; }
      }));
      setUrls(Object.fromEntries(entries));
    } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [projectId]);

  async function upload(file: File, bucket: "project-images" | "project-documents") {
    setUploading(true); setMsg("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: { session } } = await s.auth.getSession();
      if (!session) throw new Error("Session expirée.");
      const body = new FormData();
      body.append("file", file); body.append("projectId", projectId); body.append("bucket", bucket);
      const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible.");
      await load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Envoi impossible."); }
    finally { setUploading(false); }
  }

  async function remove(f: FileRow) {
    try {
      const s = getSupabaseBrowserClient();
      await s.storage.from(f.storage_bucket).remove([f.storage_path]);
      const { error } = await s.from("project_files").delete().eq("id", f.id);
      if (error) throw error;
      await load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Suppression impossible."); }
  }

  if (loading) return <p>Chargement…</p>;
  return (
    <div className="detail-card">
      <h2>Photos et documents</h2>
      {msg && <p className="form-message">{msg}</p>}
      <div className="row-actions">
        <label className="button-primary file-upload-label">{uploading ? "Envoi…" : "Ajouter une photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, "project-images"); e.target.value = ""; }} style={{ display: "none" }} />
        </label>
        <label className="button-secondary file-upload-label">{uploading ? "Envoi…" : "Ajouter un document"}
          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, "project-documents"); e.target.value = ""; }} style={{ display: "none" }} />
        </label>
      </div>
      <div className="file-grid">
        {items.length === 0 && <p>Aucun fichier envoyé pour l’instant.</p>}
        {items.map(f => (
          <article className="file-card" key={f.id}>
            {f.file_type === "image" && urls[f.id] ? <img src={urls[f.id]} alt={f.original_name} /> : <div className="file-icon">{f.mime_type === "application/pdf" ? "PDF" : "DOC"}</div>}
            <p>{f.original_name}</p>
            <div className="row-actions">
              {urls[f.id] && <a href={urls[f.id]} target="_blank" rel="noreferrer" className="text-button-inline">Ouvrir</a>}
              <button className="text-button-inline" onClick={() => remove(f)}>Supprimer</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

type Appointment = { id: string; first_choice: string; meeting_type: string; status: string; admin_comment: string | null; location: string | null };

function AppointmentsTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const s = getSupabaseBrowserClient();
        const { data, error } = await s.from("appointments").select("id,first_choice,meeting_type,status,admin_comment,location").eq("project_id", projectId).order("first_choice", { ascending: false });
        if (error) throw error;
        setItems(data || []);
      } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible."); }
      finally { setLoading(false); }
    })();
  }, [projectId]);
  if (loading) return <p>Chargement…</p>;
  return (
    <div className="detail-card">
      <h2>Rendez-vous</h2>
      {msg && <p className="form-message">{msg}</p>}
      {items.length === 0 ? <p>Aucun rendez-vous pour ce projet.</p> : (
        <div className="project-list">
          {items.map(a => (
            <article className="project-row" key={a.id}>
              <div>
                <span className="status-pill">{appointmentStatusLabels[a.status] || a.status}</span>
                <h2>{new Date(a.first_choice).toLocaleString("fr-FR")}</h2>
                <p>{meetingTypeLabels[a.meeting_type] || a.meeting_type}{a.location ? ` · ${a.location}` : ""}</p>
                {a.admin_comment && <p>{a.admin_comment}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

type Message = { id: string; sender_id: string; message: string; created_at: string };

function MessagesTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState("");

  async function load() {
    try {
      const s = getSupabaseBrowserClient();
      const { data: { user } } = await s.auth.getUser();
      setUserId(user?.id || "");
      const { data, error } = await s.from("project_messages").select("id,sender_id,message,created_at").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      setItems(data || []);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [projectId]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true); setMsg("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) throw new Error("Session expirée.");
      const { error } = await s.from("project_messages").insert({ project_id: projectId, sender_id: user.id, message: text.trim(), is_internal: false });
      if (error) throw error;
      setText(""); await load();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Envoi impossible."); }
    finally { setSending(false); }
  }

  if (loading) return <p>Chargement…</p>;
  return (
    <div className="detail-card">
      <h2>Messages</h2>
      {msg && <p className="form-message">{msg}</p>}
      <div className="notice-list">
        {items.length === 0 && <p>Aucun message pour l’instant.</p>}
        {items.map(m => (
          <article key={m.id} className={m.sender_id === userId ? "message-mine" : ""}>
            <p>{m.message}</p>
            <time>{new Date(m.created_at).toLocaleString("fr-FR")}</time>
          </article>
        ))}
      </div>
      <form className="form-card compact" onSubmit={send}>
        <label>Nouveau message<textarea rows={3} required value={text} onChange={e => setText(e.target.value)} /></label>
        <button className="button-primary" disabled={sending}>{sending ? "Envoi…" : "Envoyer"}</button>
      </form>
    </div>
  );
}

type StatusEntry = { id: string; new_status: string; public_message: string | null; created_at: string };

function StatusTab({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const [items, setItems] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const s = getSupabaseBrowserClient();
        const { data, error } = await s.from("project_status_history").select("id,new_status,public_message,created_at").eq("project_id", projectId).order("created_at", { ascending: false });
        if (error) throw error;
        setItems(data || []);
      } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible."); }
      finally { setLoading(false); }
    })();
  }, [projectId]);
  if (loading) return <p>Chargement…</p>;
  return (
    <div className="detail-card">
      <h2>Suivi du projet</h2>
      <p className="page-lead">Statut actuel : <strong>{statusLabels[currentStatus] || currentStatus}</strong></p>
      {msg && <p className="form-message">{msg}</p>}
      {items.length === 0 ? <p>Aucune étape enregistrée pour l’instant.</p> : (
        <ol className="timeline">
          {items.map(h => (
            <li key={h.id}>
              <strong>{statusLabels[h.new_status] || h.new_status}</strong>
              <time>{new Date(h.created_at).toLocaleDateString("fr-FR")}</time>
              {h.public_message && <p>{h.public_message}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
