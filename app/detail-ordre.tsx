import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  useTheme,
  HelperText,
  ActivityIndicator,
  Divider,
  Chip,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useOrdre, useOrdreMutations } from "../src/features/ordres/hooks";
import {
  ordreMontantSchema,
  paiementSchema,
} from "../src/features/ordres/schema";
import type {
  OrdreMontantFormData,
  PaiementFormData,
} from "../src/features/ordres/schema";
import { STATUT_LABEL, STATUT_TRANSITIONS } from "../src/features/ordres/types";
import { useProblemes, useProblemesMutations } from "../src/features/ordres/problemes.hooks";
import { useInterventions, useInterventionsMutations } from "../src/features/ordres/interventions.hooks";
import { useMecaniciens, useAssocies } from "../src/features/finance/hooks";
import { Card } from "../src/components/ui/Card";
import { formatCurrency, formatDate } from "../src/utils/format";
import { useTransactions } from "../src/features/transactions/hooks";

const STATUT_COLORS: Record<string, string> = {
  brouillon: "#607D8B",
  en_cours: "#FF9800",
  termine: "#2196F3",
  facture: "#4CAF50",
  paye: "#2E7D32",
};

export default function OrdreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { ordre, loading, refresh } = useOrdre(id);
  const {
    updateStatut,
    setMontant,
    setRealisateur,
    addPaiement,
    remove,
  } = useOrdreMutations();
  const { mecaniciens } = useMecaniciens();
  const { names } = useAssocies();
  const { problemes, loading: probLoading, refresh: refreshProb } = useProblemes(id);
  const { interventions, loading: intLoading, refresh: refreshInt } = useInterventions(id);
  const probMutations = useProblemesMutations();
  const intMutations = useInterventionsMutations();

  const [showMontant, setShowMontant] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [showProblemeModal, setShowProblemeModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [editingProbleme, setEditingProbleme] = useState<{ id: number; description: string } | null>(null);
  const [editingIntervention, setEditingIntervention] = useState<{ id: number; description: string } | null>(null);
  const [proFilter, setProFilter] = useState<"all" | "brouillon" | "en_cours" | "termine" | "facture">("all");

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), refreshProb(), refreshInt()]);
  }, [refresh, refreshProb, refreshInt]);

  useEffect(() => {
    refreshAll();
  }, []);

  if (loading || probLoading || intLoading || !ordre) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <IconButton icon="close" size={28} onPress={() => router.back()} />
        </View>
        <ActivityIndicator
          style={{ marginVertical: 40 }}
          color={theme.colors.primary}
        />
      </SafeAreaView>
    );
  }

  const reste = (ordre.montant_total ?? 0) - ordre.total_paye;
  const canTransition = STATUT_TRANSITIONS[ordre.statut];
  const nextStatut = canTransition.length > 0 ? canTransition[0] : null;
  const isEditable = true;

  const handleDelete = () => {
    Alert.alert(
      "Supprimer l'O.R.",
      "Êtes-vous sûr de vouloir supprimer cet ordre de réparation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await remove(ordre.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleAdvanceStatut = async () => {
    if (!nextStatut) return;

    if (nextStatut === "en_cours" && problemes.length === 0) {
      Alert.alert("Action impossible", "Ajoutez au moins un problème identifié avant de passer en cours.");
      return;
    }
    if (nextStatut === "termine" && interventions.length === 0) {
      Alert.alert("Action impossible", "Ajoutez au moins une intervention réalisée avant de passer à terminé.");
      return;
    }

    await updateStatut(ordre.id, nextStatut);
    await refreshAll();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <IconButton icon="close" size={28} onPress={() => router.back()} />
        <Text
          variant="headlineSmall"
          style={{
            fontWeight: "800",
            color: theme.colors.onBackground,
            flex: 1,
            marginLeft: 4,
          }}
        >
          O.R. #{ordre.id.slice(0, 6)}
        </Text>
        <IconButton
          icon="delete-outline"
          iconColor={theme.colors.error}
          size={22}
          onPress={handleDelete}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Statut */}
        <Card
          style={{
            backgroundColor: STATUT_COLORS[ordre.statut] + "18",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text variant="labelSmall" style={{ opacity: 0.7 }}>Statut</Text>
              <Text variant="titleLarge" style={{ fontWeight: "800" }}>
                {STATUT_LABEL[ordre.statut]}
              </Text>
            </View>
            <Chip
              textStyle={{ color: "#fff", fontWeight: "600" }}
              style={{ backgroundColor: STATUT_COLORS[ordre.statut], borderRadius: 12 }}
            >
              {STATUT_LABEL[ordre.statut]}
            </Chip>
          </View>
          {nextStatut && nextStatut !== "facture" && nextStatut !== "paye" && isEditable && (
            <Button
              mode="text"
              compact
              style={{ marginTop: 8, alignSelf: "flex-start" }}
              onPress={handleAdvanceStatut}
            >
              Passer à "{STATUT_LABEL[nextStatut]}"
            </Button>
          )}
        </Card>

        {/* Infos véhicule */}
        <Pressable onPress={() => router.push({ pathname: "/vehicule-detail", params: { id: ordre.vehicule_id } })}>
          <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text variant="titleMedium" style={{ fontWeight: "700", marginBottom: 8, flex: 1 }}>
              {ordre.marque} {ordre.modele} {ordre.annee ? `(${ordre.annee})` : ""}
            </Text>
          </View>
          <InfoRow icon="card-account-details-outline" text={ordre.immatriculation} theme={theme} />
          <InfoRow icon="phone" text={ordre.telephone} theme={theme} />
          <InfoRow icon="calendar" text={formatDate(ordre.date_creation)} theme={theme} />
          {ordre.kilometrage != null && (
            <InfoRow icon="speedometer" text={`${ordre.kilometrage.toLocaleString("fr-FR")} km`} theme={theme} />
          )}
        </Card>
        </Pressable>

        {/* Réalisé par */}
        <Card style={{ marginBottom: 12 }}>
          <Text variant="titleSmall" style={{ fontWeight: "700", marginBottom: 8 }}>
            Réalisé par
          </Text>
          {ordre.statut === "paye" ? (
            <Text variant="bodyLarge" style={{ fontWeight: "600" }}>
              {ordre.realisateur === "associe"
                ? names.associe
                : ordre.realisateur === "mecanicien"
                  ? ordre.mecanicien_name ?? "Mécanicien"
                  : names.proprio}
            </Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Chip
                selected={ordre.realisateur === "proprio"}
                mode={ordre.realisateur === "proprio" ? "flat" : "outlined"}
                icon="account-star"
                onPress={async () => {
                  await setRealisateur(ordre.id, "proprio", null);
                  await refreshAll();
                }}
                style={{ borderRadius: 10 }}
              >
                Moi ({names.proprio})
              </Chip>
              <Chip
                selected={ordre.realisateur === "associe"}
                mode={ordre.realisateur === "associe" ? "flat" : "outlined"}
                icon="account"
                onPress={async () => {
                  await setRealisateur(ordre.id, "associe", null);
                  await refreshAll();
                }}
                style={{ borderRadius: 10 }}
              >
                {names.associe}
              </Chip>
              {mecaniciens.map((m) => (
                <Chip
                  key={m.id}
                  selected={ordre.realisateur === "mecanicien" && ordre.mecanicien_id === m.id}
                  mode={ordre.realisateur === "mecanicien" && ordre.mecanicien_id === m.id ? "flat" : "outlined"}
                  icon="wrench"
                  onPress={async () => {
                    await setRealisateur(ordre.id, "mecanicien", m.id);
                    await refreshAll();
                  }}
                  style={{ borderRadius: 10 }}
                >
                  {m.name}
                </Chip>
              ))}
            </View>
          )}
        </Card>

        {/* Problèmes identifiés */}
        <Card style={{ marginBottom: 12 }}>
          <Text variant="titleSmall" style={{ fontWeight: "700", marginBottom: 8 }}>
            Problèmes identifiés ({problemes.length})
          </Text>
          {problemes.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}>
              Aucun problème renseigné
            </Text>
          ) : (
            problemes.map((p, i) => (
              <View key={p.id}>
                {i > 0 && <Divider />}
                <View style={styles.entryRow}>
                  <Text style={{ flex: 1, color: theme.colors.onSurface }}>{p.description}</Text>
                  {isEditable && (
                    <View style={{ flexDirection: "row" }}>
                      <IconButton
                        icon="pencil"
                        size={28}
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={() => {
                          setEditingProbleme({ id: p.id, description: p.description });
                          setShowProblemeModal(true);
                        }}
                      />
                      <IconButton
                        icon="delete-outline"
                        size={28}
                        iconColor={theme.colors.error}
                        onPress={() => {
                          Alert.alert("Supprimer", "Supprimer ce problème ?", [
                            { text: "Annuler", style: "cancel" },
                            {
                              text: "Supprimer",
                              style: "destructive",
                              onPress: async () => {
                                await probMutations.remove(p.id);
                                await refreshAll();
                              },
                            },
                          ]);
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
          {isEditable && (
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => {
                setEditingProbleme(null);
                setShowProblemeModal(true);
              }}
              style={{ borderRadius: 12, marginTop: 8 }}
            >
              Ajouter un problème
            </Button>
          )}
        </Card>

        {/* Interventions réalisées */}
        <Card style={{ marginBottom: 12 }}>
          <Text variant="titleSmall" style={{ fontWeight: "700", marginBottom: 8 }}>
            Interventions réalisées ({interventions.length})
          </Text>
          {interventions.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}>
              Aucune intervention renseignée
            </Text>
          ) : (
            interventions.map((intv, i) => (
              <View key={intv.id}>
                {i > 0 && <Divider />}
                <View style={styles.entryRow}>
                  <Text style={{ flex: 1, color: theme.colors.onSurface }}>{intv.description}</Text>
                  {isEditable && (
                    <View style={{ flexDirection: "row" }}>
                      <IconButton
                        icon="pencil"
                        size={28}
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={() => {
                          setEditingIntervention({ id: intv.id, description: intv.description });
                          setShowInterventionModal(true);
                        }}
                      />
                      <IconButton
                        icon="delete-outline"
                        size={28}
                        iconColor={theme.colors.error}
                        onPress={() => {
                          Alert.alert("Supprimer", "Supprimer cette intervention ?", [
                            { text: "Annuler", style: "cancel" },
                            {
                              text: "Supprimer",
                              style: "destructive",
                              onPress: async () => {
                                await intMutations.remove(intv.id);
                                await refreshAll();
                              },
                            },
                          ]);
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
          {isEditable && (
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => {
                setEditingIntervention(null);
                setShowInterventionModal(true);
              }}
              style={{ borderRadius: 12, marginTop: 8 }}
            >
              Ajouter une intervention
            </Button>
          )}
        </Card>

        {/* Montant & Paiement */}
        <Card style={{ marginBottom: 12 }}>
          <Text variant="titleSmall" style={{ fontWeight: "700", marginBottom: 8 }}>
            Paiement
          </Text>
          {ordre.montant_total != null ? (
            <>
              <View style={{ flexDirection: "row", gap: 16, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text variant="labelSmall" style={{ opacity: 0.7 }}>Total</Text>
                  <Text variant="headlineSmall" style={{ fontWeight: "800" }}>
                    {formatCurrency(ordre.montant_total)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelSmall" style={{ opacity: 0.7 }}>Payé</Text>
                  <Text variant="headlineSmall" style={{ fontWeight: "800", color: "#2E7D32" }}>
                    {formatCurrency(ordre.total_paye)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelSmall" style={{ opacity: 0.7 }}>Reste</Text>
                  <Text
                    variant="headlineSmall"
                    style={{ fontWeight: "800", color: reste > 0 ? "#D32F2F" : "#2E7D32" }}
                  >
                    {formatCurrency(reste)}
                  </Text>
                </View>
              </View>
              {reste > 0 && (
                <Button
                  mode="contained"
                  icon="cash"
                  onPress={() => setShowPaiement(true)}
                  style={{ borderRadius: 12 }}
                >
                  Enregistrer un paiement
                </Button>
              )}
            </>
          ) : (
            <>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic", marginBottom: 8 }}>
                Montant non fixé
              </Text>
              {ordre.statut === "termine" && interventions.length > 0 && (
                <Button
                  mode="contained"
                  icon="cash"
                  onPress={() => setShowMontant(true)}
                  style={{ borderRadius: 12 }}
                >
                  Fixer le montant
                </Button>
              )}
            </>
          )}
        </Card>

        {/* Historique des paiements */}
        <PaiementsList ordreId={ordre.id} />
      </ScrollView>

      {/* Modals */}
      <TextEntryModal
        visible={showProblemeModal}
        title={editingProbleme ? "Modifier le problème" : "Nouveau problème"}
        label="Description du problème"
        initialValue={editingProbleme?.description ?? ""}
        onSave={async (text) => {
          if (editingProbleme) {
            await probMutations.update(editingProbleme.id, text);
          } else {
            await probMutations.add(ordre.id, text);
            if (ordre.statut === "brouillon") {
              await updateStatut(ordre.id, "en_cours");
            }
          }
          await refreshAll();
          setShowProblemeModal(false);
        }}
        onCancel={() => setShowProblemeModal(false)}
      />
      <TextEntryModal
        visible={showInterventionModal}
        title={editingIntervention ? "Modifier l'intervention" : "Nouvelle intervention"}
        label="Description de l'intervention"
        initialValue={editingIntervention?.description ?? ""}
        onSave={async (text) => {
          if (editingIntervention) {
            await intMutations.update(editingIntervention.id, text);
          } else {
            await intMutations.add(ordre.id, text);
            if (ordre.statut === "en_cours") {
              await updateStatut(ordre.id, "termine");
            }
          }
          await refreshAll();
          setShowInterventionModal(false);
        }}
        onCancel={() => setShowInterventionModal(false)}
      />
      <MontantModal
        visible={showMontant}
        ordreId={ordre.id}
        onDone={async () => {
          setShowMontant(false);
          await refreshAll();
        }}
        onCancel={() => setShowMontant(false)}
        setMontant={setMontant}
      />
      <PaiementModal
        visible={showPaiement}
        ordreId={ordre.id}
        maxMontant={reste}
        onDone={async () => {
          setShowPaiement(false);
          await refreshAll();
        }}
        onCancel={() => setShowPaiement(false)}
        addPaiement={async (data) => {
          await addPaiement(ordre.id, data);
        }}
      />
    </SafeAreaView>
  );
}

function InfoRow({ icon, text, theme }: { icon: string; text: string; theme: any }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={16} color={theme.colors.onSurfaceVariant} />
      <Text style={{ color: theme.colors.onSurfaceVariant }}>{text}</Text>
    </View>
  );
}

function TextEntryModal({
  visible,
  title,
  label,
  initialValue,
  onSave,
  onCancel,
}: {
  visible: boolean;
  title: string;
  label: string;
  initialValue: string;
  onSave: (text: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue, visible]);

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <Card style={{ width: "90%", maxWidth: 400, gap: 12 }}>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          {title}
        </Text>
        <TextInput
          label={label}
          value={text}
          onChangeText={setText}
          mode="outlined"
          outlineStyle={{ borderRadius: 12 }}
          multiline
          numberOfLines={3}
        />
        <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
          <Button onPress={onCancel}>Annuler</Button>
          <Button
            mode="contained"
            onPress={async () => {
              if (!text.trim()) return;
              setSaving(true);
              try {
                await onSave(text.trim());
              } finally {
                setSaving(false);
              }
            }}
            loading={saving}
            disabled={saving || !text.trim()}
            style={{ borderRadius: 12 }}
          >
            Enregistrer
          </Button>
        </View>
      </Card>
    </View>
  );
}

function MontantModal({
  visible,
  ordreId,
  onDone,
  onCancel,
  setMontant,
}: {
  visible: boolean;
  ordreId: string;
  onDone: () => void;
  onCancel: () => void;
  setMontant: (id: string, montant_total: number) => Promise<any>;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrdreMontantFormData>({
    resolver: zodResolver(ordreMontantSchema),
    defaultValues: { montant_total: 0 },
  });

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <Card style={{ width: "90%", maxWidth: 400, gap: 12 }}>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          Fixer le montant
        </Text>
        <Controller
          control={control}
          name="montant_total"
          render={({ field: { onChange, value, onBlur } }) => (
            <View>
              <TextInput
                label="Montant total (DA)"
                value={value != null ? value.toString() : ""}
                onChangeText={(t) => {
                  const n = parseFloat(t.replace(",", "."));
                  onChange(isNaN(n) ? undefined : n);
                }}
                onBlur={onBlur}
                keyboardType="numeric"
                mode="outlined"
                outlineStyle={{ borderRadius: 12 }}
                error={!!errors.montant_total}
                left={<TextInput.Icon icon="cash" />}
              />
              {errors.montant_total && (
                <HelperText type="error">{errors.montant_total.message}</HelperText>
              )}
            </View>
          )}
        />
        <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
          <Button onPress={onCancel}>Annuler</Button>
          <Button
            mode="contained"
            onPress={handleSubmit(async (data) => {
              await setMontant(ordreId, data.montant_total);
              onDone();
            })}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={{ borderRadius: 12 }}
          >
            Valider
          </Button>
        </View>
      </Card>
    </View>
  );
}

function PaiementModal({
  visible,
  ordreId,
  maxMontant,
  onDone,
  onCancel,
  addPaiement,
}: {
  visible: boolean;
  ordreId: string;
  maxMontant: number;
  onDone: () => void;
  onCancel: () => void;
  addPaiement: (data: PaiementFormData) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaiementFormData>({
    resolver: zodResolver(paiementSchema),
    defaultValues: { montant: maxMontant },
  });

  if (!visible) return null;

  const montant = watch("montant");

  return (
    <View style={styles.modalOverlay}>
      <Card style={{ width: "90%", maxWidth: 400, gap: 12 }}>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          Enregistrer un paiement
        </Text>
        <Text variant="bodySmall" style={{ opacity: 0.7 }}>
          Reste à payer : {formatCurrency(maxMontant)}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            mode="outlined"
            compact
            style={{ borderRadius: 12, flex: 1 }}
            onPress={() => setValue("montant", maxMontant, { shouldValidate: true })}
          >
            Total ({formatCurrency(maxMontant)})
          </Button>
        </View>
        <Controller
          control={control}
          name="montant"
          render={({ field: { onChange, value, onBlur } }) => (
            <View>
              <TextInput
                label="Montant (DA)"
                value={value != null ? value.toString() : ""}
                onChangeText={(t) => {
                  const n = parseFloat(t.replace(",", "."));
                  onChange(isNaN(n) ? undefined : n);
                }}
                onBlur={onBlur}
                keyboardType="numeric"
                mode="outlined"
                outlineStyle={{ borderRadius: 12 }}
                error={!!errors.montant}
                left={<TextInput.Icon icon="cash" />}
              />
              {errors.montant && (
                <HelperText type="error">{errors.montant.message}</HelperText>
              )}
            </View>
          )}
        />
        {montant > maxMontant && (
          <HelperText type="error">
            Le montant ne peut pas dépasser le reste à payer ({formatCurrency(maxMontant)})
          </HelperText>
        )}
        <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
          <Button onPress={onCancel}>Annuler</Button>
          <Button
            mode="contained"
            onPress={handleSubmit(async (data) => {
              if (data.montant > maxMontant) {
                Alert.alert("Erreur", "Le montant dépasse le reste à payer.");
                return;
              }
              await addPaiement(data);
              onDone();
            })}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={{ borderRadius: 12 }}
          >
            Payer
          </Button>
        </View>
      </Card>
    </View>
  );
}

function PaiementsList({ ordreId }: { ordreId: string }) {
  const theme = useTheme();
  const { transactions } = useTransactions({});
  const paiements = transactions.filter((t) => t.ordre_id === ordreId && t.type === "income");

  if (paiements.length === 0) return null;

  return (
    <Card style={{ marginBottom: 12 }}>
      <Text variant="titleSmall" style={{ fontWeight: "700", marginBottom: 8 }}>
        Historique des paiements
      </Text>
      {paiements.map((tx, i) => (
        <React.Fragment key={tx.id}>
          {i > 0 && <Divider />}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
            <View>
              <Text style={{ fontWeight: "600" }}>{formatCurrency(tx.amount)}</Text>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>{formatDate(tx.date)}</Text>
            </View>
            <MaterialCommunityIcons name="cash" size={20} color="#2E7D32" />
          </View>
        </React.Fragment>
      ))}
    </Card>
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
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
