import React from "react";
import { View, Pressable } from "react-native";
import { Text, useTheme, Chip, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "../ui/Card";
import { formatCurrency, formatShortDate } from "../../utils/format";
import type { OrdreWithDetails } from "../../features/ordres/types";
import { STATUT_LABEL } from "../../features/ordres/types";

const STATUT_COLORS: Record<string, string> = {
  brouillon: "#607D8B",
  en_cours: "#FF9800",
  termine: "#2196F3",
  facture: "#4CAF50",
  paye: "#2E7D32",
};

const STATUT_ICONS: Record<string, string> = {
  brouillon: "file-document-outline",
  en_cours: "tools",
  termine: "check-circle-outline",
  facture: "file-document-check-outline",
  paye: "cash-check",
};

interface OrdreItemProps {
  ordre: OrdreWithDetails;
  onPress?: () => void;
}

export function OrdreItem({ ordre, onPress }: OrdreItemProps) {
  const theme = useTheme();
  const statutColor = STATUT_COLORS[ordre.statut] || "#607D8B";
  const statutIcon = STATUT_ICONS[ordre.statut] || "file-document-outline";
  const reste = (ordre.montant_total ?? 0) - ordre.total_paye;

  return (
    <Pressable onPress={onPress}>
      <Card
        variant="flat"
        style={{
          marginHorizontal: 16,
          marginVertical: 4,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "800", color: theme.colors.onSurface }}
            >
              {ordre.marque} {ordre.modele}
            </Text>
            <Chip
              compact
              textStyle={{ fontSize: 10, color: "#fff" }}
              style={{ backgroundColor: statutColor, borderRadius: 8 }}
            >
              {STATUT_LABEL[ordre.statut]}
            </Chip>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <MaterialCommunityIcons
                name="card-account-details-outline"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {ordre.immatriculation}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <MaterialCommunityIcons
                name="phone"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {ordre.telephone}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {ordre.montant_total != null && (
              <>
                <Text
                  variant="labelMedium"
                  style={{
                    fontWeight: "700",
                    color: theme.colors.onSurface,
                  }}
                >
                  {formatCurrency(ordre.total_paye)}
                </Text>
                {reste > 0 && (
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.error }}
                  >
                    / {formatCurrency(ordre.montant_total)} (reste{" "}
                    {formatCurrency(reste)})
                  </Text>
                )}
                {reste <= 0 && ordre.montant_total > 0 && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color="#2E7D32"
                  />
                )}
              </>
            )}
            {ordre.montant_total == null && (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}
              >
                Montant non fixé
              </Text>
            )}
          </View>

          {ordre.premier_probleme && (
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {ordre.premier_probleme}
            </Text>
          )}
        </View>

        <View style={{ alignItems: "flex-end", gap: 4, marginLeft: 8 }}>
          <MaterialCommunityIcons
            name={statutIcon as any}
            size={24}
            color={statutColor}
          />
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {formatShortDate(ordre.date_creation)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
