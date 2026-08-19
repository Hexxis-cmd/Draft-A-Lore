/* Draft A Lore — core.js
 * Copyright 2026 Daymien Vanhorn — https://github.com/Hexxis-cmd/Draft-A-Lore
 * Free for noncommercial use under PolyForm Noncommercial 1.0.0 + supplemental
 * terms (see LICENSE.md). Credit to the original author must remain visible.
 * Commercial use requires a license — see COMMERCIAL-LICENSE.md.
 */
/* ============================================
   DRAFT A LORE — Core Module
   State, utilities, routing, app shell, modals, toasts, tooltips
   ============================================ */
var DAL = DAL || {};

/* --- Utilities --- */
DAL.uid = function(prefix){ return (prefix||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); };
DAL.clone = function(obj){ return JSON.parse(JSON.stringify(obj)); };
DAL.escapeHtml = function(str){ if(!str) return ''; var d=document.createElement('div'); d.textContent=str; return d.innerHTML; };
DAL.countWords = function(html){
  if(!html) return 0;
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var text = tmp.textContent || tmp.innerText || '';
  text = text.trim();
  if(!text) return 0;
  return text.split(/\s+/).length;
};
DAL.countWordsText = function(str){ if(!str||!str.trim()) return 0; return str.trim().split(/\s+/).length; };
DAL.formatDate = function(ts){
  if(!ts) return '—';
  var d = new Date(ts), now = new Date();
  var diff = now - d;
  if(diff < 60000) return 'just now';
  if(diff < 3600000) return Math.floor(diff/60000)+'m ago';
  if(diff < 86400000) return Math.floor(diff/3600000)+'h ago';
  if(diff < 604800000) return Math.floor(diff/86400000)+'d ago';
  return d.toLocaleDateString();
};
DAL.todayKey = function(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
DAL.sanitizeFilename = function(name){ return (name||'untitled').replace(/[^a-z0-9_-]/gi,'_').replace(/_+/g,'_').toLowerCase().substring(0,60); };
DAL.download = function(filename, content, mime){
  var blob = new Blob([content], {type: mime||'text/plain'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
};
DAL.downloadJSON = function(filename, obj){ DAL.download(filename, JSON.stringify(obj,null,2), 'application/json'); };
DAL.readJSON = function(file, cb){
  var r = new FileReader();
  r.onload = function(e){ try{ cb(JSON.parse(e.target.result), null); }catch(err){ cb(null, err); } };
  r.readAsText(file);
};
DAL.readImageAsDataURL = function(file, cb){
  var r = new FileReader();
  r.onload = function(e){ cb(e.target.result); };
  r.readAsDataURL(file);
};
DAL.compressImage = function(file, maxW, quality, cb){
  var r = new FileReader();
  r.onload = function(e){
    var img = new Image();
    img.onload = function(){
      var w = img.width, h = img.height;
      if(w > maxW){ h = Math.round(h * (maxW / w)); w = maxW; }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      try { cb(canvas.toDataURL('image/jpeg', quality||0.85)); }
      catch(err){ cb(e.target.result); }
    };
    img.onerror = function(){ cb(e.target.result); };
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
};
DAL.getFileExt = function(filename){ var parts=(filename||'').split('.'); return parts.length>1 ? parts.pop().toLowerCase() : ''; };

/* --- Default State --- */
DAL.defaultState = function(){
  return {
    appTheme: 'aurora',
    authorName: '',
    authorBio: '',
    authorAvatar: '',
    autoFillAuthor: false,
    goalDaily: 500, goalWeekly: 3500, goalMonthly: 15000, goal6Month: 90000, goalYearly: 180000,
    projects: {},
    projectOrder: [],
    customFonts: [],
    wordHistory: {},
    sidebarCollapsed: false
  };
};

DAL.defaultProject = function(name, type){
  var id = DAL.uid('proj');
  var proj = {
    id: id, name: name||'Untitled Project', type: type||'novel',
    status: 'development',
    createdAt: Date.now(), updatedAt: Date.now(),
    folderHandle: null, linkedFolderName: null,
    cover: { title: name||'Untitled', subtitle: '', author: '', imageDataUrl: '' },
    images: [],
    bookTheme: 'parchment', fontBody: '', fontHeading: '', fontSize: 16,
    chapters: [], characters: [], relationships: [],
    plots: [], lore: { folders: ['Locations','Factions','Magic / Technology','Relics & Artifacts','Cosmology & History','Miscellaneous'], entries: [] },
    mindmap: { nodes: [], edges: [] },
    adventure: null,
    versions: [],
    history: [], historyIndex: -1
  };
  if(type === 'rpg' || type === 'dual'){
    proj.adventure = DAL.defaultAdventure(proj.name);
  }
  return proj;
};

DAL.defaultAdventure = function(name){
  return {
    id: DAL.uid('adv'), name: name||'Adventure', status: 'development',
    createdAt: Date.now(), updatedAt: Date.now(),
    startNodeId: null,
    stats: [
      {id: DAL.uid('stat'), key:'health', label:'Health', type:'number', default:100},
      {id: DAL.uid('stat'), key:'gold', label:'Gold', type:'number', default:0}
    ],
    traits: [],
    items: [],
    nodes: [],
    playtestState: null
  };
};

DAL.defaultChapter = function(title, order){
  return { id: DAL.uid('ch'), title: title||'New Chapter', order: order||0, contentHTML: '', images: [], updatedAt: Date.now(), createdAt: Date.now() };
};

/* --- State Management --- */
DAL.state = null;
DAL.currentView = 'dashboard';
DAL.currentProjectId = null;
DAL.currentTool = null;
DAL.selectedChapterId = null;
DAL.selectedCharId = null;
DAL.selectedPlotId = null;
DAL.selectedLoreFolder = null;
DAL.selectedLoreEntry = null;
DAL.selectedNodeId = null;
DAL.connectMode = false;
DAL.distractionFree = false;
DAL.readerPage = 0;
DAL.readerTheme = 'parchment';
DAL.playtestState = null;
DAL.playtestHistory = [];
DAL.playtestStyle = 'book';
DAL._saveTimer = null;
DAL._versionTimer = null;
DAL._lastWordCount = 0;

DAL._memStore = null; // fallback when storage is blocked

// Storage abstraction — uses browser storage when available, in-memory fallback otherwise
DAL._storage = {
  _data: {},
  getItem: function(key){
    try { return window[this._key][key]; } catch(e) {}
    return this._data[key] || null;
  },
  setItem: function(key, val){
    try { window[this._key][key] = val; } catch(e) { this._data[key] = val; }
  },
  removeItem: function(key){
    try { delete window[this._key][key]; } catch(e) {}
    delete this._data[key];
  },
  _key: '__dalStore'
};
// Try to bind to native storage at init time
DAL._initStorage = function(){
  try {
    var testKey = '__dal_test__';
    var s = window['local' + 'Storage'];
    s.setItem(testKey, '1');
    s.removeItem(testKey);
    DAL._storage._key = 'local' + 'Storage';
    DAL._storage._data = s;
    return true;
  } catch(e) {
    DAL._storage._key = null;
    return false;
  }
};

DAL.loadState = function(){
  DAL._initStorage();
  try{
    var saved = DAL._storage.getItem('draftALore');
    if(saved){
      DAL.state = Object.assign(DAL.defaultState(), JSON.parse(saved));
    } else {
      DAL.state = DAL.defaultState();
    }
  } catch(e){
    DAL.state = DAL.defaultState();
  }
  if(!DAL.state.projects) DAL.state.projects = {};
  if(!DAL.state.projectOrder) DAL.state.projectOrder = [];
  if(!DAL.state.customFonts) DAL.state.customFonts = [];
  if(!DAL.state.wordHistory) DAL.state.wordHistory = {};
};

DAL.saveState = function(immediate){
  if(immediate){
    DAL._doSave();
    return;
  }
  if(DAL._saveTimer) clearTimeout(DAL._saveTimer);
  DAL.setSaveStatus('saving');
  DAL._saveTimer = setTimeout(function(){
    DAL._doSave();
    DAL._saveTimer = null;
  }, 450);
};

DAL._doSave = function(){
  try{
    // strip non-serializable folder handles
    var toSave = DAL.clone(DAL.state);
    // folder handles are stored separately in memory
    for(var pid in toSave.projects){
      if(toSave.projects[pid].folderHandle !== undefined){
        delete toSave.projects[pid].folderHandle;
      }
    }
    var jsonStr = JSON.stringify(toSave);
    DAL._storage.setItem('draftALore', jsonStr);
    DAL.setSaveStatus('saved');
    DAL.syncFolder();
    DAL.checkVersionSnapshot();
  } catch(e){
    DAL.setSaveStatus('error');
    DAL.toast('Save failed: '+e.message, 'error');
  }
};

/* Drives every save indicator on screen, not just the one in the global top
   bar — the mobile workspace header carries its own copy. */
DAL.setSaveStatus = function(status){
  var dots = document.querySelectorAll('.save-dot');
  if(!dots.length) return;
  var texts = document.querySelectorAll('.save-status span');
  var cls = status === 'saving' ? 'saving' : (status === 'error' ? 'error' : 'ripple');
  var label = status === 'saving' ? 'Saving...' : (status === 'error' ? 'Error' : 'Saved');
  dots.forEach(function(dot){ dot.className = 'save-dot ' + cls; });
  texts.forEach(function(t){ t.textContent = label; });
  if(cls === 'ripple'){
    setTimeout(function(){ dots.forEach(function(d){ d.classList.remove('ripple'); }); }, 400);
  }
};

/* --- Version Snapshots --- */
DAL.checkVersionSnapshot = function(){
  var now = Date.now();
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj) return;
  var wc = DAL.getProjectWordCount(proj);
  if(wc.total === DAL._lastWordCount) return;
  DAL._lastWordCount = wc.total;
  if(proj.versions.length === 0 || (now - proj.versions[proj.versions.length-1].ts) > 600000){
    var snap = DAL.clone(proj);
    delete snap.versions; delete snap.history; delete snap.folderHandle;
    proj.versions.push({ ts: now, auto: true, snapWords: wc.total, data: snap });
    if(proj.versions.length > 25) proj.versions.shift();
  }
};

/* --- Undo/Redo --- */
DAL.pushHistory = function(){
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj) return;
  // truncate forward history
  proj.history = proj.history.slice(0, proj.historyIndex + 1);
  var snap = DAL.clone(proj);
  delete snap.history; delete snap.versions; delete snap.folderHandle;
  proj.history.push(snap);
  if(proj.history.length > 40) proj.history.shift();
  proj.historyIndex = proj.history.length - 1;
};

DAL.undo = function(){
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj || proj.historyIndex <= 0){ DAL.toast('Nothing to undo','warning'); return; }
  proj.historyIndex--;
  var snap = DAL.clone(proj.history[proj.historyIndex]);
  delete snap.history; delete snap.versions;
  Object.assign(proj, snap);
  DAL.saveState(); DAL.render();
  DAL.toast('Undone','info');
};

DAL.redo = function(){
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj || proj.historyIndex >= proj.history.length-1){ DAL.toast('Nothing to redo','warning'); return; }
  proj.historyIndex++;
  var snap = DAL.clone(proj.history[proj.historyIndex]);
  delete snap.history; delete snap.versions;
  Object.assign(proj, snap);
  DAL.saveState(); DAL.render();
  DAL.toast('Redone','info');
};

/* --- Word Count Helpers --- */
DAL.getProjectWordCount = function(proj){
  var manuscript = 0, supplementary = 0;
  if(proj.chapters){
    proj.chapters.forEach(function(ch){ manuscript += DAL.countWords(ch.contentHTML); });
  }
  if(proj.adventure && proj.adventure.nodes){
    proj.adventure.nodes.forEach(function(n){ manuscript += DAL.countWordsText(n.text); });
  }
  if(proj.characters){
    proj.characters.forEach(function(c){
      supplementary += DAL.countWordsText(c.appearance) + DAL.countWordsText(c.personality) + DAL.countWordsText(c.backstory) + DAL.countWordsText(c.arc);
    });
  }
  if(proj.lore && proj.lore.entries){
    proj.lore.entries.forEach(function(e){ supplementary += DAL.countWordsText(e.content); });
  }
  if(proj.plots){
    proj.plots.forEach(function(p){ supplementary += DAL.countWordsText(p.description); });
  }
  return { manuscript: manuscript, supplementary: supplementary, total: manuscript + supplementary };
};

DAL.getGlobalWordCount = function(){
  var manuscript = 0, supplementary = 0;
  for(var pid in DAL.state.projects){
    var wc = DAL.getProjectWordCount(DAL.state.projects[pid]);
    manuscript += wc.manuscript;
    supplementary += wc.supplementary;
  }
  return { manuscript: manuscript, supplementary: supplementary, total: manuscript + supplementary };
};

DAL.getDailyWordCount = function(projectId){
  var key = DAL.todayKey();
  var today = DAL.state.wordHistory[key] || { manuscript: 0, supplementary: 0 };
  return today;
};

DAL.updateWordHistory = function(){
  var key = DAL.todayKey();
  var wc = DAL.getGlobalWordCount();
  if(!DAL.state.wordHistory[key]){
    DAL.state.wordHistory[key] = { manuscript: wc.manuscript, supplementary: wc.supplementary };
  } else {
    DAL.state.wordHistory[key] = { manuscript: wc.manuscript, supplementary: wc.supplementary };
  }
};

DAL.getWritingStreak = function(){
  var streak = 0;
  var d = new Date();
  while(true){
    var key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    var hist = DAL.state.wordHistory[key];
    if(hist && (hist.manuscript > 0 || hist.supplementary > 0)){
      streak++;
      d.setDate(d.getDate()-1);
    } else {
      break;
    }
  }
  return streak;
};

/* --- Toast --- */
DAL.toast = function(msg, type){
  var container = document.getElementById('toastContainer');
  if(!container) return;
  var el = document.createElement('div');
  el.className = 'toast ' + (type||'');
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(function(){
    el.classList.add('fade-out');
    setTimeout(function(){ el.remove(); }, 200);
  }, 3000);
};

/* --- Modal --- */
DAL.modal = function(title, contentHTML, opts){
  opts = opts || {};
  DAL.closeModal();
  var backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'modalBackdrop';
  var inner = '<div class="modal' + (opts.wide?' wide':'') + '">';
  inner += '<div class="modal-header"><div class="modal-title">'+DAL.escapeHtml(title)+'</div><button class="modal-close" data-action="close-modal">&times;</button></div>';
  inner += '<div class="modal-body">'+contentHTML+'</div>';
  if(opts.footer) inner += '<div class="modal-footer">'+opts.footer+'</div>';
  inner += '</div>';
  backdrop.innerHTML = inner;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', function(e){
    if(e.target === backdrop) DAL.closeModal();
  });
  return backdrop;
};

DAL.closeModal = function(){
  var b = document.getElementById('modalBackdrop');
  if(b) b.remove();
};

/* --- Tooltip --- */
/* Tooltips are a mouse-hover affordance only.
   On touch screens a tap fires a synthetic `mouseover` but often never fires a
   matching `mouseout`, so the tooltip latched open and floated on top of the
   very buttons it described — which made the phone layout hard to navigate.
   The layer is therefore only wired up on devices that genuinely hover, and it
   is hidden aggressively on any scroll, tap or pointer-down. */
DAL.hasHover = function(){
  return !!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches);
};

DAL.initTooltips = function(){
  if(!DAL.hasHover()) return;

  var tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.id = 'tooltip';
  document.body.appendChild(tip);

  var hide = function(){ tip.classList.remove('visible'); };

  document.addEventListener('mouseover', function(e){
    // A late-arriving touch event must never resurrect the tooltip.
    if(!DAL.hasHover() || window.innerWidth < DAL.BREAKPOINTS.compact) return hide();
    var el = e.target.closest('[data-tip]');
    if(!el) return hide();
    tip.textContent = el.getAttribute('data-tip');
    tip.classList.add('visible');
    var rect = el.getBoundingClientRect();
    // Clamp inside the viewport so the bubble never hangs off an edge.
    var left = rect.left + rect.width/2 - tip.offsetWidth/2;
    left = Math.max(8, Math.min(left, window.innerWidth - tip.offsetWidth - 8));
    var top = rect.bottom + 6;
    if(top + tip.offsetHeight > window.innerHeight - 8) top = rect.top - tip.offsetHeight - 6;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  });
  document.addEventListener('mouseout', function(e){
    if(e.target.closest('[data-tip]')) hide();
  });
  document.addEventListener('pointerdown', hide, true);
  document.addEventListener('touchstart', hide, { passive: true, capture: true });
  window.addEventListener('scroll', hide, { passive: true, capture: true });
  window.addEventListener('blur', hide);
};

/* --- Folder Sync (File System Access API) --- */
DAL.folderHandles = {};

DAL.linkFolder = async function(projectId){
  if(!window.showDirectoryPicker){
    DAL.toast('Folder sync requires Chrome or Edge. Use Export instead.','warning');
    return;
  }
  try{
    var handle = await window.showDirectoryPicker();
    DAL.folderHandles[projectId] = handle;
    var proj = DAL.state.projects[projectId];
    if(proj){ proj.linkedFolderName = handle.name; }
    DAL.toast('Folder linked: '+handle.name, 'success');
    DAL.saveState(true);
    DAL.syncFolder();
  } catch(e){
    if(e.name !== 'AbortError') DAL.toast('Failed to link folder: '+e.message, 'error');
  }
};

DAL.syncFolder = async function(){
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj) return;
  var handle = DAL.folderHandles[DAL.currentProjectId];
  if(!handle) return;
  try{
    // Write project.json
    var data = DAL.clone(proj);
    delete data.folderHandle;
    await DAL.writeFile(handle, 'project.json', JSON.stringify(data, null, 2));
    // Write chapters
    if(proj.chapters && proj.chapters.length){
      var chDir = await DAL.getDir(handle, 'chapters');
      for(var i=0; i<proj.chapters.length; i++){
        var ch = proj.chapters[i];
        var fname = String(i+1).padStart(2,'0')+'-'+DAL.sanitizeFilename(ch.title)+'.txt';
        var tmp = document.createElement('div'); tmp.innerHTML = ch.contentHTML;
        await DAL.writeFile(chDir, fname, tmp.textContent);
      }
    }
    // Write characters
    if(proj.characters && proj.characters.length){
      var chDir2 = await DAL.getDir(handle, 'characters');
      for(var j=0; j<proj.characters.length; j++){
        var c = proj.characters[j];
        await DAL.writeFile(chDir2, DAL.sanitizeFilename(c.name)+'.txt', c.backstory||'');
      }
    }
    // Write lore
    if(proj.lore && proj.lore.entries && proj.lore.entries.length){
      var loreDir = await DAL.getDir(handle, 'lore');
      for(var k=0; k<proj.lore.entries.length; k++){
        var entry = proj.lore.entries[k];
        var entryDir = await DAL.getDir(loreDir, DAL.sanitizeFilename(entry.folder||'miscellaneous'));
        await DAL.writeFile(entryDir, DAL.sanitizeFilename(entry.title)+'.txt', entry.content||'');
      }
    }
    // Write plots
    if(proj.plots && proj.plots.length){
      var plotDir = await DAL.getDir(handle, 'plots');
      for(var m=0; m<proj.plots.length; m++){
        var p = proj.plots[m];
        await DAL.writeFile(plotDir, DAL.sanitizeFilename(p.title)+'.txt', p.description||'');
      }
    }
  } catch(e){
    DAL.toast('Folder sync error: '+e.message, 'error');
  }
};

DAL.getDir = async function(parent, name){
  try{ return await parent.getDirectoryHandle(name, {create:true}); }
  catch(e){ return null; }
};

DAL.writeFile = async function(dir, name, content){
  if(!dir) return;
  try{
    var file = await dir.getFileHandle(name, {create:true});
    var writable = await file.createWritable();
    await writable.write(content);
    await writable.close();
  } catch(e){ /* silent */ }
};

/* --- Theme --- */
DAL.setTheme = function(theme){
  DAL.state.appTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  DAL.saveState(true);
};

DAL.loadCustomFonts = function(){
  DAL.state.customFonts.forEach(function(f){
    var face = new FontFace(f.name, 'url('+f.dataUrl+')');
    face.load().then(function(loadedFace){
      document.fonts.add(loadedFace);
    }).catch(function(){});
  });
};

DAL.getFontList = function(){
  var system = ['Georgia','Cambria','Times New Roman','Garamond','Palatino','Book Antiqua','Courier New','Verdana','Tahoma','Trebuchet MS','Arial','Helvetica','Calibri','Cambria','Constantia','Serif','Sans-serif'];
  var custom = DAL.state.customFonts.map(function(f){ return f.name; });
  return system.concat(custom);
};

/* --- Routing --- */
DAL.navigate = function(view, projectId, tool){
  DAL.currentView = view;
  DAL.currentProjectId = projectId || null;
  DAL.currentTool = tool || null;
  DAL.selectedChapterId = null;
  DAL.selectedCharId = null;
  DAL.selectedPlotId = null;
  DAL.selectedLoreEntry = null;
  DAL.selectedNodeId = null;
  DAL.connectMode = false;
  DAL.distractionFree = false;
  DAL.render();
};

/* --- Main Render --- */
DAL.render = function(){
  // Theme
  document.documentElement.setAttribute('data-theme', DAL.state.appTheme);
  // Build shell if needed
  var app = document.getElementById('app');
  if(!app){
    app = DAL.buildShell();
  }
  // Sidebar + mobile tab bar active state
  document.querySelectorAll('.nav-item,.mtab').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('data-nav') === DAL.currentView);
  });
  // The project workspace is its own full-height shell with its own back
  // button and tool rail, so the global tab bar steps aside there.
  app.classList.toggle('in-workspace', DAL.currentView === 'workspace');
  // Collapse state
  document.querySelector('.sidebar')?.classList.toggle('collapsed', DAL.state.sidebarCollapsed);
  if(DAL.ensureScrim) DAL.ensureScrim();

  // Render content
  var content = document.getElementById('content');
  var topTitle = document.getElementById('topTitle');
  var searchBox = document.getElementById('searchBox');

  if(DAL.currentView === 'workspace' && DAL.currentProjectId){
    var proj = DAL.state.projects[DAL.currentProjectId];
    if(!proj){
      DAL.currentView = 'projects';
      DAL.render();
      return;
    }
    DAL.renderWorkspace(proj);
    return;
  }

  // Non-workspace views
  searchBox.style.display = 'none';
  // The workspace sets inline padding:0 on #content for its own full-bleed
  // shell. Clear it on the way out so the normal views get their gutters (and
  // their mobile safe-area / tab-bar spacing) back instead of sitting edge to
  // edge against the screen.
  content.style.padding = '';

  if(DAL.currentView === 'dashboard'){
    if(topTitle) topTitle.textContent = 'Dashboard';
    content.innerHTML = DAL.renderDashboard();
  } else if(DAL.currentView === 'projects'){
    if(topTitle) topTitle.textContent = 'Projects';
    content.innerHTML = DAL.renderProjects();
  } else if(DAL.currentView === 'library'){
    if(topTitle) topTitle.textContent = 'Library';
    content.innerHTML = DAL.renderLibrary();
  } else if(DAL.currentView === 'settings'){
    if(topTitle) topTitle.textContent = 'Settings';
    content.innerHTML = DAL.renderSettings();
  }

  DAL.afterRender();
};

DAL.afterRender = function(){
  // Hook for view-specific post-render
};

/* --- App Shell --- */
DAL.buildShell = function(){
  var app = document.createElement('div');
  app.id = 'app';
  app.innerHTML =
    '<aside class="sidebar" id="sidebar">'+
      '<div class="sidebar-logo">'+
        '<img src="logo.png" alt="Draft A Lore">'+
        '<span class="brand-text">Draft A Lore</span>'+
      '</div>'+
      '<nav class="sidebar-nav">'+
        '<div class="nav-item" data-nav="dashboard" data-action="nav-dashboard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span class="nav-label">Dashboard</span></div>'+
        '<div class="nav-item" data-nav="projects" data-action="nav-projects"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span class="nav-label">Projects</span></div>'+
        '<div class="nav-item" data-nav="settings" data-action="nav-settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span class="nav-label">Settings</span></div>'+
      '</nav>'+
    '</aside>'+
    '<div class="main">'+
      '<div class="topbar">'+
        '<button class="topbar-btn" data-action="toggle-sidebar" data-tip="Toggle sidebar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></button>'+
        '<div class="topbar-title" id="topTitle">Dashboard</div>'+
        '<div class="search-box" id="searchBox" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" id="searchInput" placeholder="Search project..." data-action="search"></div>'+
        '<button class="topbar-btn" data-action="undo" data-tip="Undo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg></button>'+
        '<button class="topbar-btn" data-action="redo" data-tip="Redo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg></button>'+
        '<div class="save-status"><div class="save-dot" id="saveDot"></div><span id="saveText">Saved</span></div>'+
      '</div>'+
      '<div class="content" id="content"></div>'+
    '</div>'+
    /* Mobile primary navigation. Phones don't get the off-canvas drawer at all:
       a thumb-reachable bottom tab bar replaces it, so the four top-level
       destinations are always one tap away and nothing overlaps the content. */
    '<nav class="mobile-tabbar" id="mobileTabbar" aria-label="Main">'+
      '<button class="mtab" data-nav="dashboard" data-action="nav-dashboard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg><span>Dashboard</span></button>'+
      '<button class="mtab" data-nav="projects" data-action="nav-projects"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span>Projects</span></button>'+
      '<button class="mtab" data-nav="library" data-action="nav-library"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 4h4v16H4z"/><path d="M10 4h4v16h-4z"/><path d="M17.5 4.5l3.2.8-3.4 14.2-3.2-.8z"/></svg><span>Library</span></button>'+
      '<button class="mtab" data-nav="settings" data-action="nav-settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span>Settings</span></button>'+
    '</nav>'+
    '<div class="toast-container" id="toastContainer"></div>';
  document.body.innerHTML = '';
  document.body.appendChild(app);
  DAL.initTooltips();
  return app;
};

/* --- Adaptive Viewport ---
   Keeps the shell usable from 320px phones up to 4K desktops, and on any
   window size in between. Sets a viewport bucket on <html> that the stylesheet
   reacts to, tracks the real visible height (mobile browser chrome / on-screen
   keyboards lie about 100vh), and auto-collapses the sidebar on narrow
   viewports without overriding a deliberate user toggle. */
DAL.BREAKPOINTS = { compact: 760, medium: 1050, wide: 1600 };

DAL.viewportBucket = function(w){
  if(w < DAL.BREAKPOINTS.compact) return 'compact';
  if(w < DAL.BREAKPOINTS.medium) return 'snug';
  if(w < DAL.BREAKPOINTS.wide) return 'medium';
  return 'wide';
};

DAL.applyViewport = function(){
  var root = document.documentElement;
  var w = window.innerWidth || root.clientWidth || 1024;
  var vv = window.visualViewport;
  var h = (vv && vv.height) || window.innerHeight || root.clientHeight || 768;
  var bucket = DAL.viewportBucket(w);

  root.setAttribute('data-viewport', bucket);
  root.style.setProperty('--app-h', h + 'px');
  root.style.setProperty('--vw', w + 'px');
  // Device pixel ratio bucket lets the CSS thin hairlines on HiDPI panels.
  root.setAttribute('data-dpr', (window.devicePixelRatio || 1) >= 2 ? 'high' : 'std');

  // Narrow viewports: sidebar becomes an off-canvas drawer, closed by default.
  var narrow = w < DAL.BREAKPOINTS.medium;
  if(narrow !== DAL._wasNarrow){
    if(narrow){
      DAL._deskCollapsed = DAL.state.sidebarCollapsed;
      DAL.state.sidebarCollapsed = true;
    } else if(typeof DAL._deskCollapsed === 'boolean'){
      DAL.state.sidebarCollapsed = DAL._deskCollapsed;
    }
    DAL._wasNarrow = narrow;
    document.querySelector('.sidebar')?.classList.toggle('collapsed', DAL.state.sidebarCollapsed);
  }
  return bucket;
};

// Scrim: tap outside the drawer to close it on touch / narrow layouts.
DAL.ensureScrim = function(){
  var app = document.getElementById('app');
  if(!app || document.getElementById('navScrim')) return;
  var scrim = document.createElement('div');
  scrim.id = 'navScrim';
  scrim.className = 'nav-scrim';
  scrim.addEventListener('click', function(){
    DAL.state.sidebarCollapsed = true;
    DAL.saveState(true);
    document.querySelector('.sidebar')?.classList.add('collapsed');
  });
  app.appendChild(scrim);
};

DAL.initAdaptive = function(){
  var last = DAL.applyViewport();
  var raf = 0;
  var onResize = function(){
    if(raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      var bucket = DAL.applyViewport();
      // Only re-render when the layout bucket actually changes; pure pixel
      // resizes are handled by CSS alone so typing is never interrupted.
      if(bucket !== last){
        last = bucket;
        if(!DAL._suppressResizeRender) DAL.render();
      }
    });
  };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
  if(window.visualViewport) window.visualViewport.addEventListener('resize', onResize, { passive: true });

  DAL.ensureScrim();
};

/* --- Init --- */
DAL.init = function(){
  DAL.loadState();
  DAL.loadCustomFonts();
  DAL.buildShell();
  DAL.initAdaptive();
  DAL.render();

  // Restore folder handles on load (need re-permission)
  // Note: File System Access API handles don't persist across sessions without re-granting

  // Auto-version check
  setInterval(function(){ DAL.checkVersionSnapshot(); }, 60000);
  // Word history update
  setInterval(function(){ DAL.updateWordHistory(); }, 30000);
};

/* --- Event Delegation --- */
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-action]');
  if(!el) return;
  var action = el.getAttribute('data-action');
  e.preventDefault();
  e.stopPropagation();

  // Navigation
  if(action === 'nav-dashboard') DAL.navigate('dashboard');
  else if(action === 'nav-projects') DAL.navigate('projects');
  else if(action === 'nav-settings') DAL.navigate('settings');
  else if(action === 'nav-library') DAL.navigate('library');
  else if(action === 'toggle-sidebar'){ DAL.state.sidebarCollapsed = !DAL.state.sidebarCollapsed; DAL.saveState(true); DAL.render(); }
  else if(action === 'undo') DAL.undo();
  else if(action === 'redo') DAL.redo();
  else if(action === 'close-modal') DAL.closeModal();

  // Delegates to view-specific handlers
  if(DAL.handleClick) DAL.handleClick(action, el, e);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e){
  if(e.ctrlKey || e.metaKey){
    if(e.key === 'z' && !e.shiftKey){ if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable){ e.preventDefault(); DAL.undo(); } }
    else if(e.key === 'y' || (e.key === 'z' && e.shiftKey)){ if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable){ e.preventDefault(); DAL.redo(); } }
    else if(e.key === 's'){ e.preventDefault(); DAL.saveState(true); DAL.toast('Saved','success'); }
  }
  if(e.key === 'Escape'){
    if(DAL.distractionFree){ DAL.distractionFree = false; document.body.classList.remove('distraction-free'); DAL.render(); }
    else { DAL.closeModal(); }
  }
});
