export const services = [
  "Conseil décoration",
  "Coaching déco",
  "Aménagement d’une pièce",
  "Optimisation d’espace",
  "Conseil couleurs et matières",
  "Rénovation légère",
  "Projet complet",
  "Décoration à distance",
] as const;

export const projectStatuses = [
  "Brouillon",
  "Dossier envoyé",
  "Dossier reçu",
  "À vérifier",
  "En attente d’informations",
  "Analyse en cours",
  "Rendez-vous à programmer",
  "Rendez-vous confirmé",
  "Proposition en préparation",
  "Proposition disponible",
  "Modifications demandées",
  "Projet validé",
  "Projet terminé",
  "Archivé",
] as const;

export const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  submitted: "Dossier envoyé",
  received: "Dossier reçu",
  to_review: "À vérifier",
  waiting_for_information: "En attente d’informations",
  under_analysis: "Analyse en cours",
  appointment_required: "Rendez-vous à programmer",
  appointment_confirmed: "Rendez-vous confirmé",
  proposal_in_progress: "Proposition en préparation",
  proposal_available: "Proposition disponible",
  changes_requested: "Modifications demandées",
  approved: "Projet validé",
  completed: "Projet terminé",
  archived: "Archivé",
};

export const budgetRanges = [
  "Moins de 1 000 €",
  "1 000 € à 3 000 €",
  "3 000 € à 5 000 €",
  "5 000 € à 10 000 €",
  "10 000 € à 20 000 €",
  "Plus de 20 000 €",
  "À définir",
] as const;

export const meetingTypeLabels: Record<string, string> = {
  onsite: "Sur place",
  video: "Visioconférence",
  office: "Au cabinet",
};

export const appointmentStatusLabels: Record<string, string> = {
  proposed: "Proposé",
  to_confirm: "À confirmer",
  confirmed: "Confirmé",
  refused: "Refusé",
  rescheduled: "Reporté",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const questionnaireSections: { section: string; label: string; questions: { key: string; label: string; type: "text" | "textarea" }[] }[] = [
  {
    section: "objectifs",
    label: "Objectifs",
    questions: [
      { key: "besoins", label: "Quels sont vos besoins principaux pour cette pièce ?", type: "textarea" },
      { key: "a_conserver", label: "Y a-t-il des éléments à conserver ?", type: "textarea" },
      { key: "contraintes", label: "Des contraintes particulières (animaux, enfants, accessibilité…) ?", type: "textarea" },
    ],
  },
  {
    section: "style",
    label: "Style",
    questions: [
      { key: "style_souhaite", label: "Quel style vous attire le plus ?", type: "text" },
      { key: "ambiance", label: "Quelle ambiance recherchez-vous ?", type: "textarea" },
    ],
  },
  {
    section: "couleurs_matieres",
    label: "Couleurs et matières",
    questions: [
      { key: "couleurs_appreciees", label: "Couleurs appréciées", type: "text" },
      { key: "couleurs_refusees", label: "Couleurs à éviter", type: "text" },
      { key: "matieres_appreciees", label: "Matières appréciées", type: "text" },
    ],
  },
];
