import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAnonServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { generateInspiration } from "@/lib/ai/generateInspiration";

const Body = z.object({
  projectId: z.string().uuid(),
  fileId: z.string().uuid(),
  options: z.object({
    keepStructure: z.boolean(),
    keepSelectedFurniture: z.boolean(),
    changeColorsAndMaterials: z.boolean(),
    proposeNewLayout: z.boolean(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const anon = getSupabaseAnonServerClient();
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const service = getSupabaseServiceClient();
    const { data: profile } = await service.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Réservé à l’administration" }, { status: 403 });

    const { projectId, fileId, options } = Body.parse(await req.json());

    const { data: file } = await service.from("project_files")
      .select("id,project_id,storage_bucket,storage_path,file_type")
      .eq("id", fileId).eq("project_id", projectId).maybeSingle();
    if (!file) return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
    if (file.file_type !== "image") return NextResponse.json({ error: "Ce fichier n’est pas une image" }, { status: 400 });

    const { data: project } = await service.from("projects").select("title,room_type,surface,surface_unit,description").eq("id", projectId).maybeSingle();

    const { data: signed, error: signErr } = await service.storage.from(file.storage_bucket).createSignedUrl(file.storage_path, 300);
    if (signErr || !signed?.signedUrl) return NextResponse.json({ error: "Image inaccessible" }, { status: 500 });

    const roomContext = [project?.room_type, project?.surface ? `${project.surface} ${project.surface_unit}` : null, project?.description]
      .filter(Boolean).join(" — ") || undefined;

    let result;
    try {
      result = await generateInspiration({ imageUrl: signed.signedUrl, options, roomContext });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Génération IA impossible" }, { status: 502 });
    }

    const { data: row, error: dbErr } = await service.from("ai_inspirations").insert({
      project_id: projectId, source_file_id: fileId, created_by: user.id,
      provider: result.provider, model: result.model,
      prompt_private: JSON.stringify(options),
      status: "internal_draft",
      metadata: { options, directions: result.directions },
    }).select("id,created_at,metadata,provider").single();
    if (dbErr) throw dbErr;

    return NextResponse.json({ inspiration: row }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Génération impossible" }, { status: 400 });
  }
}
