import { useState, useCallback } from "react";
import type { InterventionEntry } from "./interventions.api";
import * as api from "./interventions.api";

export function useInterventions(ordreId: string) {
  const [interventions, setInterventions] = useState<InterventionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getInterventions(ordreId);
      setInterventions(data);
    } finally {
      setLoading(false);
    }
  }, [ordreId]);

  return { interventions, loading, refresh };
}

export function useInterventionsMutations() {
  const [loading, setLoading] = useState(false);

  const add = async (
    ordreId: string,
    description: string
  ): Promise<InterventionEntry> => {
    setLoading(true);
    try {
      return await api.addIntervention(ordreId, description);
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: number, description: string): Promise<void> => {
    setLoading(true);
    try {
      await api.updateIntervention(id, description);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      await api.deleteIntervention(id);
    } finally {
      setLoading(false);
    }
  };

  return { add, update, remove, loading };
}
