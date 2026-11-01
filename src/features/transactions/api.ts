import { randomUUID } from "expo-crypto";
import { getDatabase } from "../../database";
import type { Transaction, TransactionFilter, TransactionSummary } from "./types";
import { COMMUNE_CATEGORIES } from "./types";
import type { TransactionFormData } from "./schema";
import {
  splitDepenseCommune,
  deleteMouvementsAssociesByTransactionId,
} from "../finance/api";

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export async function getAllTransactions(
  filter?: TransactionFilter
): Promise<Transaction[]> {
  const db = getDatabase();
  let query = "SELECT * FROM transactions";
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter?.search) {
    conditions.push("(description LIKE ? OR category LIKE ?)");
    const searchTerm = `%${filter.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filter?.category) {
    conditions.push("category = ?");
    params.push(filter.category);
  }

  if (filter?.type) {
    conditions.push("type = ?");
    params.push(filter.type);
  }

  if (filter?.startDate) {
    conditions.push("date >= ?");
    params.push(filter.startDate);
  }

  if (filter?.endDate) {
    conditions.push("date <= ?");
    params.push(filter.endDate);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY date DESC, created_at DESC";

  return db.getAllAsync<Transaction>(query, params);
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = getDatabase();
  return db.getFirstAsync<Transaction>(
    "SELECT * FROM transactions WHERE id = ?",
    [id]
  );
}

export async function createTransaction(
  data: TransactionFormData
): Promise<Transaction> {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();
  const date = data.date || formatDate(new Date());

  const photoUri = data.photoUri || null;
  const ordreId = data.ordreId || null;

  await db.runAsync(
    `INSERT INTO transactions (id, amount, type, category, description, photo_uri, date, ordre_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.amount, data.type, data.category, data.description ?? null, photoUri, date, ordreId, now, now]
  );

  if (data.type === "expense" && COMMUNE_CATEGORIES.includes(data.category)) {
    await splitDepenseCommune(data.amount, date, data.description ?? null, id);
  }

  const tx = await getTransactionById(id);
  if (!tx) throw new Error("Failed to create transaction");
  return tx;
}

export async function updateTransaction(
  id: string,
  data: Partial<TransactionFormData>
): Promise<Transaction> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.amount !== undefined) {
    updates.push("amount = ?");
    params.push(data.amount);
  }
  if (data.type !== undefined) {
    updates.push("type = ?");
    params.push(data.type);
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    params.push(data.category);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description ?? null);
  }
  if (data.date !== undefined) {
    updates.push("date = ?");
    params.push(data.date!);
  }
  if (data.photoUri !== undefined) {
    updates.push("photo_uri = ?");
    params.push(data.photoUri || null);
  }

  updates.push("updated_at = ?");
  params.push(now);
  params.push(id);

  await db.runAsync(
    `UPDATE transactions SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  const tx = await getTransactionById(id);
  if (!tx) throw new Error("Failed to update transaction");

  await deleteMouvementsAssociesByTransactionId(id);
  if (tx.type === "expense" && COMMUNE_CATEGORIES.includes(tx.category)) {
    await splitDepenseCommune(tx.amount, tx.date, tx.description, id);
  }

  return tx;
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = getDatabase();
  await deleteMouvementsAssociesByTransactionId(id);
  await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

export async function getTransactionSummary(): Promise<TransactionSummary> {
  const db = getDatabase();

  const totals = await db.getFirstAsync<{
    totalExpenses: number;
    totalIncomes: number;
    movementCount: number;
  }>(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpenses,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncomes,
      COUNT(*) as movementCount
     FROM transactions`
  );

  const breakdown = await db.getAllAsync<{
    category: string;
    total: number;
    count: number;
  }>(
    `SELECT category,
            SUM(amount) as total,
            COUNT(*) as count
     FROM transactions WHERE type = 'expense'
     GROUP BY category
     ORDER BY total DESC`
  );

  return {
    totalExpenses: totals?.totalExpenses ?? 0,
    totalIncomes: totals?.totalIncomes ?? 0,
    movementCount: totals?.movementCount ?? 0,
    categoryBreakdown: breakdown,
  };
}

