import React, { useCallback, useState } from "react";
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import {
  Text,
  useTheme,
  FAB,
  Button,
  ActivityIndicator,
  Chip,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrdres } from "../../src/features/ordres/hooks";
import { OrdreItem } from "../../src/components/ordres/OrdreItem";
import { EmptyState } from "../../src/components/ui/EmptyState";
import type { OrdreStatut } from "../../src/features/ordres/types";
import { ORDRE_STATUTS, STATUT_LABEL } from "../../src/features/ordres/types";

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Tous" },
  ...ORDRE_STATUTS.map((s) => ({ value: s, label: STATUT_LABEL[s] })),
];

export default function OrdresScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const statutFilter = filter === "all" ? undefined : (filter as OrdreStatut);
  const { ordres, loading, refresh } = useOrdres(statutFilter);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

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
            Ordres de réparation
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
          >
            {ordres.length} ordre{ordres.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Button
          mode="contained-tonal"
          icon="car-outline"
          onPress={() => router.push("/vehicules")}
          style={{ borderRadius: 12 }}
        >
          Véhicules
        </Button>
      </View>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {FILTER_OPTIONS.map((f) => (
            <Chip
              key={f.value}
              selected={filter === f.value}
              mode={filter === f.value ? "flat" : "outlined"}
              onPress={() => setFilter(f.value)}
              style={{ borderRadius: 10 }}
            >
              {f.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginVertical: 40 }}
          color={theme.colors.primary}
        />
      ) : ordres.length === 0 ? (
        <EmptyState
          icon="wrench-outline"
          title="Aucun ordre de réparation"
          description="Créez un nouvel ordre pour un véhicule"
          action={{
            label: "Nouvel ordre",
            onPress: () => router.push("/create-ordre"),
          }}
        />
      ) : (
        <FlatList
          data={ordres}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <OrdreItem
              ordre={item}
              onPress={() =>
                router.push({
                  pathname: "/detail-ordre",
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        label="Nouvel O.R."
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => router.push("/create-ordre")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  filterRow: {
    paddingVertical: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
});
