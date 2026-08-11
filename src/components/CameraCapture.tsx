"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SHOT_TYPES, encodeCaption, summarizeRoom } from "@/lib/roomIntelligence";

type Tag = "garde" | "change" | "ne_sais_pas";
type Captured = { fileId: string; url: string; tag: Tag | null };

export function CameraCapture({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [captured, setCaptured] = useState<Record<string, Captured>>({});
  const [phase, setPhase] = useState<"camera" | "tag" | "complete">("camera");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [projectFields, setProjectFields] = useState<{ title: string; room_type: string | null; surface: number | null; surface_unit: string; budget_range: string | null } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealStep, setRevealStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentShot = SHOT_TYPES[stepIndex];
  const doneCount = Object.keys(captured).length;

  function pickPhoto() { fileInputRef.current?.click(); }

  async function onFileSelected(file: File) {
    setUploading(true); setError("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: { session } } = await s.auth.getSession();
      if (!session) throw new Error("Session expirée.");
      const body = new FormData();
      body.append("file", file); body.append("projectId", projectId); body.append("bucket", "project-images"); body.append("category", currentShot.key);
      const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible.");
      const url = URL.createObjectURL(file);
      setCaptured(prev => ({ ...prev, [currentShot.key]: { fileId: json.file.id, url, tag: null } }));
      setPhase("tag");
    } catch (e) { setError(e instanceof Error ? e.message : "Envoi impossible."); }
    finally { setUploading(false); }
  }

  async function chooseTag(tag: Tag) {
    const entry = captured[currentShot.key];
    if (!entry) return;
    setCaptured(prev => ({ ...prev, [currentShot.key]: { ...entry, tag } }));
    try {
      const s = getSupabaseBrowserClient();
      await s.from("project_files").update({ caption: encodeCaption(tag, "") }).eq("id", entry.fileId);
    } catch { /* non bloquant */ }
    goNext();
  }

  function goNext() {
    if (stepIndex + 1 < SHOT_TYPES.length) { setStepIndex(i => i + 1); setPhase("camera"); }
    else finish();
  }

  function skip() { goNext(); }

  async function finish() {
    setPhase("complete");
    try {
      const s = getSupabaseBrowserClient();
      const { data: project } = await s.from("projects").select("title,room_type,surface,surface_unit,budget_range").eq("id", projectId).maybeSingle();
      if (project) setProjectFields(project);
      const { data: ans } = await s.from("project_answers").select("section,question_key,answer_json").eq("project_id", projectId);
      const map: Record<string, string> = {};
      (ans || []).forEach(r => { map[`${r.section}:${r.question_key}`] = (r.answer_json as { value?: string })?.value || ""; });
      setAnswers(map);
    } catch { /* résumé best-effort */ }
  }

  useEffect(() => {
    if (phase !== "complete") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setRevealStep(4); return; }
    const timers = [0, 1, 2, 3].map(i => window.setTimeout(() => setRevealStep(i + 1), 500 + i * 450));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  if (phase === "complete") {
    const summary = projectFields ? summarizeRoom(projectFields, Object.entries(captured).map(([shotType, c]) => ({ shotType, tag: c.tag, note: "" })), answers) : null;
    return (
      <main className="capture-complete">
        <h1>Votre pièce est prête.</h1>
        {summary && (
          <div className="capture-complete__reveal">
            {revealStep >= 1 && <p className="reveal-in"><strong>{doneCount}</strong> photos collectées</p>}
            {revealStep >= 2 && summary.toKeep.length > 0 && <p className="reveal-in">À conserver : {summary.toKeep.join(", ")}</p>}
            {revealStep >= 2 && summary.toChange.length > 0 && <p className="reveal-in">À modifier : {summary.toChange.join(", ")}</p>}
            {revealStep >= 3 && summary.budgetLabel && <p className="reveal-in">Budget : {summary.budgetLabel}</p>}
            {revealStep >= 3 && summary.constraints && <p className="reveal-in">Contraintes : {summary.constraints}</p>}
          </div>
        )}
        {revealStep >= 4 && (
          <button className="button-primary reveal-in" onClick={() => router.push(`/espace-client/projets/${projectId}`)}>
            Voir mon dossier
          </button>
        )}
      </main>
    );
  }

  return (
    <main className="camera-shell">
      <div className="camera-shell__overlay-top">
        <button className="camera-shell__close" onClick={() => router.push("/espace-client/pieces")} aria-label="Quitter">✕</button>
        <p className="camera-shell__counter">{stepIndex + 1} / {SHOT_TYPES.length}</p>
        <p className="camera-shell__label">{currentShot.label}</p>
      </div>

      <div className="camera-shell__stage">
        {captured[currentShot.key]?.url && phase === "tag" ? (
          <img src={captured[currentShot.key].url} alt={currentShot.label} className="camera-shell__preview" />
        ) : (
          <div className="camera-shell__placeholder">{currentShot.label}</div>
        )}
      </div>

      {phase === "camera" && (
        <div className="camera-shell__controls">
          {error && <p className="form-message">{error}</p>}
          <button type="button" className="camera-shutter" onClick={pickPhoto} disabled={uploading} aria-label="Prendre la photo">
            {uploading ? "…" : ""}
          </button>
          <button type="button" className="camera-shell__skip" onClick={skip}>Passer</button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
            onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(f); e.target.value = ""; }} style={{ display: "none" }} />
        </div>
      )}

      {phase === "tag" && (
        <div className="camera-shell__tag">
          <p>Je garde · Je change · Je ne sais pas</p>
          <div className="camera-shell__tag-buttons">
            <button className="button-secondary" onClick={() => chooseTag("garde")}>Je garde</button>
            <button className="button-secondary" onClick={() => chooseTag("change")}>Je change</button>
            <button className="button-secondary" onClick={() => chooseTag("ne_sais_pas")}>Je ne sais pas</button>
          </div>
        </div>
      )}

      <div className="camera-shell__filmstrip">
        {SHOT_TYPES.map((shot, i) => (
          <div key={shot.key} className={`filmstrip-item${i === stepIndex ? " is-current" : ""}${captured[shot.key] ? " is-done" : ""}`}>
            {captured[shot.key]?.url ? <img src={captured[shot.key].url} alt={shot.label} /> : <span>{i + 1}</span>}
          </div>
        ))}
      </div>
    </main>
  );
}
