export type CapturedPhoto = { shotType: string; tag: "garde" | "change" | "ne_sais_pas" | null; note: string };

export type RoomIntelligenceSummary = {
  roomLabel: string;
  surfaceLabel: string | null;
  budgetLabel: string | null;
  style: string | null;
  ambiance: string | null;
  toKeep: string[];
  toChange: string[];
  constraints: string | null;
  needs: string | null;
  colorsLiked: string | null;
  colorsRefused: string | null;
  materials: string | null;
  photosCaptured: number;
  photosTotal: number;
};

export const SHOT_TYPES: { key: string; label: string }[] = [
  { key: "vue_generale", label: "Vue générale" },
  { key: "mur_1", label: "Mur 1" },
  { key: "mur_2", label: "Mur 2" },
  { key: "mur_3", label: "Mur 3" },
  { key: "mur_4", label: "Mur 4" },
  { key: "sol", label: "Sol" },
  { key: "fenetres", label: "Fenêtres / lumière" },
  { key: "mobilier_conserver", label: "Mobilier à conserver" },
  { key: "element_supprimer", label: "Élément à supprimer" },
  { key: "detail_probleme", label: "Détail problématique" },
];

const TAG_PREFIX: Record<NonNullable<CapturedPhoto["tag"]>, string> = {
  garde: "GARDE",
  change: "CHANGE",
  ne_sais_pas: "NE_SAIS_PAS",
};

export function encodeCaption(tag: CapturedPhoto["tag"], note: string): string {
  const prefix = tag ? TAG_PREFIX[tag] : "SANS_TAG";
  return `${prefix}::${note}`;
}

export function decodeCaption(caption: string | null): { tag: CapturedPhoto["tag"]; note: string } {
  if (!caption) return { tag: null, note: "" };
  const [prefix, ...rest] = caption.split("::");
  const note = rest.join("::");
  const entry = (Object.entries(TAG_PREFIX) as [CapturedPhoto["tag"], string][]).find(([, v]) => v === prefix);
  return { tag: entry ? entry[0] : null, note: entry ? note : caption };
}

export function summarizeRoom(
  project: { title: string; room_type: string | null; surface: number | null; surface_unit: string; budget_range: string | null },
  photos: CapturedPhoto[],
  answers: Record<string, string>,
): RoomIntelligenceSummary {
  const toKeep = photos.filter(p => p.tag === "garde").map(p => SHOT_TYPES.find(s => s.key === p.shotType)?.label || p.shotType);
  const toChange = photos.filter(p => p.tag === "change").map(p => SHOT_TYPES.find(s => s.key === p.shotType)?.label || p.shotType);
  return {
    roomLabel: project.room_type || project.title,
    surfaceLabel: project.surface ? `${project.surface} ${project.surface_unit}` : null,
    budgetLabel: project.budget_range,
    style: answers["style:style_souhaite"] || null,
    ambiance: answers["style:ambiance"] || null,
    toKeep,
    toChange,
    constraints: answers["objectifs:contraintes"] || null,
    needs: answers["objectifs:besoins"] || null,
    colorsLiked: answers["couleurs_matieres:couleurs_appreciees"] || null,
    colorsRefused: answers["couleurs_matieres:couleurs_refusees"] || null,
    materials: answers["couleurs_matieres:matieres_appreciees"] || null,
    photosCaptured: photos.length,
    photosTotal: SHOT_TYPES.length,
  };
}
