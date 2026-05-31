"use no memo";

import {
  FlexWidget,
  TextWidget,
  type ColorProp,
} from "react-native-android-widget";

import {
  type BudgetWidgetCategorySnapshot,
  type BudgetWidgetSnapshot,
} from "@/widgets/budget-widget-model";
import {
  formatBudgetWidgetAmount,
  getBudgetWidgetCopy,
} from "@/widgets/budget-widget-content";

export type BudgetWidgetTheme = "dark" | "light";

type BudgetWidgetProps = {
  snapshot: BudgetWidgetSnapshot;
  theme: BudgetWidgetTheme;
};

type WidgetPalette = {
  mutedSurface: ColorProp;
  mutedText: ColorProp;
  primary: ColorProp;
  surface: ColorProp;
  text: ColorProp;
  track: ColorProp;
};

const palettes: Record<BudgetWidgetTheme, WidgetPalette> = {
  dark: {
    mutedSurface: "#353534",
    mutedText: "#D6D4CE",
    primary: "#E63C3A",
    surface: "#2B2B2A",
    text: "#F2F0EA",
    track: "#4A4947",
  },
  light: {
    mutedSurface: "#F7F6F3",
    mutedText: "#6F6E6B",
    primary: "#E63C3A",
    surface: "#FFFFFF",
    text: "#101010",
    track: "#E8E6E2",
  },
};

function ProgressBar({
  height = 8,
  palette,
  percentage,
}: {
  height?: number;
  palette: WidgetPalette;
  percentage: number;
}) {
  const filled = Math.max(percentage, 0.1);
  const empty = Math.max(100 - percentage, 0.1);

  return (
    <FlexWidget
      style={{
        backgroundColor: palette.track,
        borderRadius: height / 2,
        flexDirection: "row",
        height,
        overflow: "hidden",
        width: "match_parent",
      }}
    >
      <FlexWidget
        style={{
          backgroundColor: palette.primary,
          flex: filled,
          height: "match_parent",
        }}
      />
      <FlexWidget style={{ flex: empty, height: "match_parent" }} />
    </FlexWidget>
  );
}

function EmptyBudget({
  language,
  palette,
  titleSize,
}: {
  language: BudgetWidgetSnapshot["language"];
  palette: WidgetPalette;
  titleSize: number;
}) {
  const copy = getBudgetWidgetCopy(language);

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexGap: 8,
        justifyContent: "center",
      }}
    >
      <TextWidget
        text={copy.setBudgetTitle}
        style={{
          color: palette.primary,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1,
        }}
      />
      <TextWidget
        text={copy.emptyTitle}
        style={{ color: palette.text, fontSize: titleSize, fontWeight: "700" }}
      />
      <TextWidget
        text={copy.emptyBody}
        maxLines={2}
        style={{ color: palette.mutedText, fontSize: 12 }}
      />
    </FlexWidget>
  );
}

function CategoryCard({
  category,
  palette,
}: {
  category: BudgetWidgetCategorySnapshot;
  palette: WidgetPalette;
}) {
  return (
    <FlexWidget
      style={{
        backgroundColor: palette.mutedSurface,
        borderRadius: 12,
        flex: 1,
        flexGap: 7,
        padding: 12,
      }}
    >
      <FlexWidget
        style={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TextWidget
          maxLines={1}
          text={category.name.toUpperCase()}
          truncate="END"
          style={{
            color: palette.text,
            fontSize: 12,
            fontWeight: "700",
            paddingRight: 8,
          }}
        />
        <TextWidget
          text={`${category.spentPercentage}%`}
          style={{ color: palette.primary, fontSize: 11, fontWeight: "700" }}
        />
      </FlexWidget>
      <ProgressBar
        height={5}
        palette={palette}
        percentage={category.progressPercentage}
      />
    </FlexWidget>
  );
}

function CategoriesRow({
  palette,
  snapshot,
}: {
  palette: WidgetPalette;
  snapshot: BudgetWidgetSnapshot;
}) {
  if (!snapshot.categories.length) {
    const copy = getBudgetWidgetCopy(snapshot.language);

    return (
      <FlexWidget
        style={{
          backgroundColor: palette.mutedSurface,
          borderRadius: 12,
          padding: 12,
        }}
      >
        <TextWidget
          text={copy.noCategorySpending}
          style={{ color: palette.mutedText, fontSize: 12, fontWeight: "600" }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget style={{ flexDirection: "row", flexGap: 10 }}>
      {snapshot.categories.map((category) => (
        <CategoryCard
          category={category}
          key={category.name}
          palette={palette}
        />
      ))}
    </FlexWidget>
  );
}

function PacingHeader({
  palette,
  snapshot,
}: {
  palette: WidgetPalette;
  snapshot: BudgetWidgetSnapshot;
}) {
  const copy = getBudgetWidgetCopy(snapshot.language);

  return (
    <FlexWidget style={{ flexGap: 8, width: "match_parent" }}>
      <TextWidget
        text={copy.pacingTitle}
        style={{
          color: palette.text,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 1,
        }}
      />
      <FlexWidget
        style={{ alignItems: "flex-end", flexDirection: "row", flexGap: 8 }}
      >
        <TextWidget
          text={`${snapshot.spentPercentage}`}
          style={{ color: palette.text, fontSize: 48, fontWeight: "700" }}
        />
        <TextWidget
          text="%"
          style={{ color: palette.primary, fontSize: 22, fontWeight: "700" }}
        />
      </FlexWidget>
      <TextWidget
        text={`${copy.usedLabel} ${formatBudgetWidgetAmount(snapshot.spentAmount, snapshot.currency, snapshot.language)} ${copy.ofLabel} ${formatBudgetWidgetAmount(snapshot.limitAmount, snapshot.currency, snapshot.language)}`}
        style={{ color: palette.text, fontSize: 14, fontWeight: "600" }}
      />
      <ProgressBar palette={palette} percentage={snapshot.progressPercentage} />
    </FlexWidget>
  );
}

function DetailedWidget({
  palette,
  snapshot,
}: {
  palette: WidgetPalette;
  snapshot: BudgetWidgetSnapshot;
}) {
  if (!snapshot.hasBudget) {
    return (
      <EmptyBudget
        language={snapshot.language}
        palette={palette}
        titleSize={20}
      />
    );
  }

  return (
    <FlexWidget style={{ flex: 1, flexGap: 10, width: "match_parent" }}>
      <PacingHeader palette={palette} snapshot={snapshot} />
      <CategoriesRow palette={palette} snapshot={snapshot} />
    </FlexWidget>
  );
}

export function BudgetWidget({ snapshot, theme }: BudgetWidgetProps) {
  const palette = palettes[theme];

  return (
    <FlexWidget
      accessibilityLabel="Klar Kasse monthly budget widget"
      clickAction="OPEN_APP"
      style={{
        backgroundColor: palette.surface,
        borderRadius: 26,
        height: "match_parent",
        padding: 16,
        width: "match_parent",
      }}
    >
      <DetailedWidget palette={palette} snapshot={snapshot} />
    </FlexWidget>
  );
}
