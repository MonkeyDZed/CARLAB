import React from "react";
import { View, Pressable } from "react-native";
import { Text, useTheme, IconButton, Chip } from "react-native-paper";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../utils/format";
import {
  categoryColor as pickCategoryColor,
  amountColor as pickAmountColor,
} from "../../theme";
import type { Transaction } from "../../features/transactions/types";
import { useAppTheme } from "../../theme/useAppTheme";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function TransactionItem({
  transaction,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}: TransactionItemProps) {
  const theme = useTheme();
  const dark = useAppTheme().dark;
  const isExpense = transaction.type === "expense";
  const sign = isExpense ? "-" : "+";
  const amountColor = pickAmountColor(transaction.type, dark);
  const categoryColor = isExpense
    ? pickCategoryColor(transaction.category, dark)
    : theme.colors.primary;

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
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
              gap: 8,
            }}
          >
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "800",
                color: amountColor,
              }}
            >
              {sign}
              {formatCurrency(transaction.amount)}
            </Text>
            <Chip
              compact
              textStyle={{ fontSize: 11 }}
              style={{
                backgroundColor: categoryColor + "18",
                borderRadius: 8,
              }}
            >
              {isExpense
                ? transaction.category
                : transaction.ordre_id
                  ? `O.R. #${transaction.ordre_id.slice(0, 6)}`
                  : "Réparation"}
            </Chip>
          </View>

          {transaction.description && (
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 2,
              }}
              numberOfLines={2}
            >
              {transaction.description}
            </Text>
          )}
        </View>

        {showActions && (
          <View style={{ flexDirection: "row", marginLeft: 8 }}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={18}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={onEdit}
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete-outline"
                size={18}
                iconColor={theme.colors.error}
                onPress={onDelete}
              />
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}
