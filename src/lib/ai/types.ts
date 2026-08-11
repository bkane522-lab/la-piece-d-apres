export type InspirationOptions = {
  keepStructure: boolean;
  keepSelectedFurniture: boolean;
  changeColorsAndMaterials: boolean;
  proposeNewLayout: boolean;
};

export type InspirationDirection = {
  name: string;
  description: string;
  palette: string;
  materials: string;
  layoutIdeas: string;
  lighting: string;
  recommendations: string;
  status: "pending" | "keep" | "modify" | "reject" | "added";
};

export type GenerateInspirationInput = {
  imageUrl: string;
  options: InspirationOptions;
  roomContext?: string;
};

export type GenerateInspirationOutput = {
  directions: InspirationDirection[];
  provider: string;
  model: string;
};

export interface AiProvider {
  name: string;
  generate(input: GenerateInspirationInput): Promise<GenerateInspirationOutput>;
}
