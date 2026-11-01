import { randomUUID } from "expo-crypto";
import { getDatabase } from "../../database";
import { todayISODate } from "../../utils/workingDays";
import { getSetting, setSetting } from "../settings/api";
import { split50 } from "../../utils/finance";
import type {
  Mecanicien,
  MouvementMecanicien,
  Objectif,
  ObjectifAlimentation,
  MouvementAssocie,
  AssocieCible,
  AssocieNames,
} from "./types";

function normalizeDate(date?: string): string {
  if (date && date.trim() !== "") return date.trim();
  return todayISODate();
}

async function insertExpense(
  db: ReturnType<typeof getDatabase>,
  amount: number,
  category: string,
  date: string,
  description: string | null
): Promise<void> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO transactions (id, amount, type, category, description, photo_uri, date, partner_id, ordre_id, created_at, updated_at)
     VALUES (?, ?, 'expense', ?, ?, NULL, ?, NULL, NULL, ?, ?)`,
    [id, amount, category, description ?? null, date, now, now]
  );
}

// --- Mécaniciens ---

export async function getMecaniciens(): Promise<Mecanicien[]> {
  const db = getDatabase();
  return db.getAllAsync<Mecanicien>(
    "SELECT * FROM partners ORDER BY name ASC"
  );
}

export async function getMecanicienById(id: number): Promise<Mecanicien | null> {
  const db = getDatabase();
  return db.getFirstAsync<Mecanicien>(
    "SELECT * FROM partners WHERE id = ?",
    [id]
  );
}

export async function createMecanicien(
  name: string,
  commissionPercent: number
): Promise<Mecanicien> {
  const db = getDatabase();
  await db.runAsync(
    "INSERT INTO partners (name, commission_percent) VALUES (?, ?)",
    [name, commissionPercent]
  );
  const res = await db.getFirstAsync<{ id: number }>(
    "SELECT last_insert_rowid() as id"
  );
  return (await getMecanicienById(res!.id))!;
}

export async function updateMecanicien(
  id: number,
  data: { name?: string; commissionPercent?: number }
): Promise<Mecanicien> {
  const db = getDatabase();
  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    params.push(data.name);
  }
  if (data.commissionPercent !== undefined) {
    updates.push("commission_percent = ?");
    params.push(data.commissionPercent);
  }

  if (updates.length > 0) {
    params.push(id);
    await db.runAsync(
      `UPDATE partners SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  }
  return (await getMecanicienById(id))!;
}

export async function deleteMecanicien(id: number): Promise<void> {
  const db = getDatabase();
  const count = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM mouvements_mecaniciens WHERE mecanicien_id = ?",
    [id]
  );
  if (count && count.count > 0) {
    throw new Error(
      "Impossible de supprimer un mécanicien ayant des mouvements financiers"
    );
  }
  await db.runAsync(
    "UPDATE ordres_reparation SET mecanicien_id = NULL WHERE mecanicien_id = ?",
    [id]
  );
  await db.runAsync("DELETE FROM partners WHERE id = ?", [id]);
}

// --- Mouvements mécaniciens ---

export async function getMouvementsMecaniciens(
  mecanicienId?: number
): Promise<MouvementMecanicien[]> {
  const db = getDatabase();
  if (mecanicienId != null) {
    return db.getAllAsync<MouvementMecanicien>(
      "SELECT * FROM mouvements_mecaniciens WHERE mecanicien_id = ? ORDER BY date DESC, id DESC",
      [mecanicienId]
    );
  }
  return db.getAllAsync<MouvementMecanicien>(
    "SELECT * FROM mouvements_mecaniciens ORDER BY date DESC, id DESC"
  );
}

export interface RetraitMecanicienInput {
  mecanicienId: number;
  montant: number;
  date?: string;
  description?: string;
}

export async function createRetraitMecanicien(
  input: RetraitMecanicienInput
): Promise<MouvementMecanicien> {
  const db = getDatabase();
  const date = normalizeDate(input.date);
  if (!(input.montant > 0)) {
    throw new Error("Le montant doit être positif");
  }

  let created: MouvementMecanicien | null = null;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO mouvements_mecaniciens (mecanicien_id, type, montant, date, description)
       VALUES (?, 'retrait', ?, ?, ?)`,
      [input.mecanicienId, input.montant, date, input.description ?? null]
    );
    await insertExpense(db, input.montant, "Retrait mécanicien", date, input.description ?? null);
    created = (await db.getFirstAsync<MouvementMecanicien>(
      "SELECT * FROM mouvements_mecaniciens WHERE id = ?",
      [res.lastInsertRowId]
    ))!;
  });

  return created!;
}

export async function crediterCommission(
  input: RetraitMecanicienInput & { ordreId?: string | null }
): Promise<MouvementMecanicien> {
  const db = getDatabase();
  const date = normalizeDate(input.date);
  if (!(input.montant > 0)) {
    throw new Error("Le montant doit être positif");
  }

  let created: MouvementMecanicien | null = null;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO mouvements_mecaniciens (mecanicien_id, type, montant, date, description, ordre_id)
       VALUES (?, 'commission', ?, ?, ?, ?)`,
      [
        input.mecanicienId,
        input.montant,
        date,
        input.description ?? null,
        input.ordreId ?? null,
      ]
    );
    created = (await db.getFirstAsync<MouvementMecanicien>(
      "SELECT * FROM mouvements_mecaniciens WHERE id = ?",
      [res.lastInsertRowId]
    ))!;
  });

  return created!;
}

// --- Associés (Proprio + Associé) ---

async function insertMouvementAssocie(
  cible: AssocieCible,
  type: MouvementAssocie["type"],
  montant: number,
  date: string,
  description: string | null,
  ordreId: string | null,
  transactionId: string | null
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO comptes_associes (cible, type, montant, date, description, ordre_id, transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cible, type, montant, date, description ?? null, ordreId ?? null, transactionId ?? null]
  );
}

export async function getAssocieNames(): Promise<AssocieNames> {
  const proprio = await getSetting("proprio_name");
  const associe = await getSetting("associe_name");
  return {
    proprio: proprio ?? "Proprio",
    associe: associe ?? "Associé",
  };
}

export async function setAssocieNames(names: AssocieNames): Promise<void> {
  await setSetting("proprio_name", names.proprio);
  await setSetting("associe_name", names.associe);
}

export async function getMouvementsAssocies(
  cible?: AssocieCible
): Promise<MouvementAssocie[]> {
  const db = getDatabase();
  if (cible) {
    return db.getAllAsync<MouvementAssocie>(
      "SELECT * FROM comptes_associes WHERE cible = ? ORDER BY date DESC, id DESC",
      [cible]
    );
  }
  return db.getAllAsync<MouvementAssocie>(
    "SELECT * FROM comptes_associes ORDER BY date DESC, id DESC"
  );
}

export async function splitRecetteNet(
  net: number,
  date: string,
  ordreId: string
): Promise<void> {
  const [p1, p2] = split50(net);
  await insertMouvementAssocie("proprio", "part_recette", p1, date, null, ordreId, null);
  await insertMouvementAssocie("associe", "part_recette", p2, date, null, ordreId, null);
}

export async function splitDepenseCommune(
  montant: number,
  date: string,
  description: string | null,
  transactionId: string | null
): Promise<void> {
  const [p1, p2] = split50(montant);
  await insertMouvementAssocie("proprio", "part_depense", -p1, date, description, null, transactionId);
  await insertMouvementAssocie("associe", "part_depense", -p2, date, description, null, transactionId);
}

export async function deleteMouvementsAssociesByTransactionId(
  transactionId: string
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    "DELETE FROM comptes_associes WHERE transaction_id = ?",
    [transactionId]
  );
}

export interface RetraitAssocieInput {
  cible: AssocieCible;
  montant: number;
  date?: string;
  description?: string;
}

export async function createRetraitAssocie(
  input: RetraitAssocieInput
): Promise<MouvementAssocie> {
  const db = getDatabase();
  const date = normalizeDate(input.date);
  if (!(input.montant > 0)) {
    throw new Error("Le montant doit être positif");
  }

  let created: MouvementAssocie | null = null;
  await db.withTransactionAsync(async () => {
    await insertExpense(db, input.montant, "Retrait associé", date, input.description ?? null);
    const res = await db.runAsync(
      `INSERT INTO comptes_associes (cible, type, montant, date, description)
       VALUES (?, 'retrait', ?, ?, ?)`,
      [input.cible, -input.montant, date, input.description ?? null]
    );
    created = (await db.getFirstAsync<MouvementAssocie>(
      "SELECT * FROM comptes_associes WHERE id = ?",
      [res.lastInsertRowId]
    ))!;
  });

  return created!;
}

// --- Objectif ---

export async function getObjectifCourant(): Promise<Objectif | null> {
  const db = getDatabase();
  return db.getFirstAsync<Objectif>(
    "SELECT * FROM objectif ORDER BY id DESC LIMIT 1"
  );
}

export interface SetObjectifInput {
  montantCible: number;
  dateDebut?: string;
  description?: string;
}

export async function setObjectif(input: SetObjectifInput): Promise<Objectif> {
  const db = getDatabase();
  const date = normalizeDate(input.dateDebut);
  const existing = await getObjectifCourant();
  if (existing) {
    await db.runAsync(
      "UPDATE objectif SET montant_cible = ?, date_debut = ?, description = ? WHERE id = ?",
      [input.montantCible, date, input.description ?? null, existing.id]
    );
    return (await getObjectifCourant())!;
  }
  const res = await db.runAsync(
    "INSERT INTO objectif (montant_cible, date_debut, description) VALUES (?, ?, ?)",
    [input.montantCible, date, input.description ?? null]
  );
  return (await db.getFirstAsync<Objectif>(
    "SELECT * FROM objectif WHERE id = ?",
    [res.lastInsertRowId]
  ))!;
}

export async function getAlimentations(): Promise<ObjectifAlimentation[]> {
  const db = getDatabase();
  return db.getAllAsync<ObjectifAlimentation>(
    "SELECT * FROM objectif_alimentations ORDER BY date DESC, id DESC"
  );
}

export interface AlimentationInput {
  montant: number;
  date?: string;
  description?: string;
}

export async function alimenterObjectif(
  input: AlimentationInput
): Promise<ObjectifAlimentation> {
  const db = getDatabase();
  const date = normalizeDate(input.date);
  if (!(input.montant > 0)) {
    throw new Error("Le montant doit être positif");
  }

  let created: ObjectifAlimentation | null = null;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      "INSERT INTO objectif_alimentations (montant, date, description) VALUES (?, ?, ?)",
      [input.montant, date, input.description ?? null]
    );
    await insertExpense(db, input.montant, "Épargne objectif", date, input.description ?? null);
    await splitDepenseCommune(input.montant, date, input.description ?? null, null);
    created = (await db.getFirstAsync<ObjectifAlimentation>(
      "SELECT * FROM objectif_alimentations WHERE id = ?",
      [res.lastInsertRowId]
    ))!;
  });

  return created!;
}
