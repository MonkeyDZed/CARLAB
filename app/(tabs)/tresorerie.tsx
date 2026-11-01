import React, { useCallback, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import {
  Text,
  useTheme,
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  TextInput,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFinanceOverview, useFinanceMutations } from "../../src/features/finance/hooks";
import { ObjectifCard } from "../../src/components/finance/ObjectifCard";
import { Card } from "../../src/components/ui/Card";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { formatCurrency } from "../../src/utils/format";

export default function TresorerieScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    mecaniciens,
    objectifProgression,
    associeNames,
    soldeProprio,
    soldeAssocie,
    totalParMecanicien,
    loading,
    refresh,
  } = useFinanceOverview();
  const { createMecanicien } = useFinanceMutations();
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCommission, setNewCommission] = useState("");
  const [adding, setAdding] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const onAddMecanicien = useCallback(async () => {
    const name = newName.trim();
    const commission = parseFloat(newCommission.replace(",", "."));
    if (!name || isNaN(commission)) return;
    setAdding(true);
    try {
      await createMecanicien(name, commission);
      setNewName("");
      setNewCommission("");
      setAddOpen(false);
      await refresh();
    } finally {
      setAdding(false);
    }
  }, [newName, newCommission, createMecanicien, refresh]);

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
          Trésorerie
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
        >
          Objectif, associés et mécaniciens
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginVertical: 60 }}
          color={theme.colors.primary}
          size="large"
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ObjectifCard
            progression={objectifProgression}
            onAlimenter={() => router.push("/objectif")}
            onConfigurer={() => router.push("/objectif")}
          />

          <View style={styles.quickActions}>
            <Button
              mode="contained-tonal"
              icon="cash-minus"
              onPress={() => router.push("/retrait-associe")}
              style={styles.quickBtn}
            >
              Retrait associé
            </Button>
            <Button
              mode="contained-tonal"
              icon="cash-plus"
              onPress={() => router.push("/add-transaction")}
              style={styles.quickBtn}
            >
              Dépense
            </Button>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text variant="titleMedium" style={{ fontWeight: "700", color: theme.colors.onBackground }}>
              Associés (50/50)
            </Text>
          </View>

          <Card style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: "800" }}>
                {associeNames.proprio}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Solde : {formatCurrency(soldeProprio)}
              </Text>
            </View>
            <Button
              mode="contained-tonal"
              compact
              onPress={() => router.push({ pathname: "/retrait-associe", params: { cible: "proprio" } })}
              style={{ borderRadius: 10, marginRight: 4 }}
            >
              Retrait
            </Button>
            <Button
              compact
              onPress={() =>
                router.push({
                  pathname: "/associe-detail",
                  params: { cible: "proprio", name: associeNames.proprio },
                })
              }
              style={{ borderRadius: 10 }}
            >
              Historique
            </Button>
          </Card>

          <Card style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: "800" }}>
                {associeNames.associe}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Solde : {formatCurrency(soldeAssocie)}
              </Text>
            </View>
            <Button
              mode="contained-tonal"
              compact
              onPress={() => router.push({ pathname: "/retrait-associe", params: { cible: "associe" } })}
              style={{ borderRadius: 10, marginRight: 4 }}
            >
              Retrait
            </Button>
            <Button
              compact
              onPress={() =>
                router.push({
                  pathname: "/associe-detail",
                  params: { cible: "associe", name: associeNames.associe },
                })
              }
              style={{ borderRadius: 10 }}
            >
              Historique
            </Button>
          </Card>

          <View style={styles.sectionHeaderRow}>
            <Text variant="titleMedium" style={{ fontWeight: "700", color: theme.colors.onBackground }}>
              Mécaniciens
            </Text>
            <Button compact mode="text" icon="account-plus" onPress={() => setAddOpen(true)}>
              Ajouter
            </Button>
          </View>

          {mecaniciens.length === 0 ? (
            <EmptyState
              icon="account-group-outline"
              title="Aucun mécanicien"
              description="Ajoutez vos mécaniciens et leur commission"
            />
          ) : (
            mecaniciens.map((m) => (
              <Card
                key={m.id}
                style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: "row", alignItems: "center" }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ fontWeight: "800" }}>
                    {m.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Commission : {m.commission_percent} % · Solde dû : {formatCurrency(totalParMecanicien.get(m.id) ?? 0)}
                  </Text>
                </View>
                <Button
                  mode="contained-tonal"
                  compact
                  onPress={() =>
                    router.push({
                      pathname: "/retrait-mecanicien",
                      params: { mecanicienId: String(m.id) },
                    })
                  }
                  style={{ borderRadius: 10, marginRight: 4 }}
                >
                  Retrait
                </Button>
                <Button
                  compact
                  onPress={() =>
                    router.push({
                      pathname: "/mecanicien-detail",
                      params: { mecanicienId: String(m.id), name: m.name },
                    })
                  }
                  style={{ borderRadius: 10 }}
                >
                  Historique
                </Button>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      <Portal>
        <Dialog visible={addOpen} onDismiss={() => setAddOpen(false)}>
          <Dialog.Title>Ajouter un mécanicien</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nom"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              outlineStyle={{ borderRadius: 12 }}
              autoFocus
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Commission (%)"
              value={newCommission}
              onChangeText={setNewCommission}
              keyboardType="numeric"
              mode="outlined"
              outlineStyle={{ borderRadius: 12 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddOpen(false)}>Annuler</Button>
            <Button loading={adding} onPress={onAddMecanicien}>
              Ajouter
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
});
