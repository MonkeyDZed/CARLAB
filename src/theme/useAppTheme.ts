import { useColorScheme } from "react-native";
import {
  PaperProvider,
  MD3DarkTheme as PaperDarkTheme,
  MD3LightTheme as PaperLightTheme,
} from "react-native-paper";
import { LightTheme, DarkTheme } from "./index";

export { LightTheme, DarkTheme };

export function useAppTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? DarkTheme : LightTheme;
}
