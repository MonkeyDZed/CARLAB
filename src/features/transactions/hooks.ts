import { useState, useCallback, useEffect, useMemo } from "react";
import type { Transaction, TransactionFilter } from "./types";
import type { TransactionFormData } from "./schema";
import * as api from "./api";
import { useFocusEffect } from "expo-router";

export function useTransactions(filter?: TransactionFilter) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = filter?.search;
  const category = filter?.category;
  const type = filter?.type;
  const startDate = filter?.startDate;
  const endDate = filter?.endDate;

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllTransactions({
        search,
        category,
        type,
        startDate,
        endDate,
      });
      setTransactions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [search, category, type, startDate, endDate]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { transactions, loading, error, refresh };
}

export function useTransactionsSummary(filter?: TransactionFilter) {
  const { transactions, loading, refresh } = useTransactions(filter);

  const totals = useMemo(() => {
    let totalExpenses = 0;
    let totalIncomes = 0;
    const catMap = new Map<string, { total: number; count: number }>();
    for (const tx of transactions) {
      if (tx.type === "expense") {
        totalExpenses += tx.amount;
        const cur = catMap.get(tx.category) ?? { total: 0, count: 0 };
        cur.total += tx.amount;
        cur.count += 1;
        catMap.set(tx.category, cur);
      } else {
        totalIncomes += tx.amount;
      }
    }
    const categoryBreakdown = Array.from(catMap.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([category, d]) => ({
        category,
        total: d.total,
        count: d.count,
        percentage:
          totalExpenses > 0 ? Math.round((d.total / totalExpenses) * 100) : 0,
      }));
    return {
      totalExpenses,
      totalIncomes,
      movementCount: transactions.length,
      categoryBreakdown,
    };
  }, [transactions]);

  return { transactions, totals, loading, refresh };
}

export function useTransaction(id: string) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTransactionById(id);
      setTransaction(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transaction, loading, refresh };
}

export function useTransactionMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: TransactionFormData): Promise<Transaction> => {
    setLoading(true);
    setError(null);
    try {
      return await api.createTransaction(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la création";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const update = async (
    id: string,
    data: Partial<TransactionFormData>
  ): Promise<Transaction> => {
    setLoading(true);
    setError(null);
    try {
      return await api.updateTransaction(id, data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la modification";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteTransaction(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la suppression";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}
