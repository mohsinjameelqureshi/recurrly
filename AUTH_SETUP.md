# Recurrly authentication setup

## Account configuration

Use `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the existing `.env` and in the matching EAS environment. Do not put a secret key in the app. Development and production instances have separate keys and configuration.

In the Clerk Dashboard:

- Enable Native API under Native applications.
- Enable email/password sign-up and sign-in, require email-code verification at sign-up, and enable password reset. Enable **First and last name** so the required full-name field can be saved. Keep last name optional to support people with a single name. The app splits the first word into first name and preserves the rest as last name.
- Profile photo selection is optional. The app uploads the selected image after email verification and before activating the session; upload failures offer retry or continue without a photo. Enable profile-image updates in your instance. The image-picker config changes require a new installed build.
- Enable **email verification code** as a sign-in method. Every fresh sign-in in this app checks the password, ends the provisional password session, then creates a new email-code attempt. Only a verified code attempt is activated.
- Disable social sign-in connections for this application's email-only account policy. The app contains no social buttons, OAuth provider, or callback route.
- Keep required MFA, organizations, legal-consent session tasks, and additional profile requirements disabled for this flow. Email device-trust challenges are supported. Other requirements produce a recoverable message and cannot open protected screens.

The password-then-email-code sequence is an app flow, not Clerk-enforced MFA: Clerk treats email codes as a first-factor method. If both factors must be enforced by the authentication service across all clients, configure a supported Clerk MFA policy and implement its supported second factor. Restoring an already verified saved session does not resend a code.

## Run and build

Install with `npm ci`, then start with `npx expo start`. Dependency versions were resolved through Expo SDK 57. The custom email/password and email-code flow can be tested in Expo Go; verify production behavior in installed builds too.

Before EAS builds, set the real owned iOS bundle identifier and Android package in app config, register the apps in Clerk, and configure your EAS project/build profiles. These identifiers are intentionally not invented here. Build with `npx eas-cli@latest build --profile development --platform ios` or `--platform android` after configuring that profile.

The app uses Clerk's SecureStore token cache on native platforms. Route access requires an active session with no outstanding tasks. Sign-out removes access and protected navigation history. Password confirmation never activates the provisional session; session cleanup must succeed before code delivery begins.

## Checks

Run `npm run lint`, `npm run typecheck`, and `npm run test:auth` (Node 24 supports the TypeScript test import). The unrelated `example/` starter is excluded from active-app lint/typechecking.

On both iOS and Android, test:

- Fresh launch signed out, sign-up, correct/wrong/expired verification code, resend cooldown, and changing email.
- Returning-user login must always show email confirmation after a correct password. Check incorrect passwords never send a code; check wrong/expired codes, resend, changing email, and device trust.
- Reset code, expired reset code, new-password rejection, successful reset, and returning to sign-in.
- Offline requests and retries, rapid repeated taps, small displays, keyboard scrolling, enlarged text, and screen-reader labels.
- Cold restart with a saved session, revoked/expired session, protected subscription deep links, sign-out, and Android Back after signing out.

Web authentication is outside this change's acceptance scope. The dashboard still uses subscription fixtures; this change does not add a subscription backend.

## Verification limits

Automated checks validate types, lint, validation, error handling, protected routing decisions, and provisional-session cleanup before code delivery. End-to-end account, email delivery, device, and dashboard checks require the configured external accounts and installed app builds; passing local checks alone does not establish production readiness.
