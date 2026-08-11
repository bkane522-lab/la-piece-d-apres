"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { startCaptureFlow } from "@/lib/startCaptureFlow";

type Project = { id: string; title: string; status: string; updated_at: string };

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
        const { data } = await s.from("projects").select("id,title,status,updated_at").order("updated_at", { ascending: false }).limit(3);
        setProjects(data || []);
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
          <div className="admin-stats" style={{ marginTop: 8 }}>
            <div><strong>{projects.length}</strong><span>projets récents</span></div>
            <div><strong>{active}</strong><span>en cours</span></div>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <>
            <h2 style={{ marginTop: 32 }}>Reprendre où vous en étiez</h2>
            <div className="project-list">
              {projects.map(p => (
                <article className="project-row clickable" key={p.id} onClick={() => { window.location.href = `/espace-client/projets/${p.id}`; }}>
                  <div><h2>{p.title}</h2></div>
                  <time>{new Date(p.updated_at).toLocaleDateString("fr-FR")}</time>
                </article>
              ))}
            </div>
          </>
        )}

        <p style={{ marginTop: 32 }}><Link href="/espace-client/pieces" className="back-link">Voir toutes mes pièces →</Link></p>
      </div>
    </main>
  );
}
