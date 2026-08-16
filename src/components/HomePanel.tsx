"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { startCaptureFlow } from "@/lib/startCaptureFlow";

type Project = { id: string; title: string; status: string; updated_at: string; thumb: string | null };

export function HomePanel() {
  const [userName, setUserName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = getSupabaseBrowserClient();
        const { data: { user } } = await s.auth.getUser();
        if (!user) { window.location.href = "/connexion"; return; }
        const { data: profile } = await s.from("profiles").select("first_name").eq("id", user.id).maybeSingle();
        setUserName(profile?.first_name || "");
        const { data } = await s.from("projects").select("id,title,status,updated_at").order("updated_at", { ascending: false }).limit(4);
        const withThumbs = await Promise.all((data || []).map(async p => {
          const { data: files } = await s.from("project_files").select("storage_bucket,storage_path").eq("project_id", p.id).eq("file_type", "image").limit(1);
          const f = files?.[0];
          if (!f) return { ...p, thumb: null };
          const { data: signed } = await s.storage.from(f.storage_bucket).createSignedUrl(f.storage_path, 3600);
          return { ...p, thumb: signed?.signedUrl || null };
        }));
        setProjects(withThumbs);
      } finally { setLoading(false); }
    })();
  }, []);

  async function onCapture() {
    setStarting(true);
    try { await startCaptureFlow(); } finally { setStarting(false); }
  }

  const active = projects.filter(p => !["completed", "archived"].includes(p.status)).length;

  return (
    <main className="app-page">
      <div className="home-hero">
        <p className="eyebrow">Bonjour{userName ? ` ${userName}` : ""}</p>
        <h1>Votre pièce peut devenir autre chose.</h1>
        <button className="button-primary home-hero__cta" onClick={onCapture} disabled={starting}>
          {starting ? "Un instant…" : "Photographier ma pièce"}
        </button>
      </div>

      <div className="shell">
        {!loading && (
          <div className="home-stats-strip">
            <span><strong>{projects.length}</strong> projets récents</span>
            <span><strong>{active}</strong> en cours</span>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <>
            <h2 style={{ marginTop: 22, marginBottom: 4 }}>Reprendre où vous en étiez</h2>
            <div className="home-visual-grid">
              {projects.map(p => (
                <Link href={`/espace-client/projets/${p.id}`} key={p.id} className="home-visual-card">
                  {p.thumb ? <img src={p.thumb} alt={p.title} /> : <div className="home-visual-card__placeholder" />}
                  <div className="home-visual-card__label">
                    <strong>{p.title}</strong>
                    <time>{new Date(p.updated_at).toLocaleDateString("fr-FR")}</time>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <p style={{ marginTop: 28 }}><Link href="/espace-client/pieces" className="back-link">Voir toutes mes pièces →</Link></p>
      </div>
    </main>
  );
}
