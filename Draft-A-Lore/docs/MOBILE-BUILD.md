# Android build

Draft A Lore packages its locally staged web runtime in an Android application. Build locally; the repository does not generate Android artifacts in a hosted build step.

## Requirements

- Python 3
- JDK 21 — Android Gradle Plugin 8.7.2 requires it, and a newer JRE without a compiler will fail with `does not provide the required capabilities: [JAVA_COMPILER]`
- Android SDK with the API 35 platform, platform tools, and build tools 35.0.0

Node.js is **not** required. `build-mobile.py` stages the web app into `www/` and mirrors it into `android/app/src/main/assets/public/`, which is the directory Gradle packages — the job `npx cap copy android` would otherwise do.

```bash
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/android-sdk
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0:$PATH"
```

If Gradle cannot find the SDK, create `android/local.properties` locally (it is gitignored):

```bash
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
```

## Signing configuration

`android/app/build.gradle` reads `keystore/keystore.properties`:

```properties
storeFile=../keystore/draft-a-lore-release.p12
storePassword=…
keyAlias=draftalore
keyPassword=…
```

The release signing config is conditional. With the properties file and keystore present, `assembleRelease` and `bundleRelease` produce signed artifacts with no extra commands. With either missing, the release build still completes — unsigned — so a fork can build without the private key.

The keystore and its properties file are gitignored (`keystore/*.p12`, `keystore/*.jks`, `keystore/keystore.properties`) and must never be committed or included in a source archive.

To create a fresh key:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore keystore/draft-a-lore-release.p12 \
  -alias draftalore -keyalg RSA -keysize 4096 -validity 10000
```

## Build

```bash
python3 build-mobile.py
cd android && ./gradlew assembleRelease --no-daemon   # APK  → app/build/outputs/apk/release/app-release.apk
cd android && ./gradlew bundleRelease   --no-daemon   # AAB  → app/build/outputs/bundle/release/app-release.aab
```

Copy the artifacts to the distribution folder:

```bash
cp android/app/build/outputs/apk/release/app-release.apk releases/DraftALore.apk
cp android/app/build/outputs/bundle/release/app-release.aab releases/DraftALore.aab
```

A debug build for quick device testing:

```bash
python3 build-mobile.py
cd android && ./gradlew assembleDebug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Verify before shipping

A successful Gradle run is not proof the app is inside the package. Check both the signature and the payload:

```bash
apksigner verify --print-certs --verbose releases/DraftALore.apk

python3 - <<'PY'
import zipfile
z = zipfile.ZipFile('releases/DraftALore.apk')
html = z.read('assets/public/index.html').decode('utf-8')
print(len(html), 'characters of app HTML')
print(len([n for n in z.namelist() if n.startswith('assets/public/icons')]), 'icons')
PY
```

`assets/public/index.html` must be present and roughly 1.4 MB. An APK missing it installs and opens an empty WebView. Expect APK Signature Scheme v2 to verify; v1 is not needed at `minSdk` 24.

## Installing the APK directly

Copy `releases/DraftALore.apk` to the device and open it; Android will ask for permission to install from that source. With USB debugging enabled, `adb install -r releases/DraftALore.apk` does the same.

Do not commit the signing key, its passwords, `node_modules/`, Gradle caches, Android build directories, or `www/`.
