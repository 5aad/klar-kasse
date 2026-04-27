import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type OnboardingPage = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: IconName;
  accent: string;
  softAccent: string;
};

export const onboardingPages: OnboardingPage[] = [
  {
    key: "scan",
    eyebrow: "Scan",
    title: "Capture receipts in seconds.",
    body: "Line up the receipt, take a picture, and let Klar Kasse prepare the scan for review.",
    icon: "line-scan",
    accent: "#0f766e",
    softAccent: "#ccfbf1",
  },
  {
    key: "clean",
    eyebrow: "Clean",
    title: "Turn receipt text into clear items.",
    body: "OCR and local cleanup help organize German supermarket receipts into structured spending data.",
    icon: "receipt-text-check-outline",
    accent: "#b45309",
    softAccent: "#fef3c7",
  },
  {
    key: "track",
    eyebrow: "Track",
    title: "Keep your budget close.",
    body: "Review activity, understand patterns, and stay aware of what is left for the month.",
    icon: "chart-donut",
    accent: "#be123c",
    softAccent: "#ffe4e6",
  },
];
