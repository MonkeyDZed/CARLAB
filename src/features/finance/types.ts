export interface Mecanicien {
  id: number;
  name: string;
  commission_percent: number;
  created_at: string;
}

export type MouvementMecanicienType = "commission" | "retrait";

export interface MouvementMecanicien {
  id: number;
  mecanicien_id: number;
  type: MouvementMecanicienType;
  montant: number;
  date: string;
  description: string | null;
  ordre_id: string | null;
  created_at: string;
}

export interface Objectif {
  id: number;
  montant_cible: number;
  date_debut: string;
  description: string | null;
  created_at: string;
}

export interface ObjectifAlimentation {
  id: number;
  montant: number;
  date: string;
  description: string | null;
  created_at: string;
}

export type AssocieCible = "proprio" | "associe";

export type MouvementAssocieType =
  | "part_recette"
  | "part_depense"
  | "retrait";

export interface MouvementAssocie {
  id: number;
  cible: AssocieCible;
  type: MouvementAssocieType;
  montant: number;
  date: string;
  description: string | null;
  ordre_id: string | null;
  transaction_id: string | null;
  created_at: string;
}

export interface AssocieNames {
  proprio: string;
  associe: string;
}

export const MOUVEMENT_LABEL: Record<MouvementMecanicienType, string> = {
  commission: "Commission",
  retrait: "Retrait",
};

export const MOUVEMENT_ASSOCIE_LABEL: Record<MouvementAssocieType, string> = {
  part_recette: "Part de recette",
  part_depense: "Part de dépense",
  retrait: "Retrait",
};
