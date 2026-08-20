# Android build

Draft A Lore packages its locally staged web runtime in an Android application. Build the APK locally; the repository does not generate an APK in a hosted build step.

## Requirements

Install:

- Node.js 22 or later and npm 10 or later
- Python 3
- JDK 21
- Android SDK command-line tools, platform tools, API 35 platform files, and build tools 35.0.0

Android Gradle Plugin 8.7.2 requires JDK 21. Set the SDK and JDK locations before building:

```bash
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/android-sdk
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

If Gradle cannot find the SDK, create `android/local.properties` locally:

```bash
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
```

## Build a debug APK

From the repository root:

```bash
npm install
npm run build-android-debug
mkdir -p releases
cp android/app/build/outputs/apk/debug/app-debug.apk releases/DraftALore.apk
```

`build-android-debug` runs `build-mobile.py`, synchronizes `www/` into the Android project, and runs `assembleDebug`. The staged `www/` directory is generated; do not edit it.

The debug APK produced by Gradle is `android/app/build/outputs/apk/debug/app-debug.apk`. The optional copy in `releases/DraftALore.apk` is the file to distribute for direct installation.

Equivalent steps are available when needed:

```bash
npm run stage-mobile
npm run sync-android
(cd android && ./gradlew assembleDebug)
```

## Install a debug APK

Copy `releases/DraftALore.apk` to the Android device and install it with the device installer. The device may require permission for the app opening the APK to install unknown apps.

With USB debugging enabled:

```bash
adb install -r releases/DraftALore.apk
```

The debug APK uses the standard debug signing key and is intended for local testing and direct installation.

## Build and sign a release APK

Create and protect a signing key locally:

```bash
keytool -genkeypair -v -keystore draftalore-release.keystore \
  -alias draftalore -keyalg RSA -keysize 4096 -validity 10000
```

Build, align, sign, and verify the release APK:

```bash
(cd android && ./gradlew assembleRelease)
"$ANDROID_HOME/build-tools/35.0.0/zipalign" -p -f 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  releases/DraftALore-release-aligned.apk
"$ANDROID_HOME/build-tools/35.0.0/apksigner" sign \
  --ks draftalore-release.keystore --ks-key-alias draftalore \
  --out releases/DraftALore-release.apk releases/DraftALore-release-aligned.apk
"$ANDROID_HOME/build-tools/35.0.0/apksigner" verify --verbose \
  releases/DraftALore-release.apk
```

Do not commit the signing key, passwords, `node_modules/`, Gradle caches, Android build directories, `www/`, or locally generated APKs unless a release artifact is intentionally retained.
