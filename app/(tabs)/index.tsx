import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import {
  Text,
  useTheme,
  FAB,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactionsSummary } from "../../src/features/transactions/hooks";
import { StatCard } from "../../src/components/ui/StatCard";
import { TransactionItem } from "../../src/components/transactions/TransactionItem";
import { OrdreItem } from "../../src/components/ordres/OrdreItem";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { formatCurrency, formatDate } from "../../src/utils/format";
import { calculateBalance } from "../../src/utils/calculations";
import { useOrdres } from "../../src/features/ordres/hooks";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { transactions, totals, loading, refresh } =
    useTransactionsSummary();
  const { ordres, loading: ordresLoading, refresh: refreshOrdres } =
    useOrdres();
  const [refreshing, setRefreshing] = useState(false);

  const caReparations = ordres
    .filter((o) => o.statut === "facture" || o.statut === "paye")
    .reduce((sum, o) => sum + (o.montant_total ?? 0), 0);

  const balance = calculateBalance(totals);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshOrdres()]);
    setRefreshing(false);
  }, [refresh, refreshOrdres]);

  const recentTransactions = transactions.slice(0, 5);
  const recentOrdres = ordres.slice(0, 3);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            variant="headlineSmall"
            style={{ fontWeight: "800", color: theme.colors.onBackground }}
          >
            Garage Cash
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
          >
            Suivi de trésorerie
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            mode="contained-tonal"
            icon="chart-bar"
            compact
            onPress={() => router.push("/stats")}
            style={{ borderRadius: 12 }}
          >
            Stats
          </Button>
          <Button
            mode="contained-tonal"
            icon="clipboard-text"
            onPress={() => router.push("/bilan")}
            style={{ borderRadius: 12 }}
          >
            Bilan
          </Button>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading || ordresLoading ? (
          <ActivityIndicator
            style={{ marginVertical: 40 }}
            color={theme.colors.primary}
          />
        ) : (
          <>
            {/* --- Grille 2x2 cartes carrées --- */}
            <View style={styles.statsGrid}>
              <View style={styles.statRow}>
                <View style={styles.statHalf}>
                  <StatCard
                    label="Total dépenses"
                    value={formatCurrency(totals.totalExpenses)}
                    icon="arrow-down"
                    color="#D32F2F"
                    square
                  />
                </View>
                <View style={styles.statHalf}>
                  <StatCard
                    label="C.A. Réparations"
                    value={formatCurrency(caReparations)}
                    icon="wrench"
                    color="#2E7D32"
                    square
                  />
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statHalf}>
                  <StatCard
                    label="Solde actuel"
                    value={formatCurrency(balance)}
                    icon="wallet"
                    color={balance >= 0 ? "#2E7D32" : "#D32F2F"}
                    square
                  />
                </View>
                <View style={styles.statHalf}>
                  <StatCard
                    label="O.R. en cours"
                    value={ordres.filter((o) => o.statut !== "paye").length.toString()}
                    icon="clipboard-text-clock"
                    square
                  />
                </View>
              </View>
            </View>

            {recentOrdres.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text
                    variant="titleMedium"
                    style={{
                      fontWeight: "700",
                      color: theme.colors.onBackground,
                    }}
                  >
                    Derniers O.R.
                  </Text>
                </View>
                {recentOrdres.map((ordre) => (
                  <OrdreItem
                    key={ordre.id}
                    ordre={ordre}
                    onPress={() =>
                      router.push({
                        pathname: "/detail-ordre",
                        params: { id: ordre.id },
                      })
                    }
                  />
                ))}
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "700",
                  color: theme.colors.onBackground,
                }}
              >
                Dernières dépenses
              </Text>
            </View>

            {recentTransactions.length === 0 ? (
              <EmptyState
                icon="cash-plus"
                title="Aucune opération"
                description="Ajoutez votre première dépense en appuyant sur le bouton +"
                action={{
                  label: "Ajouter une dépense",
                  onPress: () => router.push("/add-transaction"),
                }}
              />
            ) : (
              recentTransactions.map((tx) => (
                <View key={tx.id}>
                  <Text
                    variant="labelSmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginLeft: 16,
                      marginTop: 12,
                      marginBottom: 4,
                    }}
                  >
                    {formatDate(tx.date)}
                  </Text>
                  <TransactionItem
                    transaction={tx}
                    showActions={false}
                    onPress={() =>
                      router.push({
                        pathname: "/transaction-detail",
                        params: { id: tx.id },
                      })
                    }
                  />
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.fabContainer}>
        <View style={styles.fabWrapper}>
          <FAB
            icon="plus"
            label="Nouvelle dépense"
            style={{ backgroundColor: theme.colors.primary, width: "100%" }}
            color={theme.colors.onPrimary}
            onPress={() => router.push("/add-transaction")}
          />
        </View>
        <View style={styles.fabWrapper}>
          <FAB
            icon="wrench"
            label="Nouvel O.R."
            style={{ backgroundColor: theme.colors.secondary, width: "100%" }}
            color={theme.colors.onSecondary}
            onPress={() => router.push("/create-ordre")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  statsGrid: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statHalf: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  fabContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 16,
  },
  fabWrapper: {
    flex: 1,
    alignItems: "center",
  },
});
