import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";
import { useTabBarStore } from "@/stores/tab-bar-store";

type TabIconName = keyof typeof MaterialCommunityIcons.glyphMap;

type TabConfig = {
  icon: TabIconName;
  name: string;
  titleKey: string;
};

const tabs: TabConfig[] = [
  {
    icon: "view-dashboard-outline",
    name: "(dashboard)",
    titleKey: "tabs.dashboard",
  },
  {
    icon: "chart-line",
    name: "(insight)",
    titleKey: "tabs.insight",
  },
  {
    icon: "line-scan",
    name: "scan",
    titleKey: "tabs.scan",
  },
  {
    icon: "wallet-outline",
    name: "budget",
    titleKey: "tabs.budget",
  },
  {
    icon: "cog-outline",
    name: "settings",
    titleKey: "tabs.settings",
  },
];

function FloatingTabBar({ descriptors, navigation, state }: any) {
  const themeColors = useThemeColors();
  const resolvedTheme = useResolvedTheme();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const regularTabs = tabs.filter((tab) => tab.name !== "scan");
  const isDark = resolvedTheme === "dark";
  const isMinimized = useTabBarStore((store) => store.isMinimized);
  const setIsMinimized = useTabBarStore((store) => store.setIsMinimized);
  const dockBackground = isDark ? "#050505" : colors.text;
  const dockBorderColor = isDark ? "#343434" : "transparent";
  const inactiveIconColor = isDark ? "#F4F1EA" : colors.primaryText;
  const scanRouteIndex = state.routes.findIndex(
    (route: { name: string }) => route.name === "scan",
  );
  const activeRoute = state.routes[state.index];
  const activeTab =
    tabs.find((tab) => tab.name === activeRoute?.name) ?? regularTabs[0];
  const activeRouteOptions = activeRoute
    ? descriptors[activeRoute.key]?.options
    : undefined;
  const activeLabel = activeRouteOptions?.title ?? t(activeTab.titleKey);

  function navigateToRoute(routeName: string) {
    const routeIndex = state.routes.findIndex(
      (route: { name: string }) => route.name === routeName,
    );
    const route = state.routes[routeIndex];

    if (!route) return;

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (state.index !== routeIndex && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarWrap, { paddingBottom: Math.max(bottom, spacing.md) }]}
    >
      {isMinimized ? (
        <>
          <Pressable
            accessibilityLabel={activeLabel}
            accessibilityRole="button"
            style={[
              styles.compactButton,
              {
                backgroundColor: dockBackground,
                borderColor: dockBorderColor,
                boxShadow: isDark
                  ? "0 12px 22px rgba(0, 0, 0, 0.55)"
                  : "0 10px 18px rgba(0, 0, 0, 0.22)",
              },
            ]}
            onPress={() => setIsMinimized(false)}
          >
            <MaterialCommunityIcons
              color={inactiveIconColor}
              name={activeTab.icon}
              size={28}
            />
          </Pressable>
          <View style={styles.compactSpacer} />
          <Pressable
            accessibilityRole="button"
            style={[
              styles.compactButton,
              {
                backgroundColor:
                  state.index === scanRouteIndex
                    ? themeColors.primary
                    : dockBackground,
                borderColor: dockBorderColor,
                boxShadow: isDark
                  ? "0 12px 22px rgba(0, 0, 0, 0.55)"
                  : "0 10px 18px rgba(0, 0, 0, 0.22)",
              },
            ]}
            onPress={() => navigateToRoute("scan")}
          >
            <MaterialCommunityIcons
              color={
                state.index === scanRouteIndex
                  ? themeColors.primaryText
                  : inactiveIconColor
              }
              name="line-scan"
              size={34}
            />
          </Pressable>
        </>
      ) : (
        <>
      <View
        style={[
          styles.tabPill,
          {
            backgroundColor: dockBackground,
            borderColor: dockBorderColor,
            boxShadow: isDark
              ? "0 12px 22px rgba(0, 0, 0, 0.55)"
              : "0 10px 18px rgba(0, 0, 0, 0.22)",
          },
        ]}
      >
        {regularTabs.map((tab) => {
          const routeIndex = state.routes.findIndex(
            (route: { name: string }) => route.name === tab.name,
          );
          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;
          const options = route ? descriptors[route.key]?.options : undefined;
          const label = options?.title ?? t(tab.titleKey);

          return (
            <Pressable
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : undefined}
              style={[
                styles.tabButton,
                tab.name === regularTabs[0].name && styles.firstTabButton,
                tab.name === regularTabs.at(-1)?.name && styles.lastTabButton,
                isFocused && {
                  backgroundColor: themeColors.surface,
                },
              ]}
              onPress={() => navigateToRoute(tab.name)}
            >
              <MaterialCommunityIcons
                color={isFocused ? themeColors.text : inactiveIconColor}
                name={tab.icon}
                size={23}
              />
              {isFocused ? (
                <Text
                  style={[styles.tabLabel, { color: themeColors.text }]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={state.index === scanRouteIndex ? { selected: true } : undefined}
        style={[
          styles.scanButton,
          {
            backgroundColor: dockBackground,
            borderColor: dockBorderColor,
            boxShadow: isDark
              ? "0 12px 22px rgba(0, 0, 0, 0.55)"
              : "0 10px 18px rgba(0, 0, 0, 0.22)",
          },
          state.index === scanRouteIndex && { backgroundColor: themeColors.primary },
        ]}
        onPress={() => navigateToRoute("scan")}
      >
        <MaterialCommunityIcons
          color={state.index === scanRouteIndex ? themeColors.primaryText : inactiveIconColor}
          name="line-scan"
          size={34}
        />
      </Pressable>
        </>
      )}
    </View>
  );
}

export default function AndroidTabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, focused, size }) => (
              <MaterialCommunityIcons
                color={color}
                name={tab.icon}
                size={focused ? size + 2 : size}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    position: "absolute",
    right: spacing.md,
    bottom: 0,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tabPill: {
    flex: 1,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
  },
  tabButton: {
    minWidth: 44,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
  },
  firstTabButton: {
    paddingLeft: spacing.md,
  },
  lastTabButton: {
    paddingRight: spacing.md,
  },
  tabLabel: {
    maxWidth: 82,
    fontSize: fontSize.sm,
    fontWeight: "800",
  },
  scanButton: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    borderWidth: 1,
  },
  compactButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    borderWidth: 1,
  },
  compactSpacer: {
    flex: 1,
  },
});
