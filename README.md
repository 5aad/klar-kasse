# Klar Kasse

Klar Kasse is a mobile receipt and spending app built with Expo Router inside a pnpm/Turborepo workspace.

The mobile app lets users scan receipts, crop the receipt image, run OCR with ML Kit, and clean German supermarket receipt text into structured JSON with an on-device LLM flow. The app also includes onboarding, dashboard, insight, budget, scan, and settings screens.

## Tech Stack

- Expo SDK 54 and React Native
- Expo Router file-based navigation
- pnpm workspaces and Turborepo
- Zustand for receipt scan state
- Expo Camera and Expo Image Manipulator for receipt capture and cropping
- ML Kit text recognition for OCR
- react-native-executorch for on-device receipt JSON cleanup
- Shared workspace packages for UI, theme, types, ESLint, and TypeScript config

## Project Structure

```txt
apps/
  mobile/            Expo mobile app
packages/
  ui/                Shared UI components
  theme/             Shared theme values
  types/             Shared TypeScript types
  eslint-config/     Shared ESLint config
  typescript-config/ Shared TypeScript config
```

## Requirements

- Node.js
- pnpm 8.15.6
- Android Studio for Android native builds
- Xcode for iOS native builds on macOS

Because this app uses native modules such as ML Kit and react-native-executorch, use a native development build. Expo Go is not enough for the full receipt scanning flow.

## Setup

Install dependencies from the repo root:

```sh
pnpm install
```

## Important Commands

Run the mobile app with Expo:

```sh
pnpm dev:mobile
```

Run the Android native app:

```sh
pnpm android
```

Run the iOS native app:

```sh
pnpm ios
```

Run all workspace dev tasks through Turbo:

```sh
pnpm dev
```

Build all packages/apps that define a build script:

```sh
pnpm build
```

Lint the workspace:

```sh
pnpm lint
```

Format TypeScript and Markdown files:

```sh
pnpm format
```

Run Expo web for the mobile app:

```sh
pnpm --dir apps/mobile web
```

## Mobile App Routes

- `/onboarding` - first-run onboarding
- `/dashboard` - overview screen
- `/insight` - spending insights
- `/budget` - budget screen
- `/settings` - app settings
- `/receipt-camera` - camera scanner
- `/receipt-camera/captured2` - OCR and receipt cleanup screen

## Notes

- The Expo app config is in `apps/mobile/app.json`.
- The main mobile source folder is `apps/mobile/src`.
- Shared packages are imported through the workspace, for example `@repo/ui`.
- Receipt scan image state lives in `apps/mobile/src/stores/receipt-scan-store.ts`.
