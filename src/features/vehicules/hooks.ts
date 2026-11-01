import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import type { Vehicule } from "./types";
import type { VehiculeFormData } from "./schema";
import * as api from "./api";

export function useAllVehicules(search?: string) {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllVehicules(search);
      setVehicules(data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { vehicules, loading, refresh };
}

export function useVehicule(id: number) {
  const [vehicule, setVehicule] = useState<Vehicule | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getVehiculeById(id);
      setVehicule(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { vehicule, loading, refresh };
}

export function useVehiculeMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: VehiculeFormData): Promise<Vehicule> => {
    setLoading(true);
    setError(null);
    try {
      return await api.createVehicule(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur création véhicule";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const update = async (
    id: number,
    data: Partial<VehiculeFormData>
  ): Promise<Vehicule> => {
    setLoading(true);
    setError(null);
    try {
      return await api.updateVehicule(id, data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur modification véhicule";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteVehicule(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur suppression véhicule";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}
