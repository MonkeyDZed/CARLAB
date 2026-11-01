import React from "react";
import { type ViewProps } from "react-native";
import { Surface, useTheme } from "react-native-paper";
import { radius, spacing } from "../../theme/tokens";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "elevated" | "flat";
  noPadding?: boolean;
}

export function Card({
  children,
  variant = "elevated",
  noPadding = false,
  style,
  ...props
}: CardProps) {
  const theme = useTheme();
  return (
    <Surface
      elevation={variant === "elevated" ? 1 : 0}
      style={[
        {
          borderRadius: radius.lg,
          backgroundColor: theme.colors.surface,
          overflow: "hidden",
        },
        !noPadding && { padding: spacing.lg },
        style,
      ]}
      {...(props as any)}
    >
      {children}
    </Surface>
  );
}
