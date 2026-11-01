import React, { useState, useMemo } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import {
  Text,
  useTheme,
  Chip,
  SegmentedButtons,
  Badge,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SearchBar } from "./SearchBar";
import { PERIOD_PRESETS, presetLabel } from "../../utils/period";
import type { PeriodPreset } from "../../utils/period";

export interface HistoryFilters {
  search: string;
  period: PeriodPreset;
  type?: "expense" | "income";
  category?: string;
}

interface HistoryFilterBarProps {
  filters: HistoryFilters;
  onChange: (next: HistoryFilters) => void;
  categories: string[];
}

export function HistoryFilterBar({
  filters,
  onChange,
  categories,
}: HistoryFilterBarProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.period !== "all") n++;
    if (filters.type) n++;
    if (filters.category) n++;
    return n;
  }, [filters]);

  const set = (patch: Partial<HistoryFilters>) =>
    onChange({ ...filters, ...patch });

  const clearAll = () =>
    onChange({ search: filters.search, period: "all", type: undefined, category: undefined });

  return (
    <View>
      {/* --- Search always visible --- */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar
            onSearch={(t) => set({ search: t })}
            placeholder="Rechercher..."
          />
        </View>
        <Pressable
          onPress={() => setOpen(!open)}
          style={({ pressed }) => [
            styles.filterToggle,
            {
              backgroundColor: open
                ? theme.colors.primaryContainer
                : theme.colors.surfaceVariant,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={open ? "filter-off" : "filter-variant"}
            size={20}
            color={open ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          {activeCount > 0 && (
            <Badge
              size={16}
              style={{
                position: "absolute",
                top: -2,
                right: -4,
                backgroundColor: theme.colors.primary,
              }}
            >
              {activeCount}
            </Badge>
          )}
        </Pressable>
      </View>

      {/* --- Collapsible filters --- */}
      {open && (
        <View style={[styles.panel, { backgroundColor: theme.colors.surfaceVariant }]}>
          {/* Period */}
          <SegmentedButtons
            value={filters.period}
            onValueChange={(p) => set({ period: p as PeriodPreset })}
            buttons={PERIOD_PRESETS.map((p) => ({
              value: p,
              label: presetLabel(p),
            }))}
            density="small"
            style={{ marginBottom: 8 }}
          />

          {/* Type */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              <Chip
                selected={!filters.type}
                mode={!filters.type ? "flat" : "outlined"}
                compact
                onPress={() => set({ type: undefined })}
              >
                Tous
              </Chip>
              <Chip
                selected={filters.type === "expense"}
                mode={filters.type === "expense" ? "flat" : "outlined"}
                icon="arrow-down"
                compact
                onPress={() =>
                  set({ type: filters.type === "expense" ? undefined : "expense" })
                }
              >
                Dépenses
              </Chip>
              <Chip
                selected={filters.type === "income"}
                mode={filters.type === "income" ? "flat" : "outlined"}
                icon="wrench"
                compact
                onPress={() =>
                  set({ type: filters.type === "income" ? undefined : "income" })
                }
              >
                Réparations
              </Chip>
            </View>
          </ScrollView>

          {/* Category */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={styles.chipRow}>
              <Chip
                selected={!filters.category}
                mode={!filters.category ? "flat" : "outlined"}
                compact
                onPress={() => set({ category: undefined })}
              >
                Toutes
              </Chip>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  selected={filters.category === cat}
                  mode={filters.category === cat ? "flat" : "outlined"}
                  compact
                  onPress={() =>
                    set({ category: filters.category === cat ? undefined : cat })
                  }
                >
                  {cat}
                </Chip>
              ))}
            </View>
          </ScrollView>

          {/* Clear */}
          {activeCount > 0 && (
            <Pressable onPress={clearAll} style={{ marginTop: 8, alignSelf: "flex-end" }}>
              <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "600" }}>
                Réinitialiser les filtres
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 8,
    paddingLeft: 4,
    gap: 4,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
  },
  chipRow: {
    flexDirection: "row",
    gap: 5,
  },
});
