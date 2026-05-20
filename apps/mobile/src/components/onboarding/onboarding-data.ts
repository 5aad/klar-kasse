import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type OnboardingPage = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: IconName;
};

export const onboardingPages: OnboardingPage[] = [
  {
    key: "scan",
    eyebrow: "Scan",
    title: "Capture receipts in seconds.",
    body: "Line up the receipt, take a picture, and let Klar Kasse prepare the scan for review.",
    icon: "line-scan",
  },
  {
    key: "clean",
    eyebrow: "Review",
    title: "See what you bought at a glance.",
    body: "Klar Kasse sorts your receipt into simple items, totals, and categories so it is easy to check.",
    icon: "receipt-text-check-outline",
  },
  {
    key: "track",
    eyebrow: "Track",
    title: "Keep your budget close.",
    body: "Review activity, understand patterns, and stay aware of what is left for the month.",
    icon: "chart-donut",
  },
  {
    key: "setup",
    eyebrow: "Setup",
    title: "Make Klar Kasse yours.",
    body: "Choose a profile image, add your name, and set this month's budget before you start.",
    icon: "account-heart-outline",
  },
];
