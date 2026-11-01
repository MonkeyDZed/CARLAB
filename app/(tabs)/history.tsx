import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  SectionList,
  StyleSheet,
  Alert,
} from "react-native";
import {
  Text,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactions, useTransactionMutations } from "../../src/features/transactions/hooks";
import { TransactionItem } from "../../src/components/transactions/TransactionItem";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { HistoryFilterBar, type HistoryFilters } from "../../src/components/ui/HistoryFilterBar";
import { formatDate } from "../../src/utils/format";
import { presetToRange } from "../../src/utils/period";
import { EXPENSE_CATEGORIES } from "../../src/features/transactions/types";
import type { Transaction } from "../../src/features/transactions/types";

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filters, setFilters] = useState<HistoryFilters>({
    search: "",
    period: "all",
  });

  const periodRange = useMemo(
    () => presetToRange(filters.period),
    [filters.period]
  );

  const { transactions, loading, refresh } = useTransactions({
    search: filters.search,
    category: filters.category,
    type: filters.type,
    startDate: periodRange.startDate,
    endDate: periodRange.endDate,
  });
  const { remove } = useTransactionMutations();

  const handleDelete = useCallback(
    (tx: Transaction) => {
      Alert.alert(
        "Supprimer",
        `Supprimer la dépense "${tx.description || tx.category}" de ${tx.amount.toLocaleString("fr-FR")} DA ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              await remove(tx.id);
              refresh();
            },
          },
        ]
      );
    },
    [remove, refresh]
  );

  const handleEdit = useCallback(
    (tx: Transaction) => {
      router.push({
        pathname: "/transaction-detail",
        params: { id: tx.id },
      });
    },
    [router]
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const existing = grouped.get(tx.date) ?? [];
      existing.push(tx);
      grouped.set(tx.date, existing);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({
        title: date,
        data,
      }));
  }, [transactions]);

  const hasActiveFilter =
    !!filters.search || !!filters.category || !!filters.type || filters.period !== "all";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "800", color: theme.colors.onBackground }}
        >
          Historique
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
        >
          {transactions.length} opération{transactions.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <HistoryFilterBar
        filters={filters}
        onChange={setFilters}
        categories={[...EXPENSE_CATEGORIES]}
      />

      {loading ? (
        <ActivityIndicator
          style={{ marginVertical: 40 }}
          color={theme.colors.primary}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={hasActiveFilter ? "magnify-close" : "inbox-outline"}
          title={hasActiveFilter ? "Aucun résultat" : "Aucune opération"}
          description={
            hasActiveFilter
              ? "Essayez d'élargir vos filtres"
              : "Ajoutez votre première dépense"
          }
          action={
            !hasActiveFilter
              ? {
                  label: "Ajouter une opération",
                  onPress: () => router.push("/add-transaction"),
                }
              : undefined
          }
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginLeft: 16,
                marginTop: 12,
                marginBottom: 4,
                fontWeight: "600",
              }}
            >
              {formatDate(title)}
            </Text>
          )}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => handleEdit(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
});
