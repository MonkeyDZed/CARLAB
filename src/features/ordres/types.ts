export const ORDRE_STATUTS = [
  "brouillon",
  "en_cours",
  "termine",
  "facture",
  "paye",
] as const;

export type OrdreStatut = (typeof ORDRE_STATUTS)[number];

export type Realisateur = "proprio" | "associe" | "mecanicien";

export interface OrdreReparation {
  id: string;
  vehicule_id: number;
  mecanicien_id: number | null;
  realisateur: Realisateur;
  date_creation: string;
  kilometrage: number | null;
  probleme: string | null;
  intervention_reel: string | null;
  montant_total: number | null;
  statut: OrdreStatut;
  created_at: string;
  updated_at: string;
}

export interface OrdreWithDetails extends OrdreReparation {
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number | null;
  telephone: string;
  total_paye: number;
  mecanicien_name: string | null;
  premier_probleme: string | null;
}

export const STATUT_LABEL: Record<OrdreStatut, string> = {
  brouillon: "Brouillon",
  en_cours: "En cours",
  termine: "Terminé",
  facture: "Facturé",
  paye: "Payé",
};

export const STATUT_TRANSITIONS: Record<OrdreStatut, OrdreStatut[]> = {
  brouillon: ["en_cours"],
  en_cours: ["termine"],
  termine: ["facture"],
  facture: ["paye"],
  paye: [],
};
