import type { AiProvider, InspirationDirection } from "../types";

const DIRECTION_NAMES = ["Direction 01", "Direction 02", "Direction 03"];

export const openAiProvider: AiProvider = {
  name: "openai",
  async generate(input) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("La clé OPENAI_API_KEY n’est pas configurée dans les variables d’environnement Vercel.");

    const instructions: string[] = [];
    if (input.options.keepStructure) instructions.push("conserver la structure de la pièce");
    if (input.options.keepSelectedFurniture) instructions.push("conserver le mobilier sélectionné par le client");
    if (input.options.changeColorsAndMaterials) instructions.push("proposer de nouvelles couleurs et matières");
    if (input.options.proposeNewLayout) instructions.push("proposer un nouvel aménagement");

    const systemPrompt =
      "Tu es un copilote qui aide une décoratrice d'intérieur professionnelle à démarrer sa réflexion. " +
      "À partir d'une photo de pièce, génère exactement 3 directions créatives distinctes. " +
      "Contraintes : " + (instructions.join(", ") || "aucune contrainte particulière") + ". " +
      "Réponds UNIQUEMENT en JSON valide, un tableau de 3 objets avec les clés : " +
      "name, description, palette, materials, layoutIdeas, lighting, recommendations (toutes des chaînes de texte courtes en français). " +
      "Précise dans recommendations que ce sont des pistes de départ, pas une proposition finale.";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: input.roomContext || "Voici la photo de la pièce du client." },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ] },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Service IA indisponible (${res.status}).`);
    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content || "[]";
    let parsed: unknown;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch { throw new Error("Réponse IA illisible."); }
    const list = Array.isArray(parsed) ? parsed : [];
    const directions: InspirationDirection[] = list.slice(0, 3).map((d, i) => ({
      name: String((d as Record<string, unknown>)?.name || DIRECTION_NAMES[i]),
      description: String((d as Record<string, unknown>)?.description || ""),
      palette: String((d as Record<string, unknown>)?.palette || ""),
      materials: String((d as Record<string, unknown>)?.materials || ""),
      layoutIdeas: String((d as Record<string, unknown>)?.layoutIdeas || ""),
      lighting: String((d as Record<string, unknown>)?.lighting || ""),
      recommendations: String((d as Record<string, unknown>)?.recommendations || ""),
      status: "pending",
    }));
    if (directions.length === 0) throw new Error("Réponse IA vide.");
    return { provider: "openai", model: "gpt-4o-mini", directions };
  },
};
