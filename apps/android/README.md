# @titan/android

The native Android client: everything the web app does, plus a daily 7 AM
weigh-in reminder and an ongoing workout notification with its timers. Kotlin
and Jetpack Compose against `apps/web`'s `/api/v1` endpoints; it logs offline
and syncs when back online.

## Layout

| Module | Contents |
|---|---|
| `core/` | Pure JVM, unit-tested: wire models, text/number formatting (ports of the web's), the workout state machine and timers, the API client, the outbox + sync engine, PKCE, reminder scheduling, the color palette |
| `app/` | The Android app: Compose UI (`ui/`), the `WorkoutController` and foreground `WorkoutService` (`workout/`), the reminder alarm (`reminder/`), cache and sync (`data/`) |
| `scripts/` | `bun run generate`: regenerates `TitanPalettes.kt` from the Panda preset and the Phosphor icon drawables |

## Build and test

Requires JDK 17+ and, for `:app`, the Android SDK (platform 37) via
`ANDROID_HOME` or `local.properties`.

```sh
./gradlew ktlintCheck :core:test     # what `turbo test` runs (no SDK needed: -Ptitan.coreOnly=true)
./gradlew :app:assembleDebug         # app/build/outputs/apk/debug/app-debug.apk
```

CI (`.github/workflows/android.yml`) builds a signed release APK on every PR,
and on `main` publishes it as a GitHub Release (`android-1.0.<run>`).

## Signing

Release builds read `TITAN_KEYSTORE`, `TITAN_KEYSTORE_PASSWORD` and
`TITAN_KEY_ALIAS`. CI fills them from the `TITAN_KEYSTORE_BASE64`,
`TITAN_KEYSTORE_PASSWORD` and `TITAN_KEY_ALIAS` repository secrets, or, without
them, from a keystore it generates once and keeps in the Actions cache. Updates
only install over a build signed with the same key, so set the secrets for a
key that never expires out of the cache. Without any keystore, release builds
fall back to the debug key.

## Sign-in

The app signs in with a Google account on the device (Credential Manager) and
trades the ID token at `/api/v1/auth/app/google`. Google only issues that token
to an app it knows, so the server's Google Cloud project needs an **Android**
OAuth client for package `net.prussin.titan` with the release key's SHA-1
(`keytool -list -v -keystore titan.jks -alias titan`). Without one, the app
falls back to signing in through the browser.

## Install

Download `titan.apk` from the latest `android-*` release on the phone, allow
installs from the browser, and open it. On first launch, sign in with Google
(the server field defaults to `https://titan.prussin.net`), then allow
notifications.
