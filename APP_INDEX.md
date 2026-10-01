# Recurrly app index

## Authentication implementation

Custom email/password authentication with mandatory sign-in email confirmation lives in `src/components/auth/`, with validation and session decision helpers in `src/lib/auth.ts`.

- The root layout installs Clerk with secure token storage and protects tabs, subscription details, and onboarding using active session state.
- Existing signIn/signUp routes use shared branded forms. `forgotPassword` supports email-code recovery. The login layout follows the reference image and uses the bundled logo.
- Shared forms include email verification, device-trust challenges, resend cooldowns, errors, password visibility, and keyboard-aware layouts.
- Home uses the authenticated profile name; Settings shows account email and sign-out.
- `AUTH_SETUP.md` documents dashboard configuration and mobile acceptance checks. `tests/auth.test.mjs` covers auth decision rules.
- Run `npm run lint`, `npm run typecheck`, and `npm run test:auth`. The separate example starter is excluded from active-app checks.

## Stack and entry point

- Expo SDK 57, React 19.2.3, React Native 0.86.3, TypeScript 6.
- `package.json` starts the app through `expo-router/entry`.
- npm lockfile is present; no Bun lockfile.
- `src/app/_layout.tsx` loads six Plus Jakarta Sans fonts and defines the root stack.

## Routes

| File under `src/app/` | Purpose | Current state |
| --- | --- | --- |
| `(tabs)/index.tsx` | Home dashboard | Balance, upcoming renewals, expandable subscription cards using sample data |
| `(tabs)/subscriptions.tsx` | Subscription list | Placeholder |
| `(tabs)/insights.tsx` | Insights | Placeholder |
| `(tabs)/settings.tsx` | Settings | Account email and sign-out |
| `(tabs)/_layout.tsx` | Four-tab navigation | Custom floating tab bar, safe-area positioning |
| `(auth)/signIn.tsx` | Sign in | Email/password followed by mandatory email confirmation |
| `(auth)/signUp.tsx` | Sign up | Email/password and email verification |
| `(auth)/forgotPassword.tsx` | Password recovery | Reset code and new password |
| `(auth)/_layout.tsx` | Authentication stack | Headers hidden |
| `onboarding.tsx` | Onboarding | Placeholder |
| `subscriptions/[id].tsx` | Subscription details | Reads route ID; does not yet render subscription data |

## Components and data flow

`constants/data.ts` supplies dashboard user, balance, four subscriptions, three upcoming renewals, and tab definitions. The dashboard owns `expandedSubscriptionId` in local React state and passes each record to `SubscriptionCard`. Tapping a card expands or collapses its details.

- `components/SubscriptionCard.tsx`: price, category, billing, expandable payment/date/status information.
- `components/UpcomingSubscriptionCard.tsx`: service icon, price, days remaining.
- `components/ListHeading.tsx`: heading and View all button; button has no action yet.
- `lib/utils.ts`: currency, date, and status formatting using Intl and Day.js.
- `type.d.ts`: global subscription, component-prop, and navigation interfaces.

Clerk supplies authentication, email confirmation codes, and secure session persistence. Subscription records remain sample data; there is no subscription backend. The home add icon has no action yet.

## Styling and assets

- `src/global.css`: Tailwind 4 / NativeWind 5 theme and component classes, including shared authentication forms and future modals.
- `constants/theme.ts`: colors, spacing, tab-bar geometry; overlaps CSS theme tokens.
- `constants/icon.ts` and `constants/images.ts`: bundled image registries.
- `assets/icons/`: service logos and navigation icons.
- `assets/images/`: avatar, splash, platform icons, and starter imagery.
- `assets/fonts/`: six Plus Jakarta Sans weights.

## Configuration

- `app.json`: portrait orientation, recurrly URL scheme, iOS/Android icons, static web output, Router/splash/font/Clerk/SecureStore plugins, typed routes, React Compiler.
- `metro.config.js`: Expo Metro configuration wrapped by NativeWind.
- `postcss.config.mjs`: Tailwind PostCSS plugin.
- `tsconfig.json`: strict checking; `@/*` maps to `src/*`, `@/assets/*` maps to assets.
- `nativewind*.d.ts`, `image.d.ts`, `expo-env.d.ts`: styling, image, and Expo type declarations.
- `AGENTS.md`: project development requirements; `CLAUDE.md` references it.
- `README.md`: Expo starter instructions.
- `example/`: separate Expo starter reference screens, components, hooks, and reset script; outside active routes.

## Development commands

Start: `npm run start`. Platforms: `npm run android`, `npm run ios`, `npm run web`. Checks: `npx expo lint`, `npx tsc --noEmit`.

The reset-project script in package.json points to `scripts/reset-project.js`, while the discovered reset script is under `example/scripts/`.

## Scope

This is a source-navigation map, not a runtime audit. Environment secret values, dependency internals, generated caches, and Git internals are excluded.
