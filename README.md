# CareTag — Consumer Mobile App (B2C)

React Native 0.76.9 mobile application for the consumer-facing side of the CareTag automotive maintenance SaaS.

## Features

- **Frictionless Auth** — Google, Facebook, Microsoft OAuth with Keychain session persistence
- **Multi-Vehicle Garage** — Register and manage multiple cars, Zustand + SQLite
- **Service History** — Chronological maintenance timeline with privacy-enforced truncation for transferred vehicles
- **Proactive Notifications** — Dual-trigger Notifee scheduler: 1 month early warning + on-due-date alert
- **Agency Finder** — Dark-themed Google Maps with GPS-sorted list of nearby authorized CareTag centers
- **Rating System** — 5-star post-service review with offline-first submit
- **Ownership Transfer** — Secure 4-step transfer flow; only mechanical data (oil type, mileage, filter status) is passed to new owner. All seller PII is permanently severed
- **Magic Link Claiming** — `caryapp://claim/:vehicleId` deep link from SMS instantly claims a vehicle with inline auth

## Architecture

```
src/
├── constants/config.ts      ← Feature flags, API URL, deep link scheme
├── db/clientDatabase.ts     ← 4-table SQLite schema + CRUD helpers
├── navigation/              ← React Navigation: deep link + bottom tabs
├── services/                ← API client (mock), auth, notifications, GPS, transfer
├── store/                   ← Zustand: authStore + garageStore
└── screens/                 ← All UI screens
```

## Quick Start

```bash
npm install
npm run android   # or npm run ios
```

## Going Live

1. Set `USE_MOCK_API = false` in `src/constants/config.ts`
2. Set `API_BASE_URL` to your backend URL
3. Add OAuth credentials in `config.ts`
4. Add Google Maps API key to `AndroidManifest.xml` and `AppDelegate.mm`

## Deep Link Testing

```bash
# Android
adb shell am start -W -a android.intent.action.VIEW -d "caryapp://claim/CTAG-001" com.caretag.client

# iOS Simulator
xcrun simctl openurl booted "caryapp://claim/CTAG-001"
```

## Related

- **B2B Mechanic App**: [`emad-ashour/cary`](https://github.com/emad-ashour/cary)
