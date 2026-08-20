# Draft A Lore

Draft A Lore is an offline-first writing app for manuscripts, story planning, and branching adventures. It runs in a desktop browser, a mobile browser, or as an Android APK, and stores work on the device.

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

Install `releases/DraftALore.apk` on an Android device. To build the APK locally, follow [docs/MOBILE-BUILD.md](docs/MOBILE-BUILD.md).

## License

Draft A Lore is available for noncommercial use under the terms in [LICENSE.md](LICENSE.md). Commercial use requires a separate agreement; see [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).
