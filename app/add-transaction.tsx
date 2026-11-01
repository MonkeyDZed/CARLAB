import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionForm } from "../src/components/transactions/TransactionForm";
import { useTransactionMutations } from "../src/features/transactions/hooks";
import type { TransactionFormData } from "../src/features/transactions/schema";

export default function AddTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { create } = useTransactionMutations();

  const handleSubmit = async (data: TransactionFormData) => {
    await create(data);
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={28}
          onPress={() => router.back()}
        />
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "800", color: theme.colors.onBackground, flex: 1, marginLeft: 4 }}
        >
          Nouvelle dépense
        </Text>
      </View>

      <TransactionForm onSubmit={handleSubmit} submitLabel="Enregistrer" />
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
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
  },
});
