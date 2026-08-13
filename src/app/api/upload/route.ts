import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAnonServerClient, getSupabaseUserServerClient } from "@/lib/supabase/server";

const Meta = z.object({
  projectId: z.string().uuid(),
  bucket: z.enum(["project-images", "project-documents"]),
  category: z.string().max(80).optional(),
});

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const anon = getSupabaseAnonServerClient();
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    if (file.size > MAX || !ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Type ou taille de fichier non autorisé" }, { status: 400 });
    }

    const meta = Meta.parse({
      projectId: form.get("projectId"),
      bucket: form.get("bucket"),
      category: form.get("category") || undefined,
    });

    // IMPORTANT : on agit avec le JWT utilisateur, pas avec service_role.
    // Ainsi les policies RLS et Storage existantes sont la source de vérité.
    const userClient = getSupabaseUserServerClient(token);

    const { data: project, error: projectError } = await userClient
      .from("projects")
      .select("id,user_id")
      .eq("id", meta.projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ error: "Impossible d’accéder au dossier" }, { status: 403 });
    }

    const ext = (file.name.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
    const safe = `${crypto.randomUUID()}.${ext}`;
    const path = `${user.id}/${meta.projectId}/${safe}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await userClient.storage
      .from(meta.bucket)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: `Stockage impossible : ${uploadError.message}` }, { status: 400 });
    }

    const { data: row, error: dbError } = await userClient
      .from("project_files")
      .insert({
        project_id: meta.projectId,
        user_id: user.id,
        file_type: file.type.startsWith("image/") ? "image" : "document",
        storage_bucket: meta.bucket,
        storage_path: path,
        original_name: file.name,
        safe_name: safe,
        mime_type: file.type,
        size: file.size,
        category: meta.category || null,
      })
      .select("id,storage_path")
      .single();

    if (dbError) {
      await userClient.storage.from(meta.bucket).remove([path]);
      return NextResponse.json({ error: `Enregistrement impossible : ${dbError.message}` }, { status: 400 });
    }

    return NextResponse.json({ file: row }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload impossible" }, { status: 400 });
  }
}
