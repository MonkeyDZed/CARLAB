import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import * as api from "./api";
import type {
  Mecanicien,
  MouvementMecanicien,
  MouvementAssocie,
  AssocieNames,
  Objectif,
  ObjectifAlimentation,
} from "./types";
import { calculateObjectifProgression } from "../../utils/finance";

export function useMecaniciens() {
  const [mecaniciens, setMecaniciens] = useState<Mecanicien[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setMecaniciens(await api.getMecaniciens());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { mecaniciens, loading, refresh };
}

export function useMecanicienMouvements(mecanicienId?: number) {
  const [mouvements, setMouvements] = useState<MouvementMecanicien[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setMouvements(await api.getMouvementsMecaniciens(mecanicienId));
    } finally {
      setLoading(false);
    }
  }, [mecanicienId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const total = useMemo(
    () =>
      mouvements.reduce(
        (s, m) => s + (m.type === "commission" ? m.montant : -m.montant),
        0
      ),
    [mouvements]
  );

  return { mouvements, total, loading, refresh };
}

export function useObjectif() {
  const [objectif, setObjectif] = useState<Objectif | null>(null);
  const [alimentations, setAlimentations] = useState<ObjectifAlimentation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [o, a] = await Promise.all([
        api.getObjectifCourant(),
        api.getAlimentations(),
      ]);
      setObjectif(o);
      setAlimentations(a);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const cumul = useMemo(
    () => alimentations.reduce((s, a) => s + a.montant, 0),
    [alimentations]
  );

  const progression = useMemo(
    () => calculateObjectifProgression(cumul, objectif?.montant_cible ?? 0),
    [cumul, objectif]
  );

  return { objectif, alimentations, cumul, progression, loading, refresh };
}

export function useAssocies() {
  const [mouvements, setMouvements] = useState<MouvementAssocie[]>([]);
  const [names, setNames] = useState<AssocieNames>({
    proprio: "Proprio",
    associe: "Associé",
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, n] = await Promise.all([
        api.getMouvementsAssocies(),
        api.getAssocieNames(),
      ]);
      setMouvements(m);
      setNames(n);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const soldeProprio = useMemo(
    () =>
      mouvements
        .filter((m) => m.cible === "proprio")
        .reduce((s, m) => s + m.montant, 0),
    [mouvements]
  );

  const soldeAssocie = useMemo(
    () =>
      mouvements
        .filter((m) => m.cible === "associe")
        .reduce((s, m) => s + m.montant, 0),
    [mouvements]
  );

  return { mouvements, names, soldeProprio, soldeAssocie, loading, refresh };
}

export function useFinanceOverview() {
  const mecaniciens = useMecaniciens();
  const objectif = useObjectif();
  const associes = useAssocies();
  const mouvements = useMecanicienMouvements();

  const loading =
    mecaniciens.loading ||
    objectif.loading ||
    associes.loading ||
    mouvements.loading;

  const refresh = useCallback(async () => {
    await Promise.all([
      mecaniciens.refresh(),
      objectif.refresh(),
      associes.refresh(),
      mouvements.refresh(),
    ]);
  }, [mecaniciens, objectif, associes, mouvements]);

  const totalParMecanicien = useMemo(() => {
    const map = new Map<number, number>();
    for (const m of mouvements.mouvements) {
      const signed = m.type === "commission" ? m.montant : -m.montant;
      map.set(m.mecanicien_id, (map.get(m.mecanicien_id) ?? 0) + signed);
    }
    return map;
  }, [mouvements.mouvements]);

  return {
    mecaniciens: mecaniciens.mecaniciens,
    objectifProgression: objectif.progression,
    associeNames: associes.names,
    soldeProprio: associes.soldeProprio,
    soldeAssocie: associes.soldeAssocie,
    totalParMecanicien,
    loading,
    refresh,
  };
}

export function useFinanceMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createMecanicien: (name: string, commissionPercent: number) =>
      run(() => api.createMecanicien(name, commissionPercent)),
    updateMecanicien: (
      id: number,
      data: { name?: string; commissionPercent?: number }
    ) => run(() => api.updateMecanicien(id, data)),
    deleteMecanicien: (id: number) => run(() => api.deleteMecanicien(id)),
    createRetraitMecanicien: (input: api.RetraitMecanicienInput) =>
      run(() => api.createRetraitMecanicien(input)),
    createRetraitAssocie: (input: api.RetraitAssocieInput) =>
      run(() => api.createRetraitAssocie(input)),
    setAssocieNames: (names: AssocieNames) =>
      run(() => api.setAssocieNames(names)),
    setObjectif: (input: api.SetObjectifInput) => run(() => api.setObjectif(input)),
    alimenterObjectif: (input: api.AlimentationInput) =>
      run(() => api.alimenterObjectif(input)),
  };
}
