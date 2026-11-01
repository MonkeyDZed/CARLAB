import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Text, IconButton, useTheme } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionForm } from "../src/components/transactions/TransactionForm";
import {
  useTransaction,
  useTransactionMutations,
} from "../src/features/transactions/hooks";
import type { TransactionFormData } from "../src/features/transactions/schema";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "../src/features/transactions/types";

export default function EditTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transaction, loading } = useTransaction(id);
  const { update, remove } = useTransactionMutations();

  const handleSubmit = async (data: TransactionFormData) => {
    await update(id, data);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer",
      "Supprimer définitivement cette opération ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await remove(id);
            router.back();
          },
        },
      ]
    );
  };

  if (loading || !transaction) {
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
        <IconButton
          icon="close"
          size={28}
          onPress={() => router.back()}
        />
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "800", color: theme.colors.onBackground, flex: 1, marginLeft: 4 }}
        >
          Modifier
        </Text>
        <IconButton
          icon="delete-outline"
          size={28}
          iconColor={theme.colors.error}
          onPress={handleDelete}
        />
      </View>

      <TransactionForm
        onSubmit={handleSubmit}
        initialValues={{
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category as ExpenseCategory,
          description: transaction.description ?? "",
          date: transaction.date,
          photoUri: transaction.photo_uri ?? null,
        }}
        existingPhotoUri={transaction.photo_uri}
        submitLabel="Mettre à jour"
      />
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
