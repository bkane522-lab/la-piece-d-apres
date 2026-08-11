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
type Answer = { section: string; question_key: string; answer_json: { value?: string } };

const DEFAULT_OPTIONS: InspirationOptions = { keepStructure: true, keepSelectedFurniture: true, changeColorsAndMaterials: true, proposeNewLayout: false };
const STATUS_LABELS: Record<InspirationDirection["status"], string> = { pending: "En attente", keep: "Garder", modify: "Modifier", reject: "Rejeter", added: "Ajouté au projet" };
const STUDIO_TABS = [
  { key: "room", label: "Room Intelligence" },
  { key: "photos", label: "Photos" },
  { key: "brief", label: "Brief" },
  { key: "palette", label: "Palette" },
  { key: "inspiration", label: "Inspiration IA" },
  { key: "projet", label: "Projet" },
] as const;
type StudioTab = (typeof STUDIO_TABS)[number]["key"];

export function AdminPanel() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<P[]>([]);
  const [msg, setMsg] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [studioTab, setStudioTab] = useState<StudioTab>("room");
  const [images, setImages] = useState<(ImgFile & { url: string })[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [rawAnswers, setRawAnswers] = useState<Answer[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [heroImageId, setHeroImageId] = useState<string | null>(null);
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

  async function openStudio(projectId: string) {
    if (openId === projectId) { setOpenId(null); return; }
    setOpenId(projectId); setStudioTab("room"); setImages([]); setInspirations([]); setAnswers({}); setRawAnswers([]); setHeroImageId(null); setOptions(DEFAULT_OPTIONS); setLoadingPanel(true); setMsg("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: files, error: fErr } = await s.from("project_files").select("id,storage_bucket,storage_path,original_name,category,caption").eq("project_id", projectId).eq("file_type", "image");
      if (fErr) throw fErr;
      const withUrls = await Promise.all((files || []).map(async f => {
        const { data: signed } = await s.storage.from(f.storage_bucket).createSignedUrl(f.storage_path, 3600);
        return { ...f, url: signed?.signedUrl || "" };
      }));
      setImages(withUrls);
      if (withUrls[0]) setHeroImageId(withUrls[0].id);
      const { data: ansRows } = await s.from("project_answers").select("section,question_key,answer_json").eq("project_id", projectId);
      setRawAnswers((ansRows || []) as Answer[]);
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
    if (!heroImageId) return;
    setGenerating(true); setMsg("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: { session } } = await s.auth.getSession();
      if (!session) throw new Error("Session expirée.");
      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ projectId, fileId: heroImageId, options }),
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
      await s.from("ai_inspirations").update({ metadata: nextMetadata }).eq("id", inspirationId);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Mise à jour impossible"); }
  }

  if (allowed === null) return <div className="dashboard-state">Vérification de l’accès…</div>;
  if (!allowed) return <main className="account-page"><div className="shell narrow"><h1>Accès réservé</h1><p>Cette page est réservée à l’administration.</p></div></main>;

  const heroImage = images.find(i => i.id === heroImageId) || images[0];

  return (
    <main className="admin-page">
      <div className="shell">
        <p className="eyebrow">Administration</p>
        <h1>Table de travail</h1>
        {msg && <p className="form-message">{msg}</p>}
        <div className="admin-stats">
          <div><strong>{projects.length}</strong><span>projets</span></div>
          <div><strong>{projects.filter(p => !["completed", "archived"].includes(p.status)).length}</strong><span>actifs</span></div>
          <div><strong>{projects.filter(p => p.status === "to_review").length}</strong><span>à vérifier</span></div>
        </div>

        <div className="project-list">
          {projects.map(p => (
            <article className="project-row clickable" key={p.id} onClick={() => openStudio(p.id)}>
              <div>
                <span className="status-pill">{p.status}</span>
                <h2>{p.title}</h2>
                <p>{[p.service_type, p.city].filter(Boolean).join(" · ")}</p>
              </div>
              <time>{new Date(p.updated_at).toLocaleDateString("fr-FR")}</time>
            </article>
          ))}
        </div>

        {openId && (
          <div className="studio" onClick={e => e.stopPropagation()}>
            {loadingPanel && <p>Chargement…</p>}

            {!loadingPanel && (
              <>
                <div className="studio-hero">
                  {heroImage?.url ? <img src={heroImage.url} alt="Photo principale" /> : <div className="file-icon studio-hero__placeholder">Aucune photo</div>}
                </div>
                <div className="studio-gallery">
                  {images.map(img => (
                    <button key={img.id} className={`studio-gallery__item${heroImageId === img.id ? " is-active" : ""}`} onClick={() => setHeroImageId(img.id)}>
                      <img src={img.url} alt={SHOT_TYPES.find(s => s.key === img.category)?.label || img.original_name} />
                    </button>
                  ))}
                </div>

                <nav className="studio-nav">
                  {STUDIO_TABS.map(t => (
                    <button key={t.key} className={`tab-link-h${studioTab === t.key ? " active" : ""}`} onClick={() => setStudioTab(t.key)}>{t.label}</button>
                  ))}
                </nav>

                {studioTab === "room" && (() => {
                  const project = projects.find(pr => pr.id === openId);
                  if (!project) return null;
                  const photosForSummary = images.map(f => { const d = decodeCaption(f.caption); return { shotType: f.category || "", tag: d.tag, note: d.note }; });
                  const summary = summarizeRoom(project, photosForSummary, answers);
                  return (
                    <div className="detail-card">
                      <dl className="detail-grid">
                        <div><dt>Pièce</dt><dd>{summary.roomLabel}</dd></div>
                        {summary.surfaceLabel && <div><dt>Surface</dt><dd>{summary.surfaceLabel}</dd></div>}
                        {summary.budgetLabel && <div><dt>Budget</dt><dd>{summary.budgetLabel}</dd></div>}
                        <div><dt>Photos</dt><dd>{summary.photosCaptured}/{summary.photosTotal}</dd></div>
                      </dl>
                      {summary.toKeep.length > 0 && <p><strong>À conserver :</strong> {summary.toKeep.join(", ")}</p>}
                      {summary.toChange.length > 0 && <p><strong>À changer :</strong> {summary.toChange.join(", ")}</p>}
                      {summary.needs && <p><strong>Besoins :</strong> {summary.needs}</p>}
                      {summary.constraints && <p><strong>Contraintes :</strong> {summary.constraints}</p>}
                    </div>
                  );
                })()}

                {studioTab === "photos" && (
                  <div className="detail-card">
                    <p className="saving-hint">Cliquez une photo dans la galerie ci-dessus pour la définir comme photo principale (utilisée pour l’IA).</p>
                    {images.length === 0 && <p>Aucune photo envoyée par le client pour l’instant.</p>}
                  </div>
                )}

                {studioTab === "brief" && (
                  <div className="detail-card">
                    {rawAnswers.length === 0 && <p>Questionnaire non renseigné pour l’instant.</p>}
                    <dl className="detail-grid">
                      {rawAnswers.filter(a => (a.answer_json as { value?: string })?.value).map(a => (
                        <div key={`${a.section}:${a.question_key}`}><dt>{a.question_key.replace(/_/g, " ")}</dt><dd>{(a.answer_json as { value?: string }).value}</dd></div>
                      ))}
                    </dl>
                  </div>
                )}

                {studioTab === "palette" && (() => {
                  const project = projects.find(pr => pr.id === openId);
                  if (!project) return null;
                  const summary = summarizeRoom(project, [], answers);
                  return (
                    <div className="detail-card">
                      {summary.colorsLiked && <p><strong>Couleurs appréciées :</strong> {summary.colorsLiked}</p>}
                      {summary.colorsRefused && <p><strong>Couleurs refusées :</strong> {summary.colorsRefused}</p>}
                      {summary.materials && <p><strong>Matières :</strong> {summary.materials}</p>}
                      {!summary.colorsLiked && !summary.colorsRefused && !summary.materials && <p>Aucune préférence de palette renseignée pour l’instant.</p>}
                    </div>
                  );
                })()}

                {studioTab === "inspiration" && (
                  <div className="detail-card">
                    <p className="saving-hint">Pistes créatives générées pour assister le professionnel. Validation et conception finale par le décorateur.</p>
                    {!heroImageId && <p>Sélectionnez une photo dans la galerie pour générer des pistes.</p>}
                    {heroImageId && (
                      <div className="ai-studio-options">
                        <label className="tag-choice"><input type="checkbox" checked={options.keepStructure} onChange={e => setOptions(o => ({ ...o, keepStructure: e.target.checked }))} /> Conserver la structure</label>
                        <label className="tag-choice"><input type="checkbox" checked={options.keepSelectedFurniture} onChange={e => setOptions(o => ({ ...o, keepSelectedFurniture: e.target.checked }))} /> Conserver le mobilier sélectionné</label>
                        <label className="tag-choice"><input type="checkbox" checked={options.changeColorsAndMaterials} onChange={e => setOptions(o => ({ ...o, changeColorsAndMaterials: e.target.checked }))} /> Changer couleurs et matières</label>
                        <label className="tag-choice"><input type="checkbox" checked={options.proposeNewLayout} onChange={e => setOptions(o => ({ ...o, proposeNewLayout: e.target.checked }))} /> Proposer un nouvel aménagement</label>
                        <div className="row-actions">
                          <button type="button" className="button-primary" disabled={generating} onClick={() => openId && generate(openId)}>
                            {generating ? "Génération…" : "✨ Générer des pistes d’inspiration"}
                          </button>
                        </div>
                      </div>
                    )}

                    {inspirations.map(insp => (
                      <div className="moodboard-set" key={insp.id}>
                        <p className="saving-hint">{new Date(insp.created_at).toLocaleString("fr-FR")} — {insp.provider === "mock" ? "aperçu de démonstration" : insp.provider}</p>
                        <div className="moodboard-grid">
                          {(insp.metadata.directions || []).map((d, i) => (
                            <article className="moodboard-card" key={d.name + i}>
                              <div className="moodboard-card__image">{heroImage?.url && <img src={heroImage.url} alt={d.name} />}<span className="moodboard-card__name">{d.name}</span></div>
                              <div className="moodboard-card__body">
                                <p>{d.description}</p>
                                <p className="moodboard-card__meta"><strong>Palette</strong> {d.palette}</p>
                                <p className="moodboard-card__meta"><strong>Matières</strong> {d.materials}</p>
                                <p className="moodboard-card__meta"><strong>Ambiance</strong> {d.lighting}</p>
                                <div className="row-actions">
                                  {(["keep", "modify", "reject", "added"] as const).map(st => (
                                    <button key={st} type="button" className={`text-button-inline${d.status === st ? " active" : ""}`} onClick={() => setDirectionStatus(insp.id, i, st)}>
                                      {STATUS_LABELS[st]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {studioTab === "projet" && (() => {
                  const project = projects.find(pr => pr.id === openId);
                  if (!project) return null;
                  return (
                    <div className="detail-card">
                      <dl className="detail-grid">
                        <div><dt>Titre</dt><dd>{project.title}</dd></div>
                        <div><dt>Statut</dt><dd>{project.status}</dd></div>
                        {project.service_type && <div><dt>Prestation</dt><dd>{project.service_type}</dd></div>}
                        {project.city && <div><dt>Ville</dt><dd>{project.city}</dd></div>}
                        {project.budget_range && <div><dt>Budget</dt><dd>{project.budget_range}</dd></div>}
                      </dl>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
