import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Pressable,
} from "react-native";
import {
  Text,
  useTheme,
  IconButton,
  Button,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTransaction, useTransactionMutations } from "../src/features/transactions/hooks";
import { Card } from "../src/components/ui/Card";
import { ImageViewer } from "../src/components/ui/ImageViewer";
import { formatCurrency, formatShortDate } from "../src/utils/format";
import {
  categoryColor as pickCategoryColor,
  amountColor as pickAmountColor,
} from "../src/theme";
import { useAppTheme } from "../src/theme/useAppTheme";
import type { Transaction } from "../src/features/transactions/types";

export default function TransactionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dark = useAppTheme().dark;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transaction, loading } = useTransaction(id);
  const { remove } = useTransactionMutations();
  const [viewerOpen, setViewerOpen] = useState(false);

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

  const tx = transaction;
  const isExpense = tx.type === "expense";
  const sign = isExpense ? "-" : "+";
  const txAmountColor = pickAmountColor(tx.type, dark);
  const catColor = isExpense
    ? pickCategoryColor(tx.category, dark)
    : theme.colors.primary;
  const hasPhoto = !!(tx as any).photo_uri;

  const handleDelete = () => {
    Alert.alert(
      "Supprimer",
      `Supprimer définitivement "${tx.description || tx.category}" ?`,
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <IconButton icon="close" size={28} onPress={() => router.back()} />
        <Text
          variant="titleLarge"
          style={{ fontWeight: "700", color: theme.colors.onBackground, flex: 1 }}
        >
          Détail opération
        </Text>
        <IconButton
          icon="pencil"
          size={22}
          onPress={() =>
            router.push({ pathname: "/edit-transaction", params: { id } })
          }
        />
        <IconButton
          icon="delete-outline"
          size={22}
          iconColor={theme.colors.error}
          onPress={handleDelete}
        />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* --- Montant large --- */}
        <View style={styles.amountBlock}>
          <Text
            variant="displayMedium"
            style={{ fontWeight: "900", color: txAmountColor, textAlign: "center" }}
          >
            {sign}
            {formatCurrency(tx.amount)}
          </Text>
          <Chip
            compact
            style={{
              alignSelf: "center",
              marginTop: 8,
              backgroundColor: catColor + "20",
              borderRadius: 10,
            }}
            textStyle={{ color: catColor, fontWeight: "600" }}
          >
            {isExpense ? tx.category : tx.ordre_id ? `O.R. #${tx.ordre_id.slice(0, 6)}` : "Réparation"}
          </Chip>
        </View>

        {/* --- Carte infos --- */}
        <Card style={{ marginHorizontal: 16, gap: 16 }}>
          <InfoRow
            icon="calendar"
            label="Date"
            value={formatShortDate(tx.date)}
            theme={theme}
          />
          {tx.description ? (
            <InfoRow
              icon="text"
              label="Description"
              value={tx.description}
              theme={theme}
            />
          ) : null}
          <InfoRow
            icon={isExpense ? "arrow-down" : "wrench"}
            label="Type"
            value={isExpense ? "Dépense" : "Réparation"}
            theme={theme}
          />
          <InfoRow
            icon="identifier"
            label="Référence"
            value={tx.id.slice(0, 8).toUpperCase()}
            theme={theme}
          />
          {tx.ordre_id && (
            <InfoRow
              icon="clipboard-text-outline"
              label="Ordre de réparation"
              value={`#${tx.ordre_id.slice(0, 6)}`}
              theme={theme}
            />
          )}
        </Card>

        {/* --- Photo --- */}
        {hasPhoto && (
          <View style={{ marginTop: 16, marginHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <MaterialCommunityIcons name="camera" size={14} color={theme.colors.onSurfaceVariant} />
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4, fontWeight: "600" }}
              >
                Photo
              </Text>
            </View>
            <Pressable onPress={() => setViewerOpen(true)}>
              <Image
                source={{ uri: (tx as any).photo_uri }}
                style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 12 }}
                resizeMode="contain"
              />
            </Pressable>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: "center" }}
            >
              Toucher pour agrandir
            </Text>
            <ImageViewer
              uri={(tx as any).photo_uri}
              visible={viewerOpen}
              onClose={() => setViewerOpen(false)}
            />
          </View>
        )}

        {/* --- Boutons --- */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={() =>
              router.push({ pathname: "/edit-transaction", params: { id } })
            }
            style={{ borderRadius: 12, flex: 1 }}
          >
            Modifier
          </Button>
          <Button
            mode="outlined"
            icon="delete-outline"
            textColor={theme.colors.error}
            onPress={handleDelete}
            style={{ borderRadius: 12, flex: 1 }}
          >
            Supprimer
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={theme.colors.onSurfaceVariant}
        style={{ marginTop: 1 }}
      />
      <View style={{ flex: 1 }}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={{ fontWeight: "600", color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </View>
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
  body: {
    paddingBottom: 40,
  },
  amountBlock: {
    alignItems: "center",
    paddingVertical: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 20,
  },
});
