import { getDatabase } from "../../database";

export interface ProblemeEntry {
  id: number;
  ordre_id: string;
  description: string;
  created_at: string;
}

export async function getProblemes(ordreId: string): Promise<ProblemeEntry[]> {
  const db = getDatabase();
  return db.getAllAsync<ProblemeEntry>(
    "SELECT * FROM problemes WHERE ordre_id = ? ORDER BY id ASC",
    [ordreId]
  );
}

export async function addProbleme(
  ordreId: string,
  description: string
): Promise<ProblemeEntry> {
  const db = getDatabase();
  await db.runAsync(
    "INSERT INTO problemes (ordre_id, description) VALUES (?, ?)",
    [ordreId, description]
  );
  const result = await db.getFirstAsync<{ id: number }>(
    "SELECT last_insert_rowid() as id"
  );
  return (await db.getFirstAsync<ProblemeEntry>(
    "SELECT * FROM problemes WHERE id = ?",
    [result!.id]
  ))!;
}

export async function updateProbleme(
  id: number,
  description: string
): Promise<void> {
  const db = getDatabase();
  await db.runAsync("UPDATE problemes SET description = ? WHERE id = ?", [
    description,
    id,
  ]);
}

export async function deleteProbleme(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync("DELETE FROM problemes WHERE id = ?", [id]);
}
