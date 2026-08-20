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
    // Deliberately 1, not the current version: a saved state that predates this
    // field must fall through to the migration rather than be assumed current.
    historyVersion: 1,
    wordBaseline: null,
    dashboardLayout: { order: [], hidden: [], size: {} },
    analyticsRange: '30d',
    sidebarCollapsed: false,
    autosave: true
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
    // A target of 0 means "no goal set", which is the honest default: a project
    // should not pretend to have a finish line nobody chose.
    goal: { target: 0, deadline: '' },
    // Zoom/scroll per board, filled in on first use by DAL.canvasView.
    canvasView: {},
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
      {id: DAL.uid('stat'), key:'health', label:'Health', type:'number', default:100, min:0, max:100},
      {id: DAL.uid('stat'), key:'gold', label:'Gold', type:'number', default:0, min:0, max:''}
    ],
    traits: [],
    items: [],
    nodes: [],
    /* How locked choices read to the reader, plus stat thresholds that end a
       run. Adventures saved before these existed fall back to the same
       defaults in DAL.rpg.rules. */
    rules: { lockedChoices: 'lock', failures: [] },
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
/* Grab mode is a sticky canvas mode but deliberately not saved: reopening a
   board should always start in ordinary editing mode. */
DAL.grabMode = false;
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
  DAL.migrateWordHistory();
  DAL.normalizeDashboardLayout();
  if(!DAL.analyticsRange(DAL.state.analyticsRange)) DAL.state.analyticsRange = '30d';
  // Normalise the autosave flag to a real boolean so the toggle always reads
  // on/off cleanly (older saved states have no field at all → default on).
  DAL.state.autosave = (DAL.state.autosave !== false);
};

DAL.saveState = function(immediate){
  if(immediate){ DAL._doSave(); return; }
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
  var indicators = document.querySelectorAll('.save-status');
  var cls, label, tooltip;
  if(status === 'saving'){ cls = 'saving'; label = 'Saving…'; tooltip = 'Saving on this device…'; }
  else if(status === 'error'){ cls = 'error'; label = 'Error'; tooltip = 'Couldn\'t save on this device'; }
  else if(status === 'unsaved'){ cls = 'unsaved'; label = 'Unsaved'; tooltip = 'Not yet saved on this device'; }
  else { cls = 'ripple'; label = 'Saved'; tooltip = 'Saved on this device'; }
  dots.forEach(function(dot){ dot.className = 'save-dot ' + cls; });
  texts.forEach(function(t){ t.textContent = label; });
  indicators.forEach(function(indicator){ indicator.title = tooltip; });
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

/* The manuscript editor is a contenteditable, so the browser already keeps an
   undo/redo stack for typing, paste and formatting. The toolbar buttons (and
   Ctrl+Z when the editor isn't focused) should drive THAT stack rather than the
   project-level structural history, which only records add/delete operations.
   We track whichever contenteditable was last focused so the buttons work even
   after focus leaves the editor (e.g. you clicked the Undo button). */
DAL._activeEditor = null;

DAL._liveEditor = function(){
  var ed = DAL._activeEditor;
  if(!ed || !document.body.contains(ed)){ ed = document.getElementById('editorContent'); }
  return (ed && document.body.contains(ed)) ? ed : null;
};

DAL._driveEditorCommand = function(cmd, label){
  var ed = DAL._liveEditor();
  if(!ed) return false;
  ed.focus();
  try{
    if(!document.queryCommandEnabled(cmd)) return false;
    document.execCommand(cmd, false, null);
  }catch(e){ return false; }
  // execCommand fires an 'input' event so the editor's own handler syncs the
  // chapter content + word count + debounced save. Re-sync manually as a safety
  // net in case a browser fails to dispatch 'input'.
  DAL._syncEditor(ed);
  DAL.toast(label, 'info');
  return true;
};

DAL._syncEditor = function(ed){
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj || !proj.chapters) return;
  var ch = proj.chapters.find(function(c){ return c.id === DAL.selectedChapterId; });
  if(!ch) return;
  ch.contentHTML = ed.innerHTML;
  ch.updatedAt = Date.now();
  // Match the manuscript's own input handler: with autosave off, an undo/redo
  // keystroke shouldn't force a write either — just flag the status dirty.
  if(DAL.state.autosave === false){ DAL.setSaveStatus('unsaved'); }
  else { DAL.saveState(); }
  var wc = DAL.countWords(ed.innerHTML);
  var area = ed.closest('.editor-area');
  var footer = area ? area.querySelector('.editor-footer span') : null;
  if(footer) footer.textContent = wc + ' words';
};

DAL.undo = function(){
  if(DAL._driveEditorCommand('undo', 'Text change undone')) return;
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj || proj.historyIndex <= 0){ DAL.toast('No project change to undo','warning'); return; }
  proj.historyIndex--;
  var snap = DAL.clone(proj.history[proj.historyIndex]);
  delete snap.history; delete snap.versions;
  Object.assign(proj, snap);
  DAL.saveState(); DAL.render();
  DAL.toast('Project change undone','info');
};

DAL.redo = function(){
  if(DAL._driveEditorCommand('redo', 'Text change redone')) return;
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj || proj.historyIndex >= proj.history.length-1){ DAL.toast('No project change to redo','warning'); return; }
  proj.historyIndex++;
  var snap = DAL.clone(proj.history[proj.historyIndex]);
  delete snap.history; delete snap.versions;
  Object.assign(proj, snap);
  DAL.saveState(); DAL.render();
  DAL.toast('Project change redone','info');
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

/* --- Daily word history ----------------------------------------------------
   Each entry in wordHistory is the number of words *written on that day*, keyed
   by local calendar date. Earlier versions stored a running lifetime total in
   the same place, which made every goal fill up permanently and never reset, so
   saved histories are converted once by DAL.migrateWordHistory below.

   Deltas are derived by comparing the live word count against a stored
   baseline. The baseline is the count as of the last time this ran, so the
   difference is what changed since then. */
DAL.HISTORY_VERSION = 2;

DAL.dateKey = function(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
};

DAL.parseDateKey = function(key){
  var p = String(key).split('-');
  // Constructed as local midnight on purpose. new Date('2026-08-19') parses as
  // UTC and lands on the previous day for anyone west of Greenwich.
  return new Date(parseInt(p[0],10), parseInt(p[1],10) - 1, parseInt(p[2],10));
};

/* Words written on one day, tolerating entries that predate this shape. */
DAL.dayWords = function(key){
  var e = DAL.state.wordHistory[key];
  if(!e) return { manuscript: 0, supplementary: 0, total: 0 };
  var m = (typeof e.manuscript === 'number' && isFinite(e.manuscript)) ? Math.max(0, e.manuscript) : 0;
  var s = (typeof e.supplementary === 'number' && isFinite(e.supplementary)) ? Math.max(0, e.supplementary) : 0;
  return { manuscript: m, supplementary: s, total: m + s };
};

/* Converts a legacy cumulative history into per-day deltas exactly once. The
   original snapshots are kept under wordHistoryCumulative rather than thrown
   away, so nothing is lost if the conversion ever needs revisiting. */
DAL.migrateWordHistory = function(){
  if(DAL.state.historyVersion === DAL.HISTORY_VERSION) return;

  var keys = Object.keys(DAL.state.wordHistory || {}).filter(function(k){
    return /^\d{4}-\d{2}-\d{2}$/.test(k);
  }).sort();

  if(keys.length){
    DAL.state.wordHistoryCumulative = DAL.clone(DAL.state.wordHistory);
    var prevM = 0, prevS = 0, deltas = {};
    keys.forEach(function(k){
      var e = DAL.state.wordHistory[k] || {};
      var m = (typeof e.manuscript === 'number' && isFinite(e.manuscript)) ? e.manuscript : 0;
      var s = (typeof e.supplementary === 'number' && isFinite(e.supplementary)) ? e.supplementary : 0;
      // A running total only ever rises, so a drop means words were deleted.
      // Those days get 0 written rather than a negative figure.
      deltas[k] = { manuscript: Math.max(0, m - prevM), supplementary: Math.max(0, s - prevS) };
      prevM = m; prevS = s;
    });
    DAL.state.wordHistory = deltas;
    // The last cumulative snapshot becomes the baseline, so the first day after
    // upgrading counts only what is written from here on.
    DAL.state.wordBaseline = { manuscript: prevM, supplementary: prevS };
  }

  DAL.state.historyVersion = DAL.HISTORY_VERSION;
};

DAL.getDailyWordCount = function(){
  return DAL.dayWords(DAL.todayKey());
};

DAL.updateWordHistory = function(){
  var key = DAL.todayKey();
  var wc = DAL.getGlobalWordCount();
  var base = DAL.state.wordBaseline;

  // With no baseline there is nothing to compare against, so the current count
  // becomes the starting point instead of being logged as a day's work.
  if(!base || typeof base.manuscript !== 'number' || typeof base.supplementary !== 'number'){
    DAL.state.wordBaseline = { manuscript: wc.manuscript, supplementary: wc.supplementary };
    return;
  }

  var dm = wc.manuscript - base.manuscript;
  var ds = wc.supplementary - base.supplementary;
  DAL.state.wordBaseline = { manuscript: wc.manuscript, supplementary: wc.supplementary };
  if(dm === 0 && ds === 0) return;

  var today = DAL.state.wordHistory[key];
  if(!today) today = DAL.state.wordHistory[key] = { manuscript: 0, supplementary: 0 };
  // Deleting text reduces today's figure but never past zero: a day cannot have
  // a negative amount of writing in it, and earlier days are already settled.
  today.manuscript = Math.max(0, today.manuscript + dm);
  today.supplementary = Math.max(0, today.supplementary + ds);
};

/* --- Goal periods ----------------------------------------------------------
   Every goal measures a calendar period that resets on its own boundary, which
   is what makes a goal reachable more than once. */
DAL.goalPeriodStart = function(period, from){
  var d = from ? new Date(from) : new Date();
  d.setHours(0,0,0,0);
  if(period === 'daily') return d;
  if(period === 'weekly'){
    // Weeks start Monday: getDay() returns 0 for Sunday, which belongs to the
    // week just ending rather than the one beginning.
    var back = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - back);
    return d;
  }
  if(period === 'monthly') return new Date(d.getFullYear(), d.getMonth(), 1);
  if(period === 'half') return new Date(d.getFullYear(), d.getMonth() < 6 ? 0 : 6, 1);
  if(period === 'yearly') return new Date(d.getFullYear(), 0, 1);
  return d;
};

DAL.MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

DAL.goalPeriodLabel = function(period){
  var now = new Date();
  if(period === 'daily') return 'Today';
  if(period === 'weekly') return 'This week';
  if(period === 'monthly') return DAL.MONTHS_SHORT[now.getMonth()] + ' ' + now.getFullYear();
  if(period === 'half') return (now.getMonth() < 6 ? 'Jan–Jun ' : 'Jul–Dec ') + now.getFullYear();
  if(period === 'yearly') return String(now.getFullYear());
  return '';
};

/* Words written from a start date through today, inclusive. */
DAL.wordsSince = function(start){
  var d = new Date(start); d.setHours(0,0,0,0);
  var end = new Date(); end.setHours(0,0,0,0);
  var m = 0, s = 0;
  while(d <= end){
    var day = DAL.dayWords(DAL.dateKey(d));
    m += day.manuscript; s += day.supplementary;
    d.setDate(d.getDate() + 1);
  }
  return { manuscript: m, supplementary: s, total: m + s };
};

DAL.goalProgress = function(period){
  return DAL.wordsSince(DAL.goalPeriodStart(period));
};

DAL.getWritingStreak = function(){
  var d = new Date(); d.setHours(0,0,0,0);
  // A streak should not read zero all morning just because today's writing has
  // not started yet, so an empty today rolls the count back to yesterday.
  if(DAL.dayWords(DAL.dateKey(d)).total === 0) d.setDate(d.getDate() - 1);
  var streak = 0;
  while(DAL.dayWords(DAL.dateKey(d)).total > 0){
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};

/* --- Per-project goals -----------------------------------------------------
   The target lives on the project rather than in global state, so it travels
   with the project through export and import. */
DAL.projectGoal = function(proj){
  if(!proj) return { target: 0, deadline: '' };
  // Projects saved before goals existed have no field at all, so read defensively
  // and repair in place rather than rewriting every project on load.
  if(!proj.goal || typeof proj.goal !== 'object') proj.goal = { target: 0, deadline: '' };
  var t = parseInt(proj.goal.target, 10);
  proj.goal.target = isNaN(t) || t < 0 ? 0 : t;
  if(typeof proj.goal.deadline !== 'string') proj.goal.deadline = '';
  return proj.goal;
};

/* Everything the goal card needs about one project, in one pass. */
DAL.projectGoalStats = function(proj){
  var goal = DAL.projectGoal(proj);
  var words = DAL.getProjectWordCount(proj).total;
  var stats = {
    target: goal.target,
    deadline: goal.deadline,
    words: words,
    set: goal.target > 0,
    remaining: Math.max(0, goal.target - words),
    percent: goal.target > 0 ? Math.min(100, Math.round((words / goal.target) * 100)) : 0,
    done: goal.target > 0 && words >= goal.target,
    daysLeft: null,
    overdue: false,
    perDay: null
  };

  var due = goal.deadline ? DAL.parseDateKey(goal.deadline) : null;
  if(due){
    var today = new Date(); today.setHours(0,0,0,0);
    // Counting today as a day you can still write in keeps the pace figure from
    // jumping to infinity on the final day.
    stats.daysLeft = Math.round((due - today) / 86400000) + 1;
    stats.overdue = stats.daysLeft < 1 && !stats.done;
    if(stats.set && !stats.done && stats.daysLeft >= 1){
      stats.perDay = Math.ceil(stats.remaining / stats.daysLeft);
    }
  }
  return stats;
};

/* Longest run of consecutive written days anywhere in the history. Walking the
   sorted keys is enough: gaps in the keys are gaps in the streak, so there is no
   need to visit every calendar day in between. */
DAL.getLongestStreak = function(){
  var keys = Object.keys(DAL.state.wordHistory || {}).filter(function(k){
    return DAL.dayWords(k).total > 0;
  }).sort();
  var best = 0, run = 0, prev = null;
  keys.forEach(function(k){
    var day = DAL.parseDateKey(k);
    if(!day) return;
    if(prev && Math.round((day - prev) / 86400000) === 1) run++;
    else run = 1;
    if(run > best) best = run;
    prev = day;
  });
  return best;
};

/* --- Analytics buckets -----------------------------------------------------
   Short ranges are read day by day; longer ones would be an unreadable forest
   of hairline bars, so they group into weeks or months. */
DAL.ANALYTICS_RANGES = [
  { id: '7d',  label: '7 days',   unit: 'day',   count: 7 },
  { id: '30d', label: '30 days',  unit: 'day',   count: 30 },
  { id: '12w', label: '12 weeks', unit: 'week',  count: 12 },
  { id: '12m', label: '12 months', unit: 'month', count: 12 }
];

DAL.analyticsRange = function(id){
  return DAL.ANALYTICS_RANGES.find(function(r){ return r.id === id; }) || DAL.ANALYTICS_RANGES[0];
};

/* Returns { buckets, total, days, average, range } where each bucket carries a
   short axis label, a full label for screen readers and tooltips, and the words
   written inside it. */
DAL.wordBuckets = function(rangeId){
  var range = DAL.analyticsRange(rangeId);
  var today = new Date(); today.setHours(0,0,0,0);
  var buckets = [];

  if(range.unit === 'day'){
    // Long day ranges label roughly every fifth column plus the first and last,
    // which is enough to orient a reader without the labels colliding.
    var every = range.count > 14 ? 5 : 1;
    for(var i = range.count - 1; i >= 0; i--){
      var d = new Date(today); d.setDate(d.getDate() - i);
      var tick = every === 1 || i === 0 || i === range.count - 1 || (range.count - 1 - i) % every === 0;
      buckets.push({
        start: new Date(d), end: new Date(d),
        axis: tick ? DAL.MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate() : '',
        full: DAL.longDate(d),
        words: DAL.dayWords(DAL.dateKey(d)).total
      });
    }
  } else if(range.unit === 'week'){
    var wkStart = DAL.goalPeriodStart('weekly');
    for(var w = range.count - 1; w >= 0; w--){
      var ws = new Date(wkStart); ws.setDate(ws.getDate() - w * 7);
      var we = new Date(ws); we.setDate(we.getDate() + 6);
      buckets.push({
        start: ws, end: we,
        axis: DAL.MONTHS_SHORT[ws.getMonth()] + ' ' + ws.getDate(),
        full: 'Week of ' + DAL.longDate(ws),
        words: DAL.rangeWords(ws, we)
      });
    }
  } else {
    for(var m = range.count - 1; m >= 0; m--){
      var ms = new Date(today.getFullYear(), today.getMonth() - m, 1);
      var me = new Date(ms.getFullYear(), ms.getMonth() + 1, 0);
      buckets.push({
        start: ms, end: me,
        // No year on the axis: at twelve columns it collides with its neighbours
        // on a phone, and the full month and year are in the readout anyway.
        axis: DAL.MONTHS_SHORT[ms.getMonth()],
        full: DAL.MONTHS_SHORT[ms.getMonth()] + ' ' + ms.getFullYear(),
        words: DAL.rangeWords(ms, me)
      });
    }
  }

  var total = buckets.reduce(function(a, b){ return a + b.words; }, 0);
  // The average is per day across the whole span, not per bucket, so switching
  // between weekly and monthly grouping does not change what it means.
  var spanDays = Math.round((buckets[buckets.length-1].end - buckets[0].start) / 86400000) + 1;
  return {
    range: range, buckets: buckets, total: total,
    days: spanDays,
    average: spanDays > 0 ? Math.round(total / spanDays) : 0
  };
};

/* Words written between two dates, inclusive, ignoring anything after today. */
DAL.rangeWords = function(start, end){
  var d = new Date(start); d.setHours(0,0,0,0);
  var stop = new Date(end); stop.setHours(0,0,0,0);
  var today = new Date(); today.setHours(0,0,0,0);
  if(stop > today) stop = today;
  var n = 0;
  while(d <= stop){
    n += DAL.dayWords(DAL.dateKey(d)).total;
    d.setDate(d.getDate() + 1);
  }
  return n;
};

DAL.longDate = function(d){
  return DAL.MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
};



/* --- Dashboard layout ------------------------------------------------------
   The Dashboard is a registry of cards rather than one fixed block of markup,
   so the reader can reorder, resize, hide and restore them in "Organize
   Dashboard" mode. The registry is the single source of truth for which cards
   exist; saved layout state only ever *references* these ids. That means a card
   added in a later version still appears for someone whose saved order predates
   it, and an id left behind by a removed card is ignored rather than breaking
   the grid.

   `tall` marks the data-heavy cards that are allowed a taller height; the rest
   are always normal height because there is nothing to gain from the extra
   room. `alwaysFull` marks cards whose content cannot survive a half-width
   column at any viewport. */
DAL.DASHBOARD_CARDS = [
  { id: 'continue',     label: 'Continue Writing',  defaultW: 'full', alwaysFull: true },
  { id: 'profile',      label: 'Author Profile',    defaultW: 'full', alwaysFull: true },
  { id: 'wordGraph',    label: 'Word Output',       defaultW: 'full', tall: true },
  { id: 'heatmap',      label: 'Writing Activity',  defaultW: 'half', tall: true },
  { id: 'totals',       label: 'Word Count',        defaultW: 'half' },
  { id: 'streak',       label: 'Writing Streak',    defaultW: 'half' },
  { id: 'goals',        label: 'Writing Goals',     defaultW: 'full', tall: true },
  { id: 'projectGoals', label: 'Project Goals',     defaultW: 'full', tall: true }
];

DAL.dashboardCard = function(id){
  return DAL.DASHBOARD_CARDS.find(function(c){ return c.id === id; }) || null;
};

// Organize mode is deliberately transient: it is a thing you step into to
// rearrange the page, never a state you can get stuck in across a reload.
DAL.organizeDashboard = false;

/* Repairs whatever is in saved state into a usable layout without discarding
   the reader's choices. Missing fields are created, unknown ids are dropped,
   and any registry card the saved order never knew about is appended in its
   registry position so new cards surface instead of silently vanishing. */
DAL.normalizeDashboardLayout = function(){
  var known = DAL.DASHBOARD_CARDS.map(function(c){ return c.id; });
  var saved = DAL.state.dashboardLayout;
  if(!saved || typeof saved !== 'object') saved = {};

  var order = Array.isArray(saved.order) ? saved.order.filter(function(id, i, arr){
    return known.indexOf(id) !== -1 && arr.indexOf(id) === i;
  }) : [];
  // Append any card the saved order predates, keeping registry order among the
  // newcomers so a version bump produces a sensible page rather than a jumble.
  known.forEach(function(id){ if(order.indexOf(id) === -1) order.push(id); });

  var hidden = Array.isArray(saved.hidden) ? saved.hidden.filter(function(id, i, arr){
    return known.indexOf(id) !== -1 && arr.indexOf(id) === i;
  }) : [];

  var size = {};
  var savedSize = (saved.size && typeof saved.size === 'object') ? saved.size : {};
  known.forEach(function(id){
    var card = DAL.dashboardCard(id);
    var s = savedSize[id] || {};
    var w = (s.w === 'half' || s.w === 'full') ? s.w : card.defaultW;
    if(card.alwaysFull) w = 'full';
    var h = (s.h === 'tall' && card.tall) ? 'tall' : 'normal';
    size[id] = { w: w, h: h };
  });

  DAL.state.dashboardLayout = { order: order, hidden: hidden, size: size };
  return DAL.state.dashboardLayout;
};

DAL.dashboardLayout = function(){
  return DAL.normalizeDashboardLayout();
};

DAL.isCardHidden = function(id){
  return DAL.dashboardLayout().hidden.indexOf(id) !== -1;
};

DAL.moveDashboardCard = function(id, delta){
  var layout = DAL.dashboardLayout();
  // Reordering happens among visible cards only. Stepping over a hidden card
  // would look like a dead button press, since nothing on screen would move.
  var visible = layout.order.filter(function(cid){ return layout.hidden.indexOf(cid) === -1; });
  var from = visible.indexOf(id);
  var to = from + delta;
  if(from === -1 || to < 0 || to >= visible.length) return false;
  var neighbour = visible[to];
  var a = layout.order.indexOf(id), b = layout.order.indexOf(neighbour);
  layout.order[a] = neighbour;
  layout.order[b] = id;
  DAL.saveState(true);
  return true;
};

DAL.setDashboardCardHidden = function(id, hidden){
  var layout = DAL.dashboardLayout();
  var at = layout.hidden.indexOf(id);
  if(hidden && at === -1) layout.hidden.push(id);
  else if(!hidden && at !== -1) layout.hidden.splice(at, 1);
  DAL.saveState(true);
};

DAL.setDashboardCardSize = function(id, key, value){
  var card = DAL.dashboardCard(id);
  if(!card) return;
  var layout = DAL.dashboardLayout();
  var size = layout.size[id] || { w: card.defaultW, h: 'normal' };
  if(key === 'w' && !card.alwaysFull && (value === 'half' || value === 'full')) size.w = value;
  if(key === 'h' && card.tall && (value === 'normal' || value === 'tall')) size.h = value;
  layout.size[id] = size;
  DAL.saveState(true);
};

DAL.resetDashboardLayout = function(){
  DAL.state.dashboardLayout = { order: [], hidden: [], size: {} };
  DAL.normalizeDashboardLayout();
  DAL.saveState(true);
};

/* --- Canvas view (story graph + mind map) ----------------------------------
   Zoom and scroll position are remembered per project and per board, so coming
   back to a graph puts you where you left off. Both boards live under one field
   keyed by board name; anything missing falls back to 100% at the origin, which
   is exactly how the app behaved before this was saved at all. */
DAL.ZOOM_LEVELS = [0.4, 0.5, 0.65, 0.8, 1, 1.25, 1.5, 1.75, 2];
DAL.DEFAULT_ZOOM_INDEX = 4; // 1x

// Which board the canvas markup currently belongs to.
DAL.canvasBoard = function(){
  return DAL.currentTool === 'storygraph' ? 'storygraph' : 'mindmap';
};

DAL.canvasView = function(proj, board){
  board = board || DAL.canvasBoard();
  if(!proj) return { zoom: 1, scrollX: 0, scrollY: 0 };
  if(!proj.canvasView || typeof proj.canvasView !== 'object') proj.canvasView = {};
  var v = proj.canvasView[board];
  if(!v || typeof v !== 'object') v = proj.canvasView[board] = {};
  // Snap whatever was saved to a level we actually offer, so a hand-edited or
  // future-version file can never leave the canvas at an unreachable scale.
  v.zoom = DAL.ZOOM_LEVELS[DAL.zoomIndex(v.zoom)];
  v.scrollX = (typeof v.scrollX === 'number' && isFinite(v.scrollX)) ? Math.max(0, v.scrollX) : 0;
  v.scrollY = (typeof v.scrollY === 'number' && isFinite(v.scrollY)) ? Math.max(0, v.scrollY) : 0;
  return v;
};

// Index of the nearest offered zoom level to a value.
DAL.zoomIndex = function(zoom){
  var z = parseFloat(zoom);
  if(!isFinite(z) || z <= 0) return DAL.DEFAULT_ZOOM_INDEX;
  var best = DAL.DEFAULT_ZOOM_INDEX, diff = Infinity;
  DAL.ZOOM_LEVELS.forEach(function(level, i){
    var d = Math.abs(level - z);
    if(d < diff){ diff = d; best = i; }
  });
  return best;
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

/* --- Info tips (the small "(i)" icons next to writing/lore tools) -----------
   Help is deliberately scarce. Self-evident controls (sidebar nav, undo/redo,
   save, add/edit/delete, search, import/export, close/back) carry NO tooltip at
   all — anyone can read them. Only genuinely non-obvious worldbuilding/writing
   concepts get a small inline "(i)" button, rendered right next to the thing it
   explains. That button opens a tiny, dismissible popover. It is never a big
   floating box that hovers over the UI, so on a phone it can never sit on top of
   the sidebar buttons and block taps the way the old hover tooltips did. */

// Returns the markup for an inline info icon. Place it next to a tool label or
// section heading, e.g. '<h2>Word Count '+DAL.infoIcon('Manuscript vs supplementary…')+'</h2>'.
// `id` is optional and lets a heading toggle its own help via data-info-target.
DAL.infoIcon = function(text, id){
  var attr = id ? ' data-info-target="'+DAL.escapeHtml(id)+'"' : '';
  return '<button type="button" class="info-icon"'+attr+' data-info="'+DAL.escapeHtml(text)+'"'+
    ' aria-label="What is this?" tabindex="0"><span aria-hidden="true">i</span></button>';
};

DAL.initInfoTips = function(){
  var pop = document.createElement('div');
  pop.className = 'info-popover';
  pop.setAttribute('role','tooltip');
  pop.setAttribute('aria-hidden','true');
  document.body.appendChild(pop);

  var openFor = function(icon){
    var text = icon.getAttribute('data-info');
    if(!text) return;
    pop.textContent = text;
    pop.setAttribute('aria-hidden','false');
    pop.classList.add('visible');
    // The popover sits just below the icon, clamped inside the viewport so it
    // never hangs off an edge or slides under the bottom tab bar.
    var r = icon.getBoundingClientRect();
    pop.style.left = '';
    pop.style.top = '';
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = r.left + r.width/2 - pw/2;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    var top = r.bottom + 6;
    if(top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  };
  var hide = function(){ pop.classList.remove('visible'); pop.setAttribute('aria-hidden','true'); pop.textContent = ''; };

  // A single delegated handler covers click/tap on every .info-icon, now and
  // for any added later by re-renders. Toggling means a second tap closes it.
  document.addEventListener('click', function(e){
    var icon = e.target.closest('.info-icon');
    if(icon){
      e.preventDefault(); e.stopPropagation();
      if(pop.classList.contains('visible') && pop.dataset.for === icon){ hide(); return; }
      pop.dataset.for = icon;
      openFor(icon);
      return;
    }
    // Tap anywhere else dismisses an open popover — it never lingers over the UI.
    if(pop.classList.contains('visible')) hide();
  }, true);
  // Keyboard: focus shows it (so screen-reader/keyboard users get the text),
  // Enter/Space toggles, Escape closes.
  document.addEventListener('focusin', function(e){
    var icon = e.target.closest && e.target.closest('.info-icon');
    if(icon){ pop.dataset.for = icon; openFor(icon); }
  });
  document.addEventListener('focusout', function(e){
    if(e.target.closest && e.target.closest('.info-icon')) hide();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && pop.classList.contains('visible')){ hide(); }
    var icon = e.target.closest && e.target.closest('.info-icon');
    if(icon && (e.key === 'Enter' || e.key === ' ')){
      e.preventDefault();
      if(pop.classList.contains('visible') && pop.dataset.for === icon) hide();
      else { pop.dataset.for = icon; openFor(icon); }
    }
  });
  // Never let a stale popover survive a scroll, a route/render, or a resize.
  var hideOnMove = function(){ if(pop.classList.contains('visible')) hide(); };
  window.addEventListener('scroll', hideOnMove, { passive: true, capture: true });
  window.addEventListener('resize', hideOnMove, { passive: true });
  window.addEventListener('orientationchange', hideOnMove);
  DAL._hideInfoPopover = hide;
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
DAL.themeId = function(id){
  // A theme saved by an older or newer copy of the app may not exist here, and
  // an unknown id would leave the page with no palette at all.
  for(var i = 0; i < DAL.THEMES.length; i++){ if(DAL.THEMES[i].id === id) return id; }
  return 'aurora';
};

DAL.setTheme = function(theme){
  DAL.state.appTheme = DAL.themeId(theme);
  document.documentElement.setAttribute('data-theme', DAL.state.appTheme);
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
  var list = system.concat(custom);
  // Extra fonts are only offered when a connection is live; once chosen they
  // fall back to a system serif if the device goes offline again.
  if(DAL.onlineFontsReady){
    list = list.concat(DAL.ONLINE_FONTS.map(function(f){ return f.name; }));
  }
  return list;
};

/* --- Offline-first online extras (more fonts when connected) ---------------
   The app is fully usable offline with system fonts. When there is a network
   connection, a curated set of extra writing/display fonts is loaded from Google
   Fonts and becomes selectable in the manuscript editor's font menu. If the
   connection drops, already-loaded fonts keep working for the session and any
   chosen font gracefully falls back to a readable system serif. Nothing here
   blocks startup or breaks offline use — the link is only ever added when
   navigator.onLine is true, and is removed again on going offline. */
DAL.ONLINE_FONTS = [
  {name:'Cinzel',      family:'Cinzel',      weights:'400;600;700;900'},
  {name:'EB Garamond', family:'EB Garamond', weights:'400;500;600;700'},
  {name:'Crimson Pro', family:'Crimson Pro', weights:'400;500;600;700'},
  {name:'Lora',        family:'Lora',        weights:'400;500;600;700'},
  {name:'Spectral',    family:'Spectral',    weights:'300;400;500;600;700'},
  {name:'Newsreader',  family:'Newsreader',  weights:'400;500;600;700'},
  {name:'Cormorant',   family:'Cormorant',   weights:'400;500;600;700'},
  {name:'Spline Sans', family:'Spline Sans', weights:'400;500;600;700'}
];

DAL.isOnline = function(){
  return (typeof navigator !== 'undefined') && !!navigator.onLine;
};

DAL.onlineFontsReady = false;
DAL._onlineFontLink = null;

DAL.loadOnlineFonts = function(){
  if(DAL._onlineFontLink){ DAL.onlineFontsReady = true; return; }
  var fams = DAL.ONLINE_FONTS.map(function(f){
    return 'family='+encodeURIComponent(f.family).replace(/%20/g,'+')+':wght@'+f.weights;
  }).join('&');
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?'+fams+'&display=swap';
  link.setAttribute('data-online-font','1');
  document.head.appendChild(link);
  DAL._onlineFontLink = link;
  DAL.onlineFontsReady = true;
};

DAL.unloadOnlineFonts = function(){
  // Stop requesting the stylesheet when offline. Already-loaded FontFace objects
  // stay in document.fonts for the rest of the session, so nothing visibly
  // breaks — the fonts simply won't (re)load on a fresh offline start.
  if(DAL._onlineFontLink){ DAL._onlineFontLink.remove(); DAL._onlineFontLink = null; }
  DAL.onlineFontsReady = false;
};

DAL.initOnlineFonts = function(){
  var apply = function(){
    if(DAL.isOnline()) DAL.loadOnlineFonts(); else DAL.unloadOnlineFonts();
    // Re-render Settings so the online-font list + status reflect the change.
    if(DAL.currentView === 'settings') DAL.render();
  };
  apply();
  window.addEventListener('online', apply);
  window.addEventListener('offline', apply);
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
  DAL.grabMode = false;
  DAL.distractionFree = false;
  DAL.organizeDashboard = false;
  DAL.render();
};

/* --- Main Render --- */
DAL.render = function(){
  // Theme
  document.documentElement.setAttribute('data-theme', DAL.themeId(DAL.state.appTheme));
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
  DAL.initChartReadouts();
};

/* Charts print a value label only where there is room for one, so every bar and
   heatmap square also reports itself into a line of text under its controls.
   Pointer events cover mouse and touch in one path, and focus covers the
   keyboard, so the same information is reachable however you are working. */
DAL.initChartReadouts = function(){
  var readouts = document.querySelectorAll('.chart-readout');
  if(!readouts.length) return;

  readouts.forEach(function(readout){
    var card = readout.closest('.dash-cell') || readout.parentNode;
    var rest = readout.textContent;
    var marks = card.querySelectorAll('[data-label]');
    if(!marks.length) return;

    var show = function(el){
      readout.textContent = el.getAttribute('data-label');
      card.querySelectorAll('[data-label].active').forEach(function(m){ m.classList.remove('active'); });
      el.classList.add('active');
    };
    var clear = function(){
      readout.textContent = rest;
      card.querySelectorAll('[data-label].active').forEach(function(m){ m.classList.remove('active'); });
    };

    marks.forEach(function(mark){
      mark.addEventListener('pointerenter', function(){ show(mark); });
      mark.addEventListener('pointerdown', function(){ show(mark); });
      mark.addEventListener('focus', function(){ show(mark); });
      mark.addEventListener('blur', clear);
    });
    // Reset on the way out of the chart rather than per mark, so sliding across
    // bars does not flicker back to the resting text between them.
    var svg = card.querySelector('svg');
    if(svg) svg.addEventListener('pointerleave', clear);
  });
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
        '<button class="topbar-btn" data-action="toggle-sidebar" aria-label="Toggle sidebar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></button>'+
        '<div class="topbar-title" id="topTitle">Dashboard</div>'+
        '<div class="search-box" id="searchBox" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" id="searchInput" placeholder="Search project..." data-action="search"></div>'+
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
  DAL.initInfoTips();
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
  DAL.initOnlineFonts();
  DAL.buildShell();
  DAL.initAdaptive();
  DAL.render();

  // Safety net for manual-save mode: if autosave is off and the user closes
  // the tab/app with unsaved changes, persist once on the way out so work is
  // never lost. Storage writes are synchronous, so this completes in time.
  window.addEventListener('beforeunload', function(){
    if(DAL.state && DAL.state.autosave === false){ DAL.saveState(true); }
  });

  // Restore folder handles on load (need re-permission)
  // Note: File System Access API handles don't persist across sessions without re-granting

  // Auto-version check
  setInterval(function(){ DAL.checkVersionSnapshot(); }, 60000);
  // Word history update
  setInterval(function(){ DAL.updateWordHistory(); }, 30000);
};

/* --- Themes ---
   One registry behind the Settings picker and the View menu, so adding a theme
   means adding its block in styles.css and one line here. Ids are stored in
   state.appTheme; never rename an existing id or saved settings break. */
DAL.THEMES = [
  { id:'aurora', name:'Aurora', desc:'Midnight purple lit by a pink and indigo aurora' },
  { id:'dark', name:'Midnight Ink', desc:'Cool slate and candlelit gold, easy on tired eyes' },
  { id:'light', name:'Daylight', desc:'Soft warm grey paper with a deep bronze accent' },
  { id:'fantasy-dark', name:'Emberhold', desc:'Deep forest hall with brass fittings and old burgundy' },
  { id:'fantasy-light', name:'Gilded Vellum', desc:'Aged vellum edged with sage and faded rose' },
  { id:'nebula', name:'Nebula', desc:'Cold deep-sea blues with cyan and mint light' },
  { id:'ember', name:'Ember', desc:'Banked coals: charred bark, orange fire, pale ash' },
  { id:'sakura', name:'Sakura', desc:'Pale blossom light with plum and orchid accents' },
  { id:'moss', name:'Moss', desc:'Sunlit clearing: pale stone, moss green, still water' },
  { id:'slate', name:'Slate', desc:'High-contrast graphite with electric blue edges' }
];

/* --- Workspace Menu Bar (File / Edit / View) ---
   Dropdown menus live only inside a project's workspace header — never on the
   Dashboard/Projects/Settings top bar. Every item routes to a real existing
   action; nothing here is decorative. */
DAL.MENUS = {
  file: [
    { label: 'New Project',      action: 'new-project' },
    { label: 'Import project (.json)',  action: 'import-project' },
    { divider: true },
    { label: 'Save',            action: 'manual-save', shortcut: 'Ctrl+S' },
    { label: 'Save As…',        action: 'save-as' },
    { divider: true },
    { label: 'Export this project', submenu: [
      { label: 'Project data (.json)',   action: 'export-json' },
      { label: 'Manuscript (.txt)',      action: 'export-manuscript-txt' },
      { label: 'Manuscript (.md)',       action: 'export-manuscript-md' },
      { label: 'Manuscript (.html)',     action: 'export-manuscript-html' },
      { label: 'All export options…',    action: 'export-project' }
    ] },
    { label: 'Whole workspace', submenu: [
      { label: 'Download backup of all projects (.json)', action: 'backup-workspace' },
      { label: 'Restore backup of all projects…',         action: 'restore-workspace' }
    ] }
  ],
  edit: [
    { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' }
  ],
  view: [
    { label: 'Theme', submenu: DAL.THEMES.map(function(t){
      return { label: t.name, action: 'set-theme', attr: t.id };
    }) },
    { divider: true },
    { label: 'Toggle Sidebar', action: 'toggle-sidebar' },
    { label: 'Fullscreen',     action: 'fullscreen' }
  ]
};

DAL.closeMenu = function(){
  var m = document.getElementById('dalMenuDropdown');
  if(m) m.remove();
  document.removeEventListener('click', DAL._menuOutsideHandler, true);
};

DAL.toggleMenu = function(trigger, key){
  DAL.closeMenu();
  var items = DAL.MENUS[key];
  if(!items) return;
  var dd = document.createElement('div');
  dd.id = 'dalMenuDropdown';
  dd.className = 'menu-dropdown';
  var html = '';
  items.forEach(function(it){
    if(it.divider){ html += '<div class="menu-divider"></div>'; return; }
    if(it.submenu){
      html += '<div class="menu-item has-sub" data-menu-sub="'+items.indexOf(it)+'">'+DAL.escapeHtml(it.label)+'<span class="menu-chev">›</span></div>';
      return;
    }
    var extra = it.attr !== undefined ? ' data-theme="'+DAL.escapeHtml(it.attr)+'"' : '';
    html += '<div class="menu-item" data-action="menu" data-do="'+it.action+'"'+extra+'>'+DAL.escapeHtml(it.label)+(it.shortcut?'<span class="menu-shortcut">'+DAL.escapeHtml(it.shortcut)+'</span>':'')+'</div>';
  });
  dd.innerHTML = html;
  document.body.appendChild(dd);
  // Position under the trigger button.
  var r = trigger.getBoundingClientRect();
  dd.style.left = r.left + 'px';
  dd.style.top = (r.bottom + 4) + 'px';
  // Submenu hover (desktop) / tap (mobile) handling.
  dd.querySelectorAll('.menu-item.has-sub').forEach(function(sub){
    var openSub = function(){
      dd.querySelectorAll('.menu-sub-dropdown').forEach(function(s){ s.remove(); });
      var parent = items[parseInt(sub.getAttribute('data-menu-sub'), 10)];
      var subItems = (parent && parent.submenu) || [];
      var sd = document.createElement('div');
      sd.className = 'menu-sub-dropdown';
      var sh = '';
      subItems.forEach(function(si){
        var se = si.attr !== undefined ? ' data-theme="'+DAL.escapeHtml(si.attr)+'"' : '';
        sh += '<div class="menu-item" data-action="menu" data-do="'+si.action+'"'+se+'>'+DAL.escapeHtml(si.label)+'</div>';
      });
      sd.innerHTML = sh;
      dd.appendChild(sd);
      var sr = sub.getBoundingClientRect();
      sd.style.left = (sr.right - 4) + 'px';
      sd.style.top = sr.top + 'px';
      // A long submenu (the theme list) can reach past the bottom of a short
      // window, so pull it back up until it fits.
      var sdr = sd.getBoundingClientRect();
      if(sdr.right > window.innerWidth) sd.style.left = Math.max(8, sr.left - sdr.width + 4) + 'px';
      if(sdr.bottom > window.innerHeight - 8) sd.style.top = Math.max(8, window.innerHeight - sdr.height - 8) + 'px';
    };
    sub.addEventListener('mouseenter', openSub);
    sub.addEventListener('click', openSub);
  });
  // Keep within viewport.
  var dr = dd.getBoundingClientRect();
  if(dr.right > window.innerWidth) dd.style.left = Math.max(8, window.innerWidth - dr.width - 8) + 'px';
  // Dismiss on outside click / escape / scroll.
  DAL._menuOutsideHandler = function(e){
    if(!dd.contains(e.target) && e.target !== trigger) DAL.closeMenu();
  };
  document.addEventListener('click', DAL._menuOutsideHandler, true);
};

DAL.runAction = function(action, el, e){
  if(action === 'open-menu'){ DAL.toggleMenu(el, el.getAttribute('data-menu')); return; }
  if(action === 'menu'){
    var real = el.getAttribute('data-do');
    DAL.runAction(real, el, e);
    DAL.closeMenu();
    return;
  }
  // Navigation
  if(action === 'nav-dashboard') DAL.navigate('dashboard');
  else if(action === 'nav-projects') DAL.navigate('projects');
  else if(action === 'nav-settings') DAL.navigate('settings');
  else if(action === 'nav-library') DAL.navigate('library');
  else if(action === 'toggle-sidebar'){ DAL.state.sidebarCollapsed = !DAL.state.sidebarCollapsed; DAL.saveState(true); DAL.render(); }
  else if(action === 'manual-save'){ DAL.saveState(true); DAL.toast('Saved','success'); }
  else if(action === 'toggle-autosave'){ DAL.state.autosave = !DAL.state.autosave; DAL.saveState(true); DAL.render(); DAL.toast('Automatic saving on this device is '+(DAL.state.autosave ? 'on.' : 'off.'),'info'); }
  else if(action === 'save-as'){ DAL.showSaveAsModal(); }
  else if(action === 'undo') DAL.undo();
  else if(action === 'redo') DAL.redo();
  else if(action === 'close-modal') DAL.closeModal();
  // Delegates to view-specific handlers
  if(DAL.handleClick) DAL.handleClick(action, el, e);
};

/* --- Event Delegation --- */
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-action]');
  if(!el) return;
  var action = el.getAttribute('data-action');
  e.preventDefault();
  e.stopPropagation();
  DAL.runAction(action, el, e);
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
    else if(DAL.grabMode && !document.querySelector('.modal-backdrop')){ DAL.setGrabMode(false); }
    else if(DAL.organizeDashboard && !document.querySelector('.modal-backdrop')){ DAL.organizeDashboard = false; DAL.render(); }
    else { DAL.closeModal(); }
  }
});
