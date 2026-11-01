import React, { useState, useCallback, useEffect } from "react";
import { View, Alert, Pressable } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Searchbar,
  List,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehiculeSchema, type VehiculeFormData } from "../../features/vehicules/schema";
import * as vehiculesApi from "../../features/vehicules/api";
import type { Vehicule } from "../../features/vehicules/types";
import { Card } from "../ui/Card";
import { BrandModelPicker } from "../ui/BrandModelPicker";

interface SelectedVehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  telephone: string;
}

interface VehiculePickerProps {
  onSelect: (info: SelectedVehicule) => void;
}

type Step = "search" | "new";

export function VehiculePicker({ onSelect }: VehiculePickerProps) {
  const theme = useTheme();
  const [step, setStep] = useState<Step>("search");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Vehicule[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    setSearch(query);
    if (query.length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await vehiculesApi.getAllVehicules(query);
      setResults(r);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSelect = (v: Vehicule) => {
    onSelect({
      id: v.id,
      immatriculation: v.immatriculation,
      marque: v.marque,
      modele: v.modele,
      telephone: v.telephone,
    });
  };

  const handleCreated = (v: Vehicule) => {
    onSelect({
      id: v.id,
      immatriculation: v.immatriculation,
      marque: v.marque,
      modele: v.modele,
      telephone: v.telephone,
    });
  };

  if (step === "new") {
    return (
      <NewVehiculeForm
        onCreated={handleCreated}
        onBack={() => setStep("search")}
      />
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <Searchbar
        placeholder="Rechercher véhicule (immat, marque, modele, tel)..."
        value={search}
        onChangeText={doSearch}
        style={{ borderRadius: 12 }}
        inputStyle={{ fontSize: 15 }}
      />
      {searching && <ActivityIndicator style={{ padding: 16 }} />}
      {!searching && results.length > 0 && (
        <Card noPadding>
          {results.map((v, i) => (
            <React.Fragment key={v.id}>
              {i > 0 && <Divider />}
              <List.Item
                title={`${v.marque} ${v.modele}${v.annee ? ` (${v.annee})` : ""}`}
                description={`${v.immatriculation}${v.telephone ? ` • ${v.telephone}` : ""}`}
                left={() => <List.Icon icon="car" />}
                right={() => <List.Icon icon="chevron-right" />}
                onPress={() => handleSelect(v)}
              />
            </React.Fragment>
          ))}
        </Card>
      )}
      {!searching && results.length === 0 && search.length >= 1 && (
        <View style={{ alignItems: "center", paddingVertical: 8, gap: 8 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Aucun véhicule trouvé</Text>
        </View>
      )}
      <Divider />
      <Button mode="contained" icon="car" onPress={() => setStep("new")} style={{ borderRadius: 12 }}>
        Nouveau véhicule
      </Button>
    </View>
  );
}

function NewVehiculeForm({
  onCreated,
  onBack,
}: {
  onCreated: (vehicule: Vehicule) => void;
  onBack: () => void;
}) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehiculeFormData>({
    resolver: zodResolver(vehiculeSchema),
    defaultValues: { immatriculation: "", marque: "", modele: "", annee: null, telephone: "" },
  });

  const submit = async (data: VehiculeFormData) => {
    const existing = await vehiculesApi.findVehiculeByImmat(data.immatriculation);
    if (existing) {
      Alert.alert("Immatriculation existante", "Ce véhicule existe déjà. Voulez-vous l'utiliser ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Utiliser", onPress: () => onCreated(existing) },
      ]);
      return;
    }
    const v = await vehiculesApi.createVehicule(data);
    onCreated(v);
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Button icon="arrow-left" compact onPress={onBack}>Retour</Button>
        <Text variant="titleSmall" style={{ fontWeight: "700" }}>Nouveau véhicule</Text>
      </View>
      <Controller control={control} name="immatriculation" render={({ field: { onChange, value, onBlur } }) => (
        <TextInput label="Immatriculation *" value={value} onChangeText={(t) => onChange(t.toUpperCase())} onBlur={onBlur} mode="outlined" outlineStyle={{ borderRadius: 12 }} error={!!errors.immatriculation} autoCapitalize="characters" autoCorrect={false} left={<TextInput.Icon icon="card-account-details-outline" />} />
      )} />
      <BrandModelPicker
        marque={watch("marque") ?? ""}
        modele={watch("modele") ?? ""}
        onMarqueChange={(v) => setValue("marque", v, { shouldValidate: true })}
        onModeleChange={(v) => setValue("modele", v, { shouldValidate: true })}
        errors={{ marque: errors.marque?.message, modele: errors.modele?.message }}
      />
      <Controller control={control} name="annee" render={({ field: { onChange, value, onBlur } }) => (
        <TextInput label="Année (optionnel)" value={value != null ? value.toString() : ""} onChangeText={(t) => { const n = parseInt(t); onChange(isNaN(n) ? null : n); }} onBlur={onBlur} mode="outlined" outlineStyle={{ borderRadius: 12 }} keyboardType="numeric" error={!!errors.annee} left={<TextInput.Icon icon="calendar" />} />
      )} />
      <Controller control={control} name="telephone" render={({ field: { onChange, value, onBlur } }) => (
        <TextInput label="Téléphone (optionnel)" value={value} onChangeText={onChange} onBlur={onBlur} mode="outlined" outlineStyle={{ borderRadius: 12 }} keyboardType="phone-pad" error={!!errors.telephone} left={<TextInput.Icon icon="phone" />} />
      )} />
      <Button mode="contained" onPress={handleSubmit(submit)} loading={isSubmitting} disabled={isSubmitting} style={{ borderRadius: 12, marginTop: 8 }}>
        Créer le véhicule
      </Button>
    </View>
  );
}
