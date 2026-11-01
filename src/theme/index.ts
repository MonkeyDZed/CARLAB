import {
  MD3LightTheme,
  MD3DarkTheme,
  configureFonts,
  type MD3Theme,
} from "react-native-paper";

const fontConfig = {
  fontFamily: "System",
};

export const LightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: "#1565C0",
    primaryContainer: "#D1E4FF",
    secondary: "#FF6F00",
    secondaryContainer: "#FFE0B2",
    error: "#D32F2F",
    errorContainer: "#FFCDD2",
    background: "#F5F7FA",
    surface: "#FFFFFF",
    surfaceVariant: "#F0F4F8",
    outline: "#CFD8DC",
    outlineVariant: "#E0E8EE",
    onBackground: "#1A1A2E",
    onSurface: "#1A1A2E",
    onSurfaceVariant: "#455A64",
  },
};

export const DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#90CAF9",
    primaryContainer: "#1565C0",
    secondary: "#FFB74D",
    secondaryContainer: "#E65100",
    error: "#EF9A9A",
    errorContainer: "#B71C1C",
    background: "#0D1117",
    surface: "#161B22",
    surfaceVariant: "#1C2333",
    outline: "#30363D",
    outlineVariant: "#21262D",
    onBackground: "#E6EDF3",
    onSurface: "#E6EDF3",
    onSurfaceVariant: "#9AA6B2",
  },
};

export const CHART_COLORS = [
  "#1565C0",
  "#FF6F00",
  "#2E7D32",
  "#C62828",
  "#6A1B9A",
  "#00838F",
  "#4E342E",
  "#37474F",
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Achat matériel": "#1565C0",
  Loyer: "#FF6F00",
  Consommables: "#2E7D32",
  Charges: "#E91E63",
  "Épargne objectif": "#00897B",
  "Retrait associé": "#7E57C2",
  "Retrait mécanicien": "#6A1B9A",
  Investissement: "#00838F",
  Autre: "#546E7A",
};

export const CATEGORY_COLORS_DARK: Record<string, string> = {
  "Achat matériel": "#64B5F6",
  Loyer: "#FFB74D",
  Consommables: "#81C784",
  Charges: "#F48FB1",
  "Épargne objectif": "#4DB6AC",
  "Retrait associé": "#B39DDB",
  "Retrait mécanicien": "#CE93D8",
  Investissement: "#4DD0E1",
  Autre: "#90A4AE",
};

export const INCOME_COLOR = "#2E7D32";
export const INCOME_COLOR_DARK = "#81C784";
export const EXPENSE_COLOR = "#D32F2F";
export const EXPENSE_COLOR_DARK = "#EF9A9A";

export function categoryColor(
  category: string,
  dark: boolean,
  fallbackIndex = 0
): string {
  const main = CATEGORY_COLORS[category];
  const darkColor = CATEGORY_COLORS_DARK[category];
  if (dark && darkColor) return darkColor;
  if (main) return main;
  return CHART_COLORS[fallbackIndex % CHART_COLORS.length];
}

export function amountColor(type: "expense" | "income", dark: boolean): string {
  if (type === "expense") return dark ? EXPENSE_COLOR_DARK : EXPENSE_COLOR;
  return dark ? INCOME_COLOR_DARK : INCOME_COLOR;
}
