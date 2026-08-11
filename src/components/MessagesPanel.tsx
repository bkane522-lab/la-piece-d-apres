"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Row = { id: string; message: string; created_at: string; project_id: string; projects: { title: string } | null };

export function MessagesPanel() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const s = getSupabaseBrowserClient();
        const { data: { user } } = await s.auth.getUser();
        if (!user) { window.location.href = "/connexion"; return; }
        const { data, error } = await s.from("project_messages").select("id,message,created_at,project_id,projects(title)").order("created_at", { ascending: false }).limit(50);
        if (error) throw error;
        setItems((data || []) as unknown as Row[]);
      } catch (e) { setMsg(e instanceof Error ? e.message : "Chargement impossible."); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="dashboard-state">Chargement des messages…</div>;
  return (
    <main className="app-page">
      <div className="shell">
        <p className="eyebrow">Suivi</p>
        <h1>Messages</h1>
        {msg && <p className="form-message">{msg}</p>}
        {items.length === 0 ? (
          <div className="empty-card"><h2>Aucun message</h2><p>Les échanges avec votre décorateur·rice apparaîtront ici, par projet.</p></div>
        ) : (
          <div className="notice-list">
            {items.map(m => (
              <Link href={`/espace-client/projets/${m.project_id}`} key={m.id} className="notice-list__link">
                <article>
                  <p className="saving-hint">{m.projects?.title || "Projet"}</p>
                  <p>{m.message}</p>
                  <time>{new Date(m.created_at).toLocaleString("fr-FR")}</time>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
