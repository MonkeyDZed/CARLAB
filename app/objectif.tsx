import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  IconButton,
  HelperText,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  objectifSchema,
  alimentationSchema,
  type ObjectifFormData,
  type AlimentationFormData,
} from "../src/features/finance/schema";
import { useObjectif, useFinanceMutations } from "../src/features/finance/hooks";
import { Card } from "../src/components/ui/Card";
import { DateField } from "../src/components/ui/DateField";
import { formatCurrency, formatShortDate } from "../src/utils/format";
import { todayISODate } from "../src/utils/workingDays";

export default function ObjectifScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { objectif, alimentations, progression, loading, refresh } = useObjectif();
  const { setObjectif, alimenterObjectif, loading: saving } = useFinanceMutations();
  const [refreshing, setRefreshing] = useState(false);

  const objectifForm = useForm<ObjectifFormData>({
    resolver: zodResolver(objectifSchema),
    defaultValues: {
      montantCible: objectif?.montant_cible ?? 0,
      dateDebut: objectif?.date_debut ?? todayISODate(),
      description: objectif?.description ?? "",
    },
  });

  const alimentationForm = useForm<AlimentationFormData>({
    resolver: zodResolver(alimentationSchema),
    defaultValues: { montant: 0, date: todayISODate(), description: "" },
  });

  useEffect(() => {
    if (objectif) {
      objectifForm.reset({
        montantCible: objectif.montant_cible,
        dateDebut: objectif.date_debut,
        description: objectif.description ?? "",
      });
    }
  }, [objectif, objectifForm]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const onConfig = useCallback(
    async (data: ObjectifFormData) => {
      try {
        await setObjectif({
          montantCible: data.montantCible,
          dateDebut: data.dateDebut,
          description: data.description,
        });
        await refresh();
        Alert.alert("Succès", "Objectif mis à jour.");
      } catch (e) {
        Alert.alert("Erreur", e instanceof Error ? e.message : "Échec de la mise à jour");
      }
    },
    [setObjectif, refresh]
  );

  const onAlimenter = useCallback(
    async (data: AlimentationFormData) => {
      try {
        await alimenterObjectif({
          montant: data.montant,
          date: data.date,
          description: data.description,
        });
        alimentationForm.reset({ montant: 0, date: todayISODate(), description: "" });
        await refresh();
        Alert.alert("Succès", `Alimentation de ${formatCurrency(data.montant)} enregistrée.`);
      } catch (e) {
        Alert.alert("Erreur", e instanceof Error ? e.message : "Échec de l'alimentation");
      }
    },
    [alimenterObjectif, alimentationForm, refresh]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <IconButton icon="close" size={28} onPress={() => router.back()} />
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "800", color: theme.colors.onBackground, flex: 1, marginLeft: 4 }}
        >
          Objectif épargne
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? null : (
          <Card
            style={{
              backgroundColor: theme.colors.primaryContainer,
              alignItems: "center",
              paddingVertical: 24,
            }}
          >
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.primary, fontWeight: "600", letterSpacing: 0.5 }}
            >
              RESTE À ATTEINDRE
            </Text>
            <Text
              variant="displaySmall"
              style={{ fontWeight: "900", color: theme.colors.onPrimaryContainer, marginTop: 4 }}
            >
              {formatCurrency(progression.reste)}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7, marginTop: 6 }}
            >
              {formatCurrency(progression.cumul)} / {formatCurrency(progression.cible)}
            </Text>
            <ProgressBar
              progress={progression.pourcentage / 100}
              color={theme.colors.primary}
              style={{ width: "80%", height: 8, borderRadius: 4, marginTop: 12 }}
            />
          </Card>
        )}

        <Text
          variant="titleMedium"
          style={{ fontWeight: "700", color: theme.colors.onBackground, marginTop: 20, marginBottom: 8 }}
        >
          Alimenter
        </Text>
        <Card style={{ gap: 12 }}>
          <Controller
            control={alimentationForm.control}
            name="montant"
            render={({ field: { onChange, value, onBlur } }) => (
              <View>
                <TextInput
                  label="Montant (DA)"
                  value={value != null ? value.toString() : ""}
                  onChangeText={(t) => {
                    const n = parseFloat(t.replace(",", "."));
                    onChange(isNaN(n) ? undefined : n);
                  }}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineStyle={{ borderRadius: 12 }}
                  error={!!alimentationForm.formState.errors.montant}
                  left={<TextInput.Icon icon="cash-plus" />}
                />
                {alimentationForm.formState.errors.montant && (
                  <HelperText type="error">
                    {alimentationForm.formState.errors.montant.message}
                  </HelperText>
                )}
              </View>
            )}
          />
          <Controller
            control={alimentationForm.control}
            name="date"
            render={({ field: { onChange, value, onBlur } }) => (
              <DateField label="Date" value={value || ""} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          <Controller
            control={alimentationForm.control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                label="Description (optionnel)"
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                outlineStyle={{ borderRadius: 12 }}
                left={<TextInput.Icon icon="text" />}
              />
            )}
          />
          <Button
            mode="contained"
            onPress={alimentationForm.handleSubmit(onAlimenter)}
            loading={saving}
            disabled={saving}
            style={{ borderRadius: 12 }}
            contentStyle={{ paddingVertical: 6 }}
          >
            Alimenter
          </Button>
        </Card>

        <Text
          variant="titleMedium"
          style={{ fontWeight: "700", color: theme.colors.onBackground, marginTop: 20, marginBottom: 8 }}
        >
          Configurer l'objectif
        </Text>
        <Card style={{ gap: 12 }}>
          <Controller
            control={objectifForm.control}
            name="montantCible"
            render={({ field: { onChange, value, onBlur } }) => (
              <View>
                <TextInput
                  label="Montant cible (DA)"
                  value={value != null ? value.toString() : ""}
                  onChangeText={(t) => {
                    const n = parseFloat(t.replace(",", "."));
                    onChange(isNaN(n) ? undefined : n);
                  }}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineStyle={{ borderRadius: 12 }}
                  error={!!objectifForm.formState.errors.montantCible}
                  left={<TextInput.Icon icon="target" />}
                />
                {objectifForm.formState.errors.montantCible && (
                  <HelperText type="error">
                    {objectifForm.formState.errors.montantCible.message}
                  </HelperText>
                )}
              </View>
            )}
          />
          <Controller
            control={objectifForm.control}
            name="dateDebut"
            render={({ field: { onChange, value, onBlur } }) => (
              <DateField label="Date de départ" value={value || ""} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          <Controller
            control={objectifForm.control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                label="Description (optionnel)"
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                outlineStyle={{ borderRadius: 12 }}
                left={<TextInput.Icon icon="text" />}
              />
            )}
          />
          <Button
            mode="outlined"
            onPress={objectifForm.handleSubmit(onConfig)}
            loading={saving}
            disabled={saving}
            style={{ borderRadius: 12 }}
          >
            Enregistrer l'objectif
          </Button>
        </Card>

        {alimentations.length > 0 && (
          <>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "700", color: theme.colors.onBackground, marginTop: 24, marginBottom: 8 }}
            >
              Historique des alimentations
            </Text>
            <Card noPadding>
              {alimentations.map((a, i) => (
                <View key={a.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyLarge" style={{ fontWeight: "700", color: "#2E7D32" }}>
                        +{formatCurrency(a.montant)}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatShortDate(a.date)}
                        {a.description ? ` · ${a.description}` : ""}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
});
