import { getDatabase } from "../../database";

export interface InterventionEntry {
  id: number;
  ordre_id: string;
  description: string;
  created_at: string;
}

export async function getInterventions(
  ordreId: string
): Promise<InterventionEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<InterventionEntry>(
    "SELECT * FROM interventions WHERE ordre_id = ? ORDER BY id ASC",
    [ordreId]
  );
}

export async function addIntervention(
  ordreId: string,
  description: string
): Promise<InterventionEntry> {
  const db = getDatabase();
  await db.runAsync(
    "INSERT INTO interventions (ordre_id, description) VALUES (?, ?)",
    [ordreId, description]
  );
  const result = await db.getFirstAsync<{ id: number }>(
    "SELECT last_insert_rowid() as id"
  );
  return (await db.getFirstAsync<InterventionEntry>(
    "SELECT * FROM interventions WHERE id = ?",
    [result!.id]
  ))!;
}

export async function updateIntervention(
  id: number,
  description: string
): Promise<void> {
  const db = getDatabase();
  await db.runAsync("UPDATE interventions SET description = ? WHERE id = ?", [
    description,
    id,
  ]);
}

export async function deleteIntervention(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync("DELETE FROM interventions WHERE id = ?", [id]);
}
