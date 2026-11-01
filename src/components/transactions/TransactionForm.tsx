import React, { useState } from "react";
import { ScrollView, View, Image, Pressable, Alert } from "react-native";
import {
  TextInput,
  Button,
  HelperText,
  useTheme,
  IconButton,
} from "react-native-paper";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { cacheDirectory, makeDirectoryAsync, copyAsync } from "expo-file-system/legacy";
import {
  transactionSchema,
  type TransactionFormData,
} from "../../features/transactions/schema";
import { EXPENSE_CATEGORIES } from "../../features/transactions/types";
import { Card } from "../ui/Card";
import { ImageViewer } from "../ui/ImageViewer";

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>;
  initialValues?: Partial<TransactionFormData>;
  submitLabel?: string;
  existingPhotoUri?: string | null;
}

export function TransactionForm({
  onSubmit,
  initialValues,
  submitLabel = "Enregistrer",
  existingPhotoUri,
}: TransactionFormProps) {
  const theme = useTheme();
  const [photoUri, setPhotoUri] = useState<string | null>(
    existingPhotoUri || null
  );
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      type: "expense",
      category: "Autre" as TransactionFormData["category"],
      description: "",
      date: "",
      photoUri: existingPhotoUri ?? null,
      ...initialValues,
    },
  });

  const copyToAppDir = async (uri: string): Promise<string> => {
    const fileName = `receipt_${Date.now()}.jpg`;
    const destDir = `${cacheDirectory}photos/`;
    await makeDirectoryAsync(destDir, { intermediates: true });
    const dest = `${destDir}${fileName}`;
    await copyAsync({ from: uri, to: dest });
    return dest;
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission refusée", "Accès à la galerie requis.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const path = await copyToAppDir(result.assets[0].uri);
      setPhotoUri(path);
      setPhotoRemoved(false);
      setValue("photoUri", path, { shouldValidate: true });
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission refusée", "Accès à la caméra requis.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const path = await copyToAppDir(result.assets[0].uri);
      setPhotoUri(path);
      setPhotoRemoved(false);
      setValue("photoUri", path, { shouldValidate: true });
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setPhotoRemoved(true);
    setValue("photoUri", null, { shouldValidate: true });
  };

  const onFormSubmit = async (data: TransactionFormData) => {
    if (photoRemoved) {
      data.photoUri = null;
    }
    await onSubmit(data);
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Card style={{ gap: 12 }}>
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value, onBlur } }) => (
            <View>
              <TextInput
                label="Montant (DA)"
                value={value != null ? value.toString() : ""}
                onChangeText={(text) => {
                  const num = parseFloat(text.replace(",", "."));
                  onChange(isNaN(num) ? undefined : num);
                }}
                onBlur={onBlur}
                keyboardType="numeric"
                mode="outlined"
                outlineStyle={{ borderRadius: 12 }}
                error={!!errors.amount}
                left={<TextInput.Icon icon="cash" />}
              />
              {errors.amount && (
                <HelperText type="error">{errors.amount.message}</HelperText>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View>
              <TextInput
                label="Catégorie"
                value={value || ""}
                onChangeText={() => {}}
                mode="outlined"
                outlineStyle={{ borderRadius: 12 }}
                error={!!errors.category}
                left={<TextInput.Icon icon="shape" />}
                editable={false}
                showSoftInputOnFocus={false}
              />
              {errors.category && (
                <HelperText type="error">
                  {errors.category.message}
                </HelperText>
              )}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {EXPENSE_CATEGORIES.filter(
                  (cat) =>
                    cat !== "Réparation" &&
                    cat !== "Retrait associé" &&
                    cat !== "Retrait mécanicien"
                ).map((cat) => (
                  <Button
                    key={cat}
                    mode={value === cat ? "contained" : "outlined"}
                    compact
                    onPress={() => {
                      setValue("category", cat, { shouldValidate: true });
                    }}
                    style={{ borderRadius: 10 }}
                    labelStyle={{ fontSize: 12 }}
                  >
                    {cat}
                  </Button>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value, onBlur } }) => (
            <View>
              <TextInput
                label="Description"
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                outlineStyle={{ borderRadius: 12 }}
                error={!!errors.description}
                left={<TextInput.Icon icon="text" />}
                placeholder="Ex: Achat clé dynamométrique"
                multiline
                numberOfLines={2}
              />
              {errors.description && (
                <HelperText type="error">
                  {errors.description.message}
                </HelperText>
              )}
            </View>
          )}
        />

        {photoUri && !photoRemoved ? (
          <View>
            <Pressable onPress={() => setViewerOpen(true)}>
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 12 }}
                resizeMode="cover"
              />
            </Pressable>
            <IconButton
              icon="close-circle"
              iconColor={theme.colors.error}
              size={22}
              style={{ position: "absolute", top: -4, right: -4 }}
              onPress={removePhoto}
            />
            <ImageViewer
              uri={photoUri}
              visible={viewerOpen}
              onClose={() => setViewerOpen(false)}
            />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Button
              mode="outlined"
              icon="image"
              onPress={pickFromGallery}
              style={{ borderRadius: 12, borderStyle: "dashed" }}
            >
              Galerie
            </Button>
            <Button
              mode="outlined"
              icon="camera"
              onPress={takePhoto}
              style={{ borderRadius: 12, borderStyle: "dashed" }}
            >
              Prendre une photo
            </Button>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit(onFormSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={{ borderRadius: 12, marginTop: 8 }}
          contentStyle={{ paddingVertical: 6 }}
        >
          {submitLabel}
        </Button>
      </Card>
    </ScrollView>
  );
}
