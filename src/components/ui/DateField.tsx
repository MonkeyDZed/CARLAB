import React from "react";
import { View } from "react-native";
import { TextInput, HelperText } from "react-native-paper";

interface DateFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  onBlur?: () => void;
  icon?: string;
}

export function DateField({
  label = "Date",
  value,
  onChangeText,
  error,
  onBlur,
  icon = "calendar",
}: DateFieldProps) {
  return (
    <View>
      <TextInput
        label={`${label} (AAAA-MM-JJ)`}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        mode="outlined"
        outlineStyle={{ borderRadius: 12 }}
        error={!!error}
        left={<TextInput.Icon icon={icon} />}
      />
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}
