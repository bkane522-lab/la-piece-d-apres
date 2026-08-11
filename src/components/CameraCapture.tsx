"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ensureAccessibleProject } from "@/lib/ensureAccessibleProject";
import { SHOT_TYPES, encodeCaption, summarizeRoom } from "@/lib/roomIntelligence";

type Tag = "garde" | "change" | "ne_sais_pas";
type Captured = { fileId: string; url: string; tag: Tag | null };
type Phase = "verifying" | "live" | "review" | "tag" | "complete";

function vibrate(ms: number) { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms); }

export function CameraCapture({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [realProjectId, setRealProjectId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("verifying");
  const [stepIndex, setStepIndex] = useState(0);
  const [captured, setCaptured] = useState<Record<string, Captured>>({});
  const [pendingBlob, setPendingBlob] = useState<{ blob: Blob; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [cameraSupported, setCameraSupported] = useState(true);
  const [multiCamera, setMultiCamera] = useState(false);
  const [projectFields, setProjectFields] = useState<{ title: string; room_type: string | null; surface: number | null; surface_unit: string; budget_range: string | null } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealStep, setRevealStep] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentShot = SHOT_TYPES[stepIndex];
  const doneCount = Object.keys(captured).length;

  // 1) Vérifier l'accès au projet avant d'ouvrir quoi que ce soit
  useEffect(() => {
    let cancelled = false;
    ensureAccessibleProject(projectId).then(id => {
      if (cancelled) return;
      if (!id) return; // redirection déjà lancée par le helper
      setRealProjectId(id);
      if (id !== projectId) router.replace(`/capturer/${id}`);
      setPhase("live");
    });
    return () => { cancelled = true; };
  }, [projectId, router]);

  // 2) Support caméra + nombre de caméras disponibles
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) { setCameraSupported(false); return; }
    navigator.mediaDevices.enumerateDevices?.().then(devices => {
      setMultiCamera(devices.filter(d => d.kind === "videoinput").length > 1);
    }).catch(() => {});
  }, []);

  // 3) Démarrer / redémarrer le flux vidéo
  useEffect(() => {
    if (phase !== "live" || !cameraSupported) return;
    let active = true;
    (async () => {
      try {
        streamRef.current?.getTracks().forEach(t => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setError("");
      } catch {
        setError("Caméra inaccessible (permission refusée ou matériel indisponible).");
        setCameraSupported(false);
      }
    })();
    return () => { active = false; };
  }, [phase, facing, cameraSupported]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  function shoot() {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 720; canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      setPendingBlob({ blob, url: URL.createObjectURL(blob) });
      setPhase("review");
      vibrate(12);
    }, "image/jpeg", 0.86);
  }

  function onFileFallback(file: File) {
    setPendingBlob({ blob: file, url: URL.createObjectURL(file) });
    setPhase("review");
  }

  function retake() { setPendingBlob(null); setPhase("live"); }

  async function usePhoto() {
    if (!pendingBlob || !realProjectId) return;
    setUploading(true); setError("");
    try {
      const s = getSupabaseBrowserClient();
      const { data: { session } } = await s.auth.getSession();
      if (!session) { window.location.href = "/connexion"; return; }
      const file = pendingBlob.blob instanceof File ? pendingBlob.blob : new File([pendingBlob.blob], `${currentShot.key}.jpg`, { type: "image/jpeg" });
      const body = new FormData();
      body.append("file", file); body.append("projectId", realProjectId); body.append("bucket", "project-images"); body.append("category", currentShot.key);
      const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible.");
      setCaptured(prev => ({ ...prev, [currentShot.key]: { fileId: json.file.id, url: pendingBlob.url, tag: null } }));
      vibrate(15);
      setPhase("tag");
    } catch (e) { setError(e instanceof Error ? e.message : "Envoi impossible."); }
    finally { setUploading(false); }
  }

  async function chooseTag(tag: Tag) {
    const entry = captured[currentShot.key];
    vibrate(10);
    if (entry) {
      setCaptured(prev => ({ ...prev, [currentShot.key]: { ...entry, tag } }));
      try { const s = getSupabaseBrowserClient(); await s.from("project_files").update({ caption: encodeCaption(tag, "") }).eq("id", entry.fileId); } catch { /* non bloquant */ }
    }
    setPendingBlob(null);
    if (stepIndex + 1 < SHOT_TYPES.length) { setStepIndex(i => i + 1); setPhase("live"); }
    else finish();
  }

  function skip() {
    setPendingBlob(null);
    if (stepIndex + 1 < SHOT_TYPES.length) { setStepIndex(i => i + 1); setPhase("live"); }
    else finish();
  }

  async function finish() {
    setPhase("complete");
    if (!realProjectId) return;
    try {
      const s = getSupabaseBrowserClient();
      const { data: project } = await s.from("projects").select("title,room_type,surface,surface_unit,budget_range").eq("id", realProjectId).maybeSingle();
      if (project) setProjectFields(project);
      const { data: ans } = await s.from("project_answers").select("section,question_key,answer_json").eq("project_id", realProjectId);
      const map: Record<string, string> = {};
      (ans || []).forEach(r => { map[`${r.section}:${r.question_key}`] = (r.answer_json as { value?: string })?.value || ""; });
      setAnswers(map);
    } catch { /* résumé best-effort */ }
  }

  useEffect(() => {
    if (phase !== "complete") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setRevealStep(4); return; }
    const timers = [0, 1, 2, 3].map(i => window.setTimeout(() => setRevealStep(i + 1), 350 + i * 300));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  function close() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    router.push("/espace-client/pieces");
  }

  if (phase === "verifying") return <main className="camera-shell camera-shell--loading">Préparation…</main>;

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
        {revealStep >= 4 && realProjectId && (
          <button className="button-primary reveal-in" onClick={() => router.push(`/espace-client/projets/${realProjectId}`)}>
            Voir mon dossier
          </button>
        )}
      </main>
    );
  }

  return (
    <main className="camera-shell">
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="camera-shell__overlay-top">
        <button className="camera-shell__close" onClick={close} aria-label="Quitter">✕</button>
        <p className="camera-shell__counter">{stepIndex + 1} / {SHOT_TYPES.length}</p>
        <p className="camera-shell__label">{currentShot.label}</p>
      </div>

      <div className="camera-shell__stage">
        {phase === "live" && cameraSupported && (
          <div className="camera-shell__live">
            <video ref={videoRef} playsInline autoPlay muted className="camera-shell__video" />
            <div className="camera-shell__guide" aria-hidden="true" />
            <p className="camera-shell__floating-hint">Cadrez {currentShot.label.toLowerCase()}</p>
          </div>
        )}
        {phase === "live" && !cameraSupported && (
          <div className="camera-shell__placeholder">{currentShot.label}<br /><span className="saving-hint">Caméra non disponible — utilisez le bouton ci-dessous</span></div>
        )}
        {phase === "review" && pendingBlob && (
          <div className="camera-shell__review">
            <img src={pendingBlob.url} alt={currentShot.label} className="camera-shell__preview" />
            <p className="camera-shell__review-question">Cette photo vous convient ?</p>
          </div>
        )}
      </div>

      {phase === "live" && (
        <div className="camera-shell__controls">
          {error && <p className="form-message">{error}</p>}
          {cameraSupported ? (
            <div className="camera-shell__controls-row">
              <button type="button" className="camera-shell__skip" onClick={skip}>Passer</button>
              <button type="button" className="camera-shutter" onClick={shoot} aria-label="Prendre la photo" />
              {multiCamera ? (
                <button type="button" className="camera-shell__switch" onClick={() => setFacing(f => f === "environment" ? "user" : "environment")} aria-label="Changer de caméra">⟳</button>
              ) : <span style={{ width: 34 }} />}
            </div>
          ) : (
            <>
              <button type="button" className="camera-shutter" onClick={() => fileInputRef.current?.click()} aria-label="Prendre la photo" />
              <button type="button" className="camera-shell__skip" onClick={skip}>Passer</button>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
            onChange={e => { const f = e.target.files?.[0]; if (f) onFileFallback(f); e.target.value = ""; }} style={{ display: "none" }} />
        </div>
      )}

      {phase === "review" && (
        <div className="camera-shell__controls">
          {error && <p className="form-message">{error}</p>}
          <div className="camera-shell__review-buttons">
            <button type="button" className="button-secondary" onClick={retake} disabled={uploading}>Reprendre</button>
            <button type="button" className="button-primary" onClick={usePhoto} disabled={uploading}>{uploading ? "Envoi…" : "Utiliser cette photo"}</button>
          </div>
        </div>
      )}

      {phase === "tag" && (
        <div className="camera-shell__tag">
          <p>Pour cette zone :</p>
          <div className="camera-shell__tag-buttons">
            <button className="button-secondary" onClick={() => chooseTag("garde")}>Je garde</button>
            <button className="button-secondary" onClick={() => chooseTag("change")}>Je change</button>
            <button className="button-secondary" onClick={() => chooseTag("ne_sais_pas")}>Je ne sais pas</button>
          </div>
        </div>
      )}

      <div className="camera-shell__filmstrip">
        {SHOT_TYPES.map((shot, i) => (
          <div key={shot.key} className={`filmstrip-item${i === stepIndex ? " is-current" : ""}${captured[shot.key] ? " is-done filmstrip-item--in" : ""}`}>
            {captured[shot.key]?.url ? <img src={captured[shot.key].url} alt={shot.label} /> : <span>{i + 1}</span>}
          </div>
        ))}
      </div>
    </main>
  );
}
