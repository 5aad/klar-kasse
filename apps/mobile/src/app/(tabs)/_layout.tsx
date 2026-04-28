import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, fontSize } from "@repo/theme";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      backgroundColor={colors.background}
      iconColor={{ default: colors.surface, selected: colors.primary }}
      labelStyle={{
        default: {
          color: colors.surface,
          fontSize: fontSize.sm,
          fontWeight: "500",
        },
        selected: {
          color: colors.primary,
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
