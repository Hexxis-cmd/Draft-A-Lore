# Draft A Lore — Specification Document

**Version:** 1.0.0
**Delivery format:** Single self-contained HTML file (all CSS and JS inline, zero external dependencies, works fully offline)

---

## Overview

Draft A Lore is a comprehensive writing and RPG adventure design tool for novelists, game masters, and interactive fiction authors. It combines manuscript editing, character management, lore organization, and a full RPG branching-narrative engine into a single offline-capable application.

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Markup** | Semantic HTML5 | Single-file constraint, no build pipeline |
| **Styling** | Inline CSS with CSS custom properties | 4 themes via `data-theme` attribute, no preprocessor |
| **Logic** | Vanilla JavaScript (ES6+) | No framework overhead, zero dependencies |
| **Storage** | `localStorage` (primary) | Persistent across sessions, no server |
| **Folder Sync** | File System Access API | Chrome/Edge live sync; Firefox gets zip-style export fallback |
| **Fonts** | System font stacks + custom import (base64) | No CDN, fully offline |
| **Deployment** | Static hosting | Single `index.html` served as-is |

---

## Features

### Application Shell
- **Left sidebar** (collapsible): Dashboard, Projects, Settings
- **Top bar**: App logo, current view title, global search (project-scoped), Undo/Redo, save status indicator, sidebar toggle
- **Persistent overlays**: Toast notifications (bottom-right), tooltip layer, modal backdrop
- **Flipped Stone Rule**: Every panel, modal, drawer, and detail view has an explicit Close/Back button

### Themes (4 total)
1. **Dark** — deep charcoal backgrounds, muted grey panels, warm gold accent, cream text
2. **Light** — soft grey backgrounds, cream panels, warm brown accent, dark charcoal text
3. **Fantasy Dark** — near-black with deep forest green and aged burgundy, warm amber glow
4. **Fantasy Light** — warm parchment tones, soft sage green and dusty rose, candlelight warmth

### View 1 — Dashboard
- Continue Writing banner (most recently edited project)
- Author Profile module (name, bio, auto-fill toggle)
- Global analytics: manuscript words / supplementary words / total
- Time-based goals (daily, weekly, monthly, 6-month, yearly) with progress bars
- Daily writing streak indicator with flame icon

### View 2 — Projects Hub
- Empty state with create prompt
- Project cards grid (name, type badge, status badge, word count, last edited, cover thumbnail)
- Project creation modal (name, type: Novel/RPG Adventure/Dual, folder link)
- Import from `.json`, 2-step delete confirmation
- Status badges: In Development / Drafting / Proofreading / Completed / Published

### View 3 — Completed Books Library
- Visual grid of book covers (status: Completed or Published)
- Customizable shelf folders
- Animated Ebook Reader with 3D page-turn, TOC navigation, 4 reader themes, font selector

### View 4 — Settings
- Theme selector with live preview swatch
- Author info management (synced with dashboard)
- Custom font import (.ttf/.otf/.woff/.woff2, stored as base64)
- Full workspace backup (JSON export/import)
- Clear all data (2-step confirmation)
- App version label

### Project Workspace — Story Tools
1. **Overview** — project dashboard with counts, stale plot warnings, recent activity
2. **Manuscript** — chapter list with drag reorder, rich text editor (contenteditable), distraction-free mode, folder sync
3. **Characters** — card grid, detail view with portrait, custom fields, tags, linked plots
4. **Relationship Map** — navigable tree centered on a character, relationship types, color-coded connections, generation view
5. **Plot Threads** — main plot and subplots, status tracking, linked chapters/characters, stale warnings
6. **Lore Notebook** — folder-organized entries, categories, tags, cross-links
7. **Mind Map** — dot-grid canvas (2600×1700), draggable nodes, SVG edges, connect mode
8. **Book Preview** — cover, TOC, chapters with drop-caps, 3D page turn, 4 reader themes
9. **Project Export** — JSON, plain text, markdown, HTML, folder structure, cross-project transfer

### Project Workspace — Adventure Tools
1. **Story Graph** — node-based canvas editor, zoom/pan, entry effects, choices with conditions
2. **Stats & Traits** — stat definitions (number/text/boolean), passive trait flags
3. **Inventory & Items** — item definitions, stackable, equipment slots, icon symbols
4. **RPG Playtest** — passage display, choice buttons (condition-filtered), state inspector, restart, step back, history trail, speed-run mode, Book Page/Terminal style toggle
5. **Project Export** — Twee 3, standalone playable HTML, JSON, individual node text

### Cross-Project Transfer
- Copy characters, lore entries, or plot threads between projects

### File System Folder Sync
- Chrome/Edge: live write to linked folder on every save (debounced 2s)
- Structure: `project.json`, `chapters/`, `characters/`, `lore/`, `plots/`, `exports/`
- Firefox: zip-style download fallback

### Word Count Architecture
- Two tracks: Manuscript words (chapter/node text) and Supplementary words (characters + lore + plots)
- Shown at three levels: global dashboard, project top bar, editor bottom bar
- Daily count resets at midnight local time

### Data Model
- Root object: `appTheme`, `authorName`, `authorBio`, `autoFillAuthor`, goals, projects, projectOrder, adventures, customFonts, wordHistory
- Project: chapters, characters, relationships, plots, lore, mindmap, versions
- Adventure: stats, traits, items, nodes (with choices, conditions, effects)

### Undo/Redo
- Structural changes: app-level history stack per project (up to 40 steps)
- Text editing: native browser undo while cursor is in editor

### Autosave & Versions
- Autosave debounced 450ms to localStorage
- Auto-version snapshot every 10 minutes if word count changed
- Up to 25 versions per project, manual snapshot button, version restore

### Subtle Animations (CSS only, performant)
- Nav glow pulse on active, card lift on hover, section fade-in, save ink-drop ripple, modal scale, 3D page turn, button press scale, sidebar width transition, toast slide-up

### Accessibility
- Every button/icon/control has `data-tip` tooltip
- `:focus-visible` outlines, keyboard navigation, semantic HTML
- `prefers-reduced-motion` support

---

## Architecture Notes

- Single `state` object matching the data model, persisted via debounced `saveState()`
- `render()` function + route variables (`view`, `projectId`, `tool`, selected IDs)
- Event delegation via `data-action` attributes
- Utility helpers: ID generation, word counting, date formatting, deep cloning, file downloads, filename sanitization
- Per-project history stacks for structural undo/redo
- No external libraries, CDNs, or network requests at runtime
