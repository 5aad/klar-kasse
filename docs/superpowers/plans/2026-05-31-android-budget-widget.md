# Android Budget Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one fixed `4x2` Android home-screen budget widget with matching light and dark variants.

**Architecture:** A pure widget snapshot module converts existing SQLite budget and category data into display-ready values. A pure renderer chooses a layout from Android-reported dimensions and renders only `react-native-android-widget` primitives. A task handler loads snapshots for Android lifecycle events, while app mutations request best-effort widget refreshes.

**Tech Stack:** Expo SDK 54, Expo Router, React Native 0.81, TypeScript, Expo SQLite, Drizzle ORM, `react-native-android-widget`

---

## File Structure

- Create `apps/mobile/src/widgets/budget-widget-model.ts`: normalize budget and category API data into a stable widget snapshot.
- Create `apps/mobile/src/widgets/budget-widget-model.test.ts`: cover snapshot calculations and size selection.
- Create `apps/mobile/src/widgets/budget-widget.tsx`: render the fixed `4x2` primitive-only widget tree.
- Create `apps/mobile/src/widgets/budget-widget-refresh.tsx`: load snapshots and request redraws for all installed widget instances.
- Create `apps/mobile/src/widgets/widget-task-handler.tsx`: handle add, update, and resize lifecycle events.
- Modify `apps/mobile/index.js`: register the widget task handler after the Expo Router entry import.
- Modify `apps/mobile/app.json`: register the Expo widget config plugin.
- Modify `apps/mobile/package.json`: add the widget dependency and a Node test script.
- Modify `apps/mobile/src/queries/budgets.ts`: request a refresh after budget mutations.
- Modify `apps/mobile/src/queries/receipts.ts`: request a refresh after receipt mutations.
- Modify `apps/mobile/src/queries/categories.ts`: request a refresh after category mutations.
- Modify `apps/mobile/src/app/onboarding/index.tsx`: request a refresh after onboarding saves the initial budget.
- Create `apps/mobile/assets/widget-preview/klar-kasse-budget.png`: provide a launcher picker preview.

## Task 1: Add Model Tests

- [x] Add a Node-compatible test command to `apps/mobile/package.json`.
- [x] Create `budget-widget-model.test.ts` with cases confirming the fixed medium layout.
- [x] Add cases for percentage calculation, progress clamping, top-category ordering, and the no-budget state.
- [x] Run the model tests and confirm they fail because the model module does not exist.

## Task 2: Implement Snapshot Model

- [x] Create `budget-widget-model.ts` with `selectBudgetWidgetLayout()` and `createBudgetWidgetSnapshot()`.
- [x] Run the model tests and confirm they pass.

## Task 3: Install And Register Native Package

- [x] Install `react-native-android-widget` for the mobile workspace.
- [x] Add the Expo config plugin entry with one fixed `4x2` `KlarKasse` widget.
- [x] Add a launcher preview PNG generated from the medium layout.

## Task 4: Implement Widget Renderer

- [x] Create a primitive-only renderer with matching light and dark trees.
- [x] Render the fixed `4x2` variant from the snapshot.
- [x] Make the widget body open the app.

## Task 5: Add Lifecycle And Refresh Wiring

- [x] Create a widget task handler that loads local SQLite data and renders for add and update events.
- [x] Register the handler in `apps/mobile/index.js`.
- [x] Add best-effort refresh calls after receipt, budget, and category mutations and initial onboarding setup.

## Task 6: Verify

- [x] Run model tests.
- [x] Run mobile TypeScript type checking.
- [x] Run Expo config resolution and confirm the widget plugin is present.
- [x] Run Expo prebuild for Android without installing dependencies and inspect generated widget native registration.
- [x] Review the final diff and report any manual Android launcher checks still needed.
