# Draft A Lore

Draft A Lore is an offline-first writing app for manuscripts, story planning, and branching adventures. It runs in a desktop browser, a mobile browser, or as an Android APK, and stores work on the device.

## Download

If you only want to use the app, take a file from the
[latest release](https://github.com/Hexxis-cmd/Draft-A-Lore/releases/latest) — no source code
needed:

- [DraftALore.html](https://github.com/Hexxis-cmd/Draft-A-Lore/releases/latest/download/DraftALore.html)
  — the entire app in one file. Save it and open it in any browser.
- [DraftALore.apk](https://github.com/Hexxis-cmd/Draft-A-Lore/releases/latest/download/DraftALore.apk)
  — Android build for direct installation.

Building from source is only necessary to develop the app; see Run it below.

## Features

- Manuscripts, characters, relationships, plot threads, lore, and mind maps
- Illustration library with cover, chapter, character, item, and scene images
- Branching-story graph with pan, zoom, and a grab tool
- Working adventure rules: stats with limits, traits, items with stack limits and gear slots, conditions on any of them, effects that change them, endings and run-ending rules
- Playthrough mode that shows stat bars, inventory, equipped gear, what each choice changed, and why a choice is locked
- A story checkup that finds unreachable scenes, dead links, impossible requirements, and references to things you deleted
- Adventure exports: a standalone playable file that runs the same rules, plus Twine source
- A dashboard you arrange yourself: reorder cards, set each one half or full width, choose its height, or hide it
- Writing analytics over 7 days, 30 days, 12 weeks, or 12 months, with a daily activity map and streaks
- Workspace-wide writing goals plus per-project word targets and deadlines
- Project backups, exports, version snapshots, and Save As project branching
- A reader you set up your own way: six typefaces including a dyslexia-friendly one, five text sizes, three line spacings, four page tints, and optional drop capitals — the same settings in Book Preview, the library reader, and the adventure player
- Read any page aloud with the device's own voice
- Keep a project in a folder on disk where that works, or save it as a single `.dalz` bundle in browsers that cannot open folders (Firefox, iOS Safari)
- Ten themes, six dark and four light, including the default Aurora
- Responsive desktop and mobile navigation; optional online font catalog

## Run it

### Desktop web

```bash
python3 build.py
```

Open `dist/DraftALore.html` in a modern desktop browser.

### Mobile web

Build the app as above, place `dist/DraftALore.html` where the mobile browser can open it, and open it on the device. The interface adapts for narrow screens.

### Android APK

Install `releases/DraftALore.apk` on an Android device. `releases/DraftALore.aab` is the Google Play upload of the same build.

To build both locally you need JDK 21 and the Android SDK (platform 35, build-tools 35.0.0):

```bash
python3 build-mobile.py
cd android && ./gradlew assembleRelease   # APK
cd android && ./gradlew bundleRelease     # AAB
```

`build-mobile.py` stages the web app into both `www/` and the directory Gradle packages, so no Node or Capacitor CLI step is needed. Release builds are signed when `keystore/keystore.properties` and its keystore are present, and complete unsigned when they are not — the signing key is never committed. See [docs/MOBILE-BUILD.md](docs/MOBILE-BUILD.md) and [docs/RELEASING.md](docs/RELEASING.md).

## License

Draft A Lore is available for noncommercial use under the terms in [LICENSE.md](LICENSE.md). Commercial use of the app itself requires a separate agreement; see [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).

What you write with it is yours. Selling a novel, adventure, or campaign you created in Draft A Lore needs no permission, royalty, or credit.
