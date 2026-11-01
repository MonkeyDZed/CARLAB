import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import {
  Text,
  useTheme,
  Searchbar,
  List,
  ActivityIndicator,
  IconButton,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAllVehicules } from "../src/features/vehicules/hooks";
import { Card } from "../src/components/ui/Card";
import { EmptyState } from "../src/components/ui/EmptyState";

export default function VehiculesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { vehicules, loading, refresh } = useAllVehicules(search);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={28} onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text variant="headlineSmall" style={{ fontWeight: "800", color: theme.colors.onBackground }}>
            Véhicules
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {vehicules.length} véhicule{vehicules.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <Searchbar
        placeholder="Rechercher par immat, marque, modèle, tel..."
        value={search}
        onChangeText={setSearch}
        style={{ marginHorizontal: 16, marginVertical: 8, borderRadius: 12 }}
        inputStyle={{ fontSize: 14 }}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : vehicules.length === 0 ? (
        <EmptyState
          icon="car-outline"
          title={search ? "Aucun résultat" : "Aucun véhicule"}
          description={search ? "Essayez un autre terme" : "Les véhicules créés via un O.R. apparaîtront ici"}
        />
      ) : (
        <FlatList
          data={vehicules}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: "/vehicule-detail", params: { id: item.id } })}>
              <Card variant="flat" style={styles.card}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons name="car" size={22} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge" style={{ fontWeight: "700" }}>
                      {item.marque} {item.modele} {item.annee ? `(${item.annee})` : ""}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {item.immatriculation}
                    </Text>
                    {item.telephone ? (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.telephone}
                      </Text>
                    ) : null}
                  </View>
                  <List.Icon icon="chevron-right" color={theme.colors.onSurfaceVariant} />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  card: { marginHorizontal: 16, marginVertical: 4, padding: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
