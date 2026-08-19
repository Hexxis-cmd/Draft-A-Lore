[README.md](https://github.com/user-attachments/files/31203999/README.md)
# Draft A Lore

**A single-file, offline-first writing studio and RPG adventure designer.**

Draft A Lore combines a manuscript editor, character and lore databases, a relationship
map, a mind map, a branching-narrative story graph, and an RPG playtest engine into one
self-contained `index.html`. No server, no accounts, no build step required to run it, no
network calls at runtime. Everything lives in the browser's `localStorage`, with optional
live folder sync to disk.

- **Author:** Daymien Vanhorn — [github.com/Hexxis-cmd](https://github.com/Hexxis-cmd)
- **Repository:** [github.com/Hexxis-cmd/Draft-A-Lore](https://github.com/Hexxis-cmd/Draft-A-Lore)
- **App id (Android):** `com.draftalore.app` · **Version:** 1.0.0
- **Stack:** vanilla HTML/CSS/JS (ES6+), zero runtime dependencies

---

## Quick start

### 1. Just run it (any platform)

Open `index.html` in a modern browser. That's it. The built file is fully self-contained
(all CSS and JS are inlined), so it also works from a USB stick or a plain static host.

Keep `index.html` next to `logo.png`, `favicon.ico`, `manifest.webmanifest` and `icons/`
if you want the sidebar logo, tab icon and installable-PWA behavior.

### 2. Windows desktop install

Double-click **`Install-DraftALore.bat`**. It asks two yes/no questions:

- Create a Desktop shortcut?
- Add it to the Start Menu?

It creates `Draft A Lore.lnk` using `favicon.ico` as the icon, and launches the app in
**app mode** (no browser chrome) via the first available Chromium browser it finds —
Edge, Chrome, Brave or Vivaldi — with `--app="file:///…/index.html" --window-size=1400,900`.
If none is found, it falls back to opening `index.html` with the system default browser.
Start Menu entries go to `%APPDATA%\Microsoft\Windows\Start Menu\Programs`.

Nothing is installed system-wide and no registry keys are written: delete the shortcuts
and the folder to uninstall.

### 3. Android

Copy **`DraftALore.apk`** to the device and install it (enable "install unknown apps" for
your file manager first). It is a **debug-signed** APK — fine for personal sideloading, not
for the Play Store. For a store build, see `MOBILE-BUILD.md` and sign a release variant.

### 4. Install as a PWA

`manifest.webmanifest` declares standalone display, theme color `#0F1116`, and the full
icon set (including maskable and monochrome). Serve the folder over http(s) and use your
browser's "Install app" action.

---

## Feature summary

### Shell
Collapsible left sidebar (Dashboard / Projects / Settings), top bar with view title, global
project-scoped search, undo/redo and a save-status indicator, toast layer, tooltip layer,
modal layer. Every panel, drawer, modal and detail view has an explicit Close/Back control.

### Themes
Five: `dark` (default), `light`, `fantasy-dark`, `fantasy-light`, `aurora`. Applied via a
`data-theme` attribute on the root element; all colors come from CSS custom properties, so
adding a sixth theme is one block of variables.

### Dashboard
Continue-writing banner, author profile, global word analytics (manuscript vs
supplementary), daily/weekly/monthly/6-month/yearly goals with progress bars, writing
streak.

### Projects
Card grid with type and status badges, word counts, cover thumbnails; create modal
(Novel / RPG Adventure / Dual), JSON import, two-step delete, status flow
In Development → Drafting → Proofreading → Completed → Published.

### Story tools (per project)
Overview · Manuscript (chapter list with reorder, rich-text editor, distraction-free mode,
folder sync) · Characters (portraits, custom fields, tags) · Relationship Map ·
Plot Threads (with stale-thread warnings) · Lore Notebook (folders, categories, cross-links)
· Illustrations · Mind Map (draggable nodes, SVG edges, connect mode) · Book Preview
(3D page turn, reader themes) · Project Export (JSON, TXT, Markdown, HTML, folder tree).

### Adventure tools (per project)
Story Graph (node canvas with zoom/pan, entry effects, conditional choices) ·
Stats & Traits · Items & Inventory · Playthrough playtester (condition-filtered choices,
state inspector, step-back, history trail, Book Page / Terminal styles) ·
Export to Twee 3, standalone playable HTML, or JSON.

### Persistence
`localStorage` key `draftALore`, autosave debounced to 450 ms, auto version snapshots every
10 minutes when the word count changed (25 kept per project), per-project structural
undo/redo stacks (40 steps). Chrome/Edge can live-sync a project to a real folder through
the File System Access API (`project.json`, `chapters/`, `characters/`, `lore/`, `plots/`,
`exports/`); other browsers get a download fallback.

### Adaptive layout
One codebase for 720p phones through 4K monitors and arbitrary resized windows — see
[Responsive system](#responsive-system).

---

## File key

Everything in the repository root, and what to touch when.

| Path | What it is | Edit it? |
|---|---|---|
| `index.html` | **Generated build.** The shippable single-file app: all CSS/JS inlined. 262 KB. | No — regenerate with `build.py` |
| `src/core.js` | State, storage, routing/render loop, shell, themes, undo/redo, versions, folder sync, adaptive-viewport engine. 776 lines. | **Yes** |
| `src/views.js` | Dashboard, Projects hub, Library, Settings, modals. 688 lines. | **Yes** |
| `src/story-tools.js` | Workspace shell + all novel-side tools (overview, manuscript, characters, relationship map, plots, lore, illustrations, mind map, book preview, export). 1,525 lines. | **Yes** |
| `src/adventure-tools.js` | RPG side: story graph, stats & traits, items, playtest engine, Twee/HTML export. 1,071 lines. | **Yes** |
| `src/styles.css` | All styling: theme variables, components, animations, and the adaptive-layout section. 894 lines. | **Yes** |
| `styles.css`, `core.js`, `views.js`, `story-tools.js`, `adventure-tools.js` (root) | Root mirrors of `src/`, kept for linked-file development and for the mobile bundle. | Only via copy from `src/` |
| `build.py` | Inlines the five source files into `index.html` and writes the `<head>` (meta, icons, manifest, fonts, default theme). Escapes `</script`/`</style` inside JS strings. | Rarely |
| `build-mobile.py` | Stages `www/` for Capacitor: copies the runtime files plus `icons/`, strips the hosted Google Fonts `<link>`s so the packaged app is fully offline. | Rarely |
| `Install-DraftALore.bat` | Windows installer/shortcut creator (batch + embedded PowerShell after the `#PS_START` marker). 165 lines. | Yes |
| `DraftALore.apk` | Debug-signed Android build of the current `index.html`. 5.9 MB. | Generated |
| `android/` | Capacitor Android project (Gradle 8.11.1 / AGP 8.7.2, minSdk 24, target 35). Launcher icons live in `android/app/src/main/res/mipmap-*`. | Only for native changes |
| `capacitor.config.json`, `package.json`, `package-lock.json` | Capacitor config and build-time npm deps (`@capacitor/core`, `cli`, `android`). `webDir` is `www`. | Rarely |
| `manifest.webmanifest` | PWA manifest: standalone, theme/background `#0F1116`, full icon list incl. maskable + monochrome. | Yes |
| `favicon.ico` | Multi-resolution ICO (16/24/32/48/64/128/256) used by tabs and the Windows shortcut. | Generated |
| `icons/` | `icon-16…1024.png`, `apple-touch-icon.png`, `maskable-192/512.png`, `icon-transparent-512.png`, `icon-accent-512.png`, `draft-a-lore.ico`, and `icons/android/mipmap-*/ic_launcher{,_round,_foreground}.png` + `playstore-icon-512.png`. | Generated |
| `logo.png` / `logo.jpg` | Source artwork (500×500 white line-art on transparency). All icons are composited from this onto the dark app background so they read on light and dark OS themes. | Yes (then regenerate icons) |
| `SPEC.md` | Original product specification. | Yes |
| `MOBILE-BUILD.md` | Full Android toolchain + build/signing instructions. | Yes |
| `README.md` | This file. | Yes |

Generated or transient paths that should stay out of version control:
`node_modules/`, `www/`, `android/build/`, `android/app/build/`, `android/.gradle/`,
`android/capacitor-cordova-android-plugins/build/`, `android/local.properties`.

---

## Development workflow

```bash
# 1. edit the real sources
$EDITOR src/styles.css src/core.js src/views.js src/story-tools.js src/adventure-tools.js

# 2. mirror them to the root (the linked-file dev copy + mobile bundle input)
cp src/{styles.css,core.js,views.js,story-tools.js,adventure-tools.js} .

# 3. regenerate the single-file build
python3 build.py          # -> index.html

# 4. open index.html and test
```

**Never hand-edit `index.html`** — `build.py` overwrites it. Load order matters:
`core.js` → `views.js` → `story-tools.js` → `adventure-tools.js`, all attaching to the
global `DAL` namespace.

### Architecture in one paragraph

A single global object `DAL` holds `DAL.state` (the whole workspace), route variables
(`currentView`, `currentProjectId`, `currentTool`, selected ids), and every render
function. `DAL.render()` rebuilds the shell and the active view into `#content` from state;
all interaction happens through event delegation on `data-action` attributes, handled by
`DAL.handleClick`, `DAL.handleStoryClick`, `DAL.handleAdventureClick`. Mutations call
`DAL.saveState()` (debounced) and `DAL.render()`. There is no virtual DOM and no
framework — state in, HTML string out.

Useful entry points: `DAL.init`, `DAL.navigate(view, projectId, tool)`, `DAL.loadState`,
`DAL.saveState`, `DAL.defaultProject`, `DAL.defaultChapter`, `DAL.defaultAdventure`,
`DAL.modal`, `DAL.toast`, `DAL.setTheme`, `DAL.download`, `DAL.escapeHtml`.

### Data model

Root state (localStorage key `draftALore`): `appTheme`, `authorName`, `authorBio`,
`autoFillAuthor`, goals, `wordHistory`, `customFonts`, `projects` (map), `projectOrder`.
Each project: `chapters`, `characters`, `relationships`, `plots`, `lore`, `mindmap`,
`versions`, plus an optional `adventure` (`stats`, `traits`, `items`, `nodes` with
`choices` / `conditions` / `effects`). Word counts are tracked on two tracks —
manuscript (chapters and story-graph node text) and supplementary (characters, lore,
plots) — and daily counts reset at local midnight.

---

## Responsive system

Implemented in `src/core.js` (`DAL.BREAKPOINTS`, `DAL.viewportBucket`, `DAL.applyViewport`,
`DAL.initAdaptive`) and the "ADAPTIVE LAYOUT & DENSITY" section of `src/styles.css`.

- **Breakpoints:** `compact` < 760px, `snug` 760–1049px, `medium` 1050–1599px,
  `wide` ≥ 1600px. The bucket is published as `data-viewport` on the root element, with
  device pixel ratio in `data-dpr`, so CSS and JS can both branch on it.
- **True viewport height:** `--app-h` is written from `visualViewport` (falling back to
  `100dvh`), so mobile browser toolbars and the on-screen keyboard don't clip panels.
  Layout code uses `calc(var(--app-h) - …)` instead of hardcoded `100vh`.
- **Fluid type and spacing:** `html { font-size: clamp(15px, 13.6px + 0.2vw, 19px) }`
  (15px on a small phone → 19px on 4K), with fluid `--sidebar-w`, `--panel-*`, `--gutter`,
  `--tap` and safe-area tokens.
- **Sidebar:** fixed rail ≥ 1050px; below that it becomes an off-canvas drawer with a
  `.nav-scrim`, auto-collapsing while remembering the desktop preference.
- **Workspace:** on phones the tool rail flips to a horizontally scrollable strip and the
  nested layouts stack; wide tables scroll horizontally inside the panel rather than
  pushing the page sideways. The workspace shell always fills the content area, while
  reading views cap at a comfortable measure (78ch editor, 2200px max content) on
  ≥ 1600px / ≥ 2400px screens.
- **Also handled:** touch targets ≥ 44px and 16px inputs on coarse pointers, short/landscape
  viewports, iOS safe areas, HiDPI hairline borders, `prefers-reduced-motion`, and a print
  stylesheet.
- **Resize handling** is rAF-throttled on `resize`, `orientationchange` and
  `visualViewport` changes, and only re-renders when the bucket actually changes — so
  dragging a window edge stays smooth.

Verified across 360×640 dpr2, 390×844, 412×915, 768×1024, 900×600, 1366×768, 1600×900,
1920×1080, 2560×1440 and 3840×2160 with no horizontal scrolling, no console errors and no
clipped text.

---

## Mobile layout (< 760px)

Below 760px the app stops being a scaled-down desktop and switches to a purpose-built
phone layout. Implemented in the "MOBILE LAYOUT" and "COMPACT — PROJECT WORKSPACE"
sections at the end of `src/styles.css`, plus the tab bar and tooltip guards in
`src/core.js`.

- **Bottom tab bar instead of a drawer.** The left rail and its scrim are hidden outright
  and replaced by a fixed, safe-area-aware bottom bar (`.mobile-tabbar`) with Dashboard,
  Projects, Library and Settings. Nothing is behind a hamburger, and the active tab shows
  an accent pill behind its icon. Content gets `padding-bottom` for the bar so the last
  card is never trapped under it, and toasts ride above it.
- **No tooltips on touch.** `DAL.initTooltips()` now bails out entirely unless
  `(hover: hover) and (pointer: fine)` matches, and `.tooltip` is `display:none` on any
  coarse-pointer or narrow screen. Previously a tap fired a synthetic `mouseover` with no
  matching `mouseout`, so the bubble latched open on top of the buttons underneath. The
  three sidebar destinations lost their `data-tip` attributes as well — they are
  self-explanatory. On desktop, tooltips additionally clamp inside the viewport and
  dismiss on `pointerdown`, `touchstart`, `scroll` and `blur`.
- **Its own type and spacing scale.** Fixed `--ts-*` values rather than the desktop's
  viewport clamps (which collapse to their minimums on a 390px screen), 46px tap targets,
  and a 16px input floor so iOS never zooms on focus.
- **Modals become bottom sheets** with a grab handle, a sticky header, stacked full-width
  footer buttons and a slide-up animation.
- **Project workspace.** The vertical tool rail becomes a horizontally scrollable tab strip
  with stacked icon + label; the redundant global top bar is hidden (undo/redo and the save
  indicator move into the project header, which compresses to two tight rows); the folder
  link button is hidden because the File System Access API doesn't exist on mobile; nested
  two-pane tools stack with each pane scrolling independently, and the editor keeps the
  majority of the screen.
- **Landscape phones** (`max-height: 520px`) drop to a shorter, icon-only tab bar.

---

## Rebuilding the Android APK

Short version (full details in `MOBILE-BUILD.md`):

```bash
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/android-sdk
export ANDROID_SDK_ROOT="$ANDROID_HOME"

python3 build.py           # refresh index.html
python3 build-mobile.py    # stage www/ (offline, fonts stripped)
npm install                # @capacitor/core, cli, android
npx cap sync android       # or copy www/ into android/app/src/main/assets/public/
cd android && ./gradlew assembleDebug
cp app/build/outputs/apk/debug/app-debug.apk ../DraftALore.apk
```

`assembleRelease` produces an **unsigned** APK; sign it with your own keystore via
`apksigner` before distributing.

---

## Contributing

The project is intentionally dependency-free and hand-written. If you send a PR:

1. Edit `src/`, never `index.html`.
2. Keep it vanilla — no frameworks, no CDN requests, no runtime network access.
3. Use existing CSS custom properties and the `data-viewport` buckets instead of new
   hardcoded pixel values.
4. Run `python3 build.py` and test the built `index.html` at a phone width and a desktop
   width before opening the PR.
5. Give every new control a `data-tip` tooltip and every new panel a visible Close/Back
   control.

Issues and pull requests: [github.com/Hexxis-cmd/Draft-A-Lore](https://github.com/Hexxis-cmd/Draft-A-Lore)

## License

**Free for noncommercial use. Commercial use requires a paid license.**

Draft A Lore is source-available under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)
plus four supplemental terms. Full text in [`LICENSE.md`](LICENSE.md); commercial terms in
[`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md).

**You may, for free:**

- write and sell whatever you create with it — your manuscripts, games and campaigns are
  100% yours, with no claim on them
- use it personally, as a hobby, as a student, or in a school, library, charity or
  government body
- modify it and share your version, as long as you give it away free, publish your source,
  rename and rebrand it, and keep the credit

**You must:**

- **credit Daymien Vanhorn** as the original author, with a link to this repository — in
  the running app (the Settings credit stays visible; restyle it if you like, don't remove
  it), in the source, and on any page where you publish your version
- keep the "Draft A Lore" name, `logo.png`/`logo.jpg` and the derived `icons/` out of your
  fork — those are reserved and not licensed

**You may not**, without a written commercial license: sell it, bundle it into a paid
product or service, host it behind a paywall or with ads, or use it in the ordinary
operations of a for-profit business. Ask via
[github.com/Hexxis-cmd](https://github.com/Hexxis-cmd) — royalty, flat-fee, buyout and
white-label arrangements are all on the table.

