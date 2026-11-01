import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, TextInput, Button, IconButton, useTheme, HelperText, Chip } from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VehiculePicker } from "../src/components/ordres/VehiculePicker";
import { ordreCreationSchema } from "../src/features/ordres/schema";
import type { OrdreCreationFormData } from "../src/features/ordres/schema";
import type { Realisateur } from "../src/features/ordres/types";
import { useOrdreMutations } from "../src/features/ordres/hooks";
import { useMecaniciens, useAssocies } from "../src/features/finance/hooks";
import { Card } from "../src/components/ui/Card";

interface SelectedInfo {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  telephone: string;
}

type CreateStep = "select" | "kilometrage";

export default function CreateOrdreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { create } = useOrdreMutations();
  const { mecaniciens } = useMecaniciens();
  const { names } = useAssocies();
  const [step, setStep] = useState<CreateStep>("select");
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo | null>(null);
  const [realisateur, setRealisateur] = useState<Realisateur>("proprio");
  const [mecanicienId, setMecanicienId] = useState<number | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<OrdreCreationFormData>({
    resolver: zodResolver(ordreCreationSchema),
    defaultValues: { vehicule_id: 0, kilometrage: null },
  });

  const handleSelect = (info: SelectedInfo) => {
    setSelectedInfo(info);
    setValue("vehicule_id", info.id, { shouldValidate: true });
    setStep("kilometrage");
  };

  const handleCreate = async (data: OrdreCreationFormData) => {
    if (!selectedInfo) return;
    await create({
      vehicule_id: data.vehicule_id,
      kilometrage: data.kilometrage,
      realisateur,
      mecanicien_id: realisateur === "mecanicien" ? mecanicienId : null,
    });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <IconButton icon="close" size={28} onPress={() => router.back()} />
        <Text variant="headlineSmall" style={{ fontWeight: "800", color: theme.colors.onBackground, flex: 1, marginLeft: 4 }}>
          Nouvel O.R.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === "select" ? (
          <VehiculePicker onSelect={handleSelect} />
        ) : (
          <View style={{ gap: 16 }}>
            <Card style={{ gap: 12 }}>
              <Text variant="titleMedium" style={{ fontWeight: "700", color: theme.colors.onSurface }}>
                {selectedInfo?.marque} {selectedInfo?.modele}
              </Text>
              <View style={{ gap: 4 }}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Immatriculation : {selectedInfo?.immatriculation}
                </Text>
                {selectedInfo?.telephone ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Tél : {selectedInfo.telephone}
                  </Text>
                ) : null}
              </View>
            </Card>

            <Card>
              <Controller control={control} name="kilometrage" render={({ field: { onChange, value, onBlur } }) => (
                <View>
                  <TextInput
                    label="Kilométrage"
                    value={value != null ? value.toString() : ""}
                    onChangeText={(t) => { const n = parseInt(t); onChange(isNaN(n) ? undefined : n); }}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    mode="outlined"
                    outlineStyle={{ borderRadius: 12 }}
                    error={!!errors.kilometrage}
                    left={<TextInput.Icon icon="speedometer" />}
                  />
                  {errors.kilometrage && <HelperText type="error">{errors.kilometrage.message}</HelperText>}
                </View>
              )} />
            </Card>

            <Card>
              <View>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                  Réalisé par
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <Chip
                    selected={realisateur === "proprio"}
                    mode={realisateur === "proprio" ? "flat" : "outlined"}
                    icon="account-star"
                    onPress={() => { setRealisateur("proprio"); setMecanicienId(null); }}
                    style={{ borderRadius: 10 }}
                  >
                    Moi ({names.proprio})
                  </Chip>
                  <Chip
                    selected={realisateur === "associe"}
                    mode={realisateur === "associe" ? "flat" : "outlined"}
                    icon="account"
                    onPress={() => { setRealisateur("associe"); setMecanicienId(null); }}
                    style={{ borderRadius: 10 }}
                  >
                    {names.associe}
                  </Chip>
                  {mecaniciens.map((m) => (
                    <Chip
                      key={m.id}
                      selected={realisateur === "mecanicien" && mecanicienId === m.id}
                      mode={realisateur === "mecanicien" && mecanicienId === m.id ? "flat" : "outlined"}
                      icon="wrench"
                      onPress={() => { setRealisateur("mecanicien"); setMecanicienId(m.id); }}
                      style={{ borderRadius: 10 }}
                    >
                      {m.name}
                    </Chip>
                  ))}
                </View>
              </View>
            </Card>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button mode="outlined" onPress={() => setStep("select")} style={{ borderRadius: 12, flex: 1 }}>
                Modifier véhicule
              </Button>
              <Button mode="contained" onPress={handleSubmit(handleCreate)} loading={isSubmitting} disabled={isSubmitting} style={{ borderRadius: 12, flex: 1 }} contentStyle={{ paddingVertical: 6 }}>
                Créer l'O.R.
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 },
});
