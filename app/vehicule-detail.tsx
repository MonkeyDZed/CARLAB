import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useVehicule, useVehiculeMutations } from "../src/features/vehicules/hooks";
import { vehiculeSchema, type VehiculeFormData } from "../src/features/vehicules/schema";
import { getOrdresByVehicule } from "../src/features/ordres/api";
import type { OrdreWithDetails } from "../src/features/ordres/types";
import { Card } from "../src/components/ui/Card";
import { BrandModelPicker } from "../src/components/ui/BrandModelPicker";
import { STATUT_LABEL } from "../src/features/ordres/types";
import { formatCurrency, formatShortDate } from "../src/utils/format";

const STATUT_COLORS: Record<string, string> = {
  brouillon: "#607D8B",
  en_cours: "#FF9800",
  termine: "#2196F3",
  facture: "#4CAF50",
  paye: "#2E7D32",
};

export default function VehiculeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehiculeId = parseInt(id);
  const theme = useTheme();
  const router = useRouter();
  const { vehicule, loading, refresh } = useVehicule(vehiculeId);
  const { update, remove } = useVehiculeMutations();
  const [ordres, setOrdres] = useState<OrdreWithDetails[]>([]);
  const [loadingOrdres, setLoadingOrdres] = useState(false);
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingOrdres(true);
      const o = await getOrdresByVehicule(vehiculeId);
      setOrdres(o);
      setLoadingOrdres(false);
    };
    load();
  }, [vehiculeId]);

  if (loading || !vehicule) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
        <View style={styles.header}>
          <IconButton icon="close" size={28} onPress={() => router.back()} />
        </View>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert("Supprimer", `${vehicule.marque} ${vehicule.modele} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => { await remove(vehiculeId); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <IconButton icon="close" size={28} onPress={() => router.back()} />
        <Text variant="headlineSmall" style={{ fontWeight: "800", flex: 1, marginLeft: 4 }}>
          {vehicule.marque} {vehicule.modele}
        </Text>
        <IconButton icon="delete-outline" iconColor={theme.colors.error} size={22} onPress={handleDelete} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text variant="titleSmall" style={{ fontWeight: "700" }}>Informations</Text>
            <Button mode="text" compact icon="pencil" onPress={() => setEditModal(true)}>Modifier</Button>
          </View>
          <InfoRow icon="card-account-details-outline" label="Immat." value={vehicule.immatriculation} theme={theme} />
          <InfoRow icon="car" label="Marque" value={vehicule.marque} theme={theme} />
          <InfoRow icon="car-side" label="Modèle" value={vehicule.modele} theme={theme} />
          <InfoRow icon="calendar" label="Année" value={vehicule.annee?.toString() || "-"} theme={theme} />
          <InfoRow icon="phone" label="Téléphone" value={vehicule.telephone || "-"} theme={theme} />
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <Text variant="titleSmall" style={{ fontWeight: "700", marginBottom: 8 }}>
            Historique O.R. ({ordres.length})
          </Text>
          {loadingOrdres ? (
            <ActivityIndicator style={{ padding: 16 }} />
          ) : ordres.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}>Aucun O.R.</Text>
          ) : (
            ordres.map((o, i) => (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: "/detail-ordre", params: { id: o.id } })}
              >
                <Card variant="flat" style={{ marginTop: i > 0 ? 6 : 0, padding: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" style={{ fontWeight: "600" }}>
                        #{o.id.slice(0, 6)} - {formatShortDate(o.date_creation)}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                        <Text variant="labelSmall" style={{ color: STATUT_COLORS[o.statut], fontWeight: "600" }}>
                          {STATUT_LABEL[o.statut]}
                        </Text>
                        {o.montant_total != null && (
                          <Text variant="labelSmall" style={{ opacity: 0.7 }}>{formatCurrency(o.montant_total)}</Text>
                        )}
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </Card>
      </ScrollView>

      {editModal && (
        <View style={styles.modalOverlay}>
          <Card style={{ width: "90%", maxWidth: 400, gap: 12 }}>
            <Text variant="titleMedium" style={{ fontWeight: "700" }}>Modifier le véhicule</Text>
            <EditForm vehicule={vehicule} onSave={async (data) => { await update(vehiculeId, data); await refresh(); setEditModal(false); }} onCancel={() => setEditModal(false)} />
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, theme }: { icon: string; label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
      <MaterialCommunityIcons name={icon as any} size={16} color={theme.colors.onSurfaceVariant} />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, width: 80 }}>{label}</Text>
      <Text variant="bodyMedium" style={{ fontWeight: "500", flex: 1 }}>{value}</Text>
    </View>
  );
}

function EditForm({
  vehicule,
  onSave,
  onCancel,
}: {
  vehicule: { immatriculation: string; marque: string; modele: string; annee: number | null; telephone: string };
  onSave: (data: VehiculeFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { control, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<VehiculeFormData>({
    resolver: zodResolver(vehiculeSchema),
    defaultValues: { immatriculation: vehicule.immatriculation, marque: vehicule.marque, modele: vehicule.modele, annee: vehicule.annee, telephone: vehicule.telephone },
  });

  return (
    <View style={{ gap: 12 }}>
      <Controller control={control} name="immatriculation" render={({ field: { onChange, value } }) => (
        <TextInput label="Immatriculation *" value={value} onChangeText={(t) => onChange(t.toUpperCase())} mode="outlined" outlineStyle={{ borderRadius: 12 }} autoCapitalize="characters" autoCorrect={false} />
      )} />
      <BrandModelPicker
        marque={watch("marque") ?? ""}
        modele={watch("modele") ?? ""}
        onMarqueChange={(v) => setValue("marque", v, { shouldValidate: true })}
        onModeleChange={(v) => setValue("modele", v, { shouldValidate: true })}
      />
      <Controller control={control} name="annee" render={({ field: { onChange, value } }) => (
        <TextInput label="Année (optionnel)" value={value != null ? value.toString() : ""} onChangeText={(t) => { const n = parseInt(t); onChange(isNaN(n) ? null : n); }} mode="outlined" outlineStyle={{ borderRadius: 12 }} keyboardType="numeric" />
      )} />
      <Controller control={control} name="telephone" render={({ field: { onChange, value } }) => (
        <TextInput label="Téléphone (optionnel)" value={value} onChangeText={onChange} mode="outlined" outlineStyle={{ borderRadius: 12 }} keyboardType="phone-pad" />
      )} />
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
        <Button onPress={onCancel}>Annuler</Button>
        <Button mode="contained" onPress={handleSubmit(onSave)} loading={isSubmitting} disabled={isSubmitting} style={{ borderRadius: 12 }}>Enregistrer</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 100 },
});
