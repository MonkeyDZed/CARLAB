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
  retraitMecanicienSchema,
  type RetraitMecanicienFormData,
} from "../src/features/finance/schema";
import { useMecaniciens, useFinanceMutations } from "../src/features/finance/hooks";
import { Card } from "../src/components/ui/Card";
import { DateField } from "../src/components/ui/DateField";
import { formatCurrency } from "../src/utils/format";
import { todayISODate } from "../src/utils/workingDays";

export default function RetraitMecanicienScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ mecanicienId?: string }>();
  const { mecaniciens } = useMecaniciens();
  const { createRetraitMecanicien, loading: saving } = useFinanceMutations();

  const initialMecanicienId = params.mecanicienId
    ? parseInt(params.mecanicienId, 10)
    : mecaniciens[0]?.id;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RetraitMecanicienFormData>({
    resolver: zodResolver(retraitMecanicienSchema),
    defaultValues: {
      mecanicienId: undefined,
      montant: 0,
      date: todayISODate(),
      description: "",
    },
  });

  useEffect(() => {
    if (initialMecanicienId != null) {
      setValue("mecanicienId", initialMecanicienId);
    }
  }, [initialMecanicienId, setValue]);

  const mecanicienId = watch("mecanicienId");

  const onSubmit = useCallback(
    async (data: RetraitMecanicienFormData) => {
      try {
        await createRetraitMecanicien({
          mecanicienId: data.mecanicienId,
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
    [createRetraitMecanicien, router]
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
          Retrait mécanicien
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
              Mécanicien
            </Text>
            <View style={styles.chips}>
              {mecaniciens.map((m) => (
                <Chip
                  key={m.id}
                  selected={mecanicienId === m.id}
                  mode={mecanicienId === m.id ? "flat" : "outlined"}
                  icon="account"
                  onPress={() => setValue("mecanicienId", m.id, { shouldValidate: true })}
                  style={{ borderRadius: 10 }}
                >
                  {m.name}
                </Chip>
              ))}
            </View>
            {errors.mecanicienId && (
              <HelperText type="error">{errors.mecanicienId.message}</HelperText>
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
                placeholder="Ex: Commission"
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
