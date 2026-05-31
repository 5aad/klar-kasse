# Android Budget Widget Design

## Goal

Add a polished Android home-screen widget for Klar Kasse using
`react-native-android-widget`. The widget uses a fixed `4x2` launcher size, reads
the app's local budget data, and provides matching light and dark variants.

## Scope

Create one fixed-size widget named `KlarKasse`. It renders the monthly budget
pacing layout in a `4x2` launcher cell footprint and cannot be resized.

The widget is Android-only. It does not add configuration screens, remote sync,
or an iOS widget.

## Layout

Show:

- "Monthly budget pacing" label
- Monthly spending percentage
- Used amount and monthly limit
- Red progress bar
- Up to three category cards, ordered by highest spending

Each category card shows its category name, spending percentage, and a compact
progress bar.

## Visual Design

Use the existing Klar Kasse theme values as the basis:

- Accent: `#E63C3A`
- Light background: `#F2F0EA`
- Light surface: `#FFFFFF`
- Light text: `#101010`
- Dark background: `#101010`
- Dark surface: `#2B2B2A`
- Dark text: `#F2F0EA`

Both theme trees must have identical structure, spacing, and touch targets. Only
visual styling changes between light and dark mode.

Use rounded cards, clear hierarchy, tabular-looking amounts, and restrained
progress bars. Widget components use only `react-native-android-widget`
primitives and do not use React hooks.

## Data Flow

Read the current month's local SQLite data through the existing APIs:

- `getMonthlyBudget()` for the monthly limit and spending total
- `getCategories()` for category totals and limits

Create a widget snapshot helper that normalizes values for rendering:

- Remaining amount
- Currency
- Spent percentage clamped for progress-bar width
- Display percentage allowed to exceed 100%
- Top two categories by spent amount

When no monthly budget exists, render zero values and a friendly prompt to open
the app and set a budget.

## Registration

Install `react-native-android-widget` and register its Expo config plugin in
`apps/mobile/app.json`.

Configure the widget with:

- Name: `KlarKasse`
- Picker label: `Klar Kasse Budget`
- Size: fixed `4x2`
- Resizing: disabled
- Periodic update: every 30 minutes
- Minimum size: `320dp x 110dp`

Register the widget task handler from the existing Expo Router entry file,
`apps/mobile/index.js`.

## Updates

Render or rerender the widget for:

- `WIDGET_ADDED`
- `WIDGET_UPDATE`

Request immediate refreshes while the app is open after:

- Saving or deleting a receipt
- Saving or deleting the monthly budget
- Creating, editing, or deleting a category
- Completing onboarding budget setup

Periodic Android refreshes provide a fallback when the app is not open.

## Navigation

Tapping the widget body opens Klar Kasse.

## Error Handling

If local widget data cannot be loaded, render a stable empty-state snapshot
instead of failing the task handler. Immediate refresh requests are best-effort
and must not block app mutations.

## Verification

Verify with:

- TypeScript type checking for the mobile app
- Expo config resolution to confirm plugin registration
- Android native prebuild or native build generation as available
- Manual Android launcher check for the fixed `4x2` size
- Manual Android light and dark system-theme checks
- Manual check that tapping the widget opens Klar Kasse
