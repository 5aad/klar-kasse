import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize, radius, spacing } from "@repo/theme";
import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useResolvedTheme, useThemeColors } from "@/hooks/use-theme-colors";
import { useTabBarStore } from "@/stores/tab-bar-store";

type TabIconName = keyof typeof MaterialCommunityIcons.glyphMap;

type TabConfig = {
  icon: TabIconName;
  name: string;
  titleKey: string;
};

type RegularTabButtonProps = {
  iconColor: string;
  isFocused: boolean;
  label: string;
  onPress: () => void;
  tab: TabConfig;
  themeColors: ReturnType<typeof useThemeColors>;
  isFirst: boolean;
  isLast: boolean;
  showLabel: boolean;
};

function RegularTabButton({
  iconColor,
  isFocused,
  isFirst,
  isLast,
  label,
  onPress,
  showLabel,
  tab,
  themeColors,
}: RegularTabButtonProps) {
  const selectedProgress = useRef(
    new Animated.Value(isFocused ? 1 : 0),
  ).current;
  const targetLabelWidth = showLabel
    ? Math.min(Math.max(label.length * 7.5, 42), 82)
    : 0;
  const labelWidth = selectedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetLabelWidth],
  });
  const labelOpacity = selectedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  useEffect(() => {
    Animated.timing(selectedProgress, {
      toValue: isFocused ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isFocused, selectedProgress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : undefined}
      style={[
        styles.tabButton,
        !showLabel && styles.compactTabButton,
        showLabel && isFirst && styles.firstTabButton,
        showLabel && isLast && styles.lastTabButton,
      ]}
      onPress={onPress}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeTabBackground,
          {
            backgroundColor: themeColors.surface,
            opacity: selectedProgress,
          },
        ]}
      />
      <MaterialCommunityIcons
        color={isFocused ? themeColors.text : iconColor}
        name={tab.icon}
        size={23}
      />
      <Animated.Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.15}
        style={[
          styles.tabLabel,
          {
            color: themeColors.text,
            opacity: labelOpacity,
            width: labelWidth,
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

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
  const { fontScale, width } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const tabBarBottom = Math.max(bottom, spacing.md);
  const { t } = useTranslation();
  const regularTabs = tabs.filter((tab) => tab.name !== "scan");
  const isDark = resolvedTheme === "dark";
  const isMinimized = useTabBarStore((store) => store.isMinimized);
  const setIsMinimized = useTabBarStore((store) => store.setIsMinimized);
  const dockBackground = isDark ? "#050505" : colors.text;
  const dockBorderColor = isDark ? "#343434" : "transparent";
  const inactiveIconColor = isDark ? "#F4F1EA" : colors.primaryText;
  const useCompactTabs = width < 390 || fontScale > 1.12;
  const dockWidth = width >= 600 ? Math.min(width - spacing.xl * 2, 720) : null;
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
  const collapseProgress = useRef(
    new Animated.Value(isMinimized ? 1 : 0),
  ).current;
  const fullBarOpacity = collapseProgress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.2, 0],
  });
  const fullBarScaleX = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.62],
  });
  const fullBarTranslateX = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -82],
  });
  const compactBarOpacity = collapseProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0, 1],
  });
  const compactBarScale = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });
  const compactBarTranslateX = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [56, 0],
  });

  useEffect(() => {
    Animated.spring(collapseProgress, {
      toValue: isMinimized ? 1 : 0,
      damping: 15,
      mass: 0.75,
      stiffness: 185,
      useNativeDriver: true,
    }).start();
  }, [collapseProgress, isMinimized]);

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
      style={[
        styles.tabBarWrap,
        {
          height: 68 + tabBarBottom,
          ...(dockWidth
            ? {
                left: (width - dockWidth) / 2,
                right: (width - dockWidth) / 2,
              }
            : null),
        },
      ]}
    >
      <Animated.View
        pointerEvents={isMinimized ? "none" : "auto"}
        style={[
          styles.fullTabBar,
          useCompactTabs && styles.fullTabBarCompact,
          {
            bottom: tabBarBottom,
            opacity: fullBarOpacity,
            transform: [
              { translateX: fullBarTranslateX },
              { scaleX: fullBarScaleX },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.tabPill,
            useCompactTabs && styles.tabPillCompact,
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
              <RegularTabButton
                key={tab.name}
                iconColor={inactiveIconColor}
                isFirst={tab.name === regularTabs[0].name}
                isFocused={isFocused}
                isLast={tab.name === regularTabs.at(-1)?.name}
                label={label}
                showLabel={!useCompactTabs}
                tab={tab}
                themeColors={themeColors}
                onPress={() => navigateToRoute(tab.name)}
              />
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={
            state.index === scanRouteIndex ? { selected: true } : undefined
          }
          style={[
            styles.scanButton,
            useCompactTabs && styles.scanButtonCompact,
            {
              backgroundColor: dockBackground,
              borderColor: dockBorderColor,
              boxShadow: isDark
                ? "0 12px 22px rgba(0, 0, 0, 0.55)"
                : "0 10px 18px rgba(0, 0, 0, 0.22)",
            },
            state.index === scanRouteIndex && {
              backgroundColor: themeColors.primary,
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
            size={useCompactTabs ? 30 : 34}
          />
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents={isMinimized ? "auto" : "none"}
        style={[
          styles.compactTabBar,
          useCompactTabs && styles.fullTabBarCompact,
          {
            bottom: tabBarBottom,
            opacity: compactBarOpacity,
            transform: [
              { translateX: compactBarTranslateX },
              { scale: compactBarScale },
            ],
          },
        ]}
      >
        <Pressable
          accessibilityLabel={activeLabel}
          accessibilityRole="button"
          style={[
            styles.compactButton,
            useCompactTabs && styles.compactButtonSmall,
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
            size={useCompactTabs ? 25 : 28}
          />
        </Pressable>
        <View style={styles.compactSpacer} />
        <Pressable
          accessibilityRole="button"
          style={[
            styles.compactButton,
            useCompactTabs && styles.compactButtonSmall,
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
            size={useCompactTabs ? 30 : 34}
          />
        </Pressable>
      </Animated.View>
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
    minHeight: 84,
  },
  fullTabBar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fullTabBarCompact: {
    gap: spacing.xs,
  },
  compactTabBar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
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
  tabPillCompact: {
    minHeight: 56,
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
    overflow: "hidden",
  },
  compactTabButton: {
    flex: 1,
    minWidth: 0,
    height: 48,
    gap: 0,
    paddingHorizontal: spacing.xs,
  },
  activeTabBackground: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  firstTabButton: {
    paddingLeft: spacing.md,
  },
  lastTabButton: {
    paddingRight: spacing.md,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    overflow: "hidden",
  },
  scanButton: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    borderWidth: 1,
  },
  scanButtonCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  compactButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    borderWidth: 1,
  },
  compactButtonSmall: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  compactSpacer: {
    flex: 1,
  },
});
