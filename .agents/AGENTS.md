# CareTag Client App Customizations & Rules

This file documents the workspace configurations, patterns, and agent instructions for the CareTag B2C Consumer application.

## 1. Deep Link Rules
- The application shares the custom scheme `caryapp://` with the B2B mechanic application.
- It registers intent filters for two hosts:
  - `caryapp://claim/:vehicleId` (Magic Link SMS Claiming)
  - `caryapp://vehicle/:vehicleId` (NFC Tag Tap redirection)
- Both paths must resolve to the same `ClaimVehicleScreen` to handle the claiming flow.

## 2. Authentication & Session Hydration
- Global authentication state is managed via `useAuthStore` (Zustand).
- Credentials and JWT tokens are securely persisted in the keychain using `react-native-keychain`.
- On cold start, the session must be hydrated from the keychain BEFORE the app renders the navigation container to avoid screen flickering.

## 3. SQLite Database
- Source of truth for local vehicle data, service history, scheduled reminders, and offline ratings.
- Schema consists of four tables: `vehicles`, `service_history`, `maintenance_reminders`, and `agency_ratings`.
- For transferred vehicles (`is_transferred = 1`), only the latest `TRUNCATED_HISTORY_LIMIT` (default 5) service visits are visible to ensure data privacy.

## 4. Notifications Engine
- Built using `@notifee/react-native`.
- Every maintenance reminder schedules **two trigger notifications**:
  1. An early reminder (typically 1 month prior, configured by `EARLY_REMINDER_MONTHS`).
  2. A due-date reminder.
- Trigger IDs are comma-concatenated and stored in `maintenance_reminders.notif_id` so they can be cancelled together.

## 5. API Client & Mocks
- Direct API calls are located in `src/services/apiClient.ts`.
- A mock interceptor automatically answers requests when `USE_MOCK_API` is set to `true` in `src/constants/config.ts`.

## 6. AI Contracts
- For all UI component generation and styling, you MUST strictly adhere to the design system tokens and UX patterns defined in .ai/contracts/ui-contract.md.
- For all API integrations, Supabase configurations, and local environment routing, you MUST strictly adhere to the logic defined in .ai/contracts/api-contract.md.