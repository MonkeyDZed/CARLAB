import React, { useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import {
  Text,
  useTheme,
  IconButton,
  SegmentedButtons,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrdres } from "../src/features/ordres/hooks";
import { useTransactionsSummary } from "../src/features/transactions/hooks";
import {
  useAssocies,
  useMecanicienMouvements,
  useMecaniciens,
} from "../src/features/finance/hooks";
import { Card } from "../src/components/ui/Card";
import { EmptyState } from "../src/components/ui/EmptyState";
import { formatCurrency, formatShortDate, formatTime } from "../src/utils/format";
import { todayISODate } from "../src/utils/workingDays";
import { STATUT_LABEL } from "../src/features/ordres/types";
import type { OrdreWithDetails } from "../src/features/ordres/types";
import type { Transaction } from "../src/features/transactions/types";

type BilanPeriod = "day" | "week";

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeFor(period: BilanPeriod) {
  const today = todayISODate();
  if (period === "day") return { start: today, end: today };
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start: iso(start), end: iso(end) };
}

type RetraitItem = {
  key: string;
  label: string;
  montant: number;
  date: string;
  time: string;
};

type ModalKind = "ordres" | "depenses" | "retraits" | null;

export default function BilanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [period, setPeriod] = useState<BilanPeriod>("day");
  const [modal, setModal] = useState<ModalKind>(null);

  const range = useMemo(() => rangeFor(period), [period]);

  const { ordres, loading: ordresLoading } = useOrdres();
  const { transactions, totals, loading: txLoading } = useTransactionsSummary({
    startDate: range.start,
    endDate: range.end,
  });
  const { mouvements: mvAssocies, names } = useAssocies();
  const { mouvements: mvMecas } = useMecanicienMouvements();
  const { mecaniciens } = useMecaniciens();

  const mecaName = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of mecaniciens) map.set(m.id, m.name);
    return map;
  }, [mecaniciens]);

  const inRange = (date: string) => date >= range.start && date <= range.end;

  const ordresPeriode = useMemo(
    () => ordres.filter((o) => inRange(o.date_creation)),
    [ordres, range]
  );
  const ordresPayes = ordresPeriode.filter((o) => o.statut === "paye");
  const ordresNonPayes = ordresPeriode.filter((o) => o.statut !== "paye");

  const depenses = useMemo(
    () => transactions.filter((t) => t.type === "expense"),
    [transactions]
  );
  const totalDepenses = depenses.reduce((s, t) => s + t.amount, 0);

  const retraits = useMemo<RetraitItem[]>(() => {
    const list: RetraitItem[] = [];
    for (const m of mvAssocies) {
      if (m.type === "retrait" && inRange(m.date)) {
        list.push({
          key: `a-${m.id}`,
          label: m.cible === "proprio" ? names.proprio : names.associe,
          montant: Math.abs(m.montant),
          date: m.date,
          time: formatTime(m.created_at),
        });
      }
    }
    for (const m of mvMecas) {
      if (m.type === "retrait" && inRange(m.date)) {
        list.push({
          key: `m-${m.id}`,
          label: mecaName.get(m.mecanicien_id) ?? "Mécanicien",
          montant: m.montant,
          date: m.date,
          time: formatTime(m.created_at),
        });
      }
    }
    return list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [mvAssocies, mvMecas, names, mecaName, range]);

  const totalRetraits = retraits.reduce((s, r) => s + r.montant, 0);

  const loading = ordresLoading || txLoading;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <IconButton icon="close" size={28} onPress={() => router.back()} />
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "800", color: theme.colors.onBackground, flex: 1, marginLeft: 4 }}
        >
          Bilan
        </Text>
      </View>

      <View style={styles.periodSwitch}>
        <SegmentedButtons
          value={period}
          onValueChange={(v) => setPeriod(v as BilanPeriod)}
          buttons={[
            { value: "day", label: "Aujourd'hui" },
            { value: "week", label: "7 derniers jours" },
          ]}
          density="small"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: 60 }} color={theme.colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Card style={{ gap: 4, backgroundColor: theme.colors.primaryContainer }}>
            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: "700" }}>
              ENCAISSÉ (O.R. payés)
            </Text>
            <Text variant="headlineLarge" style={{ fontWeight: "900", color: theme.colors.onPrimaryContainer }}>
              {formatCurrency(totals.totalIncomes)}
            </Text>
          </Card>

          <Pressable onPress={() => setModal("ordres")}>
            <Card style={{ marginTop: 12 }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ fontWeight: "800" }}>
                    Ordres de réparation
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {ordresPayes.length} payé{ordresPayes.length > 1 ? "s" : ""} · {ordresNonPayes.length} non payé{ordresNonPayes.length > 1 ? "s" : ""}
                  </Text>
                </View>
                <Text variant="headlineMedium" style={{ fontWeight: "900" }}>
                  {ordresPeriode.length}
                </Text>
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => setModal("depenses")}>
            <Card style={{ marginTop: 8 }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ fontWeight: "800" }}>
                    Dépenses
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {depenses.length} dépense{depenses.length > 1 ? "s" : ""}
                  </Text>
                </View>
                <Text variant="headlineMedium" style={{ fontWeight: "900", color: "#D32F2F" }}>
                  {formatCurrency(totalDepenses)}
                </Text>
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => setModal("retraits")}>
            <Card style={{ marginTop: 8 }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ fontWeight: "800" }}>
                    Retraits
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {retraits.length} retrait{retraits.length > 1 ? "s" : ""}
                  </Text>
                </View>
                <Text variant="headlineMedium" style={{ fontWeight: "900", color: "#D32F2F" }}>
                  {formatCurrency(totalRetraits)}
                </Text>
              </View>
            </Card>
          </Pressable>
        </ScrollView>
      )}

      {modal === "ordres" && (
        <OrduresModal ordres={ordresPeriode} onClose={() => setModal(null)} />
      )}
      {modal === "depenses" && (
        <DepensesModal depenses={depenses} onClose={() => setModal(null)} />
      )}
      {modal === "retraits" && (
        <RetraitsModal retraits={retraits} onClose={() => setModal(null)} />
      )}
    </SafeAreaView>
  );
}

function OrduresModal({
  ordres,
  onClose,
}: {
  ordres: OrdreWithDetails[];
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <ModalShell title={`O.R. (${ordres.length})`} onClose={onClose}>
      {ordres.length === 0 ? (
        <EmptyState icon="wrench-outline" title="Aucun O.R." description="Aucun ordre sur cette période" />
      ) : (
        <Card noPadding>
          {ordres.map((o, i) => (
            <View key={o.id}>
              {i > 0 && <Divider />}
              <View style={styles.modalRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLarge" style={{ fontWeight: "700" }}>
                    {o.marque} {o.modele}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    #{o.id.slice(0, 6)} · {o.immatriculation} · {formatShortDate(o.date_creation)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    variant="labelSmall"
                    style={{
                      color: o.statut === "paye" ? "#2E7D32" : "#FF9800",
                      fontWeight: "700",
                    }}
                  >
                    {STATUT_LABEL[o.statut]}
                  </Text>
                  {o.montant_total != null && (
                    <Text variant="bodyMedium" style={{ fontWeight: "700" }}>
                      {formatCurrency(o.montant_total)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ModalShell>
  );
}

function DepensesModal({
  depenses,
  onClose,
}: {
  depenses: Transaction[];
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <ModalShell title={`Dépenses (${depenses.length})`} onClose={onClose}>
      {depenses.length === 0 ? (
        <EmptyState icon="cash-minus" title="Aucune dépense" description="Aucune dépense sur cette période" />
      ) : (
        <Card noPadding>
          {depenses.map((t, i) => (
            <View key={t.id}>
              {i > 0 && <Divider />}
              <View style={styles.modalRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLarge" style={{ fontWeight: "700" }}>
                    {t.category}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatShortDate(t.date)}
                    {t.description ? ` · ${t.description}` : ""}
                  </Text>
                </View>
                <Text variant="bodyLarge" style={{ fontWeight: "800", color: "#D32F2F" }}>
                  -{formatCurrency(t.amount)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ModalShell>
  );
}

function RetraitsModal({
  retraits,
  onClose,
}: {
  retraits: RetraitItem[];
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <ModalShell title={`Retraits (${retraits.length})`} onClose={onClose}>
      {retraits.length === 0 ? (
        <EmptyState icon="cash-minus" title="Aucun retrait" description="Aucun retrait sur cette période" />
      ) : (
        <Card noPadding>
          {retraits.map((r, i) => (
            <View key={r.key}>
              {i > 0 && <Divider />}
              <View style={styles.modalRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLarge" style={{ fontWeight: "700" }}>
                    {r.label}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatShortDate(r.date)} · {r.time}
                  </Text>
                </View>
                <Text variant="bodyLarge" style={{ fontWeight: "800", color: "#D32F2F" }}>
                  -{formatCurrency(r.montant)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.modalOverlay}>
      <Card style={{ width: "92%", maxHeight: "80%", gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="titleMedium" style={{ fontWeight: "700" }}>
            {title}
          </Text>
          <IconButton icon="close" size={22} onPress={onClose} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: theme.colors.background }}>
          {children}
        </ScrollView>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
  },
  periodSwitch: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 100,
  },
});
