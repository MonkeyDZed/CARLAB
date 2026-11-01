import React, { useCallback, useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import {
  Text,
  useTheme,
  Divider,
  ActivityIndicator,
  SegmentedButtons,
  IconButton,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactionsSummary } from "../src/features/transactions/hooks";
import { useOrdres } from "../src/features/ordres/hooks";
import { Card } from "../src/components/ui/Card";
import { StatCard } from "../src/components/ui/StatCard";
import { EmptyState } from "../src/components/ui/EmptyState";
import { formatCurrency } from "../src/utils/format";
import { calculateBalance } from "../src/utils/calculations";
import { categoryColor, CHART_COLORS } from "../src/theme";
import { useAppTheme } from "../src/theme/useAppTheme";
import { presetToRange, type PeriodPreset, presetLabel, PERIOD_PRESETS } from "../src/utils/period";

export default function StatsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dark = useAppTheme().dark;
  const [period, setPeriod] = useState<PeriodPreset>("all");
  const range = useMemo(() => presetToRange(period), [period]);

  const { totals, loading, refresh } = useTransactionsSummary({
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const { ordres, loading: ordresLoading, refresh: refreshOrdres } =
    useOrdres();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshOrdres()]);
    setRefreshing(false);
  }, [refresh, refreshOrdres]);

  const { totalExpenses, totalIncomes, categoryBreakdown } = totals;

  const caReparations = ordres
    .filter((o) => o.statut === "facture" || o.statut === "paye")
    .reduce((sum, o) => sum + (o.montant_total ?? 0), 0);

  const caEncaisses = ordres.reduce((sum, o) => sum + o.total_paye, 0);

  const balance = calculateBalance(totals);

  if (loading || ordresLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <ActivityIndicator
          style={{ marginVertical: 100 }}
          color={theme.colors.primary}
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={28} onPress={() => router.back()} />
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "800", color: theme.colors.onBackground }}
        >
          Statistiques
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.periodSwitch}>
          <SegmentedButtons
            value={period}
            onValueChange={(v) => setPeriod(v as PeriodPreset)}
            buttons={PERIOD_PRESETS.map((p) => ({
              value: p,
              label: presetLabel(p),
            }))}
            density="small"
          />
        </View>

        {/* --- Grille 2x2 cartes carrées --- */}
        <View style={styles.statsGrid}>
          <View style={styles.statRow}>
            <View style={styles.statHalf}>
              <StatCard
                label="Total dépenses"
                value={formatCurrency(totalExpenses)}
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
                label="Solde restant"
                value={formatCurrency(balance)}
                icon="wallet"
                color={balance >= 0 ? "#2E7D32" : "#D32F2F"}
                square
              />
            </View>
            <View style={styles.statHalf}>
              <StatCard
                label="O.R. encaissé"
                value={formatCurrency(caEncaisses)}
                icon="cash-check"
                color="#1565C0"
                square
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text
            variant="titleMedium"
            style={{ fontWeight: "700", color: theme.colors.onBackground }}
          >
            Répartition par catégorie
          </Text>
        </View>

        {categoryBreakdown.length === 0 ? (
          <EmptyState
            icon="chart-bar"
            title="Aucune dépense"
            description={
              period === "all"
                ? "Ajoutez des dépenses pour voir les statistiques"
                : `Aucune dépense sur ${presetLabel(period).toLowerCase()}`
            }
          />
        ) : (
          <Card style={{ marginHorizontal: 16 }}>
            {categoryBreakdown.map((item, index) => {
              const color = categoryColor(item.category, dark, index);
              return (
                <View key={item.category}>
                  {index > 0 && <Divider />}
                  <View style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[styles.categoryDot, { backgroundColor: color }]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          variant="bodyLarge"
                          style={{ fontWeight: "600" }}
                        >
                          {item.category}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          {item.count} opération{item.count > 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text
                        variant="bodyLarge"
                        style={{ fontWeight: "700", textAlign: "right" }}
                      >
                        {formatCurrency(item.total)}
                      </Text>
                      <View style={styles.percentageBar}>
                        <View
                          style={[
                            styles.percentageFill,
                            {
                              width: `${item.percentage}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        variant="labelSmall"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          textAlign: "right",
                        }}
                      >
                        {item.percentage}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  periodSwitch: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  statsGrid: {
    paddingHorizontal: 12,
    paddingTop: 8,
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryRight: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  percentageBar: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    width: "100%",
    marginTop: 4,
    marginBottom: 2,
    overflow: "hidden",
  } as any,
  percentageFill: {
    height: 4,
    borderRadius: 2,
  },
});
