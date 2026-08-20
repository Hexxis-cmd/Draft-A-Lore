# Draft A Lore specification

## Scope

Draft A Lore is an offline-first writing and branching-adventure application. It has no account or server component. Project data is stored on the device; the only optional online feature is the font catalog described below.

## Repository layout

```text
README.md
docs/
  SPEC.md
  MOBILE-BUILD.md
src/
assets/
releases/
dist/        generated, ignored
www/         generated, ignored
```

`src/` contains the application modules. `assets/` contains the application artwork, manifest, and icons. `releases/` holds distribution files, including the Android APK and Windows installer script. `dist/` and `www/` are generated directories and are not sources of truth.

## Architecture

- The app is written in browser-native HTML, CSS, and JavaScript, without a UI framework.
- `src/core.js` owns application state, persistence, routing, menus, keyboard shortcuts, the application shell, and shared utilities.
- `src/views.js` renders the dashboard, projects, settings, library, reader, and project-level operations.
- `src/story-tools.js` renders writing tools and manuscript/story exports.
- `src/adventure-tools.js` renders branching-adventure tools, playtesting, and adventure exports.
- `src/interaction.js` owns pointer-based drag and drop: what may be dragged, what each zone accepts, and reordering inside a list.
- `src/assets-audio.js` owns the asset store (IndexedDB bytes, metadata in root state), object-URL lifecycle, audio playback, speech synthesis, and the asset inlining used by exports.
- `src/assets-ui.js` renders the asset library, the audio and narration panels, and resolves asset drops onto scenes, chapters, and audio slots.
- `src/library.js` renders the shelf and the reading experience for completed projects.
- `src/bundle.js` is a dependency-free ZIP writer and reader used for `.dalz` project bundles, the folder-sync fallback for browsers without the File System Access API. It decorates the existing folder-link and import actions rather than replacing them.
- `src/rpg-engine.js` holds every adventure rule as a DOM-free, storage-free module on `DAL.rpg`: the runtime state object, condition tests, effect application, movement between scenes, run-ending checks, plain-language descriptions, the authoring checkup, and the serialiser that embeds the same engine in an exported game.
- `src/styles.css` provides the design tokens, themes, layouts, responsive behavior, and accessibility motion reduction. Area stylesheets (`styles-story.css`, `styles-adventure.css`, `styles-assets.css`) hold component rules and are concatenated after it; every rule uses tokens so all ten themes stay correct.
- File order in `build.py` is significant: `interaction.js`, `assets-audio.js`, `assets-ui.js`, and `library.js` load last because they decorate `handleClick`, `afterRender`, and `renderPlaytest`.
- Event handling is delegated through `data-action` attributes. The current route is represented by view, project, tool, and selection variables.

## Build and distribution

`build.py` combines the app code and styles into `dist/DraftALore.html`, the desktop and browser distribution build, and copies it to `releases/`. `build-mobile.py` renders the same HTML into `www/` and mirrors `www/` into `android/app/src/main/assets/public/`, which is the directory Gradle actually packages. Doing the mirror in Python means `python3 build-mobile.py` is the only step needed before Gradle: `npx cap copy` produces the same result but requires Node 22 and a network install, and nothing else in this project needs Node.

Distribution targets are:

1. Desktop browser
2. Mobile browser
3. Android APK
4. Android App Bundle for Google Play

The Android package identifier is `com.draftalore.app`, `versionCode` 1, `versionName` 1.0. `compileSdk` and `targetSdk` are 35, `minSdk` is 24, and the Gradle wrapper is 8.11.1 on JDK 21.

### Release signing

`android/app/build.gradle` declares a release signing config that reads `keystore/keystore.properties` for the store path, alias, and passwords. The config is conditional: when the properties file or the keystore is absent the release build still completes unsigned instead of failing, so a fork can build without the private key. The keystore and its properties file are never committed — `.gitignore` excludes `*.p12`, `*.jks`, and `*.keystore` — and the signed artifacts are produced with:

```sh
python3 build-mobile.py
cd android && ./gradlew assembleRelease   # APK, for sideloading and GitHub releases
cd android && ./gradlew bundleRelease     # AAB, for Google Play
```

The release APK is verified with `apksigner verify --print-certs`; it signs under APK Signature Scheme v2, which is what `minSdk` 24 requires.

## Data model

The root state includes:

- `appTheme`, author profile fields, writing goals, project map and order
- `dashboardLayout` holding card order, hidden cards, and per-card size
- `wordHistory` holding words written per day, keyed by date
- custom fonts, sidebar state, and automatic-save preference
- `readerPrefs` holding the reading preferences shared by every reading surface: typeface, text size, line spacing, page tint, and whether drop capitals are shown. It is added by an additive migration, and the older `readerTheme` value is kept in step so saved data stays readable by either field
- `writerTools` holding the shared writing-tool state: the active sprint, find and replace options, typewriter mode, and `sprintWidget` (whether the floating sprint timer is shown, whether it is collapsed, and its last position)
- asset metadata per project; asset bytes never live in this key

`wordHistory` originally stored a cumulative total per day. Saved data is
migrated to per-day amounts on load, tracked by `DAL.HISTORY_VERSION`, and the
original cumulative snapshots are preserved under `wordHistoryCumulative`.

A project includes identity and status fields; an optional `goal` with a word target and deadline; manuscript chapters; characters and relationships; plot threads; lore folders and entries; illustration records; a mind map; cover settings; an optional adventure; saved versions; and structural undo history.

An adventure includes a start node, story nodes, choices, entry and choice effects, stats, traits, items, and story rules. Each story node carries its position, text, images, choices, its kind (a normal scene or an ending), and an optional ending name. Story rules hold how unmet choices are presented and a list of run-ending rules, each watching one stat with a comparison, a title, and a closing line. Stats carry an optional minimum and maximum that clamp every change. Items carry stackability with an optional stack limit and an optional equipment slot. Images and imported fonts are retained as local data URLs in project state.

The runtime state a playthrough evaluates against holds stat values, trait states, inventory counts, equipped items by slot, flags, visit counts per scene, the current scene, the ending reached if any, a step number, and a log of what each step changed. Every state field defaults safely when absent, so older saved projects load unchanged.

## Themes

`DAL.THEMES` in `src/core.js` is the single registry behind both the Settings
picker and the View ▸ Theme menu. Each entry pairs a stored id with a display
name and description; the matching palette lives in `src/styles.css`. Stored ids
are stable, so the first five names below differ from their ids.

| # | Name | Stored id | Character |
|---|------|-----------|-----------|
| 1 | Aurora | `aurora` | Default. Midnight purple lit by pink and indigo |
| 2 | Midnight Ink | `dark` | Cool slate with candlelit gold |
| 3 | Daylight | `light` | Warm grey paper with a deep bronze accent |
| 4 | Emberhold | `fantasy-dark` | Forest hall with brass and old burgundy |
| 5 | Gilded Vellum | `fantasy-light` | Aged vellum with sage and faded rose |
| 6 | Nebula | `nebula` | Deep-sea blue with cyan and mint |
| 7 | Ember | `ember` | Charred bark, orange fire, pale ash |
| 8 | Sakura | `sakura` | Pale blossom with plum and orchid |
| 9 | Moss | `moss` | Pale stone, moss green, still water |
| 10 | Slate | `slate` | High-contrast graphite with electric blue |

Six are dark and four are light. Every palette was checked for contrast: body
text clears 10:1 on both the page and panel backgrounds, muted text and the
status and accent colours clear 4.5:1 against the surface they sit on, and each
stop of a theme's gradient clears 3:1 against its page background.

Palettes are declared as raw `--p-<id>-*` values once, then referenced by both
the theme block and its Settings swatch, so the picker cannot drift from the
theme it previews. Theme blocks are scoped to the root element, which keeps a
preview card or menu item that carries `data-theme` from rebinding tokens for
its own subtree. An unrecognized saved id falls back to the default.

The default state is `appTheme: 'aurora'`.

## Feature inventory

### Application and projects

- Dashboard with recent project access, writing totals, goals, streak, activity, and author profile
- Dashboard organize mode: reorder cards, set half or full width, set normal or tall height, hide and restore cards, and reset to the default arrangement. `DAL.DASHBOARD_CARDS` is the registry; cards whose content cannot survive a narrow column are always full width
- Writing analytics over 7 days, 30 days, 12 weeks, or 12 months, drawn as hand-built SVG from per-day word history, with a daily activity map and current and longest streaks
- Per-project word targets with optional deadlines, surfaced together on a Project Goals card
- Project types: novel, branching adventure, and dual project
- Project import, project backup and restore, status tracking, two-step deletion, and project settings
- Save As creates an independent project copy with fresh identity, timestamps, history, versions, and folder connection
- Completed and published projects appear in the library reader
- Responsive navigation includes a mobile tab bar and adaptive workspace layout

### Writing tools

The story workspace has ten tools:

1. Overview
2. Manuscript
3. Characters
4. Relationship Map
5. Plot Threads
6. Lore Notebook
7. Illustrations
8. Mind Map
9. Book Preview
10. Export

The manuscript editor supports formatted HTML content, per-chapter word counts, distraction-free mode, and system, imported, or optional online fonts. Chapters reorder by dragging their handle, and each chapter carries up to two illustrations.

A writing sprint runs for a chosen number of minutes against an optional word target and follows the manuscript word count wherever the writer navigates. While a sprint is running it appears in a floating timer rather than a dialog, so writing is never blocked: the timer can be shown or hidden, collapsed to its title strip, and dragged anywhere on screen, and it remembers where it was left. It is clamped back into view on resize, survives every re-render, and is reachable from Writer tools and the Tools menu. Only the closing summary takes the screen.

Reading preferences apply everywhere a book is read — Book Preview, the library reader, and the adventure player. The reader offers six typefaces (serif, old-style serif, sans, humanist sans, monospace, and a dyslexia-friendly stack, all built from fonts the device already has so they work offline), five text sizes, three line spacings, four page tints (parchment, paper, night, sepia), and a drop-capital toggle. The controls are built once and reused by all three surfaces, so they cannot drift apart. Changing a preference repaints the reading shell in place, so the current page, scroll position, and any narration in progress survive. On phone-width screens the four selectors collapse into an "Aa" button that opens the same controls as a labelled sheet, which keeps the toolbar one row tall instead of a quarter of the screen. Preferences persist per device.

Drop capitals are scoped to the first paragraph of chapter prose, not to whatever paragraph happens to come first on a page, so the table of contents is never drop-capped.

Any manuscript page can be read aloud through the device's speech synthesis, from both Book Preview and the library reader. Read-aloud reads the page's prose only — page numbers, captions, and controls are skipped — and stops automatically when the reader turns the page, jumps, or leaves.

Characters, lore, plot threads, and relationships can be linked. The illustrations library stores project images for covers, chapters, character portraits, item icons, and scenes. Mind Map nodes can be added, connected, renamed, dragged, and deleted.

`DAL.exportGroups` is the single registry of everything a project can produce,
grouped by what is being exported: the whole project as JSON, the manuscript as
TXT, Markdown, or HTML, a single chapter as TXT or Markdown, the adventure as
Twee source or playable HTML, and a single scene as text. The story Export tab,
the adventure Export tab, and the export dialog all render from it, so the three
never disagree. The File menu separates exports of the open project from
whole-workspace backup and restore. Characters, lore entries, and plot threads
can be copied between projects.

### Adventure tools

- Story Graph for scenes, choices, conditions, entry effects, and choice effects, on a 2600×1700 board with pan, nine zoom steps from 40% to 200%, a sticky grab tool for dragging the canvas, and a saved per-project view
- Scenes are normal or endings; an ending carries its own name and stops the run on arrival
- Conditions on stats, traits, item possession and quantity, a worn item, a filled or empty gear slot, flags, and scenes already visited, combined with all-of or any-of, chosen from pickers built from the project's own definitions
- Effects that set, raise, or lower a clamped stat, grant, remove, or flip a trait, give or take items within stack limits, equip or unequip, set or clear flags, redirect to another scene, or end the run as an ending or a failure — each shown in plain language
- Stats with an optional minimum and maximum, and traits as yes/no flags
- Items with stackability, stack limits, equipment slots, symbols, and optional images
- Run-ending rules that stop a run when a stat crosses a line, with an author-written title and closing line
- Playtest with stat bars and change amounts, inventory with a working equip control, equipped slots, flags, a per-step change log, locked choices that name their unmet requirement, restart, step back, history, scene jump, and book or terminal presentation
- A story-wide setting for whether unmet choices appear locked or hidden, overridable per choice
- A story checkup that reports unreachable scenes, choices leading nowhere, requirements that can never be met, and references to deleted stats, traits, items, flags, or scenes
- Adventure exports as Twee source, standalone playable HTML, project JSON, and scene text, through the shared export registry. The playable HTML embeds the same engine the playtest runs. Every asset the story references is read out of IndexedDB and inlined into the exported file, so exported artwork and audio work on any machine with no origin, no session, and no network; an exported game with audio or narration carries its own sound toggle, ambient loops carry across scenes, and a voice clip that cannot play falls back to spoken narration. The export reports how many assets were embedded, how large they were, and names anything that could not be read. The Twine export carries stats, traits, items, and gated links, and lists what SugarCube cannot express in a "Not Carried Over" passage

### Assets, audio, and narration

Each project has an asset library with three standard folders: Illustrations, Sounds, and SVGs. Imports route by MIME type with an extension fallback, and unsupported files are refused. Asset bytes are held in IndexedDB and exposed as object URLs; only metadata is written to browser storage. SVG files at or under 64 KB are stored inline as text. Deleting an asset unbinds it from every scene, chapter, and audio slot that referenced it.

Audio is bound per scene as an ambient loop or a voice-over clip, with independent volumes. Where no voice clip is bound, scene narration can be spoken by the device's speech synthesis at an author-chosen rate and pitch.

### Drag and drop

Dragging is pointer-based, so it behaves the same with a mouse, a pen, or a finger. Chapters and scene cards reorder inside their lists. Assets can be dragged from the library onto a scene, onto a chapter's illustration strip, or onto a scene's ambient or voice slot; the drop target is chosen by what is being dragged rather than by the zone alone, and artwork dropped on an audio slot is refused with an explanation instead of being silently bound. Valid targets are outlined while a drag is in progress.

## Storage and persistence

The application serializes root state under the `draftALore` browser-storage key. If browser storage cannot be used, it falls back to memory for the current session. No project data is sent to an application server.

Automatic saves are debounced by 450 ms. Project actions save immediately. When automatic saving is off, pending work is written before the page or app closes. The settings screen also provides manual save, full-workspace backup and restore, and clear-data controls.

Structural undo history retains up to 40 project snapshots. Version snapshots are created after changed word counts at ten-minute intervals and are capped at 25 per project; users can also save and restore a version manually.

A supported browser can link a project folder through the File System Access API. Each completed save writes `project.json` plus available chapter, character, lore, and plot text files. The directory handle is retained only for the active session and must be authorized again after restart.

Firefox and iOS Safari have no File System Access API, so those browsers get the same content as a single `.dalz` project bundle instead of a folder. A bundle is an ordinary ZIP archive holding `project.json`, `chapters/*.txt`, `characters/`, `lore/`, `plots/`, and `Assets/{Illustrations,Sounds,SVGs}/` with the asset bytes, written by `src/bundle.js` with no library: it emits stored (uncompressed) entries with real CRC-32 values and a correct end-of-central-directory record, and reads both stored and deflated entries, using `DecompressionStream('deflate-raw')` for the latter. Importing a bundle restores assets through the same IndexedDB path as any other import. The actions are Save Bundle, Export Bundle, and Import Bundle; where folder linking is available it still works unchanged.

## Fonts and network behavior

The app remains usable offline with system fonts and locally imported fonts. When `navigator.onLine` is true, it loads one stylesheet for eight optional font families: Cinzel, EB Garamond, Crimson Pro, Lora, Spectral, Newsreader, Cormorant, and Spline Sans. The font link is removed when the device goes offline; an unavailable selected font falls back to a system serif.

Apart from the optional online font catalog, application code, project data, and user-provided assets are local to the device.
