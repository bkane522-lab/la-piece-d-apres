"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SHOT_TYPES, decodeCaption, summarizeRoom } from "@/lib/roomIntelligence";
import type { InspirationOptions, InspirationDirection } from "@/lib/ai/types";

type P = {
  id: string; title: string; status: string; city: string | null; service_type: string | null; updated_at: string;
  room_type: string | null; surface: number | null; surface_unit: string; budget_range: string | null;
};
type ImgFile = { id: string; storage_bucket: string; storage_path: string; original_name: string; category: string | null; caption: string | null };
type Inspiration = { id: string; created_at: string; provider: string; metadata: { options?: InspirationOptions; directions?: InspirationDirection[] } };

const DEFAULT_OPTIONS: InspirationOptions = { keepStructure: true, keepSelectedFurniture: true, changeColorsAndMaterials: true, proposeNewLayout: false };
const STATUS_LABELS: Record<InspirationDirection["status"], string> = { pending: "En attente", keep: "Garder", modify: "Modifier", reject: "Rejeter", added: "Ajouté au projet" };

export function AdminPanel() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<P[]>([]);
  const [msg, setMsg] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [images, setImages] = useState<(ImgFile & { url: string })[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [options, setOptions] = useState<InspirationOptions>(DEFAULT_OPTIONS);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = getSupabaseBrowserClient();
        const { data: { user } } = await s.auth.getUser();
        if (!user) { location.href = "/connexion"; return; }
        const { data: profile } = await s.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "admin") { setAllowed(false); return; }
        setAllowed(true);
        const { data, error } = await s.from("projects").select("id,title,status,city,service_type,updated_at,room_type,surface,surface_unit,budget_range").order("updated_at", { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible"); }
    })();
  }, []);

  async function toggleProject(projectId: string) {
    if (expandedId === projectId) { setExpandedId(null); return; }
    setExpandedId(projectId); setImages([]); setInspirations([]); setAnswers({}); setSelectedImageId(null); setOptions(DEFAULT_OPTIONS); setLoadingPanel(true); setMsg("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: files, error: fErr } = await s.from("project_files").select("id,storage_bucket,storage_path,original_name,category,caption").eq("project_id", projectId).eq("file_type", "image");
      if (fErr) throw fErr;
      const withUrls = await Promise.all((files || []).map(async f => {
        const { data: signed } = await s.storage.from(f.storage_bucket).createSignedUrl(f.storage_path, 3600);
        return { ...f, url: signed?.signedUrl || "" };
      }));
      setImages(withUrls);
      const { data: ansRows } = await s.from("project_answers").select("section,question_key,answer_json").eq("project_id", projectId);
      const map: Record<string, string> = {};
      (ansRows || []).forEach(r => { map[`${r.section}:${r.question_key}`] = (r.answer_json as { value?: string })?.value || ""; });
      setAnswers(map);
      const { data: insp, error: iErr } = await s.from("ai_inspirations").select("id,created_at,provider,metadata").eq("project_id", projectId).order("created_at", { ascending: false });
      if (iErr) throw iErr;
      setInspirations((insp || []) as Inspiration[]);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible"); }
    finally { setLoadingPanel(false); }
  }

  async function generate(projectId: string) {
    if (!selectedImageId) return;
    setGenerating(true); setMsg("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: { session } } = await s.auth.getSession();
      if (!session) throw new Error("Session expirée.");
      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ projectId, fileId: selectedImageId, options }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Génération impossible");
      setInspirations(prev => [json.inspiration, ...prev]);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Génération impossible"); }
    finally { setGenerating(false); }
  }

  async function setDirectionStatus(inspirationId: string, index: number, status: InspirationDirection["status"]) {
    const insp = inspirations.find(i => i.id === inspirationId);
    if (!insp?.metadata?.directions) return;
    const directions = insp.metadata.directions.map((d, i) => (i === index ? { ...d, status } : d));
    const nextMetadata = { ...insp.metadata, directions };
    setInspirations(prev => prev.map(i => (i.id === inspirationId ? { ...i, metadata: nextMetadata } : i)));
    try {
      const s = getSupabaseBrowserClient();
      const { error } = await s.from("ai_inspirations").update({ metadata: nextMetadata }).eq("id", inspirationId);
      if (error) throw error;
    } catch (e) { setMsg(e instanceof Error ? e.message : "Mise à jour impossible"); }
  }

  if (allowed === null) return <div className="dashboard-state">Vérification de l’accès…</div>;
  if (!allowed) return <main className="account-page"><div className="shell narrow"><h1>Accès réservé</h1><p>Cette page est réservée à l’administration.</p></div></main>;

  return (
    <main className="admin-page">
      <div className="shell">
        <p className="eyebrow">Administration</p>
        <h1>Pilotage des projets</h1>
        <p className="page-lead">Table de travail privée : dossier client, Room Intelligence et AI Inspiration Studio.</p>
        {msg && <p className="form-message">{msg}</p>}
        <div className="admin-stats">
          <div><strong>{projects.length}</strong><span>projets</span></div>
          <div><strong>{projects.filter(p => !["completed", "archived"].includes(p.status)).length}</strong><span>actifs</span></div>
          <div><strong>{projects.filter(p => p.status === "to_review").length}</strong><span>à vérifier</span></div>
        </div>
        <div className="project-list">
          {projects.map(p => {
            const photosForSummary = expandedId === p.id ? images.map(f => { const d = decodeCaption(f.caption); return { shotType: f.category || "", tag: d.tag, note: d.note }; }) : [];
            const summary = expandedId === p.id ? summarizeRoom(p, photosForSummary, answers) : null;
            return (
              <article className="project-row clickable" key={p.id} onClick={() => toggleProject(p.id)}>
                <div>
                  <span className="status-pill">{p.status}</span>
                  <h2>{p.title}</h2>
                  <p>{[p.service_type, p.city].filter(Boolean).join(" · ")}</p>

                  {expandedId === p.id && (
                    <div className="detail-card" onClick={e => e.stopPropagation()}>
                      {loadingPanel && <p>Chargement…</p>}

                      {!loadingPanel && summary && (
                        <>
                          <h3>Room Intelligence</h3>
                          <dl className="detail-grid">
                            <div><dt>Pièce</dt><dd>{summary.roomLabel}</dd></div>
                            {summary.surfaceLabel && <div><dt>Surface</dt><dd>{summary.surfaceLabel}</dd></div>}
                            {summary.budgetLabel && <div><dt>Budget</dt><dd>{summary.budgetLabel}</dd></div>}
                            {summary.style && <div><dt>Style</dt><dd>{summary.style}</dd></div>}
                            {summary.ambiance && <div><dt>Ambiance</dt><dd>{summary.ambiance}</dd></div>}
                            {summary.colorsLiked && <div><dt>Couleurs appréciées</dt><dd>{summary.colorsLiked}</dd></div>}
                            {summary.colorsRefused && <div><dt>Couleurs refusées</dt><dd>{summary.colorsRefused}</dd></div>}
                            {summary.materials && <div><dt>Matières</dt><dd>{summary.materials}</dd></div>}
                            <div><dt>Photos</dt><dd>{summary.photosCaptured}/{summary.photosTotal}</dd></div>
                          </dl>
                          {summary.toKeep.length > 0 && <p><strong>À conserver :</strong> {summary.toKeep.join(", ")}</p>}
                          {summary.toChange.length > 0 && <p><strong>À changer :</strong> {summary.toChange.join(", ")}</p>}
                          {summary.needs && <p><strong>Besoins :</strong> {summary.needs}</p>}
                          {summary.constraints && <p><strong>Contraintes :</strong> {summary.constraints}</p>}
                        </>
                      )}

                      <h3>Photos du client</h3>
                      {!loadingPanel && images.length === 0 && <p>Aucune photo envoyée par le client pour l’instant.</p>}
                      <div className="file-grid">
                        {images.map(img => (
                          <article className={`file-card${selectedImageId === img.id ? " selected" : ""}`} key={img.id} onClick={() => setSelectedImageId(img.id)}>
                            {img.url && <img src={img.url} alt={img.original_name} />}
                            <p>{SHOT_TYPES.find(s => s.key === img.category)?.label || img.original_name}</p>
                          </article>
                        ))}
                      </div>

                      <h3>✨ AI Inspiration Studio</h3>
                      <p className="saving-hint">Pistes créatives générées pour assister le professionnel. Validation et conception finale par le décorateur.</p>
                      {!selectedImageId && <p>Sélectionnez une photo ci-dessus pour générer des pistes.</p>}
                      {selectedImageId && (
                        <div className="ai-studio-options">
                          <label className="tag-choice"><input type="checkbox" checked={options.keepStructure} onChange={e => setOptions(o => ({ ...o, keepStructure: e.target.checked }))} /> Conserver la structure</label>
                          <label className="tag-choice"><input type="checkbox" checked={options.keepSelectedFurniture} onChange={e => setOptions(o => ({ ...o, keepSelectedFurniture: e.target.checked }))} /> Conserver le mobilier sélectionné</label>
                          <label className="tag-choice"><input type="checkbox" checked={options.changeColorsAndMaterials} onChange={e => setOptions(o => ({ ...o, changeColorsAndMaterials: e.target.checked }))} /> Changer couleurs et matières</label>
                          <label className="tag-choice"><input type="checkbox" checked={options.proposeNewLayout} onChange={e => setOptions(o => ({ ...o, proposeNewLayout: e.target.checked }))} /> Proposer un nouvel aménagement</label>
                          <div className="row-actions">
                            <button type="button" className="button-primary" disabled={generating} onClick={() => generate(p.id)}>
                              {generating ? "Génération…" : "✨ Générer des pistes d’inspiration"}
                            </button>
                          </div>
                        </div>
                      )}

                      {inspirations.map(insp => (
                        <div className="ai-directions" key={insp.id}>
                          <p className="saving-hint">{new Date(insp.created_at).toLocaleString("fr-FR")} — {insp.provider === "mock" ? "aperçu de démonstration" : insp.provider}</p>
                          <div className="capture-grid">
                            {(insp.metadata.directions || []).map((d, i) => (
                              <article className="capture-card" key={d.name + i}>
                                <h3>{d.name}</h3>
                                <p>{d.description}</p>
                                <p><strong>Palette :</strong> {d.palette}</p>
                                <p><strong>Matières :</strong> {d.materials}</p>
                                <p><strong>Agencement :</strong> {d.layoutIdeas}</p>
                                <p><strong>Éclairage :</strong> {d.lighting}</p>
                                <p className="saving-hint">{d.recommendations}</p>
                                <div className="row-actions">
                                  {(["keep", "modify", "reject", "added"] as const).map(st => (
                                    <button key={st} type="button" className={`text-button-inline${d.status === st ? " active" : ""}`} onClick={() => setDirectionStatus(insp.id, i, st)}>
                                      {STATUS_LABELS[st]}
                                    </button>
                                  ))}
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <time>{new Date(p.updated_at).toLocaleDateString("fr-FR")}</time>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
