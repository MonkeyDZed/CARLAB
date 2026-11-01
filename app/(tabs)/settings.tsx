import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  List,
  Divider,
  ActivityIndicator,
  Dialog,
  Portal,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMecaniciens, useAssocies, useFinanceMutations } from "../../src/features/finance/hooks";
import { Card } from "../../src/components/ui/Card";
import { exportCSV, exportPDF } from "../../src/features/export/csv";
import {
  exportBackup,
  importBackup,
} from "../../src/features/export/backup";
import type { Mecanicien } from "../../src/features/finance/types";

export default function SettingsScreen() {
  const theme = useTheme();
  const { mecaniciens, refresh: refreshMecaniciens } = useMecaniciens();
  const { names: associeNames, refresh: refreshAssocies } = useAssocies();
  const {
    createMecanicien,
    updateMecanicien,
    deleteMecanicien,
    setAssocieNames,
  } = useFinanceMutations();
  const [proprioName, setProprioName] = useState("");
  const [associeName, setAssocieName] = useState("");
  const [savingNames, setSavingNames] = useState(false);

  useEffect(() => {
    setProprioName(associeNames.proprio);
    setAssocieName(associeNames.associe);
  }, [associeNames]);

  const onSaveNames = useCallback(async () => {
    setSavingNames(true);
    try {
      await setAssocieNames({
        proprio: proprioName.trim() || "Proprio",
        associe: associeName.trim() || "Associé",
      });
      await refreshAssocies();
      Alert.alert("Succès", "Noms des associés mis à jour.");
    } finally {
      setSavingNames(false);
    }
  }, [proprioName, associeName, setAssocieNames, refreshAssocies]);
  const [exporting, setExporting] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editMecanicien, setEditMecanicien] = useState<Mecanicien | null>(null);
  const [newName, setNewName] = useState("");
  const [newCommission, setNewCommission] = useState("");
  const [savingMecanicien, setSavingMecanicien] = useState(false);

  const handleExport = useCallback(async (type: string) => {
    setExporting(type);
    try {
      if (type === "csv") await exportCSV();
      else if (type === "pdf") await exportPDF();
      else if (type === "backup") await exportBackup();
    } catch (e) {
      Alert.alert("Erreur", "L'export a échoué.");
    }
    setExporting(null);
  }, []);

  const handleImport = useCallback(async () => {
    Alert.alert(
      "Importer une sauvegarde",
      "Cela remplacera toutes les données actuelles. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Importer",
          onPress: async () => {
            const success = await importBackup();
            if (success) {
              await refreshMecaniciens();
              await refreshAssocies();
              Alert.alert("Succès", "Sauvegarde importée avec succès.");
            }
          },
        },
      ]
    );
  }, [refreshMecaniciens, refreshAssocies]);

  const onAddMecanicien = useCallback(async () => {
    const name = newName.trim();
    const commission = parseFloat(newCommission.replace(",", "."));
    if (!name || isNaN(commission)) return;
    setSavingMecanicien(true);
    try {
      await createMecanicien(name, commission);
      setNewName("");
      setNewCommission("");
      setAddOpen(false);
      await refreshMecaniciens();
    } finally {
      setSavingMecanicien(false);
    }
  }, [newName, newCommission, createMecanicien, refreshMecaniciens]);

  const onEditMecanicien = useCallback(async () => {
    if (!editMecanicien) return;
    const name = newName.trim();
    const commission = parseFloat(newCommission.replace(",", "."));
    if (!name || isNaN(commission)) return;
    setSavingMecanicien(true);
    try {
      await updateMecanicien(editMecanicien.id, { name, commissionPercent: commission });
      setEditMecanicien(null);
      await refreshMecaniciens();
    } finally {
      setSavingMecanicien(false);
    }
  }, [editMecanicien, newName, newCommission, updateMecanicien, refreshMecaniciens]);

  const openEdit = (m: Mecanicien) => {
    setEditMecanicien(m);
    setNewName(m.name);
    setNewCommission(String(m.commission_percent));
  };

  const onDeleteMecanicien = useCallback(
    (m: Mecanicien) => {
      Alert.alert("Supprimer", `Supprimer "${m.name}" ?`, [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMecanicien(m.id);
              await refreshMecaniciens();
            } catch (e) {
              Alert.alert("Erreur", e instanceof Error ? e.message : "Suppression impossible");
            }
          },
        },
      ]);
    },
    [deleteMecanicien, refreshMecaniciens]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "800", color: theme.colors.onBackground }}
        >
          Paramètres
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text
            variant="titleMedium"
            style={{ fontWeight: "700", color: theme.colors.onBackground }}
          >
            Mécaniciens
          </Text>
        </View>

        <Card style={{ marginHorizontal: 16 }} noPadding>
          {mecaniciens.map((m, i) => (
            <View key={m.id}>
              {i > 0 && <Divider />}
              <View style={styles.mecanicienRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLarge" style={{ fontWeight: "700" }}>
                    {m.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Commission : {m.commission_percent} %
                  </Text>
                </View>
                <IconButton icon="pencil" size={20} onPress={() => openEdit(m)} />
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => onDeleteMecanicien(m)}
                />
              </View>
            </View>
          ))}
          <Divider />
          <List.Item
            title="Ajouter un mécanicien"
            left={(props) => <List.Icon {...props} icon="account-plus" />}
            onPress={() => {
              setNewName("");
              setNewCommission("");
              setAddOpen(true);
            }}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text
            variant="titleMedium"
            style={{ fontWeight: "700", color: theme.colors.onBackground }}
          >
            Associés (50/50)
          </Text>
        </View>

        <Card style={{ marginHorizontal: 16, gap: 12 }}>
          <TextInput
            label="Nom du proprio"
            value={proprioName}
            onChangeText={setProprioName}
            mode="outlined"
            outlineStyle={{ borderRadius: 12 }}
          />
          <TextInput
            label="Nom de l'associé"
            value={associeName}
            onChangeText={setAssocieName}
            mode="outlined"
            outlineStyle={{ borderRadius: 12 }}
          />
          <Button
            mode="contained"
            onPress={onSaveNames}
            loading={savingNames}
            disabled={savingNames}
            style={{ borderRadius: 12 }}
          >
            Enregistrer les noms
          </Button>
        </Card>

        <View style={styles.sectionHeader}>
          <Text
            variant="titleMedium"
            style={{ fontWeight: "700", color: theme.colors.onBackground }}
          >
            Export
          </Text>
        </View>

        <Card style={{ marginHorizontal: 16 }} noPadding>
          <List.Item
            title="Exporter en CSV"
            description="Fichier CSV avec toutes les opérations"
            left={(props) => <List.Icon {...props} icon="file-delimited" />}
            right={(props) =>
              exporting === "csv" ? (
                <ActivityIndicator size="small" />
              ) : (
                <List.Icon {...props} icon="chevron-right" />
              )
            }
            onPress={() => handleExport("csv")}
          />
          <Divider />
          <List.Item
            title="Exporter en PDF"
            description="Rapport PDF formaté"
            left={(props) => <List.Icon {...props} icon="file-pdf-box" />}
            right={(props) =>
              exporting === "pdf" ? (
                <ActivityIndicator size="small" />
              ) : (
                <List.Icon {...props} icon="chevron-right" />
              )
            }
            onPress={() => handleExport("pdf")}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text
            variant="titleMedium"
            style={{ fontWeight: "700", color: theme.colors.onBackground }}
          >
            Sauvegarde
          </Text>
        </View>

        <Card style={{ marginHorizontal: 16 }} noPadding>
          <List.Item
            title="Exporter la sauvegarde"
            description="Sauvegarde complète de la base de données"
            left={(props) => <List.Icon {...props} icon="database-export" />}
            right={(props) =>
              exporting === "backup" ? (
                <ActivityIndicator size="small" />
              ) : (
                <List.Icon {...props} icon="chevron-right" />
              )
            }
            onPress={() => handleExport("backup")}
          />
          <Divider />
          <List.Item
            title="Importer une sauvegarde"
            description="Restaurer depuis un fichier de sauvegarde"
            left={(props) => <List.Icon {...props} icon="database-import" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleImport}
          />
        </Card>

        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              width: "100%",
            }}
          >
            Garage Cash v1.0.0 — 100% hors ligne
          </Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={addOpen || editMecanicien != null} onDismiss={() => { setAddOpen(false); setEditMecanicien(null); }}>
          <Dialog.Title>{editMecanicien ? "Modifier le mécanicien" : "Ajouter un mécanicien"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nom"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              outlineStyle={{ borderRadius: 12 }}
              autoFocus
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Commission (%)"
              value={newCommission}
              onChangeText={setNewCommission}
              keyboardType="numeric"
              mode="outlined"
              outlineStyle={{ borderRadius: 12 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setAddOpen(false); setEditMecanicien(null); }}>Annuler</Button>
            <Button
              loading={savingMecanicien}
              onPress={editMecanicien ? onEditMecanicien : onAddMecanicien}
            >
              Enregistrer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  mecanicienRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 6,
  },
});
