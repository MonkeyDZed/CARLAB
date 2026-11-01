import React, { useCallback, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Text, useTheme, IconButton, Divider, Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAssocies } from "../src/features/finance/hooks";
import { Card } from "../src/components/ui/Card";
import { EmptyState } from "../src/components/ui/EmptyState";
import { formatCurrency, formatShortDate } from "../src/utils/format";
import { MOUVEMENT_ASSOCIE_LABEL, type AssocieCible } from "../src/features/finance/types";

export default function AssocieDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ cible?: string; name?: string }>();
  const cible: AssocieCible = params.cible === "associe" ? "associe" : "proprio";
  const name = params.name ?? "Associé";

  const { mouvements, loading, refresh } = useAssocies();
  const [refreshing, setRefreshing] = useState(false);

  const filtered = mouvements.filter((m) => m.cible === cible);
  const totalMouvements = filtered.reduce((s, m) => s + m.montant, 0);
  const solde = totalMouvements;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const isCredit = (montant: number) => montant >= 0;

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
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
            SOLDE
          </Text>
          <Text
            variant="displaySmall"
            style={{ fontWeight: "900", color: theme.colors.onPrimaryContainer, marginTop: 4 }}
          >
            {formatCurrency(solde)}
          </Text>
        </Card>

        <Button
          mode="contained"
          icon="cash-minus"
          onPress={() =>
            router.push({
              pathname: "/retrait-associe",
              params: { cible },
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

        {!loading && filtered.length === 0 ? (
          <EmptyState
            icon="account-cash-outline"
            title="Aucun mouvement"
            description="Aucune part ni retrait pour cet associé"
          />
        ) : (
          <Card noPadding>
            {filtered.map((m, i) => (
              <View key={m.id}>
                {i > 0 && <Divider />}
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge" style={{ fontWeight: "700" }}>
                      {MOUVEMENT_ASSOCIE_LABEL[m.type]}
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
                      color: isCredit(m.montant) ? "#2E7D32" : "#D32F2F",
                    }}
                  >
                    {isCredit(m.montant) ? "+" : ""}
                    {formatCurrency(Math.abs(m.montant))}
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
