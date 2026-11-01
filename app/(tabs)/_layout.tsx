import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";
import { Platform, StyleSheet, type ColorValue } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const TAB_BAR_BG = "#3A3F4B";
const TAB_ACTIVE_BG = "rgba(255,255,255,0.14)";
const TAB_INACTIVE_TINT = "#C9CDD4";
const TAB_ACTIVE_TINT = "#FFFFFF";

function TabIcon({
  name,
  color,
  size,
}: {
  name: IconName;
  color: ColorValue | string;
  size: number;
}) {
  return <MaterialCommunityIcons name={name} color={color} size={size} />;
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_ACTIVE_TINT,
        tabBarInactiveTintColor: TAB_INACTIVE_TINT,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "ios" ? 96 : 72,
          paddingBottom: Platform.OS === "ios" ? 32 : 12,
          paddingTop: 10,
          paddingHorizontal: 8,
          elevation: 0,
          shadowOpacity: 0.05,
          shadowColor: "#000",
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          borderRadius: 12,
          paddingVertical: 4,
        },
        tabBarActiveBackgroundColor: undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home-variant" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ordres"
        options={{
          title: "Ordres",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="wrench-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="clipboard-text-clock" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tresorerie"
        options={{
          title: "Trésorerie",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="bank-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Paramètres",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
