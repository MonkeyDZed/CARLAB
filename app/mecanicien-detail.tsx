import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from "react-native";
import {
  Text,
  useTheme,
  IconButton,
  Divider,
  Button,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMecanicienMouvements, useFinanceMutations } from "../src/features/finance/hooks";
import { getMecanicienById } from "../src/features/finance/api";
import { Card } from "../src/components/ui/Card";
import { EmptyState } from "../src/components/ui/EmptyState";
import { formatCurrency, formatShortDate } from "../src/utils/format";
import { MOUVEMENT_LABEL, type Mecanicien } from "../src/features/finance/types";

export default function MecanicienDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ mecanicienId?: string; name?: string }>();
  const mecanicienId = parseInt(params.mecanicienId ?? "0", 10);
  const name = params.name ?? "Mécanicien";

  const { mouvements, total, loading, refresh } = useMecanicienMouvements(mecanicienId);
  const { deleteMecanicien } = useFinanceMutations();
  const [mecanicien, setMecanicien] = useState<Mecanicien | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getMecanicienById(mecanicienId).then(setMecanicien).catch(() => {});
  }, [mecanicienId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const onDelete = useCallback(() => {
    Alert.alert(
      "Supprimer le mécanicien",
      `Supprimer "${name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMecanicien(mecanicienId);
              router.back();
            } catch (e) {
              Alert.alert(
                "Erreur",
                e instanceof Error ? e.message : "Suppression impossible"
              );
            }
          },
        },
      ]
    );
  }, [name, mecanicienId, router, deleteMecanicien]);

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
          {name}
        </Text>
        <IconButton icon="delete-outline" size={28} iconColor={theme.colors.error} onPress={onDelete} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card
          style={{
            backgroundColor: theme.colors.secondaryContainer,
            alignItems: "center",
            paddingVertical: 24,
          }}
        >
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.secondary, fontWeight: "600", letterSpacing: 0.5 }}
          >
            SOLDE DÛ AU MÉCANICIEN
          </Text>
          <Text
            variant="displaySmall"
            style={{ fontWeight: "900", color: theme.colors.onSecondaryContainer, marginTop: 4 }}
          >
            {formatCurrency(total)}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSecondaryContainer, opacity: 0.7, marginTop: 6 }}
          >
            Commission : {mecanicien?.commission_percent ?? 0} %
          </Text>
        </Card>

        <Button
          mode="contained"
          icon="cash-minus"
          onPress={() =>
            router.push({
              pathname: "/retrait-mecanicien",
              params: { mecanicienId: String(mecanicienId) },
            })
          }
          style={{ borderRadius: 12, marginTop: 16 }}
        >
          Nouveau retrait
        </Button>

        <Text
          variant="titleMedium"
          style={{ fontWeight: "700", color: theme.colors.onBackground, marginTop: 24, marginBottom: 8 }}
        >
          Historique
        </Text>

        {!loading && mouvements.length === 0 ? (
          <EmptyState
            icon="account-cash-outline"
            title="Aucun mouvement"
            description="Aucune commission ni retrait pour ce mécanicien"
          />
        ) : (
          <Card noPadding>
            {mouvements.map((m, i) => (
              <View key={m.id}>
                {i > 0 && <Divider />}
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge" style={{ fontWeight: "700" }}>
                      {MOUVEMENT_LABEL[m.type]}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatShortDate(m.date)}
                      {m.description ? ` · ${m.description}` : ""}
                    </Text>
                  </View>
                  <Text
                    variant="bodyLarge"
                    style={{
                      fontWeight: "800",
                      color: m.type === "commission" ? "#2E7D32" : "#D32F2F",
                    }}
                  >
                    {m.type === "commission" ? "+" : "-"}
                    {formatCurrency(m.montant)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
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
