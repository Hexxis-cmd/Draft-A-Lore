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


In laments terms.

Draft A Lore is an offline-first writing application for manuscripts, story planning, and
branching adventures. It has no account, no server, and no telemetry. Your work is stored on your
own device.

Downloads
DraftALore.html — the entire application in one file. Save it anywhere and open it in a
browser. No installer, no internet connection required after the download.

DraftALore.apk — Android build for direct installation. Debug-signed, so Android will warn
about an unknown source; allow the installation if you trust this download.

Install-DraftALore.bat — optional Windows helper that copies the app to your user folder and
creates a desktop shortcut.

Writing
Manuscript editor with chapters, word counts, targets, and a distraction-free mode

Characters with relationships, plot threads, lore folders, and a mind map

A dashboard with word output over 7 days, 30 days, 12 weeks, or 12 months, and writing goals

Library and reader views, cover settings, and a book preview

Export to TXT, Markdown, HTML, or a single chapter

Branching adventures
Story graph with pan, nine zoom levels, and a grab tool for moving the canvas

Stats with minimums and maximums, traits, and items with stack limits and equipment slots

Choice requirements built from your own stats, traits, items, flags, and visited scenes

Effects that change stats, traits, inventory, equipment, and flags, or redirect and end a run

Endings, and run-ending rules that stop a run when a stat crosses a line you set

A playthrough mode showing stat bars, what each choice changed, and why a choice is locked

A story checkup that finds unreachable scenes, dead links, impossible requirements, and
references to anything you deleted

Export a standalone playable file that runs by the same rules, or Twine source

Your data
Projects live in your browser's local storage. Nothing is uploaded. Export or use folder sync to
keep your own copies, and remember that clearing your browser's site data clears the projects with
it.

License
Free for noncommercial use under PolyForm Noncommercial 1.0.0, with supplemental terms in
LICENSE.md. Commercial use requires a license; see COMMERCIAL-LICENSE.md.

### Android APK

Install `releases/DraftALore.apk` on an Android device. To build the APK locally, follow [docs/MOBILE-BUILD.md](docs/MOBILE-BUILD.md).

## License

Draft A Lore is available for noncommercial use under the terms in [LICENSE.md](LICENSE.md). Commercial use requires a separate agreement; see [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).
