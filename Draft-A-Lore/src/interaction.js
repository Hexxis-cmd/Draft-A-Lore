/* Shared interaction layer: menus, right-click menus, clipboard boards and
   drag-and-drop. Views register their own behaviour in the DAL.CTX, DAL.PASTE
   and DAL.DROP registries, so nothing view-specific belongs in this file. */

DAL.CTX = {};    /* kind -> function(id, el) returning menu items */
DAL.PASTE = {};  /* kind -> function(payload) placing a clipboard entry */
DAL.DROP = {};   /* zone -> function(payload, targetEl, index) */
DAL.SELECT = {}; /* kind -> {label, copy, remove, duplicate} */

/* Universal selection
   Copy, cut, duplicate and delete are single commands rather than one pair per
   entity type: whatever is selected answers them. Elements advertise
   data-sel="<kind>:<id>" and each kind registers how to read and change itself
   in DAL.SELECT, so the shortcut layer never learns about characters or nodes. */

DAL.selection = null;

DAL.clearSelection = function(){
  DAL.selection = null;
  document.querySelectorAll('.is-selected').forEach(function(el){
    el.classList.remove('is-selected');
    el.removeAttribute('aria-selected');
  });
};

DAL.select = function(kind, id, el){
  DAL.clearSelection();
  var handler = DAL.SELECT[kind];
  DAL.selection = { kind: kind, id: id, label: handler && handler.label ? handler.label(id) : id };
  if(el){
    el.classList.add('is-selected');
    el.setAttribute('aria-selected', 'true');
  }
};

/* Clicking empty space clears the selection, but a click that landed on a
   control is that control's business. */
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-sel]');
  if(el){
    var spec = (el.getAttribute('data-sel') || '').split(':');
    DAL.select(spec[0], spec.slice(1).join(':'), el);
    return;
  }
  if(!e.target.closest('[data-action], .menu-dropdown, .modal, input, textarea, select, button')) DAL.clearSelection();
});

/* Right-clicking something unselected selects it first, so the menu that opens
   and the keyboard commands always agree about the target. */
document.addEventListener('contextmenu', function(e){
  var el = e.target.closest('[data-sel]');
  if(!el) return;
  var spec = (el.getAttribute('data-sel') || '').split(':');
  var id = spec.slice(1).join(':');
  if(!DAL.selection || DAL.selection.id !== id) DAL.select(spec[0], id, el);
}, true);

DAL.handleEditAction = function(action){
  if(action === 'edit-select-all'){
    if(DAL.SELECT_ALL) DAL.SELECT_ALL();
    else DAL.toast('Select all is not available here', 'info');
    return;
  }
  if(action === 'edit-paste'){
    var board = DAL.clipboard();
    if(!board.length){ DAL.toast('Nothing copied yet', 'info'); return; }
    // Paste what is most recently copied that something here can actually take.
    var usable = board.find(function(c){ return DAL.PASTE[c.kind]; });
    if(!usable){ DAL.toast('Nothing on the board can be pasted here', 'info'); return; }
    DAL.clipPasteEntry(usable);
    return;
  }
  var sel = DAL.selection;
  if(!sel){ DAL.toast('Select something first', 'info'); return; }
  var handler = DAL.SELECT[sel.kind];
  if(!handler){ DAL.toast('That cannot be edited here', 'info'); return; }
  if(action === 'edit-copy' || action === 'edit-cut'){
    if(!handler.copy){ DAL.toast('That cannot be copied', 'info'); return; }
    DAL.clipCopy(sel.kind, sel.label, handler.copy(sel.id));
    if(action === 'edit-cut' && handler.remove){ handler.remove(sel.id); DAL.clearSelection(); }
    return;
  }
  if(action === 'edit-duplicate'){
    if(handler.duplicate) handler.duplicate(sel.id);
    else if(handler.copy && DAL.PASTE[sel.kind]) DAL.PASTE[sel.kind](handler.copy(sel.id));
    else DAL.toast('That cannot be duplicated', 'info');
    return;
  }
  if(action === 'edit-delete'){
    if(handler.remove){ handler.remove(sel.id); DAL.clearSelection(); }
    else DAL.toast('That cannot be deleted here', 'info');
  }
};
/* Items are plain objects so both menu systems and every view can describe a
   menu without touching the DOM: {label, action, shortcut, attr, data, divider,
   danger, disabled, submenu, checked}. */
DAL.menuItemHtml = function(it, subIndex){
  if(it.divider) return '<div class="menu-divider" role="separator"></div>';
  if(it.heading) return '<div class="menu-heading" role="presentation">'+DAL.escapeHtml(it.heading)+'</div>';
  if(it.submenu) return '<div class="menu-item has-sub" role="menuitem" tabindex="0" aria-haspopup="menu" data-menu-sub="'+subIndex+'">'+DAL.escapeHtml(it.label)+'<span class="menu-chev">\u203A</span></div>';
  var cls = 'menu-item' + (it.danger ? ' danger' : '') + (it.disabled ? ' disabled' : '');
  var attrs = ' role="menuitem" tabindex="'+(it.disabled?'-1':'0')+'"'+(it.disabled?' aria-disabled="true"':' data-action="menu" data-do="'+DAL.escapeHtml(it.action)+'"');
  if(it.attr !== undefined) attrs += ' data-theme="'+DAL.escapeHtml(it.attr)+'"';
  if(it.data) for(var k in it.data){ if(it.data.hasOwnProperty(k)) attrs += ' data-'+k+'="'+DAL.escapeHtml(String(it.data[k]))+'"'; }
  var check = it.checked ? '<span class="menu-check">\u2713</span>' : (it.checked === false ? '<span class="menu-check"></span>' : '');
  var right = it.shortcut ? '<span class="menu-shortcut">'+DAL.escapeHtml(it.shortcut)+'</span>' : '';
  return '<div class="'+cls+'"'+attrs+'>'+check+DAL.escapeHtml(it.label)+right+'</div>';
};

DAL.menuHtml = function(items){
  return items.map(function(it, i){ return DAL.menuItemHtml(it, i); }).join('');
};

/* Keeps a floating panel fully on screen. Menus, submenus and drag ghosts all
   need the same clamping, and a submenu that would overflow flips to the left
   of its parent rather than being pinned to the window edge. */
DAL.clampToViewport = function(el, x, y, flipFrom){
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  var r = el.getBoundingClientRect();
  if(r.right > window.innerWidth - 8){
    el.style.left = Math.max(8, (flipFrom !== undefined ? flipFrom - r.width : window.innerWidth - r.width - 8)) + 'px';
  }
  if(r.bottom > window.innerHeight - 8) el.style.top = Math.max(8, window.innerHeight - r.height - 8) + 'px';
};

/* Wires hover/tap submenu opening for an already-rendered menu element. */
DAL.bindSubmenus = function(dd, items){
  dd.querySelectorAll('.menu-item.has-sub').forEach(function(sub){
    var openSub = function(){
      dd.querySelectorAll('.menu-sub-dropdown').forEach(function(s){ s.remove(); });
      var parent = items[parseInt(sub.getAttribute('data-menu-sub'), 10)];
      if(!parent || !parent.submenu) return;
      var sd = document.createElement('div');
      sd.className = 'menu-sub-dropdown';
      sd.setAttribute('role','menu');
      sd.innerHTML = DAL.menuHtml(parent.submenu);
      dd.appendChild(sd);
      DAL.bindMenuKeyboard(sd);
      var sr = sub.getBoundingClientRect();
      DAL.clampToViewport(sd, sr.right - 4, sr.top, sr.left + 4);
    };
    sub.addEventListener('mouseenter', openSub);
    sub.addEventListener('click', openSub);
  });
};

DAL.bindMenuKeyboard = function(menu){
  menu.setAttribute('role','menu');
  menu.addEventListener('keydown',function(e){
    var item=e.target.closest('.menu-item');
    if(!item||!menu.contains(item)) return;
    if(['ArrowDown','ArrowUp','Enter',' ','ArrowRight','Escape'].indexOf(e.key)<0) return;
    if(e.key==='ArrowRight'&&!item.classList.contains('has-sub')) return;
    e.stopPropagation();
    var items=Array.prototype.slice.call(menu.querySelectorAll(':scope > .menu-item:not(.disabled)'));
    var index=items.indexOf(item);
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();
      if(items.length) items[(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();
    } else if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){
      e.preventDefault(); item.click();
      var sub=menu.querySelector(':scope > .menu-sub-dropdown');
      if(sub){ var first=sub.querySelector('.menu-item:not(.disabled)'); if(first) first.focus(); }
    } else if(e.key==='Escape'){
      e.preventDefault(); DAL.closeContextMenu(); DAL.closeMenu();
    }
  });
};
DAL.closeContextMenu = function(){
  var m = document.getElementById('dalCtxMenu');
  if(m) m.remove();
};

DAL.contextMenu = function(x, y, items){
  DAL.closeContextMenu();
  DAL.closeMenu();
  if(!items || !items.length) return;
  var dd = document.createElement('div');
  dd.id = 'dalCtxMenu';
  dd.className = 'menu-dropdown ctx-menu';
  dd.innerHTML = DAL.menuHtml(items);
  document.body.appendChild(dd);
  DAL.bindSubmenus(dd, items);
  DAL.bindMenuKeyboard(dd);
  DAL.clampToViewport(dd, x, y);
  var first = dd.querySelector('.menu-item:not(.disabled)');
  if(first) first.focus();
};

DAL.openElementContextMenu = function(el, x, y, sourceEvent){
  if(!el || el.closest('input, textarea, [contenteditable="true"]')) return false;
  var selected = el.closest('[data-sel]');
  if(selected){
    var spec = (selected.getAttribute('data-sel') || '').split(':');
    DAL.select(spec[0], spec.slice(1).join(':'), selected);
  }
  var builder = DAL.CTX[el.getAttribute('data-ctx')];
  if(!builder) return false;
  var items = builder(el.getAttribute('data-ctx-id'), el, sourceEvent || {});
  if(!items || !items.length) return false;
  DAL.contextMenu(x, y, items);
  return true;
};

/* Elements opt in with data-ctx="<kind>" and usually data-ctx-id. The nearest
   ancestor carrying data-ctx wins, so a node inside a canvas gets the node menu
   while empty canvas space gets the canvas menu. Text selections and form
   fields are left alone so the browser's own menu (with spellcheck and
   clipboard) stays reachable. */
document.addEventListener('contextmenu', function(e){
  var el = e.target.closest('[data-ctx]');
  if(!el) return;
  if(DAL.openElementContextMenu(el, e.clientX, e.clientY, e)) e.preventDefault();
});

/* Touch devices have no right-click. A short, movement-tolerant hold opens the
   same menu while ordinary taps and canvas dragging remain untouched. */
var touchContext = null;
document.addEventListener('pointerdown', function(e){
  if(e.pointerType !== 'touch' || e.button !== 0) return;
  var el = e.target.closest('[data-ctx]');
  if(!el || e.target.closest('input, textarea, [contenteditable="true"]')) return;
  touchContext = {pointerId:e.pointerId, x:e.clientX, y:e.clientY, el:el, opened:false};
  touchContext.timer = setTimeout(function(){
    if(!touchContext) return;
    touchContext.opened = DAL.openElementContextMenu(touchContext.el, touchContext.x, touchContext.y, e);
    if(touchContext.opened && navigator.vibrate) navigator.vibrate(20);
  }, 550);
}, true);
document.addEventListener('pointermove', function(e){
  if(!touchContext || e.pointerId !== touchContext.pointerId) return;
  if(Math.abs(e.clientX-touchContext.x)>10 || Math.abs(e.clientY-touchContext.y)>10){ clearTimeout(touchContext.timer); touchContext=null; }
}, true);
['pointerup','pointercancel'].forEach(function(type){
  document.addEventListener(type, function(e){
    if(!touchContext || e.pointerId !== touchContext.pointerId) return;
    clearTimeout(touchContext.timer);
    if(touchContext.opened){ e.preventDefault(); e.stopPropagation(); }
    touchContext=null;
  }, true);
});

DAL.registerActionHandler(function(action, el){
  if(action !== 'selection-menu') return false;
  if(!DAL.selection && DAL.selectedNodeId && (DAL.currentTool === 'storygraph' || DAL.currentTool === 'mindmap')){
    var selectedKind = DAL.currentTool === 'storygraph' ? 'rpg-node' : 'mind-node';
    var selectedElement = document.querySelector('[data-sel="'+selectedKind+':'+CSS.escape(DAL.selectedNodeId)+'"]');
    if(selectedElement) DAL.select(selectedKind, DAL.selectedNodeId, selectedElement);
  }
  var selectedSpec = DAL.selection && DAL.selection.kind+':'+DAL.selection.id;
  var target = selectedSpec && Array.prototype.find.call(document.querySelectorAll('[data-sel]'), function(candidate){
    return candidate.getAttribute('data-sel') === selectedSpec;
  });
  if(!target){ DAL.toast('Select something first', 'info'); return true; }
  var contextTarget = target.closest('[data-ctx]');
  var rect = el.getBoundingClientRect();
  if(!DAL.openElementContextMenu(contextTarget, rect.left, rect.bottom+4, {})) DAL.toast('More actions are not available here', 'info');
  return true;
});

document.addEventListener('click', function(e){
  var m = document.getElementById('dalCtxMenu');
  if(m && !m.contains(e.target)) DAL.closeContextMenu();
}, true);

/* Clipboard board
   A stack of copied elements that survives navigation and reloads, so parts can
   be lifted from one project and dropped into another. The newest matching
   entry is what a plain paste uses; the board modal reaches the rest. */

DAL.CLIP_MAX = 24;

DAL.clipboard = function(){
  if(!DAL.state.clipboard) DAL.state.clipboard = [];
  return DAL.state.clipboard;
};

DAL.clipCopy = function(kind, label, payload, quiet){
  var board = DAL.clipboard();
  board.unshift({ id: DAL.uid(), kind: kind, label: label, payload: DAL.clone(payload), ts: Date.now() });
  if(board.length > DAL.CLIP_MAX) board.length = DAL.CLIP_MAX;
  DAL.saveState(true);
  if(!quiet) DAL.toast('Copied ' + label, 'success');
};

DAL.clipLatest = function(kind){
  return DAL.clipboard().find(function(c){ return c.kind === kind; }) || null;
};

/* Pastes a board entry through the handler its kind registered. Returns false
   when nothing can accept it, so callers can fall through to a message. */
DAL.clipPasteEntry = function(entry){
  if(!entry) return false;
  var handler = DAL.PASTE[entry.kind];
  if(!handler) return false;
  handler(DAL.clone(entry.payload));
  return true;
};

DAL.clipPaste = function(kind){
  var entry = DAL.clipLatest(kind);
  if(!entry){ DAL.toast('Nothing copied yet', 'info'); return false; }
  return DAL.clipPasteEntry(entry);
};

DAL.CLIP_LABELS = {
  character: 'Character', chapter: 'Chapter', node: 'Scene node', item: 'Item',
  lore: 'Lore entry', location: 'Location', thread: 'Plot thread', stat: 'Stat', note: 'Note'
};

DAL.showClipboardBoard = function(){
  var board = DAL.clipboard();
  var body;
  if(!board.length){
    body = '<p class="u-hint">Nothing on the board yet. Copy a character, chapter, scene node or item and it will collect here, ready to paste into any project.</p>';
  } else {
    body = '<div class="clip-board">' + board.map(function(c){
      var kindLabel = DAL.CLIP_LABELS[c.kind] || c.kind;
      return '<div class="clip-entry">' +
        '<div class="clip-entry-main">' +
          '<span class="clip-kind">'+DAL.escapeHtml(kindLabel)+'</span>' +
          '<span class="clip-label">'+DAL.escapeHtml(c.label)+'</span>' +
          '<span class="u-hint-faint">'+DAL.formatDate(c.ts)+'</span>' +
        '</div>' +
        '<div class="clip-entry-actions">' +
          '<button class="btn sm" data-action="clip-paste" data-clip="'+c.id+'">Paste</button>' +
          '<button class="btn sm icon" data-action="clip-remove" data-clip="'+c.id+'" aria-label="Remove from board">\u2715</button>' +
        '</div></div>';
    }).join('') + '</div>';
  }
  DAL.modal('Clipboard Board', body, {
    footer: '<button class="btn" data-action="clip-clear">Clear board</button><button class="btn primary" data-action="close-modal">Done</button>'
  });
};

/* Drag and drop
   Pointer events rather than the HTML5 drag API, because HTML5 dragging does
   not exist on touch and half of this app is used on a phone. A drag starts
   only after the pointer travels far enough to prove intent, so taps, text
   selection and canvas panning all still work. */

DAL.DRAG_THRESHOLD = 6;
DAL._drag = null;

/* Reads the drop zones an element advertises: data-drop="chapters characters"
   accepts either kind. */
DAL._dropAccepts = function(el, kind){
  var zones = (el.getAttribute('data-drop') || '').split(/\s+/);
  return zones.indexOf(kind) !== -1 || zones.indexOf('*') !== -1;
};

/* Finds the drop zone under the pointer. The ghost is skipped because it sits
   directly beneath the cursor and would shadow every real target. */
DAL._dropUnder = function(x, y, kind){
  var g = DAL._drag && DAL._drag.ghost;
  if(g) g.style.display = 'none';
  var el = document.elementFromPoint(x, y);
  if(g) g.style.display = '';
  while(el && el !== document.body){
    if(el.hasAttribute && el.hasAttribute('data-drop') && DAL._dropAccepts(el, kind)) return el;
    el = el.parentElement;
  }
  return null;
};

/* Works out where in a sortable list the dragged item would land, and draws the
   insertion line there. Items are measured live so the list can be a grid or a
   column without special cases. */
DAL._sortIndex = function(zone, x, y, dragEl){
  var sel = zone.getAttribute('data-sort-item') || '[data-drag]';
  var items = Array.prototype.filter.call(zone.querySelectorAll(sel), function(el){ return el !== dragEl; });
  var horizontal = zone.getAttribute('data-sort-axis') === 'x';
  var index = items.length, marker = null, after = false;
  for(var i = 0; i < items.length; i++){
    var r = items[i].getBoundingClientRect();
    var mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
    if((horizontal ? x : y) < mid){ index = i; marker = items[i]; break; }
  }
  if(marker === null && items.length){ marker = items[items.length - 1]; after = true; }
  return { index: index, marker: marker, after: after, horizontal: horizontal };
};

DAL._showInsertLine = function(pos){
  var line = document.getElementById('dalDropLine');
  if(!pos || !pos.marker){ if(line) line.remove(); return; }
  if(!line){
    line = document.createElement('div');
    line.id = 'dalDropLine';
    line.className = 'drop-line';
    document.body.appendChild(line);
  }
  var r = pos.marker.getBoundingClientRect();
  line.classList.toggle('vertical', !!pos.horizontal);
  if(pos.horizontal){
    line.style.left = ((pos.after ? r.right : r.left) - 1) + 'px';
    line.style.top = r.top + 'px';
    line.style.height = r.height + 'px';
    line.style.width = '';
  } else {
    line.style.left = r.left + 'px';
    line.style.top = ((pos.after ? r.bottom : r.top) - 1) + 'px';
    line.style.width = r.width + 'px';
    line.style.height = '';
  }
};

DAL._clearDragVisuals = function(){
  var line = document.getElementById('dalDropLine');
  if(line) line.remove();
  document.querySelectorAll('.drop-active').forEach(function(el){ el.classList.remove('drop-active'); });
  document.body.classList.remove('dragging');
};

/* data-drag="<kind>:<id>" marks a draggable element. When it also carries
   data-drag-handle, only that handle starts a drag, which keeps whole cards
   clickable while still being reorderable by their grip. */
document.addEventListener('pointerdown', function(e){
  if(e.button !== undefined && e.button !== 0) return;
  var el = e.target.closest('[data-drag]');
  if(!el) return;
  var handleSel = el.getAttribute('data-drag-handle');
  if(handleSel && !e.target.closest(handleSel)) return;
  if(!handleSel && e.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
  var spec = (el.getAttribute('data-drag') || '').split(':');
  if(!spec[0]) return;
  DAL._drag = {
    el: el, kind: spec[0], id: spec.slice(1).join(':'),
    startX: e.clientX, startY: e.clientY, active: false,
    pointerId: e.pointerId, zone: null, pos: null, ghost: null
  };
});

document.addEventListener('pointermove', function(e){
  var d = DAL._drag;
  if(!d || (d.pointerId !== undefined && e.pointerId !== d.pointerId)) return;
  if(!d.active){
    if(Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) < DAL.DRAG_THRESHOLD) return;
    d.active = true;
    document.body.classList.add('dragging');
    d.el.classList.add('drag-source');
    var ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = (d.el.getAttribute('data-drag-label') || d.el.textContent || '').trim().slice(0, 60) || 'Item';
    document.body.appendChild(ghost);
    d.ghost = ghost;
  }
  e.preventDefault();
  d.ghost.style.left = (e.clientX + 12) + 'px';
  d.ghost.style.top = (e.clientY + 12) + 'px';
  var zone = DAL._dropUnder(e.clientX, e.clientY, d.kind);
  if(zone !== d.zone){
    if(d.zone) d.zone.classList.remove('drop-active');
    if(zone) zone.classList.add('drop-active');
    d.zone = zone;
  }
  if(zone && zone.hasAttribute('data-sort-item')){
    d.pos = DAL._sortIndex(zone, e.clientX, e.clientY, d.el);
    DAL._showInsertLine(d.pos);
  } else {
    d.pos = null;
    DAL._showInsertLine(null);
  }
  d.ghost.classList.toggle('over-target', !!zone);
}, { passive: false });

document.addEventListener('pointerup', function(e){
  var d = DAL._drag;
  DAL._drag = null;
  if(!d) return;
  if(d.ghost) d.ghost.remove();
  d.el.classList.remove('drag-source');
  DAL._clearDragVisuals();
  if(!d.active || !d.zone) return;
  /* The handler is chosen by what is being dragged, not by the order the zone
     happens to list its kinds. A scene accepts items, stats and assets, and
     picking the zone's first named kind would send an asset to the item handler. */
  var accepted = (d.zone.getAttribute('data-drop') || '').split(/\s+/);
  var handler = DAL.DROP[d.kind];
  if(!handler){
    var fallback = accepted.filter(function(z){ return z !== '*' && DAL.DROP[z]; })[0];
    handler = fallback ? DAL.DROP[fallback] : null;
  }
  if(handler) handler({ kind: d.kind, id: d.id, sourceEl: d.el }, d.zone, d.pos ? d.pos.index : null);
});

document.addEventListener('pointercancel', function(){
  var d = DAL._drag;
  DAL._drag = null;
  if(!d) return;
  if(d.ghost) d.ghost.remove();
  d.el.classList.remove('drag-source');
  DAL._clearDragVisuals();
});

/* Moves an item inside an array to the position a sortable drop reported.
   Removing before inserting means the caller never has to adjust for the hole
   the item left behind. */
DAL.moveInArray = function(arr, fromIndex, toIndex){
  if(fromIndex < 0 || fromIndex >= arr.length) return false;
  var item = arr.splice(fromIndex, 1)[0];
  if(toIndex > fromIndex) toIndex--;
  arr.splice(Math.max(0, Math.min(arr.length, toIndex)), 0, item);
  return true;
};

/* Collapsible panels
   Open/closed state is remembered per panel key so a writer's layout survives
   navigation. Height is animated from a measured value because CSS cannot
   transition to or from `auto`. */

DAL.panelOpen = function(key, fallback){
  if(!DAL.state.panels) DAL.state.panels = {};
  return DAL.state.panels[key] === undefined ? (fallback !== false) : !!DAL.state.panels[key];
};

DAL.togglePanel = function(key, el){
  if(!DAL.state.panels) DAL.state.panels = {};
  var open = !DAL.panelOpen(key);
  DAL.state.panels[key] = open;
  DAL.saveState(true);
  var panel = el && el.closest('.panel');
  if(!panel) return;
  var body = panel.querySelector('.panel-body');
  panel.classList.toggle('open', open);
  var head = panel.querySelector('.panel-head');
  if(head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
  if(!body) return;
  if(open){
    body.hidden = false;
    body.style.height = '0px';
    var target = body.scrollHeight;
    requestAnimationFrame(function(){ body.style.height = target + 'px'; });
    var done = function(){ body.style.height = ''; body.removeEventListener('transitionend', done); };
    body.addEventListener('transitionend', done);
  } else {
    body.style.height = body.scrollHeight + 'px';
    requestAnimationFrame(function(){ body.style.height = '0px'; });
  }
};

/* Opens or closes every panel at once, then repaints so the whole layout lands
   in its new state rather than animating dozens of sections independently. */
DAL.setAllPanels = function(open){
  if(!DAL.state.panels) DAL.state.panels = {};
  document.querySelectorAll('.panel .panel-head[data-panel]').forEach(function(head){
    DAL.state.panels[head.getAttribute('data-panel')] = open;
  });
  DAL.saveState(true);
  DAL.render();
};

/* Renders a collapsible section. Callers pass finished HTML for the body so
   this stays presentation-only. */
DAL.panel = function(key, title, bodyHtml, opts){
  opts = opts || {};
  var open = DAL.panelOpen(key, opts.defaultOpen);
  return '<section class="panel'+(open ? ' open' : '')+(opts.className ? ' '+opts.className : '')+'">' +
    '<button class="panel-head" data-action="toggle-panel" data-panel="'+DAL.escapeHtml(key)+'" aria-expanded="'+(open ? 'true' : 'false')+'">' +
      '<span class="panel-chev" aria-hidden="true">\u203A</span>' +
      '<span class="panel-title">'+DAL.escapeHtml(title)+'</span>' +
      (opts.badge ? '<span class="panel-badge">'+DAL.escapeHtml(String(opts.badge))+'</span>' : '') +
    '</button>' +
    '<div class="panel-body"'+(open ? '' : ' hidden')+'>'+bodyHtml+'</div>' +
  '</section>';
};
