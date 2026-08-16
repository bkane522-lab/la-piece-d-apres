import type { AiProvider, GenerateInspirationInput, InspirationDirection } from "../types";

const DIRECTION_NAMES = ["Direction 01", "Direction 02", "Direction 03"];

function mockDirection(name: string, options: GenerateInspirationInput["options"]): InspirationDirection {
  const parts: string[] = [];
  if (options.keepStructure) parts.push("structure conservée");
  if (options.keepSelectedFurniture) parts.push("mobilier sélectionné conservé");
  if (options.changeColorsAndMaterials) parts.push("couleurs et matières renouvelées");
  if (options.proposeNewLayout) parts.push("nouvel agencement proposé");
  return {
    name,
    description: `[Aperçu de démonstration — clé IA non configurée] Piste générée selon : ${parts.join(", ") || "aucune option cochée"}.`,
    palette: "Ivoire chaud, terracotta, bronze — à ajuster une fois la clé IA branchée.",
    materials: "Bois noyer, lin, laiton brossé (exemple de démonstration).",
    layoutIdeas: "Exemple : dégager la circulation principale, regrouper les assises.",
    lighting: "Exemple : lumière chaude indirecte, point d’accent sur un mur.",
    recommendations: "Ceci est un aperçu de démonstration, pas une suggestion réelle.",
    status: "pending",
  };
}

export const mockProvider: AiProvider = {
  name: "mock",
  async generate(input) {
    return {
      provider: "mock",
      model: "mock-dev",
      directions: DIRECTION_NAMES.map((name) => mockDirection(name, input.options)),
    };
  },
};
