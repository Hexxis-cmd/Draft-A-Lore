# Interaction layer API (`src/interaction.js`)

Shared plumbing for menus, right-click menus, selection, clipboard boards, drag
and drop, and collapsible panels. Loaded after `core.js` and before the views, so
every view can rely on it. Verified working in a browser.

## Ground rules

- Vanilla JS on the `DAL` namespace. No modules, no frameworks, no build step
  beyond concatenation. ES5-style `var` / `function` to match the codebase.
- Never rename or remove an existing `data-action` value.
- All persisted data lives under `DAL.state`; every new field must default safely
  when absent (add an `if(!DAL.state.x) DAL.state.x = …` line in `loadState`).
- Use design tokens only — `var(--c-*)`, `var(--radius-*)`, `var(--ts-*)`,
  `var(--tap)`, `var(--dur*)`, `var(--ease-*)`, `var(--z-*)`. Never hardcode a colour.
- Touch targets ≥ `var(--tap)`. Touch text inputs 16px to avoid iOS focus zoom.
- Comments explain non-obvious logic only. No dev-process notes, no section banners.

## Collapsible panels

```js
DAL.panel(key, title, bodyHtml, opts)   // returns HTML for a collapsible section
// opts: {defaultOpen: true|false, badge: 'text', className: 'extra-class'}
```

Open/closed state persists in `DAL.state.panels[key]`. The `toggle-panel` action
and the height animation are already handled — just render the markup. Use this
for every group of tools in a sidebar or tool panel rather than a bare heading.

```js
DAL.panelOpen(key, fallback)   // read current state
DAL.setAllPanels(true|false)   // used by View > Expand/Collapse All Panels
```

## Right-click context menus

Register a builder per kind, then tag elements.

```js
DAL.CTX.chapter = function(id, el, event){
  return [
    { heading: 'Chapter' },
    { label: 'Rename…',  action: 'rename-chapter', data: { cid: id } },
    { label: 'Duplicate', action: 'edit-duplicate' },
    { divider: true },
    { label: 'Delete', action: 'edit-delete', danger: true }
  ];
};
```

```html
<div data-ctx="chapter" data-ctx-id="c123">…</div>
```

Item fields: `label`, `action`, `shortcut`, `data` (becomes `data-*` attributes on
the item, read them with `el.getAttribute('data-cid')` in your handler), `divider`,
`heading`, `danger`, `disabled`, `checked`, `submenu`.

The nearest ancestor with `data-ctx` wins, so a node inside a canvas gets the node
menu while empty canvas space gets the canvas menu. Right-clicks inside inputs,
textareas and contenteditable are deliberately left to the browser so spellcheck
and native clipboard stay reachable — do not change that.

## Universal selection and edit commands

`Ctrl+C/X/V/D`, `Delete`, and the Edit menu all resolve against the current
selection. Register how a kind answers them:

```js
DAL.SELECT.chapter = {
  label:     function(id){ return chapterById(id).title; },
  copy:      function(id){ return DAL.clone(chapterById(id)); },   // returns payload
  remove:    function(id){ /* delete it, save, re-render */ },
  duplicate: function(id){ /* optional; falls back to copy + PASTE */ }
};
DAL.PASTE.chapter = function(payload){ /* insert a copy, new id, save, render */ };
```

Tag selectable elements with `data-sel="chapter:c123"`. Clicking sets the
selection and adds `.is-selected`; clicking empty space clears it. Right-clicking
an unselected element selects it first, so menu and keyboard always agree.

`DAL.SELECT_ALL` is an optional global hook for `Ctrl+A` outside text fields.

## Clipboard board

```js
DAL.clipCopy(kind, label, payload, quiet)  // push onto the board (cap 24)
DAL.clipLatest(kind)                       // newest entry of a kind, or null
DAL.clipPaste(kind)                        // paste newest of a kind
DAL.showClipboardBoard()                   // the board modal
```

Entries persist in `DAL.state.clipboard` and survive reloads, so parts can be
lifted from one project into another. Add a human label for each new kind to
`DAL.CLIP_LABELS`.

## Drag and drop

Pointer-events based, so it works with a mouse and with touch. HTML5 drag is not
used and must not be introduced — it does not exist on touch.

Mark a draggable element:

```html
<div data-drag="chapter:c123" data-drag-label="Chapter One">…</div>
<!-- grip-only dragging keeps the rest of the card clickable -->
<div data-drag="chapter:c123" data-drag-handle=".drag-handle">
  <span class="drag-handle">⋮⋮</span> …
</div>
```

Mark a drop zone, and register what happens:

```html
<!-- sortable list: data-sort-item selects the reorderable children -->
<div data-drop="chapter" data-sort-item="[data-drag]">…</div>
<!-- axis defaults to y; use data-sort-axis="x" for a row -->
<!-- a zone can accept several kinds, or "*" for anything -->
<div data-drop="item character">…</div>
```

```js
DAL.DROP.chapter = function(payload, zoneEl, index){
  // payload: {kind, id, sourceEl}
  // index: target position for sortable zones, else null
};
DAL.moveInArray(arr, fromIndex, toIndex);   // handles the index shift for you
```

A drag starts only after the pointer travels 6px, so taps, text selection and
canvas panning still work. An insertion line is drawn automatically for sortable
zones, and the hovered zone gets `.drop-active`.

## Menu bar

`DAL.MENUS` holds `file`, `edit`, `view`, `tools`. Same item shape as context
menus. Every item must route to an action that actually exists — nothing
decorative. Both menu systems share `DAL.menuHtml` / `DAL.bindSubmenus` /
`DAL.clampToViewport`, so a fix to positioning fixes both.

## Keyboard shortcuts

Bound in `core.js`. `DAL.inTextField(target)` guards anything that would collide
with text editing; `DAL.fireAction(action)` routes a key press through
`runAction` so keys and menu clicks can never drift apart. Register new commands
as actions and add them to a menu — do not add bare key handlers elsewhere.

Currently bound: `Ctrl+S` save, `Ctrl+F` find, `Ctrl+\` sidebar, `Ctrl+Shift+V`
clipboard board, `Ctrl+Z/Y` undo/redo, `Ctrl+C/X/V/D/A` edit commands (outside
fields), `Ctrl+=`/`-`/`0` zoom, `F3` find next, `F11` focus mode, `Delete`,
`Escape` (closes context menu → menu → focus mode → grab mode → modal).

## CSS classes available

`.panel .panel-head .panel-chev .panel-title .panel-badge .panel-body`,
`.menu-heading .menu-check .menu-item.danger .menu-item.disabled .ctx-menu`,
`.is-selected`, `.clip-board .clip-entry .clip-kind .clip-label`,
`.drag-ghost .drop-line .drop-active .drag-handle`, plus the existing utility
layer: `.u-hint .u-hint-faint .u-label-caps .u-row .u-grow .u-measure .icon-sm`
and the `.tool-panel` dock/sheet component.
