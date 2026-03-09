# BillGuard (Expo + Supabase MVP)

Mobile-first BillGuard app with Supabase auth, bills CRUD, dynamic categories, and user currency preference.

## 1) Install and run

```bash
cd /Users/melissa/billguard
npm install
cp .env.example .env
npm run start
```

Optional:

```bash
npm run ios
npm run android
npm run web
npm run lint
```

## 2) Environment variables

Add these to `.env` in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Where to find them:
- Supabase Dashboard -> Project Settings -> API
- Copy `Project URL` into `EXPO_PUBLIC_SUPABASE_URL`
- Copy `anon public` key into `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 3) Database schema and seed

Run SQL from:
- `supabase/schema.sql`

It creates/updates MVP tables:
- `profiles`
- `bill_categories`
- `bills`
- `payments` (includes `month_reference`)

It also includes:
- `profiles.currency_code` (user preferred currency)

It also inserts starter categories:
- Utilities
- Rent
- Subscriptions
- Loans
- Insurance
- Credit Cards

## 4) Current app behavior

- Signup/Login screens are connected to Supabase email/password auth.
- Profile screen can log out.
- Profile screen can update preferred currency.
- Session persistence is enabled through Supabase auth config.
- If env vars are missing, app still boots and shows safe alerts instead of crashing.
- Bills list/add/details/edit/delete are connected to Supabase.
- Bill categories dropdown is loaded from Supabase `bill_categories` (with local fallback).

## 5) Scope boundaries

Implemented now:
- Supabase client foundation
- Auth integration (signup/login/logout)
- Route/session handling for auth vs app screens
- Bills CRUD
- Dynamic bill categories
- Currency preference + amount formatting

Phase 2:
- Form schema validation
- Notifications/reminders

## 6) Release checklist (EAS deployment)

Prerequisites:
- Expo account + `eas-cli` installed
- App icon and splash already configured in `app.json`
- Supabase production project ready

### One-time setup

```bash
npm install -g eas-cli
eas login
eas init
```

### Set build-time env vars (project secrets)

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY"
```

### Build profiles (already configured)

File:
- `eas.json`

Profiles:
- `development` -> dev client (internal)
- `preview` -> internal testing (APK on Android)
- `production` -> store-ready build

### Build commands

```bash
# Internal test build (Android APK)
eas build --profile preview --platform android

# Production store builds
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Submit to stores

```bash
eas submit --profile production --platform android
eas submit --profile production --platform ios
```

### OTA updates after release (JS/UI only)

```bash
eas update --branch production --message "Describe update"
```
