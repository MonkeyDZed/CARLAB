export interface Vehicule {
  id: number;
  client_id: number | null;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number | null;
  telephone: string;
  created_at: string;
}
