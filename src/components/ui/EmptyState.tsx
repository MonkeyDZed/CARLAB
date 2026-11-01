import React from "react";
import { View } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Card } from "./Card";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({
  icon = "inbox-outline",
  title,
  description,
  action,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Card
      style={{
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 32,
        paddingVertical: 32,
        paddingHorizontal: 24,
      }}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={48}
        color={theme.colors.onSurfaceVariant}
        style={{ marginBottom: 12, opacity: 0.5 }}
      />
      <Text
        variant="titleMedium"
        style={{
          color: theme.colors.onSurface,
          fontWeight: "600",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          {description}
        </Text>
      )}
      {action && (
        <Button
          mode="contained"
          onPress={action.onPress}
          style={{ borderRadius: 12 }}
        >
          {action.label}
        </Button>
      )}
    </Card>
  );
}
