import { randomUUID } from "expo-crypto";
import { getDatabase } from "../../database";
import type {
  OrdreReparation,
  OrdreWithDetails,
  OrdreStatut,
  Realisateur,
} from "./types";
import type { OrdreCreationFormData } from "./schema";

const ORDRE_SELECT = `
  SELECT
    o.*,
    v.immatriculation,
    v.marque,
    v.modele,
    v.annee,
    v.telephone,
    p.name as mecanicien_name,
    (SELECT description FROM problemes pr WHERE pr.ordre_id = o.id ORDER BY pr.id ASC LIMIT 1) as premier_probleme,
    COALESCE(SUM(t.amount), 0) as total_paye
  FROM ordres_reparation o
  JOIN vehicules v ON o.vehicule_id = v.id
  LEFT JOIN partners p ON o.mecanicien_id = p.id
  LEFT JOIN transactions t ON t.ordre_id = o.id AND t.type = 'income'
`;

export async function getAllOrdres(
  statut?: OrdreStatut
): Promise<OrdreWithDetails[]> {
  const db = getDatabase();
  let query = ORDRE_SELECT;
  const params: string[] = [];

  if (statut) {
    query += " WHERE o.statut = ?";
    params.push(statut);
  }

  query += " GROUP BY o.id ORDER BY o.date_creation DESC";

  return db.getAllAsync<OrdreWithDetails>(query, params);
}

export async function getOrdreById(
  id: string
): Promise<OrdreWithDetails | null> {
  const db = getDatabase();
  return db.getFirstAsync<OrdreWithDetails>(
    `${ORDRE_SELECT} WHERE o.id = ? GROUP BY o.id`,
    [id]
  );
}

export async function getOrdresByVehicule(
  vehiculeId: number
): Promise<OrdreWithDetails[]> {
  const db = getDatabase();
  return db.getAllAsync<OrdreWithDetails>(
    `${ORDRE_SELECT} WHERE o.vehicule_id = ? GROUP BY o.id ORDER BY o.date_creation DESC`,
    [vehiculeId]
  );
}

export async function createOrdre(
  data: OrdreCreationFormData
): Promise<OrdreReparation> {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();
  const dateCreation = new Date().toISOString().split("T")[0];

  await db.runAsync(
    `INSERT INTO ordres_reparation (id, vehicule_id, mecanicien_id, realisateur, date_creation, kilometrage, statut, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'brouillon', ?, ?)`,
    [id, data.vehicule_id, data.mecanicien_id ?? null, data.realisateur ?? "proprio", dateCreation, data.kilometrage ?? null, now, now]
  );

  return (await db.getFirstAsync<OrdreReparation>(
    "SELECT * FROM ordres_reparation WHERE id = ?",
    [id]
  ))!;
}

export async function updateOrdreStatut(
  id: string,
  statut: OrdreStatut
): Promise<OrdreReparation> {
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE ordres_reparation SET statut = ?, updated_at = ? WHERE id = ?",
    [statut, now, id]
  );
  return (await getOrdreById(id))!;
}

export async function updateOrdreRealisateur(
  id: string,
  realisateur: Realisateur,
  mecanicien_id: number | null
): Promise<OrdreReparation> {
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE ordres_reparation SET realisateur = ?, mecanicien_id = ?, updated_at = ? WHERE id = ?",
    [realisateur, mecanicien_id, now, id]
  );
  return (await getOrdreById(id))!;
}

export async function updateOrdreMontant(
  id: string,
  montant_total: number
): Promise<OrdreReparation> {
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE ordres_reparation SET montant_total = ?, statut = 'facture', updated_at = ? WHERE id = ?",
    [montant_total, now, id]
  );
  return (await getOrdreById(id))!;
}

export async function getTotalCA(): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(o.montant_total), 0) as total
     FROM ordres_reparation o
     WHERE o.statut IN ('facture', 'paye')`
  );
  return result?.total ?? 0;
}

export async function getTotalCAPaye(): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     WHERE t.type = 'income' AND t.ordre_id IS NOT NULL`
  );
  return result?.total ?? 0;
}

export async function deleteOrdre(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync("DELETE FROM comptes_associes WHERE ordre_id = ?", [id]);
  await db.runAsync("DELETE FROM mouvements_mecaniciens WHERE ordre_id = ?", [id]);
  await db.runAsync("DELETE FROM transactions WHERE ordre_id = ?", [id]);
  await db.runAsync("DELETE FROM ordres_reparation WHERE id = ?", [id]);
}
