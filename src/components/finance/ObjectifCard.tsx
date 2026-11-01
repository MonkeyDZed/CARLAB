import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, ProgressBar, useTheme } from "react-native-paper";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../utils/format";

interface ObjectifCardProps {
  progression: {
    cumul: number;
    cible: number;
    reste: number;
    pourcentage: number;
  };
  onAlimenter: () => void;
  onConfigurer: () => void;
}

export function ObjectifCard({
  progression,
  onAlimenter,
  onConfigurer,
}: ObjectifCardProps) {
  const theme = useTheme();
  const pourcentage = progression.pourcentage / 100;

  return (
    <Card
      style={{
        marginHorizontal: 16,
        padding: 20,
        backgroundColor: theme.colors.primaryContainer,
      }}
    >
      <Text
        variant="labelMedium"
        style={{
          color: theme.colors.primary,
          fontWeight: "700",
          letterSpacing: 1,
        }}
      >
        OBJECTIF ÉPARGNE
      </Text>

      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={[styles.label, { color: theme.colors.onPrimaryContainer }]}>
            Objectif cible
          </Text>
          <Text
            variant="headlineMedium"
            style={[styles.value, { color: theme.colors.onPrimaryContainer }]}
          >
            {formatCurrency(progression.cible)}
          </Text>
        </View>

        <View style={styles.item}>
          <Text style={[styles.label, { color: theme.colors.onPrimaryContainer }]}>
            Alimenté
          </Text>
          <Text
            variant="headlineMedium"
            style={[styles.value, { color: theme.colors.onPrimaryContainer }]}
          >
            {formatCurrency(progression.cumul)}
          </Text>
        </View>

        <View style={styles.item}>
          <Text style={[styles.label, { color: theme.colors.onPrimaryContainer }]}>
            Reste à atteindre
          </Text>
          <Text
            variant="headlineMedium"
            style={[styles.value, { color: theme.colors.onPrimaryContainer }]}
          >
            {formatCurrency(progression.reste)}
          </Text>
        </View>

        <View style={styles.item}>
          <Text style={[styles.label, { color: theme.colors.onPrimaryContainer }]}>
            Progression
          </Text>
          <Text
            variant="titleLarge"
            style={[styles.value, { color: theme.colors.onPrimaryContainer }]}
          >
            {progression.pourcentage}%
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={pourcentage}
        color={theme.colors.primary}
        style={{ height: 8, borderRadius: 4, marginTop: 8 }}
      />

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="piggy-bank"
          onPress={onAlimenter}
          style={{ borderRadius: 12, flex: 1 }}
        >
          Alimenter
        </Button>
        <Button
          mode="outlined"
          icon="target"
          onPress={onConfigurer}
          style={{ borderRadius: 12, flex: 1 }}
        >
          Objectif
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  item: {
    width: "50%",
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.75,
    marginBottom: 2,
  },
  value: {
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
});
