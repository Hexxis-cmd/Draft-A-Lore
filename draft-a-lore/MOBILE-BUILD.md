# Draft A Lore Android build

This project packages the existing offline web app in a Capacitor Android
WebView. Its Android application id is `com.draftalore.app`; its launcher label
is **Draft A Lore**.

## Required tooling

- Node.js 22 or later (the installed Capacitor CLI 8.5.0 requires it)
- npm 10 or later
- Python 3
- JDK 21
- Android SDK command-line tools, `platform-tools`, `platforms;android-35`, and
  `build-tools;35.0.0`

The Project uses Android Gradle Plugin 8.7.2 / Gradle 8.11.1, has
`minSdkVersion` 24, and targets/compiles Android API 35.

Set the SDK and JDK environment before building:

```bash
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/android-sdk
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Create `android/local.properties` locally if Gradle cannot find the SDK:

```bash
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
```

## Build a debug APK

From this directory:

```bash
npm install
python3 build-mobile.py
npx cap sync android
(cd android && ./gradlew assembleDebug)
cp android/app/build/outputs/apk/debug/app-debug.apk DraftALore.apk
```

`build-mobile.py` stages only the runtime HTML, CSS, JavaScript, local images,
and icon assets into `www/`. It also removes the hosted Google Fonts links from
the staged HTML so the packaged app remains offline; the CSS fallback font
stack is used instead. `www/` is a generated directory and should not be
edited.

The final debug APK is `DraftALore.apk` at the project root. Gradle's original
debug output is `android/app/build/outputs/apk/debug/app-debug.apk`.

Convenience equivalents are available after `npm install`:

```bash
npm run stage-mobile
npm run sync-android
npm run build-android-debug
```

To work in Android Studio instead, first run the staging and sync commands,
then use:

```bash
npx cap open android
```

## Install the debug APK

Copy `DraftALore.apk` to the Android device. In the Android settings, allow the
app used to open the file to install unknown apps, then open the APK and follow
the installer. With USB debugging enabled, the equivalent command is:

```bash
adb install -r DraftALore.apk
```

The debug APK is signed with the standard debug key and is suitable for direct
sideloading, not Play Store publication.

## Sign a release APK

`assembleRelease` produces
`android/app/build/outputs/apk/release/app-release-unsigned.apk`. Create a
private signing key once and keep its password and file secure:

```bash
keytool -genkeypair -v -keystore draftalore-release.keystore \
  -alias draftalore -keyalg RSA -keysize 4096 -validity 10000
```

Build, align, sign, and verify an installable release APK:

```bash
(cd android && ./gradlew assembleRelease)
"$ANDROID_HOME/build-tools/35.0.0/zipalign" -p -f 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  DraftALore-release-aligned.apk
"$ANDROID_HOME/build-tools/35.0.0/apksigner" sign \
  --ks draftalore-release.keystore --ks-key-alias draftalore \
  --out DraftALore-release.apk DraftALore-release-aligned.apk
"$ANDROID_HOME/build-tools/35.0.0/apksigner" verify --verbose \
  DraftALore-release.apk
```

Do not commit the keystore, passwords, `node_modules/`, `www/`, Android build
directories, Gradle caches, or generated APKs unless a particular distribution
APK is intentionally being retained. They are build outputs or local tooling
and can be large.

## Offline and icon behavior

The Android manifest does not request `INTERNET` permission and explicitly
disallows cleartext traffic. `MainActivity` permits local file/content access
and DOM/database storage for the bundled app. The supplied artwork under
`icons/android/mipmap-*` is copied into the matching Android resource
directories; adaptive launcher icons use the supplied foreground artwork and
the `#0F1116` background color.
