import React, { useState, useCallback } from "react";
import { TextInput } from "react-native-paper";
import { View } from "react-native";

interface SearchBarProps {
  onSearch: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Rechercher...",
}: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleChangeText = useCallback(
    (text: string) => {
      setValue(text);
      onSearch(text);
    },
    [onSearch]
  );

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        mode="outlined"
        left={<TextInput.Icon icon="magnify" />}
        right={
          value.length > 0 ? (
            <TextInput.Icon
              icon="close"
              onPress={() => handleChangeText("")}
            />
          ) : null
        }
        outlineStyle={{ borderRadius: 12 }}
        style={{ marginBottom: 4 }}
      />
    </View>
  );
}
