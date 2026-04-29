import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { fontSize } from "@repo/theme";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

import { useThemeColors } from "@/hooks/use-theme-colors";

export default function TabLayout() {
  const themeColors = useThemeColors();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      backgroundColor={themeColors.background}
      iconColor={{
        default: themeColors.surface,
        selected: themeColors.primary,
      }}
      labelStyle={{
        default: {
          color: themeColors.surface,
          fontSize: fontSize.sm,
          fontWeight: "500",
        },
        selected: {
          color: themeColors.primary,
          fontSize: fontSize.sm,
          fontWeight: "700",
        },
      }}
    >
      <NativeTabs.Trigger name="dashboard">
        <Icon
          src={
            <VectorIcon
              family={MaterialCommunityIcons}
              name="view-dashboard-outline"
            />
          }
        />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="insight">
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="chart-line" />}
        />
        <Label>Insight</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan" role="search">
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="line-scan" />}
        />
        <Label>Scan</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="budget">
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="wallet-outline" />
          }
        />
        <Label>Budget</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon
          src={
            <VectorIcon family={MaterialCommunityIcons} name="cog-outline" />
          }
        />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
