import { getAiProvider } from "./provider";
import type { GenerateInspirationInput, GenerateInspirationOutput } from "./types";

export async function generateInspiration(input: GenerateInspirationInput): Promise<GenerateInspirationOutput> {
  const provider = getAiProvider();
  return provider.generate(input);
}
