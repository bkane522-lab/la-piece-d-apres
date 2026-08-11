import type { AiProvider } from "./types";
import { mockProvider } from "./providers/mock";
import { openAiProvider } from "./providers/openai";

// Registre des fournisseurs disponibles. Pour brancher un nouveau fournisseur
// (Groq, Anthropic, etc.) : créer src/lib/ai/providers/<nom>.ts qui exporte un
// AiProvider, puis l'ajouter ici. Aucun autre fichier du projet (UI, route, base)
// n'a besoin d'être modifié.
const PROVIDERS: Record<string, AiProvider> = {
  mock: mockProvider,
  openai: openAiProvider,
};

// Sélection explicite via AI_PROVIDER=mock|openai. Par défaut : openai si une
// clé OPENAI_API_KEY est présente, sinon mock. Ne jamais faire planter l'appelant
// si une valeur inconnue est fournie — on retombe sur mock.
export function getAiProvider(): AiProvider {
  const requested = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (requested && PROVIDERS[requested]) return PROVIDERS[requested];
  return process.env.OPENAI_API_KEY ? PROVIDERS.openai : PROVIDERS.mock;
}
