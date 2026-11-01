import React, { useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  IconButton,
  HelperText,
  Chip,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  retraitAssocieSchema,
  type RetraitAssocieFormData,
} from "../src/features/finance/schema";
import { useAssocies, useFinanceMutations } from "../src/features/finance/hooks";
import { Card } from "../src/components/ui/Card";
import { DateField } from "../src/components/ui/DateField";
import { formatCurrency } from "../src/utils/format";
import { todayISODate } from "../src/utils/workingDays";
import type { AssocieCible } from "../src/features/finance/types";

export default function RetraitAssocieScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ cible?: string }>();
  const { names } = useAssocies();
  const { createRetraitAssocie, loading: saving } = useFinanceMutations();

  const initialCible: AssocieCible =
    params.cible === "associe" ? "associe" : "proprio";

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RetraitAssocieFormData>({
    resolver: zodResolver(retraitAssocieSchema),
    defaultValues: {
      cible: initialCible,
      montant: 0,
      date: todayISODate(),
      description: "",
    },
  });

  useEffect(() => {
    setValue("cible", initialCible);
  }, [initialCible, setValue]);

  const cible = watch("cible");

  const onSubmit = useCallback(
    async (data: RetraitAssocieFormData) => {
      try {
        await createRetraitAssocie({
          cible: data.cible,
          montant: data.montant,
          date: data.date,
          description: data.description,
        });
        Alert.alert("Succès", `Retrait de ${formatCurrency(data.montant)} enregistré.`);
        router.back();
      } catch (e) {
        Alert.alert("Erreur", e instanceof Error ? e.message : "Échec du retrait");
      }
    },
    [createRetraitAssocie, router]
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
          Retrait associé
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ gap: 12 }}>
          <View>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}>
              Associé
            </Text>
            <View style={styles.chips}>
              <Chip
                selected={cible === "proprio"}
                mode={cible === "proprio" ? "flat" : "outlined"}
                icon="account-star"
                onPress={() => setValue("cible", "proprio", { shouldValidate: true })}
                style={{ borderRadius: 10 }}
              >
                {names.proprio}
              </Chip>
              <Chip
                selected={cible === "associe"}
                mode={cible === "associe" ? "flat" : "outlined"}
                icon="account"
                onPress={() => setValue("cible", "associe", { shouldValidate: true })}
                style={{ borderRadius: 10 }}
              >
                {names.associe}
              </Chip>
            </View>
            {errors.cible && (
              <HelperText type="error">{errors.cible.message}</HelperText>
            )}
          </View>

          <Controller
            control={control}
            name="montant"
            render={({ field: { onChange, value, onBlur } }) => (
              <View>
                <TextInput
                  label="Montant (DA)"
                  value={value != null ? value.toString() : ""}
                  onChangeText={(text) => {
                    const num = parseFloat(text.replace(",", "."));
                    onChange(isNaN(num) ? undefined : num);
                  }}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineStyle={{ borderRadius: 12 }}
                  error={!!errors.montant}
                  left={<TextInput.Icon icon="cash" />}
                />
                {errors.montant && (
                  <HelperText type="error">{errors.montant.message}</HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value, onBlur } }) => (
              <DateField label="Date" value={value || ""} onChangeText={onChange} onBlur={onBlur} />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                label="Motif / description"
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                outlineStyle={{ borderRadius: 12 }}
                left={<TextInput.Icon icon="text" />}
                placeholder="Ex: Part de bénéfice"
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            disabled={saving}
            style={{ borderRadius: 12 }}
            contentStyle={{ paddingVertical: 6 }}
          >
            Enregistrer le retrait
          </Button>
        </Card>
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
