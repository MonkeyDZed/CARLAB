import { useState, useCallback } from "react";
import type { ProblemeEntry } from "./problemes.api";
import * as api from "./problemes.api";

export function useProblemes(ordreId: string) {
  const [problemes, setProblemes] = useState<ProblemeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProblemes(ordreId);
      setProblemes(data);
    } finally {
      setLoading(false);
    }
  }, [ordreId]);

  return { problemes, loading, refresh };
}

export function useProblemesMutations() {
  const [loading, setLoading] = useState(false);

  const add = async (
    ordreId: string,
    description: string
  ): Promise<ProblemeEntry> => {
    setLoading(true);
    try {
      return await api.addProbleme(ordreId, description);
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: number, description: string): Promise<void> => {
    setLoading(true);
    try {
      await api.updateProbleme(id, description);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      await api.deleteProbleme(id);
    } finally {
      setLoading(false);
    }
  };

  return { add, update, remove, loading };
}
