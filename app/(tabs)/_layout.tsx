import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { colors, spacing } from "../../src/theme";

const tabs = [
  { name: "library", label: "Library", icon: "▣" },
  { name: "assessment", label: "Assess", icon: "◎" },
  { name: "dashboard", label: "Dashboard", icon: "◈" },
  { name: "profile", label: "Profile", icon: "○" },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.accentMuted,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 82 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 6,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          gap: 2,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  width: 32,
                  height: 28,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: focused ? colors.accentLight : "transparent",
                }}
              >
                <Text style={{ fontSize: 20, color, fontWeight: focused ? "700" : "400" }}>
                  {tab.icon}
                </Text>
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
