import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
      backgroundColor="#ffffff"
      iconColor={{ default: "#6b7280", selected: "#111827" }}
      labelStyle={{
        default: { color: "#6b7280", fontSize: 12, fontWeight: "500" },
        selected: { color: "#111827", fontSize: 12, fontWeight: "700" },
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
      <NativeTabs.Trigger name="scan" role="search" >
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
