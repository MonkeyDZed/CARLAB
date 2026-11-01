import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import type { OrdreReparation, OrdreWithDetails, OrdreStatut, Realisateur } from "./types";
import type {
  OrdreCreationFormData,
  PaiementFormData,
} from "./schema";
import * as api from "./api";
import { createTransaction } from "../transactions/api";
import {
  getMecanicienById,
  crediterCommission,
  splitRecetteNet,
} from "../finance/api";
import { calculateCommission } from "../../utils/finance";

export function useOrdres(statut?: OrdreStatut) {
  const [ordres, setOrdres] = useState<OrdreWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllOrdres(statut);
      setOrdres(data);
    } finally {
      setLoading(false);
    }
  }, [statut]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { ordres, loading, refresh };
}

export function useOrdre(id: string) {
  const [ordre, setOrdre] = useState<OrdreWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOrdreById(id);
      setOrdre(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { ordre, loading, refresh };
}

export function useOrdreMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (
    data: OrdreCreationFormData
  ): Promise<OrdreReparation> => {
    setLoading(true);
    setError(null);
    try {
      return await api.createOrdre(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur création O.R.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (
    id: string,
    statut: OrdreStatut
  ): Promise<OrdreReparation> => {
    setLoading(true);
    setError(null);
    try {
      return await api.updateOrdreStatut(id, statut);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur statut";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const setRealisateur = async (
    id: string,
    realisateur: Realisateur,
    mecanicienId: number | null
  ): Promise<OrdreReparation> => {
    setLoading(true);
    setError(null);
    try {
      return await api.updateOrdreRealisateur(id, realisateur, mecanicienId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur mécanicien";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const setMontant = async (
    id: string,
    montant_total: number
  ): Promise<OrdreReparation> => {
    setLoading(true);
    setError(null);
    try {
      return await api.updateOrdreMontant(id, montant_total);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur montant";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const addPaiement = async (
    ordreId: string,
    data: PaiementFormData
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const date = new Date().toISOString().split("T")[0];
      const ordre = await api.getOrdreById(ordreId);
      const mecanicienId = ordre?.mecanicien_id ?? null;
      const commissionPercent =
        mecanicienId != null
          ? (await getMecanicienById(mecanicienId))?.commission_percent ?? 0
          : 0;
      const commission = calculateCommission(
        data.montant,
        commissionPercent
      );
      const net = data.montant - commission;

      await createTransaction({
        amount: data.montant,
        type: "income",
        category: "Réparation",
        date,
        ordreId,
      });

      if (mecanicienId != null && commission > 0) {
        await crediterCommission({
          mecanicienId,
          montant: commission,
          date,
          description: `Commission O.R. #${ordreId.slice(0, 6)}`,
          ordreId,
        });
      }

      if (net > 0) {
        await splitRecetteNet(net, date, ordreId);
      }

      const refreshed = await api.getOrdreById(ordreId);
      if (
        refreshed &&
        refreshed.montant_total &&
        refreshed.montant_total > 0 &&
        refreshed.total_paye >= refreshed.montant_total
      ) {
        await api.updateOrdreStatut(ordreId, "paye");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur paiement";
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
      await api.deleteOrdre(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur suppression";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    create,
    updateStatut,
    setRealisateur,
    setMontant,
    addPaiement,
    remove,
    loading,
    error,
  };
}
