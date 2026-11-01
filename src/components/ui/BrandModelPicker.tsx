import React, { useState, useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Text, TextInput, useTheme, Divider } from "react-native-paper";
import { ALL_MARQUES, MARQUES_MODELES } from "../../data/marques";
import { Card } from "../ui/Card";

interface BrandModelPickerProps {
  marque: string;
  modele: string;
  onMarqueChange: (v: string) => void;
  onModeleChange: (v: string) => void;
  errors?: { marque?: string; modele?: string };
}

export function BrandModelPicker({
  marque = "",
  modele = "",
  onMarqueChange,
  onModeleChange,
  errors,
}: BrandModelPickerProps) {
  const theme = useTheme();
  const [showBrandList, setShowBrandList] = useState(false);
  const [showModelList, setShowModelList] = useState(false);
  const [brandSearch, setBrandSearch] = useState(marque);
  const [modelSearch, setModelSearch] = useState(modele);

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return ALL_MARQUES.slice(0, 20);
    const q = brandSearch.toLowerCase();
    return ALL_MARQUES.filter((b) => b.toLowerCase().includes(q)).slice(0, 20);
  }, [brandSearch]);

  const filteredModels = useMemo(() => {
    const models = MARQUES_MODELES[marque] || [];
    if (!modelSearch) return models;
    const q = modelSearch.toLowerCase();
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [marque, modelSearch]);

  const selectBrand = (brand: string) => {
    setBrandSearch(brand);
    onMarqueChange(brand);
    setShowBrandList(false);
    if (marque !== brand) {
      setModelSearch("");
      onModeleChange("");
    }
  };

  const selectModel = (model: string) => {
    setModelSearch(model);
    onModeleChange(model);
    setShowModelList(false);
  };

  return (
    <View style={{ gap: 12 }}>
      <View>
        <TextInput
          label="Marque (optionnel)"
          value={brandSearch}
          onChangeText={(t) => {
            setBrandSearch(t);
            onMarqueChange(t);
            setShowBrandList(true);
          }}
          onFocus={() => setShowBrandList(true)}
          mode="outlined"
          outlineStyle={{ borderRadius: 12 }}
          error={!!errors?.marque}
        />
        {showBrandList && filteredBrands.length > 0 && (
          <Card noPadding style={{ marginTop: 4, maxHeight: 200 }}>
            <ScrollView nestedScrollEnabled>
              {filteredBrands.map((item, i) => (
                <React.Fragment key={item}>
                  {i > 0 && <Divider />}
                  <Pressable
                    onPress={() => selectBrand(item)}
                    style={({ pressed }) => ({
                      padding: 12,
                      backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent",
                    })}
                  >
                    <Text style={{ fontWeight: marque === item ? "700" : "400" }}>
                      {item}
                    </Text>
                  </Pressable>
                </React.Fragment>
              ))}
            </ScrollView>
          </Card>
        )}
      </View>

      <View>
        <TextInput
          label="Modèle (optionnel)"
          value={modelSearch}
          onChangeText={(t) => {
            setModelSearch(t);
            onModeleChange(t);
            setShowModelList(true);
          }}
          onFocus={() => filteredModels.length > 0 && setShowModelList(true)}
          mode="outlined"
          outlineStyle={{ borderRadius: 12 }}
          error={!!errors?.modele}
        />
        {showModelList && filteredModels.length > 0 && (
          <Card noPadding style={{ marginTop: 4, maxHeight: 200 }}>
            <ScrollView nestedScrollEnabled>
              {filteredModels.map((item, i) => (
                <React.Fragment key={item}>
                  {i > 0 && <Divider />}
                  <Pressable
                    onPress={() => selectModel(item)}
                    style={({ pressed }) => ({
                      padding: 12,
                      backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent",
                    })}
                  >
                    <Text style={{ fontWeight: modele === item ? "700" : "400" }}>
                      {item}
                    </Text>
                  </Pressable>
                </React.Fragment>
              ))}
            </ScrollView>
          </Card>
        )}
      </View>
    </View>
  );
}
