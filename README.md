# BillGuard (Expo + Supabase)

Mobile-first BillGuard app with Supabase auth, shared household billing, payment history, reminders, printable reports, and profile/theme settings.

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
npm run build:web
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

It creates/updates app tables:
- `profiles`
- `households`
- `household_members`
- `household_invites`
- `bill_categories`
- `bills`
- `payments` (includes `month_reference`)

It also includes:
- `profiles.currency_code` (user preferred currency)
- `profiles.theme_color`
- `profiles.active_household_id`
- bills and payments household ownership
- payment snapshot fields for historical reports

It also inserts starter categories:
- Utilities
- Rent
- Subscriptions
- Loans
- Insurance
- Credit Cards

## 4) Milestone Progress

### Milestone 1: App foundation
- Supabase client integration
- Signup / login / logout
- Session-based routing
- Safe boot when env vars are missing

### Milestone 2: Bills and payments
- Bills CRUD
- Dynamic bill categories
- Mark bill as paid
- Undo bill payment
- Payment history list
- Month and payer filtering in Payments

### Milestone 3: Shared household model
- Household-based ownership instead of per-user-only ownership
- Household members and invites
- Accept invite flow
- Switch active household
- Create another household
- Rename household
- Remove member
- Leave household
- Transfer household ownership

### Milestone 4: Profile and personalization
- Full name editing
- Currency preference
- Theme color selection
- Password change in Profile
- Signup password confirmation

### Milestone 5: Reports and history hardening
- Monthly printable payment report
- Clean report layout for export/print
- Report filename support
- Historical payment amount preservation
- Payment bill name/category snapshot support so old reports stay stable after bill renames

### Milestone 6: UI polish
- Theme-aware shared components
- Improved tab/background orb motion
- Screen content entrance transitions
- Reorganized Profile tab
- Collapsible Profile management sections

## 5) Current app behavior

- Signup/Login screens are connected to Supabase email/password auth.
- Profile supports full name, password change, preferred currency, and theme selection.
- Session persistence is enabled through Supabase auth config.
- Bills list/add/details/edit/delete are connected to Supabase.
- Payment history supports filtering and printable monthly reporting.
- Household collaboration is supported through shared households, member management, and invites.
- If env vars are missing, app still boots and shows safe alerts instead of crashing.

## 6) Current limitations / notes

- Latest schema changes must be rerun in Supabase from `supabase/schema.sql` when database fields/functions are added.
- Web/PWA use is possible, but current best working mode is still Expo/dev usage.
- Real standalone iPhone usage still depends on a proper iOS build / TestFlight path.

## 7) Release checklist (EAS deployment)

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

## 8) Vercel web deployment

Use Expo's static web export for Vercel.

Build:

```bash
npm run build:web
```

This project includes `vercel.json` with:
- build command: `npm run build:web`
- output directory: `dist`

In Vercel:
- Framework Preset: `Other`
- Build Command: leave default from `vercel.json`
- Output Directory: leave default from `vercel.json`
- Add env vars:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
