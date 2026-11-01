import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
  size?: "normal" | "large";
  icon?: string;
  square?: boolean;
}

export function StatCard({
  label,
  value,
  color,
  size = "normal",
  icon,
  square = false,
}: StatCardProps) {
  const theme = useTheme();

  return (
    <Card
      style={{
        alignItems: "center",
        justifyContent: "center",
        minHeight: size === "large" ? 110 : 90,
        ...(square ? { aspectRatio: 1 } : {}),
      }}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={color ?? theme.colors.onSurfaceVariant}
          style={{ marginBottom: 6, opacity: 0.75 }}
        />
      )}
      <Text
        variant="labelSmall"
        style={{
          color: theme.colors.onSurfaceVariant,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 6,
          textAlign: "center",
          fontSize: 11,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        variant={size === "large" ? "headlineLarge" : square ? "headlineSmall" : "headlineMedium"}
        style={{
          fontWeight: "800",
          color: color ?? theme.colors.onSurface,
          textAlign: "center",
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.45}
      >
        {value}
      </Text>
    </Card>
  );
}
