# TAE Native

This is the active React Native client scaffold for The Abel Experience Dashboard.

It replaces `client_mobile/` and `mobile/` as the target for new native feature work. Those older apps remain reference material only.

## Stack

- Expo managed workflow
- React Native + TypeScript
- React Navigation
- TanStack Query
- Axios
- Secure token storage and AsyncStorage-backed local preferences

## Quick Start

1. Create `client_native/.env` from `.env.example` and point it at a reachable API host.
2. Install dependencies:

```powershell
cd client_native
npm install
```

3. Start Expo:

```powershell
npm start
```

## Current Scope

The scaffold covers EPIC-0 foundation work:

- app shell
- auth provider
- query provider
- persona-aware theme provider
- shared API client
- secure and local storage adapters
- starter dashboard, profile, and settings screens

## Notes

- Do not point mobile to `localhost` unless you are using a simulator that can resolve it correctly.
- Prefer your machine LAN IP for `EXPO_PUBLIC_API_BASE_URL` during local development.