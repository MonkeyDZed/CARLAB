import { getDatabase } from "../../database";
import type { Vehicule } from "./types";
import type { VehiculeFormData } from "./schema";

export async function getAllVehicules(search?: string): Promise<Vehicule[]> {
  const db = getDatabase();
  if (search) {
    const term = `%${search}%`;
    return db.getAllAsync<Vehicule>(
      "SELECT * FROM vehicules WHERE immatriculation LIKE ? OR marque LIKE ? OR modele LIKE ? OR telephone LIKE ? ORDER BY immatriculation ASC",
      [term, term, term, term]
    );
  }
  return db.getAllAsync<Vehicule>(
    "SELECT * FROM vehicules ORDER BY immatriculation ASC"
  );
}

export async function getVehiculeById(id: number): Promise<Vehicule | null> {
  const db = getDatabase();
  return db.getFirstAsync<Vehicule>(
    "SELECT * FROM vehicules WHERE id = ?",
    [id]
  );
}

export async function findVehiculeByImmat(
  immatriculation: string
): Promise<Vehicule | null> {
  const db = getDatabase();
  return db.getFirstAsync<Vehicule>(
    "SELECT * FROM vehicules WHERE immatriculation = ?",
    [immatriculation]
  );
}

export async function createVehicule(
  data: VehiculeFormData
): Promise<Vehicule> {
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO vehicules (client_id, immatriculation, marque, modele, annee, telephone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [0, data.immatriculation, data.marque || "", data.modele || "", data.annee ?? null, data.telephone || "", now]
  );
  const result = await db.getFirstAsync<{ id: number }>(
    "SELECT last_insert_rowid() as id"
  );
  return (await getVehiculeById(result!.id))!;
}

export async function updateVehicule(
  id: number,
  data: Partial<VehiculeFormData>
): Promise<Vehicule> {
  const db = getDatabase();
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.immatriculation !== undefined) {
    updates.push("immatriculation = ?");
    params.push(data.immatriculation);
  }
  if (data.marque !== undefined) {
    updates.push("marque = ?");
    params.push(data.marque);
  }
  if (data.modele !== undefined) {
    updates.push("modele = ?");
    params.push(data.modele);
  }
  if (data.annee !== undefined) {
    updates.push("annee = ?");
    params.push(data.annee ?? null);
  }
  if (data.telephone !== undefined) {
    updates.push("telephone = ?");
    params.push(data.telephone);
  }

  if (updates.length > 0) {
    params.push(id);
    await db.runAsync(
      `UPDATE vehicules SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }

  return (await getVehiculeById(id))!;
}

export async function deleteVehicule(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync("DELETE FROM vehicules WHERE id = ?", [id]);
}
