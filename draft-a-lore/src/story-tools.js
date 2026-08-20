/* Draft A Lore — story-tools.js
 * Copyright 2026 Daymien Vanhorn — https://github.com/Hexxis-cmd/Draft-A-Lore
 * Free for noncommercial use under PolyForm Noncommercial 1.0.0 + supplemental
 * terms (see LICENSE.md). Credit to the original author must remain visible.
 * Commercial use requires a license — see COMMERCIAL-LICENSE.md.
 */
/* ============================================
   DRAFT A LORE — Story Tools Module
   Manuscript, Characters, Relationships, Plots, Lore, Mind Map, Book Preview, Export
   ============================================ */
DAL = DAL || {};

/* --- Workspace Render --- */
DAL.renderWorkspace = function(proj){
  var app = document.getElementById('app');
  // Build workspace layout
  var typeLabel = proj.type === 'novel' ? 'Novel' : (proj.type === 'rpg' ? 'RPG Adventure' : 'Dual');
  var wc = DAL.getProjectWordCount(proj);
  var daily = DAL.getDailyWordCount(proj.id);

  var html = '<div class="workspace">';
  // Workspace sidebar
  html += '<aside class="workspace-sidebar" id="wsSidebar">';

  // Back button
  html += '<div style="padding:8px 12px;border-bottom:1px solid var(--c-border)"><button class="btn sm" data-action="nav-projects">← Projects</button></div>';

  // Story Tools section
  if(proj.type === 'novel' || proj.type === 'dual'){
    if(proj.type === 'dual') html += '<div class="ws-nav-group-label">Story Tools</div>';
    var storyTools = [
      ['overview','Overview','M3 13h18v8H3z M3 3h18v8H3z'],
      ['manuscript','Manuscript','M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
      ['characters','Characters','M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 7a4 4 0 1 0 0 .1z M20 8v6 M23 11h-6'],
      ['relationships','Relationship Map','M9 17H7A5 5 0 0 1 7 7h2 M14 7h2a5 5 0 0 1 0 10h-2 M8 12h8'],
      ['plots','Plot Threads','M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3'],
      ['lore','Lore Notebook','M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
      ['illustrations','Illustrations','M21 15l-5-5L5 21 M3 3h18v18H3z M8.5 8.5a1.5 1.5 0 1 0 0 .1z'],
      ['mindmap','Mind Map','M12 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z M9 12a3 3 0 0 1-3-3 M15 12a3 3 0 0 0 3-3 M12 7v5'],
      ['bookpreview','Book Preview','M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
      ['export','Export','M12 3v12 M7 8l5-5 5 5 M5 21h14']
    ];
    storyTools.forEach(function(t){
      var active = DAL.currentTool === t[0] ? ' active' : '';
      html += '<div class="ws-nav-item'+active+'" data-action="ws-tool" data-tool="'+t[0]+'">'+(t[2]?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="'+t[2]+'"/></svg>':'')+'<span>'+t[1]+'</span></div>';
    });
  }

  // Adventure Tools section
  if(proj.type === 'rpg' || proj.type === 'dual'){
    if(proj.type === 'dual') html += '<div class="ws-nav-group-label">Adventure Tools</div>';
    var advTools = [
      ['storygraph','Story Graph','M9 3H5a2 2 0 0 0-2 2v4 M15 3h4a2 2 0 0 1 2 2v4 M9 21H5a2 2 0 0 1-2-2v-4 M15 21h4a2 2 0 0 0 2-2v-4'],
      ['stats','Stats & Traits','M3 3v18h18 M7 16l4-8 4 4 4-6'],
      ['items','Items & Inventory','M20 7l-8-4-8 4 8 4 8-4z M4 7v10l8 4 8-4V7'],
      ['playtest','Playthrough','M6 12h12 M9 9l-3 3 3 3 M15 9l3 3-3 3'],
      ['export-rpg','Export','M12 3v12 M7 8l5-5 5 5 M5 21h14']
    ];
    advTools.forEach(function(t){
      var active = DAL.currentTool === t[0] ? ' active' : '';
      html += '<div class="ws-nav-item'+active+'" data-action="ws-tool" data-tool="'+t[0]+'">'+(t[2]?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="'+t[2]+'"/></svg>':'')+'<span>'+t[1]+'</span></div>';
    });
  }

  /* Assets belong to the project rather than to one discipline, so the folder
     lives in its own section for every project type. */
  html += '<div class="ws-nav-group-label">Project</div>';
  [['assets','Assets','M3 7l9-4 9 4-9 4-9-4z M3 7v10l9 4 9-4V7 M12 11v10']].forEach(function(t){
    var active = DAL.currentTool === t[0] ? ' active' : '';
    html += '<div class="ws-nav-item'+active+'" data-action="ws-tool" data-tool="'+t[0]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="'+t[2]+'"/></svg><span>'+t[1]+'</span></div>';
  });

  html += '</aside>'; // end sidebar

  // Workspace topbar + main
  html += '<div class="workspace-shell">';
  html += '<div class="workspace-topbar">'+
    '<button class="btn sm" data-action="nav-projects">← Back</button>'+
    /* File/Edit/View menu bar — workspace only. It carries Save, Save As,
       Import/Export, Undo/Redo and view options, replacing the old loose
       Save/Undo/Redo cluster. On phones the global top bar is hidden inside
       the workspace so this header becomes the single control surface. */
    '<div class="ws-menubar">'+
      '<button class="menu-trigger" data-action="open-menu" data-menu="file">File<span class="menu-caret">▾</span></button>'+
      '<button class="menu-trigger" data-action="open-menu" data-menu="edit">Edit<span class="menu-caret">▾</span></button>'+
      '<button class="menu-trigger" data-action="open-menu" data-menu="view">View<span class="menu-caret">▾</span></button>'+
      '<button class="menu-trigger" data-action="open-menu" data-menu="tools">Tools<span class="menu-caret">▾</span></button>'+
      '<div class="save-status" title="Saved on this device"><div class="save-dot"></div><span>Saved</span></div>'+
    '</div>'+
    '<input class="form-input" style="width:auto;font-weight:600" id="projNameInput" value="'+DAL.escapeHtml(proj.name)+'">'+
    '<select class="form-select" style="width:auto;font-size:var(--ts-xs)" data-action="change-status" data-pid="'+proj.id+'">'+
      ['development','drafting','proofreading','completed','published'].map(function(s){ return '<option value="'+s+'"'+(proj.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>'; }).join('')+
    '</select>'+
    '<div style="margin-left:auto;display:flex;gap:8px;align-items:center;font-size:var(--ts-xs);color:var(--c-text-muted)">'+
      '<span><strong style="color:var(--c-text)">'+wc.manuscript+'</strong> / <strong style="color:var(--c-text)">'+wc.supplementary+'</strong> / <strong style="color:var(--c-text)">'+wc.total+'</strong> words</span>'+
      '<span>Today: <strong style="color:var(--c-accent)">'+(daily.manuscript+daily.supplementary)+'</strong></span>'+
      '<div class="sync-dot '+(DAL.folderHandles[proj.id]?'linked':'unlinked')+'"></div>'+
      /* Folder sync needs the File System Access API, which mobile browsers
         don't implement — so the control is hidden rather than offered and
         then refused. */
      '<button class="btn sm ws-folder-btn" data-action="link-folder" data-pid="'+proj.id+'">Link Folder</button>'+
    '</div></div>';

  // Main content
  html += '<div class="workspace-main" id="wsMain">';

  // Render the current tool
  if(!DAL.currentTool) DAL.currentTool = proj.type === 'rpg' ? 'storygraph' : 'overview';
  html += DAL.renderStoryTool(proj, DAL.currentTool);

  html += '</div>'; // end workspace-main
  html += '</div>'; // end flex container
  html += '</div>'; // end workspace

  // Keep the global top bar honest: without this it still shows whichever view
  // the user came from ("Dashboard", "Settings") while a project is open.
  var topTitle = document.getElementById('topTitle');
  if(topTitle) topTitle.textContent = proj.name || 'Project';

  // Replace content
  var content = document.getElementById('content');
  content.style.padding = '0';
  content.innerHTML = html;
  content.parentElement.style.flex = '1';
  content.parentElement.style.display = 'flex';
  content.parentElement.style.flexDirection = 'column';
  content.parentElement.style.overflow = 'hidden';

  // Post-render hooks
  DAL.afterStoryRender(proj);
};

DAL.renderStoryTool = function(proj, tool){
  switch(tool){
    case 'overview': return DAL.renderOverview(proj);
    case 'manuscript': return DAL.renderManuscript(proj);
    case 'characters': return DAL.renderCharacters(proj);
    case 'relationships': return DAL.renderRelationshipMap(proj);
    case 'plots': return DAL.renderPlotThreads(proj);
    case 'lore': return DAL.renderLoreNotebook(proj);
    case 'illustrations': return DAL.renderIllustrations(proj);
    case 'mindmap': return DAL.renderMindMap(proj);
    case 'bookpreview': return DAL.renderBookPreview(proj);
    case 'export': return DAL.renderStoryExport(proj);
    case 'storygraph': return DAL.renderStoryGraph(proj);
    case 'stats': return DAL.renderStatsTraits(proj);
    case 'items': return DAL.renderItems(proj);
    case 'assets': return DAL.renderAssets(proj);
    case 'playtest': return DAL.renderPlaytest(proj);
    case 'export-rpg': return DAL.renderRPGExport(proj);
    default: return DAL.renderOverview(proj);
  }
};

/* --- Overview --- */
DAL.renderOverview = function(proj){
  var wc = DAL.getProjectWordCount(proj);
  var now = Date.now();
  var stalePlots = (proj.plots||[]).filter(function(p){ return (now - (p.lastTouched||p.createdAt||0)) > 30*86400000; });
  var recent = [];
  (proj.chapters||[]).forEach(function(c){ recent.push({name:'Chapter: '+c.title, ts:c.updatedAt}); });
  (proj.characters||[]).forEach(function(c){ recent.push({name:'Character: '+c.name, ts:c.createdAt}); });
  (proj.lore&&proj.lore.entries||[]).forEach(function(e){ recent.push({name:'Lore: '+e.title, ts:e.updatedAt}); });
  recent.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  recent = recent.slice(0,5);

  var html = '<div class="u-measure-mid">';
  html += '<div class="section-header"><div class="section-title">'+DAL.escapeHtml(proj.name)+'</div><span class="badge accent">'+proj.type+'</span></div>';

  // Stats grid
  html += '<div class="card-grid ws-stat-grid">'+
    '<div class="card" style="text-align:center"><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+(proj.chapters||[]).length+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Chapters</div></div>'+
    '<div class="card" style="text-align:center"><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+(proj.characters||[]).length+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Characters</div></div>'+
    '<div class="card" style="text-align:center"><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+(proj.plots||[]).length+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Plot Threads</div></div>'+
    '<div class="card" style="text-align:center"><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+(proj.lore&&proj.lore.entries||[]).length+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Lore Entries</div></div>'+
  '</div>';

  // Word counts
  html += '<div class="card" style="margin-bottom:16px;text-align:center">'+
    '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:10px;font-size:var(--ts-xs);color:var(--c-text-muted);text-transform:uppercase;letter-spacing:.4px">Word Counts '+DAL.infoIcon('Manuscript = words in your chapters and adventure nodes (the actual story). Supplementary = words in characters, lore and plot threads. Total = both combined. Daily goals and writing streaks track the manuscript count.')+'</div>'+
    '<div style="display:flex;gap:16px;justify-content:center">'+
    '<div><div style="font-size:var(--ts-lg);font-weight:700">'+wc.manuscript+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Manuscript</div></div>'+
    '<div><div style="font-size:var(--ts-lg);font-weight:700">'+wc.supplementary+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Supplementary</div></div>'+
    '<div><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+wc.total+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Total</div></div>'+
    '</div></div>';

  // Stale plots
  if(stalePlots.length){
    html += '<div class="card" style="margin-bottom:16px;border-left:3px solid var(--c-warning)">'+
      '<div style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--c-warning);margin-bottom:8px">⚠ Stale Plot Threads '+DAL.infoIcon('A plot thread is marked stale when it hasn\'t been edited in 30+ days, so abandoned storylines don\'t quietly slip through the cracks. Open a thread and edit it to reset the timer.')+'</div>';
    stalePlots.forEach(function(p){
      html += '<div style="font-size:var(--ts-sm);padding:2px 0">'+DAL.escapeHtml(p.title)+' — untouched '+DAL.formatDate(p.lastTouched||p.createdAt)+'</div>';
    });
    html += '</div>';
  }

  // Quick links
  html += '<div class="card" style="margin-bottom:16px"><div style="font-weight:600;margin-bottom:8px">Quick Links</div><div class="quick-links">';
  var tools = proj.type === 'rpg' ? ['storygraph','stats','items','playtest','assets'] : ['manuscript','characters','illustrations','bookpreview','assets'];
  if(proj.type === 'dual') tools = ['manuscript','characters','storygraph','items','playtest','assets'];
  tools.forEach(function(t){
    var labels = {manuscript:'Manuscript',characters:'Characters',relationships:'Relationships',plots:'Plot Threads',lore:'Lore',illustrations:'Illustrations',mindmap:'Mind Map',bookpreview:'Book Preview',export:'Export',storygraph:'Story Graph',stats:'Stats & Traits',items:'Items',playtest:'Playthrough',assets:'Assets'};
    html += '<div class="quick-link" data-action="ws-tool" data-tool="'+t+'">'+labels[t]+'</div>';
  });
  html += '</div></div>';

  // Recent activity
  if(recent.length){
    html += '<div class="card"><div style="font-weight:600;margin-bottom:8px">Recent Activity</div>';
    recent.forEach(function(r){
      html += '<div class="activity-item">'+DAL.escapeHtml(r.name)+'<span class="activity-time">'+DAL.formatDate(r.ts)+'</span></div>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
};

/* --- Manuscript --- */
DAL.renderManuscript = function(proj){
  if(!proj.chapters) proj.chapters = [];
  if(!DAL.selectedChapterId && proj.chapters.length){
    DAL.selectedChapterId = proj.chapters[0].id;
  }
  var currentCh = proj.chapters.find(function(c){ return c.id === DAL.selectedChapterId; });

  var html = '<div class="manuscript-layout u-fill-body">';
  // Chapter list
  var chapterPanelBody = '<div class="chapter-list-header"><span style="font-size:var(--ts-xs);font-weight:600;text-transform:uppercase;color:var(--c-text-muted)">Chapters</span><button class="btn sm primary" data-action="add-chapter">+</button></div>'+
    '<div class="chapter-list-items" id="chapterList" data-drop="chapter" data-sort-item="[data-drag=\"chapter\"]">';
  proj.chapters.forEach(function(ch, i){
    var active = ch.id === DAL.selectedChapterId ? ' active' : '';
    var wc = DAL.countWords(ch.contentHTML);
    chapterPanelBody += '<div class="chapter-item'+active+'" data-action="select-chapter" data-cid="'+ch.id+'" data-sel="chapter:'+ch.id+'" data-ctx="chapter" data-ctx-id="'+ch.id+'" data-drag="chapter:'+ch.id+'" data-drag-label="'+DAL.escapeHtml(ch.title)+'" data-drag-handle=".drag-handle">'+
      '<span class="drag-handle" data-cid="'+ch.id+'" title="Drag to reorder">⋮⋮</span>'+
      '<span>'+(i+1)+'. '+DAL.escapeHtml(ch.title)+'</span>'+
    '</div>';
  });
  if(!proj.chapters.length){
    chapterPanelBody += '<div style="padding:12px;font-size:var(--ts-xs);color:var(--c-text-faint);text-align:center">No chapters yet</div>';
  }
  chapterPanelBody += '</div>';
  html += '<div class="chapter-list">'+DAL.panel('manuscript-chapters','Chapters',chapterPanelBody,{defaultOpen:true,badge:proj.chapters.length})+DAL.panel('manuscript-tools','Writer tools','<div class="writer-tool-actions"><button class="btn sm" data-action="show-find">Find</button><button class="btn sm" data-action="show-comments">Comments '+DAL.commentBadge(proj)+'</button><button class="btn sm" data-action="show-sprint">Sprint</button><button class="btn sm" data-action="toggle-sprint-widget">Sprint timer</button><button class="btn sm" data-action="show-corkboard">Corkboard</button></div>',{defaultOpen:true})+'</div>';

  // Editor
  html += '<div class="editor-area">';
  html += '<div class="editor-toolbar" id="editorToolbar">';
  // Block format
  html += '<select data-action="format-block"><option value="p">Body Text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Subheading</option></select>';
  // Font family
  var fonts = DAL.getFontList();
  html += '<select class="tb-select" data-action="font-family">';
  fonts.forEach(function(f){ html += '<option value="'+f+'">'+f+'</option>'; });
  html += '</select>';
  // Font size
  html += '<select data-action="font-size" style="width:50px">';
  [12,14,16,18,20,24,28,32].forEach(function(s){ html += '<option value="'+s+'">'+s+'</option>'; });
  html += '</select>';
  html += '<span class="tb-sep"></span>';
  // Formatting buttons
  var fmtBtns = [
    ['bold','<b>B</b>','Bold'],
    ['italic','<i>I</i>','Italic'],
    ['underline','<u>U</u>','Underline'],
    ['strikeThrough','<s>S</s>','Strikethrough']
  ];
  fmtBtns.forEach(function(b){ html += '<button class="tb-btn" data-action="format-cmd" data-cmd="'+b[0]+'">'+b[1]+'</button>'; });
  html += '<span class="tb-sep"></span>';
  html += '<input type="color" data-action="text-color" style="width:24px;height:24px;border:none;cursor:pointer">';
  html += '<span class="tb-sep"></span>';
  var aligns = [['justifyLeft','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>','Align Left'],['justifyCenter','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>','Center'],['justifyRight','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>','Right'],['justifyFull','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>','Justify']];
  aligns.forEach(function(a){ html += '<button class="tb-btn" data-action="format-cmd" data-cmd="'+a[0]+'">'+a[1]+'</button>'; });
  html += '<span class="tb-sep"></span>';
  html += '<button class="tb-btn" data-action="format-cmd" data-cmd="insertUnorderedList"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg></button>';
  html += '<button class="tb-btn" data-action="format-cmd" data-cmd="insertOrderedList"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4 M4 10h2 M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg></button>';
  html += '<button class="tb-btn" data-action="insert-image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></button>';
  html += '<button class="tb-btn" data-action="insert-hr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><line x1="4" y1="12" x2="20" y2="12"/></svg></button>';
  html += '<span class="tb-sep"></span>';
  html += '<button class="tb-btn" data-action="copy-chapter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>';
  html += '<button class="tb-btn" data-action="export-chapter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path d="M12 3v12 M7 8l5-5 5 5 M5 21h14"/></svg></button>';
  html += '<button class="tb-btn" data-action="fullscreen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path d="M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>';
  html += '</div>'; // end toolbar

  // Chapter illustrations strip
  if(currentCh){
    html += '<div class="chapter-illustrations-strip asset-dropzone" data-drop="asset" data-asset-bind="chapter:'+currentCh.id+'">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:var(--ts-xs);font-weight:600;text-transform:uppercase;color:var(--c-text-muted)">Chapter Illustrations</span>'+
      '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+((currentCh.images||[]).length)+'/2</span>'+
      ((currentCh.images||[]).length < 2 ? '<button class="btn sm" data-action="upload-chapter-image" data-cid="'+currentCh.id+'">+ Add Image</button>' : '')+
    '</div>';
    if(currentCh.images && currentCh.images.length){
      html += '<div style="display:flex;gap:8px">';
      currentCh.images.forEach(function(img, ii){
        html += '<div class="chapter-ill-thumb">'+
          '<img src="'+DAL.imageSrc(proj,img)+'">'+
          '<button class="chapter-ill-remove" data-action="remove-chapter-image" data-cid="'+currentCh.id+'" data-img-idx="'+ii+'">&times;</button>'+
          '</div>';
      });
      html += '</div>';
    }
    html += '<input type="file" id="chapterImageInput" accept="image/*" style="display:none">';
    html += '</div>';
    html += DAL.renderAudioBinding(proj, currentCh, 'chapter', currentCh.id);
  }

  // Editor surface
  html += '<div class="editor-surface"><div class="content-editable" id="editorContent" contenteditable="true" data-placeholder="Start writing..." data-cid="'+(currentCh?currentCh.id:'')+'">'+(currentCh?currentCh.contentHTML:'')+'</div></div>';

  // Editor footer
  var editorWC = currentCh ? DAL.countWords(currentCh.contentHTML) : 0;
  html += '<div class="editor-footer"><span>'+editorWC+' words</span><span>'+(currentCh?'Edited '+DAL.formatDate(currentCh.updatedAt):'')+'</span></div>';

  html += '</div>'; // end editor area
  html += '</div>'; // end manuscript layout
  return html;
};

DAL.afterStoryRender = function(proj){
  // Bind editor if present
  var editor = document.getElementById('editorContent');
  if(editor){
    var saveTimer = null;
    editor.addEventListener('input', function(){
      var ch = proj.chapters.find(function(c){ return c.id === DAL.selectedChapterId; });
      if(ch){
        ch.contentHTML = editor.innerHTML;
        ch.updatedAt = Date.now();
        proj.updatedAt = Date.now();
        if(saveTimer) clearTimeout(saveTimer);
        // Manuscript typing is the one place autosave-off actually matters: with
        // it off we don't want every keystroke hitting storage, so just mark the
        // status dot dirty and wait for an explicit Save. Everywhere else in the
        // app (adding a character, deleting a plot, etc.) still saves right away
        // regardless of this toggle, since those are already deliberate clicks.
        if(DAL.state.autosave === false){
          DAL.setSaveStatus('unsaved');
        } else {
          saveTimer = setTimeout(function(){ DAL.saveState(); }, 450);
        }
        // Update word count
        var wc = DAL.countWords(editor.innerHTML);
        var footer = editor.parentElement.parentElement.querySelector('.editor-footer span');
        if(footer) footer.textContent = wc + ' words';
      }
    });
    editor.addEventListener('focusin', function(){ DAL._activeEditor = editor; });
    if(document.activeElement === editor) DAL._activeEditor = editor;
  }

  // Bind canvas interactions if present
  DAL.initCanvasInteractions(proj);

  // Bind relationship map if present
  DAL.initRelMap(proj);

  // Bind project name input
  var nameInput = document.getElementById('projNameInput');
  if(nameInput){
    nameInput.addEventListener('change', function(){
      proj.name = nameInput.value.trim() || proj.name;
      proj.cover.title = proj.name;
      proj.updatedAt = Date.now();
      DAL.saveState();
    });
  }

  // Status change
  var statusSel = document.querySelector('[data-action="change-status"]');
  if(statusSel){
    statusSel.addEventListener('change', function(){
      proj.status = statusSel.value;
      proj.updatedAt = Date.now();
      DAL.saveState();
    });
  }
};

/* --- Characters --- */
DAL.renderCharacters = function(proj){
  if(!proj.characters) proj.characters = [];
  if(DAL.selectedCharId){
    var ch = proj.characters.find(function(c){ return c.id === DAL.selectedCharId; });
    if(ch) return DAL.renderCharacterDetail(proj, ch);
  }

  var html = '<div class="section-header"><div class="section-title">Characters</div><button class="btn primary" data-action="add-character">+ Add Character</button></div>';
  if(!proj.characters.length){
    return html + '<div class="empty-state"><h3>No Characters Yet</h3><p>Add your first character to get started.</p><button class="btn primary" data-action="add-character">Add Character</button></div>';
  }
  html += '<div class="char-grid">';
  proj.characters.forEach(function(c){
    var initials = (c.name||'?').split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();
    html += '<div class="char-card" data-action="select-character" data-cid="'+c.id+'" data-sel="character:'+c.id+'" data-ctx="character" data-ctx-id="'+c.id+'">'+
      '<div class="char-portrait">'+(c.image?'<img src="'+c.image+'">':DAL.escapeHtml(initials))+'</div>'+
      '<div class="char-name">'+DAL.escapeHtml(c.name)+'</div>'+
      '<div class="char-role">'+DAL.escapeHtml(c.role||'')+'</div>'+(c.deceased?'<span class="badge deceased-badge">Killed</span>':'')+
    '</div>';
  });
  html += '</div>';
  return html;
};

DAL.renderCharacterDetail = function(proj, ch){
  var charWC = DAL.countWordsText(ch.appearance)+DAL.countWordsText(ch.personality)+DAL.countWordsText(ch.backstory)+DAL.countWordsText(ch.arc);
  var html = '<div class="u-measure">';
  html += '<div style="margin-bottom:16px"><button class="btn sm" data-action="back-to-characters">← Back</button></div>';
  html += '<div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-start">';
  // Portrait
  html += '<div class="char-portrait" style="width:96px;height:96px;flex-shrink:0;font-size:32px;border-radius:var(--radius-lg)">'+(ch.image?'<img src="'+ch.image+'">':DAL.escapeHtml((ch.name||'?').charAt(0).toUpperCase()))+'</div>';
  html += '<div style="flex:1"><input class="form-input" id="charName" value="'+DAL.escapeHtml(ch.name||'')+'" placeholder="Character name" style="font-size:var(--ts-lg);font-weight:700;margin-bottom:4px"><label class="u-hint" style="display:inline-flex;align-items:center;gap:6px;margin-top:6px"><input type="checkbox" data-action="toggle-character-deceased" data-cid="'+ch.id+'"'+(ch.deceased?' checked':'')+'> Killed / deceased</label></div></div>';

  // Portrait upload
  html += '<div style="margin-bottom:12px"><input type="file" id="charPortrait" accept="image/*" style="display:none"><button class="btn sm" data-action="upload-portrait" data-cid="'+ch.id+'">Upload Portrait</button> '+(ch.image?'<button class="btn sm danger" data-action="remove-portrait" data-cid="'+ch.id+'">Remove</button>':'')+'</div>';

  html += '<div class="form-row" style="margin-bottom:12px">'+
    '<div class="form-group"><label class="form-label">Role</label><input class="form-input" data-char-field="role" value="'+DAL.escapeHtml(ch.role||'')+'" placeholder="Protagonist"></div>'+
    '<div class="form-group"><label class="form-label">Age</label><input class="form-input" data-char-field="age" value="'+DAL.escapeHtml(ch.age||'')+'" placeholder="25"></div>'+
    '<div class="form-group"><label class="form-label">Gender</label><input class="form-input" data-char-field="gender" value="'+DAL.escapeHtml(ch.gender||'')+'" placeholder="Female"></div></div>';

  var fields = [['appearance','Physical Appearance'],['personality','Personality'],['backstory','Backstory'],['arc','Character Arc / Goals']];
  fields.forEach(function(f){
    html += '<div class="form-group"><label class="form-label">'+f[1]+'</label><textarea class="form-textarea" data-char-field="'+f[0]+'" placeholder="Write '+f[1].toLowerCase()+'...">'+DAL.escapeHtml(ch[f[0]]||'')+'</textarea></div>';
  });

  // Custom fields
  if(!ch.customFields) ch.customFields = [];
  html += '<div class="form-group"><label class="form-label">Custom Fields</label><div class="custom-fields">';
  ch.customFields.forEach(function(cf, i){
    cf.type = cf.type || 'text';
    var value = cf.type === 'boolean' ? '<label class="u-hint"><input type="checkbox" data-cf-value="'+i+'"'+(cf.value===true||cf.value==='true'?' checked':'')+'> Yes</label>' : '<input class="form-input" type="'+(cf.type==='number'?'number':'text')+'" value="'+DAL.escapeHtml(cf.value===undefined?'':String(cf.value))+'" data-cf-value="'+i+'" placeholder="Value">';
    html += '<div class="custom-field-row"><input class="form-input" value="'+DAL.escapeHtml(cf.label||'')+'" data-cf-label="'+i+'" placeholder="Field name"><select class="form-select" data-cf-type="'+i+'"><option value="text"'+(cf.type==='text'?' selected':'')+'>Text</option><option value="number"'+(cf.type==='number'?' selected':'')+'>Number</option><option value="boolean"'+(cf.type==='boolean'?' selected':'')+'>Yes / No</option></select>'+value+'<div class="custom-field-actions"><button class="btn sm" data-action="move-custom-field" data-cid="'+ch.id+'" data-cf-index="'+i+'" data-dir="-1" aria-label="Move field up">↑</button><button class="btn sm" data-action="move-custom-field" data-cid="'+ch.id+'" data-cf-index="'+i+'" data-dir="1" aria-label="Move field down">↓</button><button class="btn sm danger" data-action="delete-custom-field" data-cid="'+ch.id+'" data-cf-index="'+i+'" aria-label="Delete field">×</button></div></div>';
  });
  html += '</div><button class="btn sm" data-action="add-custom-field" data-cid="'+ch.id+'">+ Add Custom Field</button></div>';

  // Tags
  html += '<div class="form-group" style="margin-top:12px"><label class="form-label">Tags</label><input class="form-input" data-char-field="tags" value="'+DAL.escapeHtml((ch.tags||[]).join(', '))+'" placeholder="comma, separated, tags"></div>';

  // Linked plots
  html += '<div class="form-group"><label class="form-label">Linked Plot Threads</label><div style="display:flex;flex-wrap:wrap;gap:4px">';
  (proj.plots||[]).forEach(function(p){
    var sel = (ch.linkedPlotIds||[]).indexOf(p.id) >= 0;
    html += '<span class="chip'+(sel?' selected':'')+'" data-action="toggle-char-plot" data-cid="'+ch.id+'" data-pid="'+p.id+'">'+DAL.escapeHtml(p.title)+'</span>';
  });
  if(!proj.plots||!proj.plots.length) html += '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">No plot threads yet</span>';
  html += '</div></div>';

  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px"><span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+charWC+' words in this character sheet</span><button class="btn sm danger" data-action="delete-character" data-cid="'+ch.id+'">Delete Character</button></div>';
  html += '</div>';
  return html;
};

/* --- Relationship Map --- */
DAL.renderRelationshipMap = function(proj){
  if(!proj.characters || !proj.characters.length){
    return '<div class="empty-state"><h3>No Characters</h3><p>Add characters first to build relationship maps.</p></div>';
  }
  if(!DAL._relCenter) DAL._relCenter = proj.characters[0].id;
  var center = proj.characters.find(function(c){ return c.id === DAL._relCenter; });
  if(!center){ DAL._relCenter = proj.characters[0].id; center = proj.characters[0]; }

  var connected = (proj.relationships||[]).filter(function(r){ return r.fromCharId === center.id || r.toCharId === center.id; });
  var connectedChars = connected.map(function(r){
    var otherId = r.fromCharId === center.id ? r.toCharId : r.fromCharId;
    var c = proj.characters.find(function(ch){ return ch.id === otherId; });
    return c ? { char: c, rel: r } : null;
  }).filter(Boolean);

  var html = '<div class="section-header"><div class="section-title">Relationship Map</div><button class="btn primary" data-action="add-relationship">+ Add Relationship</button></div>';
  html += '<div style="margin-bottom:12px"><label class="form-label">Center on character</label><select class="form-select" id="relCenterSelect" style="width:auto;display:inline-block">';
  proj.characters.forEach(function(c){
    html += '<option value="'+c.id+'"'+(c.id===center.id?' selected':'')+'>'+DAL.escapeHtml(c.name)+'</option>';
  });
  html += '</select></div>';

  html += '<div class="rel-map-container" id="relMapContainer">';
  html += '<svg class="rel-svg" id="relSvg"></svg>';

  // Center node
  html += '<div class="rel-node center" id="relCenterNode">'+
    '<div style="font-weight:700">'+DAL.escapeHtml(center.name)+'</div>'+
    '<div style="font-size:var(--ts-xs);color:var(--c-text-muted)">'+DAL.escapeHtml(center.role||'')+'</div></div>';

  // Connected nodes in a circle
  var radius = 180;
  connectedChars.forEach(function(item, i){
    var angle = (i / connectedChars.length) * Math.PI * 2 - Math.PI/2;
    var x = 50 + Math.cos(angle) * 35;
    var y = 50 + Math.sin(angle) * 35;
    var colorMap = { family:'var(--c-warning)', enemy:'var(--c-danger)', ally:'var(--c-info)', friend:'var(--c-success)', rival:'var(--c-warning)' };
    var color = colorMap[item.rel.category] || 'var(--c-border)';
    html += '<div class="rel-node connected" data-action="rel-center-on" data-cid="'+item.char.id+'" style="position:absolute;left:'+x+'%;top:'+y+'%;transform:translate(-50%,-50%);border-color:'+color+'">'+
      '<div style="font-weight:600;font-size:var(--ts-sm)">'+DAL.escapeHtml(item.char.name)+'</div>'+
      '<div style="font-size:var(--ts-xs);color:var(--c-text-muted)">'+DAL.escapeHtml(item.rel.type||'')+'</div></div>';
  });

  if(!connectedChars.length){
    html += '<div class="canvas-empty rel-map-empty">No relationships yet. Click "Add Relationship" to connect characters.</div>';
  }

  html += '</div>';
  return html;
};

DAL.initRelMap = function(proj){
  var sel = document.getElementById('relCenterSelect');
  if(sel){
    sel.addEventListener('change', function(){
      DAL._relCenter = sel.value;
      DAL.render();
    });
  }
};

/* --- Plot Threads --- */
DAL.renderPlotThreads = function(proj){
  if(!proj.plots) proj.plots = [];
  if(DAL.selectedPlotId){
    var p = proj.plots.find(function(pl){ return pl.id === DAL.selectedPlotId; });
    if(p) return DAL.renderPlotDetail(proj, p);
  }

  var main = proj.plots.filter(function(p){ return p.type === 'main'; });
  var sub = proj.plots.filter(function(p){ return p.type !== 'main'; });
  var now = Date.now();

  var html = '<div class="section-header"><div class="section-title">Plot Threads</div></div>';

  // Main plots
  html += '<div class="plot-section"><div class="plot-section-title">Main Plot</div>';
  if(main.length){
    main.forEach(function(p){
      var stale = (now - (p.lastTouched||p.createdAt||0)) > 30*86400000;
      html += '<div class="plot-card" data-action="select-plot" data-pid="'+p.id+'">'+
        '<div class="plot-status-dot '+p.status+'"></div>'+
        '<div style="flex:1"><div style="font-weight:600">'+DAL.escapeHtml(p.title)+'</div></div>'+
        (stale?'<span class="stale-warning">⚠ stale</span>':'')+
        '<span class="badge">'+DAL.escapeHtml(p.status)+'</span></div>';
    });
  } else {
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);padding:8px">No main plot threads</div>';
  }
  html += '<button class="btn sm" data-action="add-plot" data-type="main" style="margin-top:4px">+ Add Main Plot</button></div>';

  // Subplots
  html += '<div class="plot-section"><div class="plot-section-title">Subplots</div>';
  if(sub.length){
    sub.forEach(function(p){
      var stale = (now - (p.lastTouched||p.createdAt||0)) > 30*86400000;
      html += '<div class="plot-card" data-action="select-plot" data-pid="'+p.id+'">'+
        '<div class="plot-status-dot '+p.status+'"></div>'+
        '<div style="flex:1"><div style="font-weight:600">'+DAL.escapeHtml(p.title)+'</div></div>'+
        (stale?'<span class="stale-warning">⚠ stale</span>':'')+
        '<span class="badge">'+DAL.escapeHtml(p.status)+'</span></div>';
    });
  } else {
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);padding:8px">No subplots</div>';
  }
  html += '<button class="btn sm" data-action="add-plot" data-type="subplot" style="margin-top:4px">+ Add Subplot</button></div>';

  return html;
};

DAL.renderPlotDetail = function(proj, p){
  var now = Date.now();
  var stale = (now - (p.lastTouched||p.createdAt||0)) > 30*86400000;
  var html = '<div class="u-measure">';
  html += '<div style="margin-bottom:16px"><button class="btn sm" data-action="back-to-plots">← Back</button></div>';
  html += '<input class="form-input" style="font-size:var(--ts-lg);font-weight:700;margin-bottom:12px" id="plotTitle" value="'+DAL.escapeHtml(p.title)+'" placeholder="Plot title">';
  html += '<div class="form-row" style="margin-bottom:12px">'+
    '<div class="form-group"><label class="form-label">Type</label><select class="form-select" id="plotType"><option value="main"'+(p.type==='main'?' selected':'')+'>Main Plot</option><option value="subplot"'+(p.type!=='main'?' selected':'')+'>Subplot</option></select></div>'+
    '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="plotStatus">'+
      ['planted','developing','climax','resolved','dormant'].map(function(s){ return '<option value="'+s+'"'+(p.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>'; }).join('')+
    '</select></div></div>';
  html += '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="plotDesc" placeholder="Describe this plot thread...">'+DAL.escapeHtml(p.description||'')+'</textarea></div>';

  // Linked chapters
  html += '<div class="form-group"><label class="form-label">Linked Chapters</label><div style="display:flex;flex-wrap:wrap;gap:4px">';
  (proj.chapters||[]).forEach(function(ch){
    var sel = (p.linkedChapterIds||[]).indexOf(ch.id) >= 0;
    html += '<span class="chip'+(sel?' selected':'')+'" data-action="toggle-plot-chapter" data-pid="'+p.id+'" data-chid="'+ch.id+'">'+DAL.escapeHtml(ch.title)+'</span>';
  });
  if(!proj.chapters||!proj.chapters.length) html += '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">No chapters yet</span>';
  html += '</div></div>';

  // Linked characters
  html += '<div class="form-group"><label class="form-label">Linked Characters</label><div style="display:flex;flex-wrap:wrap;gap:4px">';
  (proj.characters||[]).forEach(function(c){
    var sel = (p.linkedCharacterIds||[]).indexOf(c.id) >= 0;
    html += '<span class="chip'+(sel?' selected':'')+'" data-action="toggle-plot-char" data-pid="'+p.id+'" data-cid="'+c.id+'">'+DAL.escapeHtml(c.name)+'</span>';
  });
  if(!proj.characters||!proj.characters.length) html += '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">No characters yet</span>';
  html += '</div></div>';

  if(stale) html += '<div class="stale-warning" style="margin-bottom:12px">⚠ This plot thread hasn\'t been touched in 30+ days</div>';
  html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-bottom:12px">Last touched: '+DAL.formatDate(p.lastTouched||p.createdAt)+'</div>';

  html += '<div style="display:flex;gap:8px"><button class="btn sm" data-action="mark-reviewed" data-pid="'+p.id+'">Mark Reviewed</button><button class="btn sm danger" data-action="delete-plot" data-pid="'+p.id+'">Delete</button></div>';
  html += '</div>';
  return html;
};

/* --- Lore Notebook --- */
DAL.renderLoreNotebook = function(proj){
  if(!proj.lore) proj.lore = { folders: ['Locations','Factions','Magic / Technology','Relics & Artifacts','Cosmology & History','Miscellaneous'], entries: [] };
  if(!DAL.selectedLoreFolder) DAL.selectedLoreFolder = proj.lore.folders[0] || 'Miscellaneous';

  if(DAL.selectedLoreEntry){
    var entry = proj.lore.entries.find(function(e){ return e.id === DAL.selectedLoreEntry; });
    if(entry) return DAL.renderLoreDetail(proj, entry);
  }

  var html = '<div class="lore-layout u-fill-body">';
  // Sidebar
  html += '<div class="lore-sidebar"><div style="padding:8px 12px;border-bottom:1px solid var(--c-border)"><span style="font-size:var(--ts-xs);font-weight:600;text-transform:uppercase;color:var(--c-text-muted)">Lore</span></div>';
  proj.lore.folders.forEach(function(f){
    var active = f === DAL.selectedLoreFolder ? ' active' : '';
    var count = proj.lore.entries.filter(function(e){ return e.folder === f; }).length;
    html += '<div class="lore-folder'+active+'" data-action="select-lore-folder" data-folder="'+DAL.escapeHtml(f)+'">'+DAL.escapeHtml(f)+' ('+count+')</div>';
    // Show entries in this folder
    proj.lore.entries.filter(function(e){ return e.folder === f; }).forEach(function(e){
      html += '<div class="lore-entry-item" data-action="select-lore-entry" data-eid="'+e.id+'">'+DAL.escapeHtml(e.title)+'</div>';
    });
  });
  html += '<div style="padding:8px 12px"><button class="btn sm" data-action="add-lore-folder">+ Folder</button></div>';
  html += '</div>';

  // Main area
  var entries = proj.lore.entries.filter(function(e){ return e.folder === DAL.selectedLoreFolder; });
  html += '<div class="lore-main">';
  html += '<div class="section-header"><div class="section-title">'+DAL.escapeHtml(DAL.selectedLoreFolder)+'</div><button class="btn primary" data-action="add-lore-entry">+ Add Entry</button></div>';
  if(!entries.length){
    html += '<div class="empty-state"><h3>No Entries</h3><p>Add lore entries to this category.</p><button class="btn primary" data-action="add-lore-entry">Add Entry</button></div>';
  } else {
    entries.forEach(function(e){
      html += '<div class="card hoverable" style="margin-bottom:8px;cursor:pointer" data-action="select-lore-entry" data-eid="'+e.id+'"><div style="font-weight:600">'+DAL.escapeHtml(e.title)+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-top:2px">'+(e.tags||[]).join(', ')+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:2px">'+DAL.formatDate(e.updatedAt)+'</div></div>';
    });
  }
  html += '</div></div>';
  return html;
};

DAL.renderLoreDetail = function(proj, entry){
  var html = '<div class="u-measure">';
  html += '<div style="margin-bottom:16px"><button class="btn sm" data-action="back-to-lore">← Back</button></div>';
  html += '<input class="form-input" style="font-size:var(--ts-lg);font-weight:700;margin-bottom:12px" id="loreTitle" value="'+DAL.escapeHtml(entry.title)+'" placeholder="Entry title">';
  html += '<div class="form-group"><label class="form-label">Category</label><select class="form-select" id="loreFolder">';
  proj.lore.folders.forEach(function(f){
    html += '<option value="'+DAL.escapeHtml(f)+'"'+(entry.folder===f?' selected':'')+'>'+DAL.escapeHtml(f)+'</option>';
  });
  html += '</select></div>';
  html += '<div class="form-group"><label class="form-label">Content</label><textarea class="form-textarea" id="loreContent" style="min-height:200px" placeholder="Write lore content...">'+DAL.escapeHtml(entry.content||'')+'</textarea></div>';
  html += '<div class="form-group"><label class="form-label">Tags</label><input class="form-input" id="loreTags" value="'+DAL.escapeHtml((entry.tags||[]).join(', '))+'" placeholder="comma, separated, tags"></div>';

  // Linked characters
  html += '<div class="form-group"><label class="form-label">Linked Characters</label><div style="display:flex;flex-wrap:wrap;gap:4px">';
  (proj.characters||[]).forEach(function(c){
    var sel = (entry.linkedCharIds||[]).indexOf(c.id) >= 0;
    html += '<span class="chip'+(sel?' selected':'')+'" data-action="toggle-lore-char" data-eid="'+entry.id+'" data-cid="'+c.id+'">'+DAL.escapeHtml(c.name)+'</span>';
  });
  html += '</div></div>';

  // Linked plots
  html += '<div class="form-group"><label class="form-label">Linked Plot Threads</label><div style="display:flex;flex-wrap:wrap;gap:4px">';
  (proj.plots||[]).forEach(function(p){
    var sel = (entry.linkedPlotIds||[]).indexOf(p.id) >= 0;
    html += '<span class="chip'+(sel?' selected':'')+'" data-action="toggle-lore-plot" data-eid="'+entry.id+'" data-pid="'+p.id+'">'+DAL.escapeHtml(p.title)+'</span>';
  });
  html += '</div></div>';

  html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:12px">Last edited: '+DAL.formatDate(entry.updatedAt)+'</div>';
  html += '<button class="btn sm danger" style="margin-top:12px" data-action="delete-lore-entry" data-eid="'+entry.id+'">Delete Entry</button>';
  html += '</div>';
  return html;
};

/* --- Illustrations / Asset Library --- */
DAL.renderIllustrations = function(proj){
  if(!proj.images) proj.images = [];
  var html = '<div class="u-measure-wide">';
  html += '<div class="section-header"><div class="section-title">Illustrations</div>'+
    '<div style="display:flex;gap:8px">'+
    '<input type="file" id="illustrationUpload" accept="image/*" multiple style="display:none">'+
    '<button class="btn primary" data-action="upload-illustration">+ Upload Images</button>'+
    '</div></div>';
  html += '<p style="color:var(--c-text-muted);font-size:var(--ts-sm);margin-bottom:16px;line-height:1.6">Your project asset library. Images uploaded here belong to this project only — they won\'t appear in other stories. Use these for book covers, chapter illustrations, character portraits, item icons, and scene artwork.</p>';

  if(proj.images.length === 0){
    html += '<div class="card" style="text-align:center;padding:40px">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:var(--c-text-faint);margin:0 auto 12px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
    html += '<div style="font-weight:600;margin-bottom:4px">No illustrations yet</div>';
    html += '<div style="font-size:var(--ts-sm);color:var(--c-text-muted)">Upload images to build your asset library. You can then assign them as covers, chapter art, item icons, and scene illustrations.</div>';
    html += '</div>';
  } else {
    html += '<div class="illustration-grid">';
    proj.images.forEach(function(img, i){
      html += '<div class="illustration-card">';
      html += '<div class="illustration-thumb">'+(DAL.imageSrc(proj,img)?'<img src="'+DAL.imageSrc(proj,img)+'">':'<div class="illustration-placeholder">No image</div>')+'</div>';
      html += '<div class="illustration-info">';
      html += '<input class="form-input illustration-name-input" value="'+DAL.escapeHtml(img.name||'')+'" data-illustration-name="'+i+'" placeholder="Image name">';
      html += '<div style="display:flex;align-items:center;gap:4px;margin-top:4px">';
      html += '<select class="form-select illustration-category" data-illustration-category="'+i+'" style="font-size:var(--ts-xs);flex:1">';
      var cats = ['Cover','Chapter Art','Character','Item Icon','Scene','Other'];
      cats.forEach(function(c){ html += '<option value="'+c.toLowerCase().replace(/\s/g,'-')+'"'+(img.category===c.toLowerCase().replace(/\s/g,'-')?' selected':'')+'>'+c+'</option>'; });
      html += '</select>';
      html += '<button class="btn sm danger" data-action="delete-illustration" data-idx="'+i+'">&times;</button>';
      html += '</div>';
      if(img.usedIn && img.usedIn.length){
        html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:4px">Used in: '+DAL.escapeHtml(img.usedIn.join(', '))+'</div>';
      }
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
};

/* --- Mind Map --- */
DAL.renderMindMap = function(proj){
  if(!proj.mindmap) proj.mindmap = { nodes: [], edges: [] };
  var mm = proj.mindmap;

  var html = '<div class="canvas-toolbar">'+
    '<button class="tb-btn" data-action="mm-add-node"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>'+
    '<button class="tb-btn" data-action="mm-connect" '+(DAL.connectMode?'style="background:var(--c-accent-soft);color:var(--c-accent)"':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>'+
    '<button class="tb-btn" data-action="mm-delete-sel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>'+
    '<span class="tb-sep"></span>'+
    DAL.canvasViewControls()+
    '<span style="flex:1"></span>'+DAL.infoIcon('Mind Map: double-tap the canvas to add an idea node. Turn on Connect mode, then tap two nodes in order to draw a line between them. Tap a node to rename it; tap a line to remove it. Drag nodes to rearrange.')+
  '</div>';
  html += '<div class="canvas-container u-fill-canvas" id="canvasContainer"><div class="canvas-inner" id="canvasInner"><div class="canvas-stage" id="canvasStage">';
  html += '<svg class="canvas-svg" id="canvasSvg"></svg>';
  mm.nodes.forEach(function(n){
    var sel = n.id === DAL.selectedNodeId ? ' selected' : '';
    var label = n.label || 'Idea';
    html += '<div class="canvas-node'+sel+'" data-action="mm-select" data-nid="'+n.id+'" style="left:'+(n.x||0)+'px;top:'+(n.y||0)+'px">'+
      '<div class="canvas-node-title">'+DAL.escapeHtml(label)+'</div>'+
      (n.type?'<div class="canvas-node-badge">'+DAL.escapeHtml(n.type)+'</div>':'')+
    '</div>';
  });
  if(!mm.nodes.length){
    html += '<div class="canvas-empty">'+
      '<div style="margin-bottom:8px;font-size:var(--ts-lg);color:var(--c-text-muted)">What is a Mind Map?</div>'+
      '<p style="line-height:1.6">A mind map is a free-form visual brainstorming space. Use it to jot down ideas, connect them with lines, and see how different parts of your story relate to each other.</p>'+
      '<p style="margin-top:8px"><strong>Double-click</strong> the canvas to add an idea, <strong>click two nodes in Connect mode</strong> to link them, <strong>click a node</strong> to rename it, and <strong>click a line</strong> to remove it.</p>'+
    '</div>';
  }
  html += '</div></div></div>';
  return html;
};

/* --- Canvas: view controls, panning, zooming and node dragging -------------
   One implementation serves both boards. Which board is on screen is decided by
   the current tool, and the shape of the data differs (a story graph connects
   scenes through choices, a mind map through its own edge list), but the
   gestures, the zoom and the saved view behave identically in both.

   Zoom works by scaling an inner stage. The scrollable box around it grows with
   the scale, because a transform changes what gets drawn without changing the
   size of anything that scrolls — without that, zooming in would put the far
   side of the board out of reach. */

// Movement below this many pixels is treated as a tap, not a drag, so a click
// on a node is never swallowed by an accidental one-pixel wobble.
DAL.CANVAS_DRAG_SLOP = 4;

// Shared zoom + grab controls for both canvas toolbars.
DAL.canvasViewControls = function(){
  var proj = DAL.state && DAL.currentProjectId ? DAL.state.projects[DAL.currentProjectId] : null;
  var zoom = proj ? DAL.canvasView(proj).zoom : 1;
  var grab = DAL.grabMode ? ' active' : '';
  return '<button class="tb-btn'+grab+'" data-action="sg-grab" aria-pressed="'+(DAL.grabMode?'true':'false')+'"'+
      ' title="Grab tool — drag the board around instead of moving scenes" aria-label="Grab tool">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">'+
      '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v7"/>'+
      '<path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>'+
      '<path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-1a2 2 0 0 1 4 0"/></svg></button>'+
    '<button class="tb-btn" data-action="sg-zoom-out" title="Zoom out" aria-label="Zoom out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>'+
    '<span class="tb-zoom" data-canvas-zoom aria-live="polite">'+Math.round(zoom*100)+'%</span>'+
    '<button class="tb-btn" data-action="sg-zoom-in" title="Zoom in" aria-label="Zoom in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>'+
    '<button class="tb-btn" data-action="sg-reset" title="Back to 100% and centre on your scenes" aria-label="Reset zoom and position"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>'+
    '<span class="tb-sep"></span>';
};

DAL.canvasEls = function(){
  var container = document.getElementById('canvasContainer');
  var inner = document.getElementById('canvasInner');
  var stage = document.getElementById('canvasStage');
  if(!container || !inner || !stage) return null;
  return { container: container, inner: inner, stage: stage, svg: document.getElementById('canvasSvg') };
};

// The nodes and connections of whichever board is on screen.
DAL.canvasData = function(proj){
  if(DAL.canvasBoard() === 'storygraph') return DAL.ensureAdventure(proj);
  if(!proj.mindmap) proj.mindmap = { nodes: [], edges: [] };
  return proj.mindmap;
};

DAL.applyCanvasView = function(proj){
  var els = DAL.canvasEls();
  if(!els) return;
  var view = DAL.canvasView(proj);
  els.stage.style.transform = view.zoom === 1 ? '' : 'scale('+view.zoom+')';
  els.inner.style.width = Math.round(els.stage.offsetWidth * view.zoom) + 'px';
  els.inner.style.height = Math.round(els.stage.offsetHeight * view.zoom) + 'px';
  var label = document.querySelector('[data-canvas-zoom]');
  if(label) label.textContent = Math.round(view.zoom * 100) + '%';
};

// Scrolling is how the canvas is panned, so the saved position is a scroll
// offset. Writing it back is guarded because restoring it fires scroll events of
// its own, which would otherwise overwrite what we are in the middle of applying.
DAL._canvasRestoring = false;

DAL.restoreCanvasScroll = function(proj){
  var els = DAL.canvasEls();
  if(!els) return;
  var view = DAL.canvasView(proj);
  DAL._canvasRestoring = true;
  els.container.scrollLeft = view.scrollX;
  els.container.scrollTop = view.scrollY;
  setTimeout(function(){ DAL._canvasRestoring = false; }, 0);
};

DAL.rememberCanvasScroll = function(proj){
  var els = DAL.canvasEls();
  if(!els || DAL._canvasRestoring) return;
  var view = DAL.canvasView(proj);
  view.scrollX = els.container.scrollLeft;
  view.scrollY = els.container.scrollTop;
  DAL.saveState();
};

/* Steps to another zoom level while holding whatever is in the middle of the
   viewport still, which is what makes repeated zooming feel like it is aimed at
   the work rather than at the corner of the board. */
DAL.stepCanvasZoom = function(proj, delta){
  var els = DAL.canvasEls();
  if(!els) return;
  var view = DAL.canvasView(proj);
  var i = DAL.zoomIndex(view.zoom) + delta;
  if(i < 0 || i >= DAL.ZOOM_LEVELS.length){
    DAL.toast(delta > 0 ? 'Already at the closest zoom' : 'Already at the widest zoom', 'info');
    return;
  }
  var c = els.container;
  var midX = (c.scrollLeft + c.clientWidth / 2) / view.zoom;
  var midY = (c.scrollTop + c.clientHeight / 2) / view.zoom;
  view.zoom = DAL.ZOOM_LEVELS[i];
  DAL.applyCanvasView(proj);
  DAL._canvasRestoring = true;
  c.scrollLeft = Math.max(0, midX * view.zoom - c.clientWidth / 2);
  c.scrollTop = Math.max(0, midY * view.zoom - c.clientHeight / 2);
  setTimeout(function(){ DAL._canvasRestoring = false; }, 0);
  view.scrollX = c.scrollLeft;
  view.scrollY = c.scrollTop;
  DAL.saveState();
};

/* Reset means 100% centred on the work: an empty board goes to the origin, and
   a board with scenes centres on them, so reset always ends up somewhere useful
   rather than staring at blank grid. */
DAL.resetCanvasView = function(proj){
  var els = DAL.canvasEls();
  if(!els) return;
  var view = DAL.canvasView(proj);
  view.zoom = 1;
  DAL.applyCanvasView(proj);
  var nodes = (DAL.canvasData(proj).nodes || []);
  var x = 0, y = 0;
  if(nodes.length){
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function(n){
      var nx = n.x || 0, ny = n.y || 0;
      if(nx < minX) minX = nx;
      if(ny < minY) minY = ny;
      if(nx > maxX) maxX = nx;
      if(ny > maxY) maxY = ny;
    });
    x = (minX + maxX) / 2 - els.container.clientWidth / 2;
    y = (minY + maxY) / 2 - els.container.clientHeight / 2;
  }
  view.scrollX = Math.max(0, Math.round(x));
  view.scrollY = Math.max(0, Math.round(y));
  DAL.restoreCanvasScroll(proj);
  DAL.saveState();
};

/* Grab mode is sticky: press once to pick the hand up, press again (or Escape)
   to put it down. It is toggled in place rather than through a re-render so the
   board does not flicker or lose its place mid-gesture. */
DAL.setGrabMode = function(on){
  DAL.grabMode = !!on;
  var els = DAL.canvasEls();
  if(els) els.container.classList.toggle('grab-mode', DAL.grabMode);
  var btn = document.querySelector('[data-action="sg-grab"]');
  if(btn){
    btn.classList.toggle('active', DAL.grabMode);
    btn.setAttribute('aria-pressed', DAL.grabMode ? 'true' : 'false');
  }
};

DAL.handleCanvasClick = function(action, el, e){
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj || !DAL.canvasEls()) return;
  if(action === 'sg-grab'){ DAL.setGrabMode(!DAL.grabMode); return; }
  if(action === 'sg-zoom-in'){ DAL.stepCanvasZoom(proj, 1); return; }
  if(action === 'sg-zoom-out'){ DAL.stepCanvasZoom(proj, -1); return; }
  if(action === 'sg-reset'){ DAL.resetCanvasView(proj); return; }
};

/* Redraws the connection lines from the current node positions. Called on every
   frame of a node drag as well as after one, so lines stay attached to their
   nodes instead of snapping into place at the end. */
DAL.drawCanvasEdges = function(proj, data){
  var els = DAL.canvasEls();
  if(!els || !els.svg) return;
  var isStoryGraph = DAL.canvasBoard() === 'storygraph';
  var parts = [];
  // The arrow marker has to be redefined each time because the whole svg body is
  // rewritten; a story graph reads as a direction of travel without it.
  if(isStoryGraph){
    parts.push('<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'+
      '<path d="M0,0 L10,5 L0,10 z" fill="var(--c-border)"/></marker></defs>');
  }
  var curve = function(from, to, extra, trim){
    var x1 = (from.x||0)+70, y1 = (from.y||0)+20;
    var x2 = (to.x||0)+70, y2 = (to.y||0)+20;
    var mx = (x1+x2)/2, my = (y1+y2)/2-20;
    if(trim){
      // Lines run centre to centre, so an arrowhead at the exact end point would
      // sit underneath the scene box where nobody can see it. Pull the end back
      // to just outside the box along the direction the line arrives from.
      var dx = x2-mx, dy = y2-my;
      var hw = 78, hh = 32;
      var t = Math.min(Math.abs(dx) > 0.01 ? hw/Math.abs(dx) : Infinity,
                       Math.abs(dy) > 0.01 ? hh/Math.abs(dy) : Infinity);
      if(isFinite(t) && t < 1){ x2 -= dx*t; y2 -= dy*t; }
    }
    return '<path d="M'+x1+','+y1+' Q'+mx+','+my+' '+Math.round(x2)+','+Math.round(y2)+'" fill="none" stroke="var(--c-border)" stroke-width="2" '+extra+'/>';
  };
  var nodes = data.nodes || [];
  var find = function(id){ return nodes.find(function(n){ return n.id === id; }); };
  if(isStoryGraph){
    nodes.forEach(function(n){
      (n.choices||[]).forEach(function(ch){
        if(!ch.targetNodeId) return;
        var to = find(ch.targetNodeId);
        if(to) parts.push(curve(n, to, 'marker-end="url(#arrowhead)" style="pointer-events:none"', true));
      });
    });
  } else {
    (data.edges||[]).forEach(function(edge){
      var from = find(edge.from), to = find(edge.to);
      if(from && to) parts.push(curve(from, to, 'data-action="mm-delete-edge" data-eid="'+edge.id+'" style="pointer-events:stroke;cursor:pointer"'));
    });
  }
  els.svg.innerHTML = parts.join('');
};

DAL.initCanvasInteractions = function(proj){
  var els = DAL.canvasEls();
  if(!els) return;
  var container = els.container, stage = els.stage;
  var data = DAL.canvasData(proj);

  DAL.applyCanvasView(proj);
  DAL.restoreCanvasScroll(proj);
  DAL.drawCanvasEdges(proj, data);
  container.classList.toggle('grab-mode', DAL.grabMode);

  // Assigned rather than added: the canvas markup is rebuilt on every render, but
  // this runs again on plain redraws too, and addEventListener would stack up a
  // second and third copy of the same gesture on the same element.
  var gesture = null;

  container.onpointerdown = function(e){
    if(e.button > 0) return;
    var nodeEl = e.target.closest('.canvas-node');
    var view = DAL.canvasView(proj);
    if(nodeEl && !DAL.grabMode && !DAL.connectMode){
      var node = (data.nodes||[]).find(function(n){ return n.id === nodeEl.getAttribute('data-nid'); });
      if(!node) return;
      gesture = { kind: 'node', node: node, el: nodeEl, fromX: node.x||0, fromY: node.y||0 };
    } else if(DAL.grabMode){
      gesture = { kind: 'pan', scrollX: container.scrollLeft, scrollY: container.scrollTop };
    } else {
      return;
    }
    gesture.id = e.pointerId;
    gesture.startX = e.clientX;
    gesture.startY = e.clientY;
    gesture.moved = false;
    // Capturing keeps the gesture alive when the pointer runs off the node or
    // past the edge of the canvas mid-drag.
    try { container.setPointerCapture(e.pointerId); } catch(err) {}
  };

  container.onpointermove = function(e){
    if(!gesture || e.pointerId !== gesture.id) return;
    var dx = e.clientX - gesture.startX, dy = e.clientY - gesture.startY;
    if(!gesture.moved && Math.abs(dx) + Math.abs(dy) < DAL.CANVAS_DRAG_SLOP) return;
    gesture.moved = true;
    if(gesture.kind === 'pan'){
      // Panning moves the scroll box, which is measured in screen pixels, so the
      // pointer movement is used as it comes.
      DAL._canvasRestoring = true;
      container.scrollLeft = gesture.scrollX - dx;
      container.scrollTop = gesture.scrollY - dy;
    } else {
      // Node coordinates are unscaled board units, so the movement is divided by
      // the zoom or the node slides away from the pointer at any other scale.
      var z = DAL.canvasView(proj).zoom;
      gesture.node.x = Math.max(0, Math.round(gesture.fromX + dx / z));
      gesture.node.y = Math.max(0, Math.round(gesture.fromY + dy / z));
      gesture.el.style.left = gesture.node.x + 'px';
      gesture.el.style.top = gesture.node.y + 'px';
      DAL.drawCanvasEdges(proj, data);
    }
  };

  var finish = function(e){
    if(!gesture || (e && e.pointerId !== gesture.id)) return;
    try { container.releasePointerCapture(gesture.id); } catch(err) {}
    if(gesture.moved){
      // A real drag must not also count as a click, or letting go of a node
      // would open its editor every time.
      DAL._canvasClickGuard = true;
      if(gesture.kind === 'node'){
        proj.updatedAt = Date.now();
        DAL.drawCanvasEdges(proj, data);
        DAL.saveState();
      } else {
        DAL._canvasRestoring = false;
        DAL.rememberCanvasScroll(proj);
      }
    }
    gesture = null;
  };
  container.onpointerup = finish;
  container.onpointercancel = finish;

  container.onclick = function(e){
    if(DAL._canvasClickGuard){
      DAL._canvasClickGuard = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  container.onscroll = function(){
    if(DAL._canvasRestoring) return;
    if(DAL._canvasScrollTimer) clearTimeout(DAL._canvasScrollTimer);
    DAL._canvasScrollTimer = setTimeout(function(){ DAL.rememberCanvasScroll(proj); }, 250);
  };

  // Double-click adds an idea to a mind map. A story graph's scenes are created
  // from the toolbar instead, because a scene needs a title and text to mean
  // anything.
  container.ondblclick = function(e){
    if(DAL.canvasBoard() === 'storygraph') return;
    if(e.target !== container && e.target !== els.inner && e.target !== stage && e.target !== els.svg) return;
    var rect = stage.getBoundingClientRect();
    var z = DAL.canvasView(proj).zoom;
    data.nodes.push({
      id: DAL.uid('mm'), label: 'New Idea', type: 'idea',
      x: Math.max(0, Math.round((e.clientX - rect.left) / z)),
      y: Math.max(0, Math.round((e.clientY - rect.top) / z))
    });
    DAL.saveState(); DAL.render();
  };
};

/* --- Book Preview --- */
DAL.renderBookPreview = function(proj){
  if(!proj.chapters || !proj.chapters.length){
    return '<div class="empty-state"><h3>No Chapters</h3><p>Add chapters to your manuscript to preview the book.</p></div>';
  }
  if(DAL.readerPage === undefined || DAL.readerPage === null) DAL.readerPage = 0;
  if(DAL._readerPid !== proj.id){ DAL.readerPage = 0; DAL._readerPid = proj.id; }

  var pages = [];
  var author = proj.cover.author || (DAL.state.autoFillAuthor ? DAL.state.authorName : '');
  // Cover page with illustration
  var coverHtml = '<div class="book-cover">';
  if(proj.cover.imageDataUrl){
    coverHtml += '<div class="book-cover-image"><img src="'+proj.cover.imageDataUrl+'"></div>';
  }
  coverHtml += '<div class="book-cover-title">'+DAL.escapeHtml(proj.cover.title||proj.name)+'</div>'+(proj.cover.subtitle?'<div style="font-size:var(--ts-sm);opacity:.7;margin-bottom:12px">'+DAL.escapeHtml(proj.cover.subtitle)+'</div>':'')+(author?'<div class="book-cover-author">'+DAL.escapeHtml(author)+'</div>':'')+'</div>';
  pages.push({ html: coverHtml });
  // Cover controls (upload/remove) — hidden in reader, shown in preview toolbar
  pages.push({ html: '<div class="book-cover-controls"><h3>Cover Illustration</h3>'+
    (proj.cover.imageDataUrl?'<div class="cover-preview-box"><img src="'+proj.cover.imageDataUrl+'"></div>':'<div class="cover-preview-box empty">No cover image set</div>')+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
    '<input type="file" id="coverImageInput" accept="image/*" style="display:none">'+
    '<button class="btn sm" data-action="upload-cover">'+(proj.cover.imageDataUrl?'Change Image':'Upload Cover')+'</button>'+
    (proj.cover.imageDataUrl?'<button class="btn sm danger" data-action="remove-cover">Remove</button>':'')+
    '</div></div>' });
  var tocHtml = '<h1>Table of Contents</h1>';
  /* Chapters begin after the cover, the cover controls and this table, so the
     first chapter is page three. */
  proj.chapters.forEach(function(ch, i){ tocHtml += '<p style="cursor:pointer;color:var(--c-accent)" data-action="bp-goto" data-page="'+(i+3)+'">'+(i+1)+'. '+DAL.escapeHtml(ch.title)+'</p>'; });
  pages.push({ html: tocHtml });
  proj.chapters.forEach(function(ch){
    var chHtml = '<h2>'+DAL.escapeHtml(ch.title)+'</h2>';
    // Chapter images
    if(ch.images && ch.images.length){
      ch.images.forEach(function(img){
        chHtml += '<div class="chapter-illustration"><img src="'+DAL.imageSrc(proj,img)+'">'+(img.name?'<div class="chapter-illustration-caption">'+DAL.escapeHtml(img.name)+'</div>':'')+'</div>';
      });
    }
    /* Wrapping the prose keeps the drop capital on the chapter's own opening
       paragraph rather than on the first line of the table of contents. */
    chHtml += '<div class="chapter-prose">'+ch.contentHTML+'</div>';
    pages.push({ html: chHtml });
  });
  if(DAL.readerPage >= pages.length) DAL.readerPage = 0;

  /* The narrator needs to know which chapter is on screen so a bound voiceover
     clip is used in place of the synthesised voice. */
  var pageCh = proj.chapters[DAL.readerPage - 3] || null;
  DAL._readAloudCid = pageCh ? pageCh.id : '';

  var html = '<div class="book-reader"'+DAL.readerStyleAttr()+'>';
  html += '<div class="book-reader-toolbar"><div class="reader-title">Book Preview</div>'+DAL.readerControls()+'</div>';
  html += '<div class="book-page-container"><div class="book-page" id="bookPage">'+pages[DAL.readerPage].html+'<div class="book-page-num">'+(DAL.readerPage+1)+' / '+pages.length+'</div></div></div>';
  html += '<div class="book-nav"><button class="btn sm" data-action="bp-prev" '+(DAL.readerPage<=0?'disabled':'')+'>← Previous</button><span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+(DAL.readerPage+1)+' / '+pages.length+'</span><button class="btn sm" data-action="bp-next" '+(DAL.readerPage>=pages.length-1?'disabled':'')+'>Next →</button></div></div>';
  return html;
};

/* --- Export registry -------------------------------------------------------
   Every export button in the app is generated from this one list so the Export
   tool tab, the RPG export tab and the Export Project dialog cannot drift apart
   in wording or in which formats they offer. Groups appear only when the
   project actually has that kind of content. */
DAL.exportGroups = function(proj){
  var groups = [];
  var chapters = proj.chapters || [];
  var nodes = (proj.adventure && proj.adventure.nodes) ? proj.adventure.nodes : [];
  var hasProse = proj.type === 'novel' || proj.type === 'dual' || chapters.length > 0;
  var hasAdventure = proj.type === 'rpg' || proj.type === 'dual' || nodes.length > 0;

  groups.push({
    title: 'Whole project',
    note: 'Everything in this project: chapters, characters, lore, adventure and its settings. Import it again with File \u25b8 Import project, which adds it alongside your other projects.',
    items: [{ action: 'export-json', label: 'Project data (.json)' }]
  });
  if(hasProse){
    groups.push({
      title: 'Manuscript',
      note: 'The prose on its own. This is not a project backup \u2014 characters, lore and settings are not included.',
      items: [
        { action: 'export-manuscript-txt',  label: 'Manuscript (.txt)' },
        { action: 'export-manuscript-md',   label: 'Manuscript (.md)' },
        { action: 'export-manuscript-html', label: 'Manuscript (.html)' }
      ]
    });
  }
  if(chapters.length){
    groups.push({
      title: 'Single chapter',
      select: { id: 'exportChapterSelect', options: chapters.map(function(ch, i){ return { value: ch.id, label: (i + 1) + '. ' + ch.title }; }) },
      items: [
        { action: 'export-chapter-txt', label: 'Chapter (.txt)', small: true },
        { action: 'export-chapter-md',  label: 'Chapter (.md)',  small: true }
      ]
    });
  }
  if(hasAdventure){
    groups.push({
      title: 'Adventure',
      note: 'Playable formats for the branching story. The playable file runs the same rules the Playthrough tool runs, on its own, in any browser. Twine source opens in Twine and carries stats, traits, items and gated choices; anything SugarCube cannot express is listed in a "Not Carried Over" passage.',
      items: [
        { action: 'export-twee',          label: 'Twine source (.twee)' },
        { action: 'export-playable-html', label: 'Playable adventure (.html)' }
      ]
    });
  }
  if(nodes.length){
    groups.push({
      title: 'Single scene',
      select: { id: 'exportNodeSelect', options: nodes.map(function(n){ return { value: n.id, label: n.title || 'Untitled' }; }) },
      items: [{ action: 'export-node-text', label: 'Scene (.txt)', small: true }]
    });
  }
  return groups;
};

DAL.renderExportGroups = function(proj){
  return DAL.exportGroups(proj).map(function(g){
    var h = '<div class="card export-group"><div class="export-group-title">' + DAL.escapeHtml(g.title) + '</div>';
    if(g.note) h += '<p class="export-group-note">' + DAL.escapeHtml(g.note) + '</p>';
    if(g.select){
      h += '<select class="form-select export-group-select" id="' + g.select.id + '">';
      g.select.options.forEach(function(o){ h += '<option value="' + o.value + '">' + DAL.escapeHtml(o.label) + '</option>'; });
      h += '</select>';
    }
    h += '<div class="export-group-actions">';
    g.items.forEach(function(it){
      h += '<button class="btn' + (it.small ? ' sm' : '') + '" data-action="' + it.action + '" data-pid="' + proj.id + '">' + DAL.escapeHtml(it.label) + '</button>';
    });
    return h + '</div></div>';
  }).join('');
};

/* Export actions also fire from the File menu, where no button carries a
   project id, so fall back to the open project. */
DAL.exportTarget = function(el){
  var pid = (el && el.getAttribute) ? el.getAttribute('data-pid') : null;
  return DAL.state.projects[pid || DAL.currentProjectId] || null;
};

/* The same select ids exist in a tool panel and in the Export Project dialog
   layered over it, so prefer the dialog's copy while one is open. */
DAL.exportSelectValue = function(id){
  var el = document.querySelector('.modal-backdrop #' + id) || document.getElementById(id);
  return el ? el.value : '';
};

/* --- Story Export --- */
DAL.renderStoryExport = function(proj){
  var html = '<div class="u-measure"><div class="section-header"><div class="section-title">Export</div></div>';
  html += DAL.renderExportGroups(proj);

  html += '<div class="card" style="margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">Cross-Project Transfer</div><p style="font-size:var(--ts-sm);color:var(--c-text-muted);margin-bottom:8px">Copy a character, lore entry, or plot thread into another project.</p>'+
    '<div class="form-row"><select class="form-select" id="transferType"><option value="character">Character</option><option value="lore">Lore Entry</option><option value="plot">Plot Thread</option></select>'+
    '<select class="form-select" id="transferItem"></select><select class="form-select" id="transferDest">';
  DAL.state.projectOrder.forEach(function(pid){
    if(pid !== proj.id){ var p = DAL.state.projects[pid]; if(p) html += '<option value="'+pid+'">'+DAL.escapeHtml(p.name)+'</option>'; }
  });
  html += '</select></div><button class="btn primary" style="margin-top:8px" data-action="transfer-item" data-pid="'+proj.id+'">Transfer</button></div>';

  // Version snapshots
  html += '<div class="card"><div style="font-weight:600;margin-bottom:8px">Version Snapshots</div>';
  html += '<button class="btn sm" data-action="save-version" data-pid="'+proj.id+'">Save Version Now</button>';
  if(proj.versions && proj.versions.length){
    html += '<div style="margin-top:8px;max-height:200px;overflow-y:auto">';
    proj.versions.forEach(function(v, i){
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--c-divider)"><span style="font-size:var(--ts-xs)">'+new Date(v.ts).toLocaleString()+(v.auto?' (auto)':'')+' — '+v.snapWords+' words</span><button class="btn sm" data-action="restore-version" data-pid="'+proj.id+'" data-idx="'+i+'">Restore</button></div>';
    });
    html += '</div>';
  } else {
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:8px">No versions saved yet</div>';
  }
  html += '</div></div>';
  return html;
};

DAL.showExportModal = function(pid){
  var proj = DAL.state.projects[pid || DAL.currentProjectId];
  if(!proj){ DAL.toast('Open a project first.','error'); return; }
  DAL.modal('Export \u201c' + DAL.escapeHtml(proj.name) + '\u201d', '<div class="export-groups">' + DAL.renderExportGroups(proj) + '</div>', { footer: '<button class="btn" data-action="close-modal">Close</button>' });
};

/* --- Story Click Handler --- */
DAL.handleStoryClick = function(action, el, e){
  if(action === 'ws-tool'){
    DAL.currentTool = el.getAttribute('data-tool');
    DAL.render();
    return;
  }

  // Illustrations
  if(action === 'upload-illustration'){ document.getElementById('illustrationUpload').click(); return; }

  if(action === 'delete-illustration'){
    var projIll = DAL.state.projects[DAL.currentProjectId];
    var idxIll = parseInt(el.getAttribute('data-idx'));
    if(projIll.images && projIll.images[idxIll]){
      projIll.images.splice(idxIll, 1);
      DAL.saveState(); DAL.render();
    }
    return;
  }

  // Cover image upload in Book Preview
  if(action === 'upload-cover'){ document.getElementById('coverImageInput').click(); return; }

  if(action === 'remove-cover'){
    var projCov = DAL.state.projects[DAL.currentProjectId];
    projCov.cover.imageDataUrl = '';
    DAL.saveState(); DAL.render();
    return;
  }

  // Chapter image upload
  if(action === 'upload-chapter-image'){
    var chIdx = el.getAttribute('data-cid');
    DAL._uploadChapterCid = chIdx;
    document.getElementById('chapterImageInput').click();
    return;
  }

  if(action === 'remove-chapter-image'){
    var projCh = DAL.state.projects[DAL.currentProjectId];
    var cidRm = el.getAttribute('data-cid');
    var imgIdx = parseInt(el.getAttribute('data-img-idx'));
    var chRm = projCh.chapters.find(function(c){ return c.id === cidRm; });
    if(chRm && chRm.images){
      chRm.images.splice(imgIdx, 1);
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'change-status'){
    var pid = el.getAttribute('data-pid');
    var p = DAL.state.projects[pid];
    if(p){ p.status = el.value; p.updatedAt = Date.now(); DAL.saveState(); }
    return;
  }

  // Manuscript
  if(action === 'add-chapter'){
    DAL.pushHistory();
    var proj = DAL.state.projects[DAL.currentProjectId];
    var ch = DAL.defaultChapter('Chapter '+(proj.chapters.length+1), proj.chapters.length);
    proj.chapters.push(ch);
    DAL.selectedChapterId = ch.id;
    proj.updatedAt = Date.now();
    DAL.saveState(); DAL.render();
    return;
  }

  if(action === 'select-chapter'){
    DAL.selectedChapterId = el.getAttribute('data-cid');
    DAL.render();
    return;
  }

  if(action === 'format-block' || action === 'font-family' || action === 'font-size'){
    // These are handled by change event
    return;
  }

  if(action === 'format-cmd'){
    document.execCommand(el.getAttribute('data-cmd'), false, null);
    DAL.saveChapterContent();
    return;
  }

  if(action === 'text-color'){
    document.execCommand('foreColor', false, el.value);
    DAL.saveChapterContent();
    return;
  }

  if(action === 'insert-image'){
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function(){
      if(inp.files[0]) DAL.readImageAsDataURL(inp.files[0], function(dataUrl){
        document.execCommand('insertHTML', false, '<img src="'+dataUrl+'" style="max-width:100%;border-radius:4px"/>');
        DAL.saveChapterContent();
      });
    };
    inp.click();
    return;
  }

  if(action === 'insert-hr'){
    document.execCommand('insertHorizontalRule');
    DAL.saveChapterContent();
    return;
  }

  if(action === 'fullscreen'){
    DAL.distractionFree = !DAL.distractionFree;
    document.body.classList.toggle('distraction-free', DAL.distractionFree);
    return;
  }

  if(action === 'copy-chapter'){
    var proj2 = DAL.state.projects[DAL.currentProjectId];
    var ch2 = proj2.chapters.find(function(c){ return c.id === DAL.selectedChapterId; });
    if(ch2){
      var tmp = document.createElement('div'); tmp.innerHTML = ch2.contentHTML;
      navigator.clipboard.writeText(tmp.textContent).then(function(){ DAL.toast('Chapter copied','success'); });
    }
    return;
  }

  if(action === 'export-chapter'){
    var proj3 = DAL.state.projects[DAL.currentProjectId];
    var ch3 = proj3.chapters.find(function(c){ return c.id === DAL.selectedChapterId; });
    if(ch3){
      var tmp3 = document.createElement('div'); tmp3.innerHTML = ch3.contentHTML;
      DAL.download(DAL.sanitizeFilename(ch3.title)+'.txt', tmp3.textContent);
      DAL.toast('Chapter exported','success');
    }
    return;
  }

  // Characters
  if(action === 'add-character'){
    DAL.pushHistory();
    var proj4 = DAL.state.projects[DAL.currentProjectId];
    var char = { id: DAL.uid('char'), name: 'New Character', role: '', age: '', gender: '', appearance: '', personality: '', backstory: '', arc: '', customFields: [], tags: [], image: '', linkedPlotIds: [], createdAt: Date.now() };
    proj4.characters.push(char);
    DAL.selectedCharId = char.id;
    proj4.updatedAt = Date.now();
    DAL.saveState(); DAL.render();
    return;
  }

  if(action === 'select-character'){
    DAL.selectedCharId = el.getAttribute('data-cid');
    DAL.render();
    return;
  }

  if(action === 'back-to-characters'){
    DAL.selectedCharId = null;
    DAL.render();
    return;
  }

  if(action === 'upload-portrait'){
    var cid = el.getAttribute('data-cid');
    var inp2 = document.createElement('input');
    inp2.type = 'file'; inp2.accept = 'image/*';
    inp2.onchange = function(){
      if(inp2.files[0]) DAL.readImageAsDataURL(inp2.files[0], function(dataUrl){
        var proj5 = DAL.state.projects[DAL.currentProjectId];
        var ch4 = proj5.characters.find(function(c){ return c.id === cid; });
        if(ch4){ ch4.image = dataUrl; DAL.saveState(); DAL.render(); }
      });
    };
    inp2.click();
    return;
  }

  if(action === 'remove-portrait'){
    var cid2 = el.getAttribute('data-cid');
    var proj6 = DAL.state.projects[DAL.currentProjectId];
    var ch5 = proj6.characters.find(function(c){ return c.id === cid2; });
    if(ch5){ ch5.image = ''; DAL.saveState(); DAL.render(); }
    return;
  }

  if(action === 'add-custom-field'){
    var cid3 = el.getAttribute('data-cid');
    var proj7 = DAL.state.projects[DAL.currentProjectId];
    var ch6 = proj7.characters.find(function(c){ return c.id === cid3; });
    if(ch6){ if(!ch6.customFields) ch6.customFields = []; ch6.customFields.push({label:'', value:''}); DAL.saveState(); DAL.render(); }
    return;
  }

  if(action === 'toggle-char-plot'){
    var cid4 = el.getAttribute('data-cid');
    var plotId = el.getAttribute('data-pid');
    var proj8 = DAL.state.projects[DAL.currentProjectId];
    var ch7 = proj8.characters.find(function(c){ return c.id === cid4; });
    if(ch7){
      if(!ch7.linkedPlotIds) ch7.linkedPlotIds = [];
      var idx = ch7.linkedPlotIds.indexOf(plotId);
      if(idx >= 0) ch7.linkedPlotIds.splice(idx, 1); else ch7.linkedPlotIds.push(plotId);
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'delete-character'){
    DAL.pushHistory();
    var cid5 = el.getAttribute('data-cid');
    var proj9 = DAL.state.projects[DAL.currentProjectId];
    proj9.characters = proj9.characters.filter(function(c){ return c.id !== cid5; });
    DAL.selectedCharId = null;
    proj9.updatedAt = Date.now();
    DAL.saveState(); DAL.render(); DAL.toast('Character deleted','warning');
    return;
  }

  // Relationships
  if(action === 'rel-center-on'){
    DAL._relCenter = el.getAttribute('data-cid');
    DAL.render();
    return;
  }

  if(action === 'add-relationship'){
    var proj10 = DAL.state.projects[DAL.currentProjectId];
    if(!proj10.characters || proj10.characters.length < 2){ DAL.toast('Need at least 2 characters','warning'); return; }
    var relTypes = ['Parent','Child','Sibling','Spouse/Partner','Extended Family','Friend','Rival','Enemy','Acquaintance','Mentor','Protégé','Ally','Colleague','Unknown/Mystery','Complicated'];
    var html = '<div class="form-group"><label class="form-label">From Character</label><select class="form-select" id="relFrom">';
    proj10.characters.forEach(function(c){ html += '<option value="'+c.id+'">'+DAL.escapeHtml(c.name)+'</option>'; });
    html += '</select></div><div class="form-group"><label class="form-label">To Character</label><select class="form-select" id="relTo">';
    proj10.characters.forEach(function(c){ html += '<option value="'+c.id+'">'+DAL.escapeHtml(c.name)+'</option>'; });
    html += '</select></div><div class="form-group"><label class="form-label">Relationship Type</label><select class="form-select" id="relType">';
    relTypes.forEach(function(t){ html += '<option value="'+t+'">'+t+'</option>'; });
    html += '</select></div><div class="form-group"><label class="form-label">Description (optional)</label><input class="form-input" id="relDesc" placeholder="Why are they connected?"></div>';
    DAL.modal('Add Relationship', html, { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="save-relationship">Save</button>' });
    return;
  }

  if(action === 'save-relationship'){
    var proj11 = DAL.state.projects[DAL.currentProjectId];
    var fromId = document.getElementById('relFrom').value;
    var toId = document.getElementById('relTo').value;
    var type = document.getElementById('relType').value;
    var desc = document.getElementById('relDesc').value;
    var categories = { 'Parent':'family','Child':'family','Sibling':'family','Spouse/Partner':'family','Extended Family':'family','Friend':'social','Rival':'social','Enemy':'social','Acquaintance':'social','Mentor':'social','Protégé':'social','Ally':'professional','Colleague':'professional','Unknown/Mystery':'other','Complicated':'other' };
    proj11.relationships = proj11.relationships || [];
    proj11.relationships.push({ id: DAL.uid('rel'), fromCharId: fromId, toCharId: toId, type: type, category: categories[type]||'other', description: desc, directional: (type==='Mentor'||type==='Protégé'||type==='Parent'||type==='Child') });
    DAL.saveState(); DAL.closeModal(); DAL.render(); DAL.toast('Relationship added','success');
    return;
  }

  // Plots
  if(action === 'add-plot'){
    DAL.pushHistory();
    var proj12 = DAL.state.projects[DAL.currentProjectId];
    var plotType = el.getAttribute('data-type') || 'subplot';
    var plot = { id: DAL.uid('plot'), title: 'New Plot Thread', type: plotType, status: 'planted', description: '', linkedChapterIds: [], linkedCharacterIds: [], lastTouched: Date.now(), createdAt: Date.now() };
    proj12.plots.push(plot);
    DAL.selectedPlotId = plot.id;
    proj12.updatedAt = Date.now();
    DAL.saveState(); DAL.render();
    return;
  }

  if(action === 'select-plot'){
    DAL.selectedPlotId = el.getAttribute('data-pid');
    DAL.render();
    return;
  }

  if(action === 'back-to-plots'){
    DAL.selectedPlotId = null;
    DAL.render();
    return;
  }

  if(action === 'mark-reviewed'){
    var proj13 = DAL.state.projects[DAL.currentProjectId];
    var p2 = proj13.plots.find(function(pl){ return pl.id === el.getAttribute('data-pid'); });
    if(p2){ p2.lastTouched = Date.now(); DAL.saveState(); DAL.render(); DAL.toast('Marked as reviewed','success'); }
    return;
  }

  if(action === 'delete-plot'){
    DAL.pushHistory();
    var proj14 = DAL.state.projects[DAL.currentProjectId];
    proj14.plots = proj14.plots.filter(function(pl){ return pl.id !== el.getAttribute('data-pid'); });
    DAL.selectedPlotId = null;
    proj14.updatedAt = Date.now();
    DAL.saveState(); DAL.render(); DAL.toast('Plot deleted','warning');
    return;
  }

  if(action === 'toggle-plot-chapter' || action === 'toggle-plot-char'){
    var proj15 = DAL.state.projects[DAL.currentProjectId];
    var p3 = proj15.plots.find(function(pl){ return pl.id === el.getAttribute('data-pid'); });
    if(p3){
      var arr = action === 'toggle-plot-chapter' ? (p3.linkedChapterIds||(p3.linkedChapterIds=[])) : (p3.linkedCharacterIds||(p3.linkedCharacterIds=[]));
      var tid = el.getAttribute(action==='toggle-plot-chapter'?'data-chid':'data-cid');
      var idx2 = arr.indexOf(tid);
      if(idx2 >= 0) arr.splice(idx2, 1); else arr.push(tid);
      DAL.saveState(); DAL.render();
    }
    return;
  }

  // Lore
  if(action === 'select-lore-folder'){
    DAL.selectedLoreFolder = el.getAttribute('data-folder');
    DAL.selectedLoreEntry = null;
    DAL.render();
    return;
  }

  if(action === 'select-lore-entry'){
    DAL.selectedLoreEntry = el.getAttribute('data-eid');
    DAL.render();
    return;
  }

  if(action === 'back-to-lore'){
    DAL.selectedLoreEntry = null;
    DAL.render();
    return;
  }

  if(action === 'add-lore-entry'){
    DAL.pushHistory();
    var proj16 = DAL.state.projects[DAL.currentProjectId];
    var entry2 = { id: DAL.uid('lore'), title: 'New Entry', folder: DAL.selectedLoreFolder, content: '', tags: [], linkedCharIds: [], linkedPlotIds: [], updatedAt: Date.now(), createdAt: Date.now() };
    proj16.lore.entries.push(entry2);
    DAL.selectedLoreEntry = entry2.id;
    proj16.updatedAt = Date.now();
    DAL.saveState(); DAL.render();
    return;
  }

  if(action === 'add-lore-folder'){
    var name2 = prompt('Folder name:');
    if(name2){
      var proj17 = DAL.state.projects[DAL.currentProjectId];
      proj17.lore.folders.push(name2);
      DAL.selectedLoreFolder = name2;
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'delete-lore-entry'){
    DAL.pushHistory();
    var proj18 = DAL.state.projects[DAL.currentProjectId];
    proj18.lore.entries = proj18.lore.entries.filter(function(en){ return en.id !== el.getAttribute('data-eid'); });
    DAL.selectedLoreEntry = null;
    proj18.updatedAt = Date.now();
    DAL.saveState(); DAL.render(); DAL.toast('Entry deleted','warning');
    return;
  }

  if(action === 'toggle-lore-char' || action === 'toggle-lore-plot'){
    var proj19 = DAL.state.projects[DAL.currentProjectId];
    var en3 = proj19.lore.entries.find(function(en){ return en.id === el.getAttribute('data-eid'); });
    if(en3){
      var arr2 = action === 'toggle-lore-char' ? (en3.linkedCharIds||(en3.linkedCharIds=[])) : (en3.linkedPlotIds||(en3.linkedPlotIds=[]));
      var tid2 = el.getAttribute(action==='toggle-lore-char'?'data-cid':'data-pid');
      var idx3 = arr2.indexOf(tid2);
      if(idx3 >= 0) arr2.splice(idx3, 1); else arr2.push(tid2);
      DAL.saveState(); DAL.render();
    }
    return;
  }

  // Mind Map
  if(action === 'mm-add-node'){
    var proj20 = DAL.state.projects[DAL.currentProjectId];
    var node = { id: DAL.uid('mm'), label: 'New Idea', type: 'idea', x: 400, y: 300 };
    proj20.mindmap.nodes.push(node);
    DAL.saveState(); DAL.render();
    return;
  }

  if(action === 'mm-connect'){
    DAL.connectMode = !DAL.connectMode;
    DAL.selectedNodeId = null;
    DAL.render();
    return;
  }

  if(action === 'mm-select'){
    if(DAL.connectMode){
      if(!DAL.selectedNodeId){
        DAL.selectedNodeId = el.getAttribute('data-nid');
        DAL.toast('Select another node to connect','info');
      } else {
        var proj21 = DAL.state.projects[DAL.currentProjectId];
        var fromId = DAL.selectedNodeId;
        var toId = el.getAttribute('data-nid');
        if(fromId !== toId){
          proj21.mindmap.edges.push({ id: DAL.uid('edge'), from: fromId, to: toId });
          DAL.saveState();
        }
        DAL.connectMode = false;
        DAL.selectedNodeId = null;
        DAL.render();
      }
    } else {
      DAL.selectedNodeId = el.getAttribute('data-nid');
      var proj22 = DAL.state.projects[DAL.currentProjectId];
      var n = proj22.mindmap.nodes.find(function(nn){ return nn.id === DAL.selectedNodeId; });
      var label = prompt('Node label:', n ? n.label : '');
      if(n && label !== null){ n.label = label; DAL.saveState(); }
      DAL.render();
    }
    return;
  }

  if(action === 'mm-delete-sel'){
    var proj23 = DAL.state.projects[DAL.currentProjectId];
    if(DAL.selectedNodeId){
      proj23.mindmap.nodes = proj23.mindmap.nodes.filter(function(n){ return n.id !== DAL.selectedNodeId; });
      proj23.mindmap.edges = proj23.mindmap.edges.filter(function(ed){ return ed.from !== DAL.selectedNodeId && ed.to !== DAL.selectedNodeId; });
      DAL.selectedNodeId = null;
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'mm-delete-edge'){
    var proj24 = DAL.state.projects[DAL.currentProjectId];
    proj24.mindmap.edges = proj24.mindmap.edges.filter(function(ed){ return ed.id !== el.getAttribute('data-eid'); });
    DAL.saveState(); DAL.render();
    return;
  }

  // Book Preview
  if(action === 'bp-prev'){
    if(DAL.readerPage > 0){ DAL.readerPage--; DAL.render(); }
    return;
  }
  if(action === 'bp-next'){
    DAL.readerPage++; DAL.render();
    return;
  }
  if(action === 'bp-goto'){
    DAL.readerPage = parseInt(el.getAttribute('data-page')) || 0;
    DAL.render();
    return;
  }

  // Export
  if(action === 'export-json'){
    var proj25 = DAL.exportTarget(el);
    if(!proj25){ DAL.toast('Open a project first.','error'); return; }
    var data = DAL.clone(proj25);
    delete data.history; delete data.versions; delete data.folderHandle;
    DAL.downloadJSON(DAL.sanitizeFilename(proj25.name)+'.json', data);
    DAL.closeModal(); DAL.toast('Project data downloaded.','success');
    return;
  }

  if(action === 'export-manuscript-txt' || action === 'export-manuscript-md' || action === 'export-manuscript-html'){
    var proj26 = DAL.exportTarget(el);
    if(!proj26){ DAL.toast('Open a project first.','error'); return; }
    if(!(proj26.chapters||[]).length){ DAL.toast('This project has no chapters to export.','error'); return; }
    var txt = '';
    if(action === 'export-manuscript-html'){
      txt += '<!DOCTYPE html><html><head><title>'+DAL.escapeHtml(proj26.name)+'</title></head><body>';
      txt += '<h1>'+DAL.escapeHtml(proj26.cover.title||proj26.name)+'</h1>';
      (proj26.chapters||[]).forEach(function(ch){ txt += '<h2>'+DAL.escapeHtml(ch.title)+'</h2>'+ch.contentHTML; });
      txt += '</body></html>';
      DAL.download(DAL.sanitizeFilename(proj26.name)+'.html', txt, 'text/html');
    } else if(action === 'export-manuscript-md'){
      txt += '# '+(proj26.cover.title||proj26.name)+'\n\n';
      (proj26.chapters||[]).forEach(function(ch){
        var tmp = document.createElement('div'); tmp.innerHTML = ch.contentHTML;
        txt += '## '+ch.title+'\n\n'+tmp.textContent+'\n\n';
      });
      DAL.download(DAL.sanitizeFilename(proj26.name)+'.md', txt, 'text/markdown');
    } else {
      txt += (proj26.cover.title||proj26.name)+'\n\n';
      (proj26.chapters||[]).forEach(function(ch){
        var tmp2 = document.createElement('div'); tmp2.innerHTML = ch.contentHTML;
        txt += ch.title+'\n\n'+tmp2.textContent+'\n\n';
      });
      DAL.download(DAL.sanitizeFilename(proj26.name)+'.txt', txt);
    }
    DAL.closeModal(); DAL.toast(action === 'export-manuscript-txt' ? 'Manuscript TXT downloaded.' : (action === 'export-manuscript-md' ? 'Manuscript Markdown downloaded.' : 'Manuscript HTML downloaded.'),'success');
    return;
  }

  if(action === 'export-chapter-txt' || action === 'export-chapter-md'){
    var proj27 = DAL.exportTarget(el);
    if(!proj27) return;
    var chId = DAL.exportSelectValue('exportChapterSelect');
    var ch7 = (proj27.chapters||[]).find(function(c){ return c.id === chId; });
    if(ch7){
      var tmp3 = document.createElement('div'); tmp3.innerHTML = ch7.contentHTML;
      if(action === 'export-chapter-md') DAL.download(DAL.sanitizeFilename(ch7.title)+'.md', '## '+ch7.title+'\n\n'+tmp3.textContent, 'text/markdown');
      else DAL.download(DAL.sanitizeFilename(ch7.title)+'.txt', ch7.title+'\n\n'+tmp3.textContent);
      DAL.toast(action === 'export-chapter-md' ? 'Chapter Markdown downloaded.' : 'Chapter TXT downloaded.','success');
    }
    return;
  }

  if(action === 'transfer-item'){
    var proj28 = DAL.state.projects[el.getAttribute('data-pid')];
    var type = document.getElementById('transferType').value;
    var itemId = document.getElementById('transferItem').value;
    var destId = document.getElementById('transferDest').value;
    var dest = DAL.state.projects[destId];
    if(!dest){ DAL.toast('Select a destination','warning'); return; }
    var item;
    if(type === 'character') item = proj28.characters.find(function(c){ return c.id === itemId; });
    else if(type === 'lore') item = proj28.lore.entries.find(function(en){ return en.id === itemId; });
    else if(type === 'plot') item = proj28.plots.find(function(p){ return p.id === itemId; });
    if(!item){ DAL.toast('Select an item','warning'); return; }
    var copy = DAL.clone(item);
    copy.id = DAL.uid(type);
    if(type === 'character') dest.characters.push(copy);
    else if(type === 'lore'){ dest.lore = dest.lore || {folders:[],entries:[]}; dest.lore.entries.push(copy); }
    else if(type === 'plot') dest.plots.push(copy);
    dest.updatedAt = Date.now();
    DAL.saveState(); DAL.toast('Transferred to '+dest.name,'success');
    return;
  }

  if(action === 'save-version'){
    var proj29 = DAL.state.projects[el.getAttribute('data-pid')];
    var wc2 = DAL.getProjectWordCount(proj29);
    var snap = DAL.clone(proj29);
    delete snap.versions; delete snap.history; delete snap.folderHandle;
    proj29.versions.push({ ts: Date.now(), auto: false, snapWords: wc2.total, data: snap });
    if(proj29.versions.length > 25) proj29.versions.shift();
    DAL.saveState(); DAL.render(); DAL.toast('Version saved','success');
    return;
  }

  if(action === 'restore-version'){
    var proj30 = DAL.state.projects[el.getAttribute('data-pid')];
    var vIdx = parseInt(el.getAttribute('data-idx'));
    var ver = proj30.versions[vIdx];
    if(!ver) return;
    DAL.pushHistory();
    var restored = DAL.clone(ver.data);
    delete restored.versions; delete restored.history;
    Object.assign(proj30, restored);
    DAL.saveState(); DAL.render(); DAL.toast('Version restored','success');
    return;
  }
};

DAL.saveChapterContent = function(){
  var editor = document.getElementById('editorContent');
  if(!editor) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj) return;
  var ch = proj.chapters.find(function(c){ return c.id === DAL.selectedChapterId; });
  if(ch){
    ch.contentHTML = editor.innerHTML;
    ch.updatedAt = Date.now();
    proj.updatedAt = Date.now();
    DAL.saveState();
  }
};

/* --- Field bindings for story tools --- */
document.addEventListener('input', function(e){
  var el = e.target;
  if(el.hasAttribute('data-char-field')){
    var field = el.getAttribute('data-char-field');
    var proj = DAL.state.projects[DAL.currentProjectId];
    if(!proj || !DAL.selectedCharId) return;
    var ch = proj.characters.find(function(c){ return c.id === DAL.selectedCharId; });
    if(!ch) return;
    if(field === 'tags') ch.tags = el.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    else ch[field] = el.value;
    ch.updatedAt = Date.now();
    proj.updatedAt = Date.now();
    DAL.saveState();
    return;
  }
  if(el.hasAttribute('data-cf-label') || el.hasAttribute('data-cf-value')){
    var proj2 = DAL.state.projects[DAL.currentProjectId];
    var ch2 = proj2.characters.find(function(c){ return c.id === DAL.selectedCharId; });
    if(ch2 && ch2.customFields){
      var idx = parseInt(el.getAttribute('data-cf-label')||el.getAttribute('data-cf-value'));
      if(el.hasAttribute('data-cf-label')) ch2.customFields[idx].label = el.value;
      else ch2.customFields[idx].value = el.value;
      DAL.saveState();
    }
    return;
  }
  if(el.id === 'plotTitle' || el.id === 'plotDesc' || el.id === 'plotType' || el.id === 'plotStatus'){
    var proj3 = DAL.state.projects[DAL.currentProjectId];
    var p = proj3.plots.find(function(pl){ return pl.id === DAL.selectedPlotId; });
    if(p){
      if(el.id === 'plotTitle') p.title = el.value;
      else if(el.id === 'plotDesc') p.description = el.value;
      else if(el.id === 'plotType') p.type = el.value;
      else if(el.id === 'plotStatus') p.status = el.value;
      p.lastTouched = Date.now();
      proj3.updatedAt = Date.now();
      DAL.saveState();
    }
    return;
  }
  if(el.id === 'loreTitle' || el.id === 'loreContent' || el.id === 'loreTags' || el.id === 'loreFolder'){
    var proj4 = DAL.state.projects[DAL.currentProjectId];
    var entry = proj4.lore.entries.find(function(en){ return en.id === DAL.selectedLoreEntry; });
    if(entry){
      if(el.id === 'loreTitle') entry.title = el.value;
      else if(el.id === 'loreContent') entry.content = el.value;
      else if(el.id === 'loreTags') entry.tags = el.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
      else if(el.id === 'loreFolder') entry.folder = el.value;
      entry.updatedAt = Date.now();
      proj4.updatedAt = Date.now();
      DAL.saveState();
    }
    return;
  }
});

/* --- Change handler for story tool selects --- */
document.addEventListener('change', function(e){
  var el = e.target;
  if(el.hasAttribute('data-action')){
    var action = el.getAttribute('data-action');
    if(action === 'format-block'){
      document.execCommand('formatBlock', false, el.value);
      DAL.saveChapterContent();
    } else if(action === 'font-family'){
      document.execCommand('fontName', false, el.value);
      DAL.saveChapterContent();
    } else if(action === 'font-size'){
      document.execCommand('fontSize', false, '7');
      var fonts = document.querySelectorAll('font[size="7"]');
      fonts.forEach(function(f){ f.removeAttribute('size'); f.style.fontSize = el.value+'px'; });
      DAL.saveChapterContent();
    } else if(DAL.applyReaderPref(action, el)){
      /* Handled by the shared reading-preference handler, which repaints the
         open reader in place instead of re-rendering it. */
    }
  }
  // Transfer item dropdown
  if(el.id === 'transferType'){
    var proj = DAL.state.projects[DAL.currentProjectId];
    var type = el.value;
    var items = [];
    if(type === 'character') items = proj.characters || [];
    else if(type === 'lore') items = (proj.lore&&proj.lore.entries) || [];
    else if(type === 'plot') items = proj.plots || [];
    var sel = document.getElementById('transferItem');
    if(sel){
      sel.innerHTML = items.map(function(it){ return '<option value="'+it.id+'">'+DAL.escapeHtml(it.title||it.name)+'</option>'; }).join('');
    }
  }
});

/* Writer tools keep their project-specific records under one additive state branch,
   so older libraries simply receive empty tools when first opened. */
DAL.writerState = function(){
  if(!DAL.state.writerTools) DAL.state.writerTools = { projects:{}, typewriter:false, find:{query:'',replace:'',scope:'chapter',caseSensitive:false,wholeWord:false} };
  if(!DAL.state.writerTools.projects) DAL.state.writerTools.projects = {};
  return DAL.state.writerTools;
};
DAL.writerProject = function(proj){
  var store = DAL.writerState(), id = proj.id;
  if(!store.projects[id]) store.projects[id] = { comments:[], structure:null };
  var data = store.projects[id];
  if(!data.comments) data.comments = [];
  return data;
};
DAL.currentWriterProject = function(){ return DAL.state.projects[DAL.currentProjectId]; };
DAL.chapterById = function(proj, id){ return (proj.chapters||[]).find(function(c){ return c.id === id; }); };
DAL.plainChapter = function(ch){ var d=document.createElement('div'); d.innerHTML=ch.contentHTML||''; return d.textContent||''; };
DAL.commentBadge = function(proj){ return (DAL.writerProject(proj).comments||[]).filter(function(c){ return !c.resolved; }).length ? '<span class="badge">'+(DAL.writerProject(proj).comments||[]).filter(function(c){ return !c.resolved; }).length+'</span>' : ''; };
DAL.writerSave = function(proj){ if(proj) proj.updatedAt=Date.now(); DAL.saveState(); };

DAL.findOptions = function(){
  var f=DAL.writerState().find;
  return {query:f.query||'',replace:f.replace||'',scope:f.scope||'chapter',caseSensitive:!!f.caseSensitive,wholeWord:!!f.wholeWord};
};
DAL.findMatches = function(proj, opts){
  var query=opts.query||'', flags=opts.caseSensitive?'g':'gi', re, out=[];
  if(!query) return out;
  try { re=new RegExp((opts.wholeWord?'\\b':'')+query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+(opts.wholeWord?'\\b':''),flags); } catch(e){ return out; }
  (proj.chapters||[]).forEach(function(ch){
    if(opts.scope==='chapter' && ch.id!==DAL.selectedChapterId) return;
    var text=DAL.plainChapter(ch), m;
    while((m=re.exec(text))){
      out.push({cid:ch.id,title:ch.title,index:m.index,length:m[0].length,text:text});
      if(!m[0].length) re.lastIndex++;
    }
  });
  return out;
};
DAL.findContext = function(m){
  var a=Math.max(0,m.index-55), b=Math.min(m.text.length,m.index+m.length+55);
  return (a?'…':'')+DAL.escapeHtml(m.text.slice(a,m.index))+'<mark>'+DAL.escapeHtml(m.text.slice(m.index,m.index+m.length))+'</mark>'+DAL.escapeHtml(m.text.slice(m.index+m.length,b))+(b<m.text.length?'…':'');
};
DAL.showFindModal = function(){
  var proj=DAL.currentWriterProject(); if(!proj) return;
  var o=DAL.findOptions(), matches=DAL.findMatches(proj,o), h='';
  h += '<div class="writer-toolbar"><input class="form-input" id="findQuery" value="'+DAL.escapeHtml(o.query)+'" placeholder="Find in manuscript"><input class="form-input" id="findReplace" value="'+DAL.escapeHtml(o.replace)+'" placeholder="Replace with"><button class="btn primary" data-action="find-run">Find</button></div>';
  h += '<div class="writer-toolbar"><select class="form-select" id="findScope"><option value="chapter"'+(o.scope==='chapter'?' selected':'')+'>Current chapter</option><option value="manuscript"'+(o.scope==='manuscript'?' selected':'')+'>Whole manuscript</option></select><label class="u-hint"><input type="checkbox" id="findCase"'+(o.caseSensitive?' checked':'')+'> Case-sensitive</label><label class="u-hint"><input type="checkbox" id="findWhole"'+(o.wholeWord?' checked':'')+'> Whole word</label><span class="writer-status">'+matches.length+' match'+(matches.length===1?'':'es')+'</span></div>';
  h += '<div class="writer-results">'+(matches.length?matches.map(function(m,i){ return '<div class="writer-result" data-action="find-open" data-find-index="'+i+'"><strong>'+DAL.escapeHtml(m.title)+'</strong><span>'+DAL.findContext(m)+'</span><div><button class="btn sm" data-action="find-replace-one" data-find-index="'+i+'">Replace</button></div></div>'; }).join(''):'<p class="writer-muted">Enter a phrase to search this '+(o.scope==='chapter'?'chapter.':'manuscript.')+'</p>')+'</div>';
  DAL._findMatches=matches;
  DAL.modal('Find & Replace',h,{wide:true,footer:'<button class="btn" data-action="close-modal">Close</button><button class="btn" data-action="find-next-modal">Find Next</button><button class="btn primary" data-action="find-replace-all">Replace All</button>'});
};
DAL.readFindForm = function(){
  var f=DAL.writerState().find;
  f.query=(document.getElementById('findQuery')||{}).value||f.query||''; f.replace=(document.getElementById('findReplace')||{}).value||'';
  f.scope=(document.getElementById('findScope')||{}).value||f.scope||'chapter'; f.caseSensitive=!!((document.getElementById('findCase')||{}).checked); f.wholeWord=!!((document.getElementById('findWhole')||{}).checked);
  return DAL.findOptions();
};
DAL.replaceTextNodes = function(ch, opts, onlyIndex){
  var holder=document.createElement('div'); holder.innerHTML=ch.contentHTML||'';
  var flags=opts.caseSensitive?'g':'gi', re=new RegExp((opts.wholeWord?'\\b':'')+opts.query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+(opts.wholeWord?'\\b':''),flags), walker=document.createTreeWalker(holder,NodeFilter.SHOW_TEXT,null,false), node, count=0, offset=0;
  while((node=walker.nextNode())){
    var raw=node.nodeValue, changed=false;
    node.nodeValue=raw.replace(re,function(match,pos){
      var absolute=offset+pos;
      if(onlyIndex!==undefined && absolute!==onlyIndex) return match;
      count++; changed=true; return opts.replace;
    });
    offset+=raw.length;
    if(onlyIndex!==undefined && count) break;
  }
  if(count){ ch.contentHTML=holder.innerHTML; ch.updatedAt=Date.now(); }
  return count;
};
DAL.openFindMatch = function(m){
  var proj=DAL.currentWriterProject(); if(!m||!proj) return;
  DAL.selectedChapterId=m.cid; DAL.currentTool='manuscript'; DAL.closeModal(); DAL.render();
  setTimeout(function(){ var ed=document.getElementById('editorContent'), text=ed&&ed.textContent||'', pos=text.indexOf(m.text.slice(m.index,m.index+m.length)); if(ed&&pos>=0){ ed.focus(); var w=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT,null,false), n, seen=0; while((n=w.nextNode())){ if(seen+n.nodeValue.length>=pos){ var range=document.createRange(); range.setStart(n,pos-seen); range.setEnd(n,Math.min(n.nodeValue.length,pos-seen+m.length)); var sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range); break; } seen+=n.nodeValue.length; } } },80);
};

DAL.showComments = function(){
  var proj=DAL.currentWriterProject(); if(!proj) return; var data=DAL.writerProject(proj), current=DAL.chapterById(proj,DAL.selectedChapterId), h='';
  h+='<div class="writer-toolbar"><select class="form-select" id="commentChapter">'+(proj.chapters||[]).map(function(c){return '<option value="'+c.id+'"'+(c.id===DAL.selectedChapterId?' selected':'')+'>'+DAL.escapeHtml(c.title)+'</option>';}).join('')+'</select><button class="btn primary" data-action="new-comment">Add comment</button><span class="writer-status">'+data.comments.filter(function(c){return !c.resolved;}).length+' unresolved</span></div>';
  h+='<div class="comment-list">'+(data.comments.length?data.comments.slice().reverse().map(function(c){var ch=DAL.chapterById(proj,c.chapterId);return '<div class="comment-item'+(c.resolved?' comment-resolved':'')+'"><strong>'+DAL.escapeHtml(ch?ch.title:'Deleted chapter')+'</strong><div>'+DAL.escapeHtml(c.body||'')+'</div>'+(c.anchor?'<div class="comment-meta">“'+DAL.escapeHtml(c.anchor)+'”</div>':'')+'<div class="comment-meta">'+new Date(c.createdAt).toLocaleString()+'</div><div class="writer-tool-actions"><button class="btn sm" data-action="edit-comment" data-comment-id="'+c.id+'">Edit</button><button class="btn sm" data-action="resolve-comment" data-comment-id="'+c.id+'">'+(c.resolved?'Reopen':'Resolve')+'</button><button class="btn sm danger" data-action="delete-comment" data-comment-id="'+c.id+'">Delete</button></div></div>';}).join(''):'<p class="writer-muted">No annotations yet. Add notes to keep revision thoughts beside the manuscript.</p>')+'</div>';
  DAL.modal('Comments & Annotations',h,{wide:true,footer:'<button class="btn" data-action="close-modal">Close</button>'});
};
DAL.commentEditor = function(existing){
  var proj=DAL.currentWriterProject(), selection=window.getSelection?String(window.getSelection()):'', h='<div class="form-group"><label class="form-label">Chapter</label><select class="form-select" id="commentEditChapter">'+(proj.chapters||[]).map(function(c){return '<option value="'+c.id+'"'+((existing?existing.chapterId:DAL.selectedChapterId)===c.id?' selected':'')+'>'+DAL.escapeHtml(c.title)+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">Anchored text (optional)</label><input class="form-input" id="commentAnchor" value="'+DAL.escapeHtml(existing?existing.anchor:(selection||''))+'" placeholder="Selected manuscript text"></div><div class="form-group"><label class="form-label">Note</label><textarea class="form-textarea" id="commentBody" placeholder="Revision note…">'+DAL.escapeHtml(existing?existing.body:'')+'</textarea></div>';
  DAL._editingComment=existing?existing.id:null; DAL.modal(existing?'Edit Comment':'Add Comment',h,{footer:'<button class="btn" data-action="show-comments">Cancel</button><button class="btn primary" data-action="save-comment">Save</button>'});
};

DAL.sprintWords = function(proj){ return DAL.getProjectWordCount(proj).manuscript; };
DAL.sprintClock = function(){
  var s=DAL.writerState().sprint, proj=s&&DAL.state.projects[s.projectId]; if(!s||!proj) return null;
  var remain=Math.max(0,s.endsAt-Date.now()), written=Math.max(0,DAL.sprintWords(proj)-s.startWords); return {remain:remain,written:written,ended:remain<=0};
};
DAL.stopSprintTimer = function(){ if(DAL._sprintTimer){clearInterval(DAL._sprintTimer); DAL._sprintTimer=null;} };
DAL.renderSprintLive = function(){ var c=DAL.sprintClock(), clock=document.getElementById('sprintClock'), words=document.getElementById('sprintWords'); if(!c)return; if(clock){var sec=Math.ceil(c.remain/1000);clock.textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');} if(words)words.textContent=c.written; if(c.ended){DAL.stopSprintTimer(); DAL.writerState().sprint.finishedAt=Date.now(); DAL.saveState(true); DAL.showSprint(true);} };
DAL.showSprint = function(finished){
  var proj=DAL.currentWriterProject(); if(!proj)return; var s=DAL.writerState().sprint, c=DAL.sprintClock();
  /* A sprint that is still running belongs in the floating timer, not a modal the
     writer has to dismiss before typing another word. Only the closing summary
     still takes the screen. */
  if(s&&c&&!(c.ended||finished)){
    var ws=DAL.sprintWidgetState(); ws.visible=true; ws.collapsed=false; DAL.saveState(true);
    DAL.closeModal(); DAL.renderSprintWidget();
    return;
  }
  if(s&&c){ var summary=c.ended||finished, h='<div class="sprint-clock" id="sprintClock">'+Math.floor(Math.ceil(c.remain/1000)/60)+':'+String(Math.ceil(c.remain/1000)%60).padStart(2,'0')+'</div><div class="sprint-progress"><div><strong id="sprintWords">'+c.written+'</strong>words written</div><div><strong>'+((s.target||0)?s.target:'—')+'</strong>word target</div></div>'+(summary?'<p class="writer-muted" style="text-align:center">Sprint complete. '+c.written+' manuscript words recorded.</p>':'');
    DAL.modal(summary?'Sprint Complete':'Writing Sprint',h,{footer:'<button class="btn" data-action="stop-sprint">'+(summary?'Done':'End Sprint')+'</button>'}); if(!summary){DAL.stopSprintTimer();DAL._sprintTimer=setInterval(DAL.renderSprintLive,1000);} return; }
  var h2='<div class="writer-form-grid"><div class="form-group"><label class="form-label">Minutes</label><input class="form-input" id="sprintMinutes" type="number" min="1" value="25"></div><div class="form-group"><label class="form-label">Word target (optional)</label><input class="form-input" id="sprintTarget" type="number" min="0" placeholder="500"></div></div><p class="writer-muted">The sprint follows your manuscript words even if you change chapters or navigate elsewhere.</p>';
  DAL.modal('Start Writing Sprint',h2,{footer:'<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="start-sprint">Start</button>'});
};

/* --- Floating sprint timer -------------------------------------------------
   A modal timer means the writer cannot write while it is open, which defeats
   the point of a sprint. The timer therefore lives in a small panel that floats
   over the workspace, can be dragged anywhere, collapsed to a strip, or hidden
   altogether — and it remembers where it was left. */

DAL.sprintWidgetState = function(){
  var w = DAL.writerState();
  if(!w.sprintWidget) w.sprintWidget = { visible:false, collapsed:false, x:null, y:null };
  var s = w.sprintWidget;
  /* Fields added after the first release default rather than crash on old saves. */
  if(typeof s.visible !== 'boolean') s.visible = false;
  if(typeof s.collapsed !== 'boolean') s.collapsed = false;
  return s;
};

/* Keeps the panel on screen after a window resize or a save made on a larger
   display, so it can never be dragged somewhere it cannot be dragged back from. */
DAL.clampSprintWidget = function(el){
  var s = DAL.sprintWidgetState();
  var w = el.offsetWidth || 210, h = el.offsetHeight || 120;
  var maxX = Math.max(8, window.innerWidth - w - 8);
  var maxY = Math.max(8, window.innerHeight - h - 8);
  var x = s.x == null ? maxX : Math.min(maxX, Math.max(8, s.x));
  var y = s.y == null ? Math.max(8, window.innerHeight - h - 88) : Math.min(maxY, Math.max(8, s.y));
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  return { x:x, y:y };
};

DAL.sprintWidgetBody = function(){
  var s = DAL.sprintWidgetState();
  var clock = DAL.sprintClock();
  var sprint = DAL.writerState().sprint;
  var head = '<div class="sprint-widget-head" data-sprint-grip="1" title="Drag to move">'+
    '<span class="sprint-widget-grip">\u22ee\u22ee</span>'+
    '<span class="sprint-widget-title">Sprint</span>'+
    '<button class="sprint-widget-btn" data-action="collapse-sprint-widget" title="'+(s.collapsed?'Expand':'Collapse')+'">'+(s.collapsed?'\u25b8':'\u25be')+'</button>'+
    '<button class="sprint-widget-btn" data-action="toggle-sprint-widget" title="Hide timer">\u00d7</button>'+
  '</div>';
  if(s.collapsed) return head;
  if(!clock){
    return head + '<div class="sprint-widget-body">'+
      '<p class="sprint-widget-idle">No sprint running.</p>'+
      '<button class="btn sm primary" data-action="show-sprint">Start a sprint</button>'+
    '</div>';
  }
  var sec = Math.ceil(clock.remain / 1000);
  var target = sprint && sprint.target ? sprint.target : 0;
  var pct = target ? Math.min(100, Math.round(clock.written / target * 100)) : 0;
  return head + '<div class="sprint-widget-body">'+
    '<div class="sprint-widget-clock" id="sprintWidgetClock">'+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')+'</div>'+
    '<div class="sprint-widget-stats"><span><strong id="sprintWidgetWords">'+clock.written+'</strong> words</span>'+
      (target ? '<span><strong>'+target+'</strong> target</span>' : '')+'</div>'+
    (target ? '<div class="sprint-widget-bar"><i id="sprintWidgetBar" style="width:'+pct+'%"></i></div>' : '')+
    '<button class="btn sm" data-action="stop-sprint">End sprint</button>'+
  '</div>';
};

DAL.renderSprintWidget = function(){
  var s = DAL.sprintWidgetState();
  var el = document.getElementById('sprintWidget');
  if(!s.visible){
    if(el) el.remove();
    DAL.stopSprintWidgetTimer();
    return;
  }
  if(!el){
    el = document.createElement('div');
    el.id = 'sprintWidget';
    el.className = 'sprint-widget';
    /* Appended to the body rather than the view, so re-rendering the workspace
       never destroys a running timer or loses where it was placed. */
    document.body.appendChild(el);
  }
  el.classList.toggle('collapsed', !!s.collapsed);
  el.innerHTML = DAL.sprintWidgetBody();
  DAL.clampSprintWidget(el);
  if(DAL.sprintClock()) DAL.startSprintWidgetTimer(); else DAL.stopSprintWidgetTimer();
};

DAL.stopSprintWidgetTimer = function(){
  if(DAL._sprintWidgetTimer){ clearInterval(DAL._sprintWidgetTimer); DAL._sprintWidgetTimer = null; }
};

DAL.startSprintWidgetTimer = function(){
  if(DAL._sprintWidgetTimer) return;
  DAL._sprintWidgetTimer = setInterval(DAL.tickSprintWidget, 1000);
};

/* Only the numbers are rewritten each second. Replacing the whole panel would
   fight the pointer while it is being dragged. */
DAL.tickSprintWidget = function(){
  var clock = DAL.sprintClock();
  if(!clock){ DAL.stopSprintWidgetTimer(); DAL.renderSprintWidget(); return; }
  var sec = Math.ceil(clock.remain / 1000);
  var c = document.getElementById('sprintWidgetClock');
  var w = document.getElementById('sprintWidgetWords');
  var bar = document.getElementById('sprintWidgetBar');
  var sprint = DAL.writerState().sprint;
  if(c) c.textContent = Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
  if(w) w.textContent = clock.written;
  if(bar && sprint && sprint.target) bar.style.width = Math.min(100, Math.round(clock.written / sprint.target * 100)) + '%';
  if(clock.ended){
    DAL.stopSprintWidgetTimer();
    if(DAL.writerState().sprint && !DAL.writerState().sprint.finishedAt){
      DAL.writerState().sprint.finishedAt = Date.now();
      DAL.saveState(true);
      DAL.showSprint(true);
    }
    DAL.renderSprintWidget();
  }
};

/* Dragging uses its own pointer handler rather than the list drag system, which
   exists to reorder items inside a container. A named attribute keeps the two
   apart so grabbing the timer never looks like reordering a chapter. */
(function(){
  var drag = null;

  document.addEventListener('pointerdown', function(e){
    var grip = e.target.closest ? e.target.closest('[data-sprint-grip]') : null;
    if(!grip || e.target.closest('button')) return;
    var el = document.getElementById('sprintWidget');
    if(!el) return;
    var box = el.getBoundingClientRect();
    drag = { el:el, dx:e.clientX - box.left, dy:e.clientY - box.top, pointerId:e.pointerId, moved:false };
    el.classList.add('dragging');
  });

  document.addEventListener('pointermove', function(e){
    if(!drag || (drag.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
    e.preventDefault();
    drag.moved = true;
    var w = drag.el.offsetWidth, h = drag.el.offsetHeight;
    var x = Math.min(Math.max(8, e.clientX - drag.dx), Math.max(8, window.innerWidth - w - 8));
    var y = Math.min(Math.max(8, e.clientY - drag.dy), Math.max(8, window.innerHeight - h - 8));
    drag.el.style.left = x + 'px';
    drag.el.style.top = y + 'px';
  }, { passive:false });

  function release(){
    if(!drag) return;
    drag.el.classList.remove('dragging');
    if(drag.moved){
      var s = DAL.sprintWidgetState();
      s.x = parseInt(drag.el.style.left, 10);
      s.y = parseInt(drag.el.style.top, 10);
      DAL.saveState(true);
    }
    drag = null;
  }

  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);

  window.addEventListener('resize', function(){
    var el = document.getElementById('sprintWidget');
    if(el) DAL.clampSprintWidget(el);
  });
})();

/* The widget survives view changes, so it is refreshed after every render. */
(function(){
  var baseAfter = DAL.afterRender;
  DAL.afterRender = function(){
    if(baseAfter) baseAfter();
    if(DAL.renderSprintWidget) DAL.renderSprintWidget();
  };
})();

DAL.syllables = function(word){ word=(word||'').toLowerCase().replace(/[^a-z]/g,''); if(word.length<3)return word?1:0; var n=(word.replace(/e$/,'').match(/[aeiouy]+/g)||[]).length; return Math.max(1,n); };
DAL.report = function(proj){
  var stop={the:1,and:1,that:1,have:1,with:1,this:1,from:1,were:1,been:1,they:1,will:1,into:1,about:1,which:1,when:1,then:1,than:1,them:1,there:1,their:1,what:1,your:1,said:1,just:1,like:1,over:1,also:1,only:1,very:1}, filler=['just','very','really','quite','rather','somewhat','maybe','actually','basically','suddenly'], total={words:0,sentences:0,paragraphs:0,syllables:0,adverbs:0,passive:0,counts:{},longest:[],fillers:{}};
  var one=function(ch){var text=DAL.plainChapter(ch), words=text.match(/[A-Za-z][A-Za-z'-]*/g)||[], sentences=text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[], paras=(text.trim()?text.trim().split(/\n\s*\n+/):[]), r={title:ch.title,words:words.length,sentences:sentences.length,paragraphs:paras.length}; words.forEach(function(w){var x=w.toLowerCase();total.syllables+=DAL.syllables(x);total.counts[x]=(total.counts[x]||0)+1;if(/ly$/.test(x))total.adverbs++;if(filler.indexOf(x)>=0)total.fillers[x]=(total.fillers[x]||0)+1;}); sentences.forEach(function(s){total.longest.push({title:ch.title,text:s.trim(),words:(s.match(/[A-Za-z][A-Za-z'-]*/g)||[]).length}); if(/\b(?:was|were|is|are|be|been|being)\s+\w+(?:ed|en)\b/i.test(s))total.passive++;}); total.words+=r.words;total.sentences+=r.sentences;total.paragraphs+=r.paragraphs;return r;};
  var chapters=(proj.chapters||[]).map(one); total.longest.sort(function(a,b){return b.words-a.words;}); var repeated=Object.keys(total.counts).filter(function(w){return !stop[w]&&w.length>2;}).sort(function(a,b){return total.counts[b]-total.counts[a];}).slice(0,10); /* Flesch–Kincaid grade = .39(words/sentences) + 11.8(syllables/words) - 15.59. */ total.grade=total.words?Math.max(0,.39*(total.words/Math.max(1,total.sentences))+11.8*(total.syllables/total.words)-15.59):0; total.repeated=repeated.map(function(w){return w+' ('+total.counts[w]+')';});return {chapters:chapters,total:total};
};
DAL.showReadability = function(){var proj=DAL.currentWriterProject();if(!proj)return;var r=DAL.report(proj),t=r.total,h='<div class="report-grid"><div class="report-metric"><strong>'+t.words+'</strong>words</div><div class="report-metric"><strong>'+t.sentences+'</strong>sentences</div><div class="report-metric"><strong>'+t.paragraphs+'</strong>paragraphs</div><div class="report-metric"><strong>'+(t.sentences?(t.words/t.sentences).toFixed(1):'0')+'</strong>avg sentence length</div><div class="report-metric"><strong>'+t.grade.toFixed(1)+'</strong>Flesch–Kincaid grade</div><div class="report-metric"><strong>'+t.adverbs+' / '+t.passive+'</strong>adverbs / passive candidates</div></div><h3>Chapters</h3><div class="writer-report-list">'+r.chapters.map(function(c){return '<div class="writer-result"><strong>'+DAL.escapeHtml(c.title)+'</strong><span>'+c.words+' words · '+c.sentences+' sentences · '+c.paragraphs+' paragraphs</span></div>';}).join('')+'</div><h3>Most repeated words</h3><p>'+ (t.repeated.join(', ')||'No non-stopword repetitions yet.')+'</p><h3>Filler / crutch words</h3><p>'+ (Object.keys(t.fillers).map(function(w){return w+' ('+t.fillers[w]+')';}).join(', ')||'None detected.')+'</p><h3>Longest sentences</h3><div class="writer-report-list">'+t.longest.slice(0,5).map(function(x){return '<div class="writer-result"><strong>'+DAL.escapeHtml(x.title)+' · '+x.words+' words</strong><span>'+DAL.escapeHtml(x.text)+'</span></div>';}).join('')+'</div>';DAL.modal('Manuscript Report',h,{wide:true,footer:'<button class="btn primary" data-action="close-modal">Done</button>'});};

DAL.BEAT_TEMPLATES={three:[['Setup','Introduce the ordinary world and story promise.'],['Inciting incident','Disrupt the status quo.'],['First turning point','Commit to the central conflict.'],['Midpoint','Raise stakes with a reversal or revelation.'],['Second turning point','Force the final choice.'],['Climax','Confront the central conflict.'],['Resolution','Show the changed world.']],cat:[['Opening Image','A snapshot of the protagonist before change.'],['Theme Stated','A question or lesson is voiced.'],['Setup','Introduce stakes, wants, and flaws.'],['Catalyst','A life-changing event lands.'],['Debate','Hesitation before commitment.'],['Break into Two','Enter the new world.'],['B Story','Introduce the relationship thread.'],['Midpoint','A false victory or defeat.'],['All Is Lost','The lowest point.'],['Finale','Prove the theme through action.'],['Final Image','Mirror the opening image after change.']],hero:[['Ordinary World','Establish the familiar life.'],['Call to Adventure','Present the disruptive invitation.'],['Refusal of the Call','Show resistance or fear.'],['Meeting the Mentor','Gain guidance or a tool.'],['Crossing the Threshold','Enter the unfamiliar world.'],['Tests, Allies, Enemies','Learn the new rules.'],['Ordeal','Face the central fear.'],['Reward','Claim insight or treasure.'],['Road Back','Turn toward home.'],['Resurrection','Pass a final, transforming test.'],['Return with the Elixir','Bring change back to the world.']]};
DAL.showBeats = function(){var proj=DAL.currentWriterProject();if(!proj)return;var d=DAL.writerProject(proj), cur=d.structure,h='<p class="writer-muted">Choose a story structure. It creates a separate checklist and never changes your chapters.</p><div class="writer-tool-actions"><button class="btn" data-action="apply-beats" data-template="three">Three-Act</button><button class="btn" data-action="apply-beats" data-template="cat">Save the Cat</button><button class="btn" data-action="apply-beats" data-template="hero">Hero’s Journey</button></div>';
 if(cur){h+='<div class="beat-list">'+cur.beats.map(function(b,i){return '<div class="beat-row"><input type="checkbox" data-action="toggle-beat" data-beat-index="'+i+'"'+(b.done?' checked':'')+'><label><strong>'+DAL.escapeHtml(b.title)+'</strong><span class="writer-muted"> '+DAL.escapeHtml(b.note)+'</span></label><select class="form-select" data-action="attach-beat" data-beat-index="'+i+'"><option value="">Attach to chapter…</option>'+(proj.chapters||[]).map(function(c){return '<option value="'+c.id+'"'+(b.chapterId===c.id?' selected':'')+'>'+DAL.escapeHtml(c.title)+'</option>';}).join('')+'</select></div>';}).join('')+'</div>';}
 DAL.modal('Story Structure Templates',h,{wide:true,footer:'<button class="btn" data-action="close-modal">Done</button>'});};
DAL.showCorkboard=function(){var proj=DAL.currentWriterProject();if(!proj)return;var h='<p class="writer-muted">Drag cards to reorder. Titles, synopsis, and status save as you edit.</p><div class="corkboard" data-drop="chapter" data-sort-item="[data-drag=\"chapter\"]">'+(proj.chapters||[]).map(function(c){var syn=c.synopsis||'';return '<article class="cork-card" data-drag="chapter:'+c.id+'" data-drag-label="'+DAL.escapeHtml(c.title)+'"><span class="cork-grip" data-drag-handle=".cork-grip">⋮⋮</span><input class="form-input" data-cork-field="title" data-cork-id="'+c.id+'" value="'+DAL.escapeHtml(c.title)+'" aria-label="Chapter title"><textarea class="form-textarea" data-cork-field="synopsis" data-cork-id="'+c.id+'" placeholder="Synopsis">'+DAL.escapeHtml(syn)+'</textarea><select class="form-select" data-cork-field="status" data-cork-id="'+c.id+'"><option value="draft"'+((c.status||'draft')==='draft'?' selected':'')+'>Draft</option><option value="revising"'+(c.status==='revising'?' selected':'')+'>Revising</option><option value="complete"'+(c.status==='complete'?' selected':'')+'>Complete</option></select><div class="cork-meta"><span>'+DAL.countWords(c.contentHTML)+' words</span><span>'+DAL.escapeHtml(c.status||'draft')+'</span></div></article>';}).join('')+'</div>';DAL.modal('Corkboard',h,{wide:true,footer:'<button class="btn primary" data-action="close-modal">Done</button>'});};

DAL.makeSnapshot=function(proj,name){var wc=DAL.getProjectWordCount(proj),snap=DAL.clone(proj);delete snap.versions;delete snap.history;delete snap.folderHandle;proj.versions=proj.versions||[];proj.versions.push({ts:Date.now(),auto:false,name:name||'',snapWords:wc.total,data:snap});if(proj.versions.length>25)proj.versions.shift();DAL.saveState();};
DAL.showVersions=function(){var proj=DAL.currentWriterProject();if(!proj)return;var h='<div class="writer-toolbar"><input class="form-input" id="snapshotName" placeholder="Optional snapshot name"><button class="btn primary" data-action="take-snapshot">Take snapshot</button></div><div class="version-list">'+((proj.versions||[]).slice().reverse().map(function(v,ri){var i=proj.versions.length-1-ri;return '<div class="version-item"><strong>'+DAL.escapeHtml(v.name||((v.auto?'Auto snapshot':'Untitled snapshot')))+'</strong><div class="comment-meta">'+new Date(v.ts).toLocaleString()+' · '+v.snapWords+' words</div><div class="writer-tool-actions"><button class="btn sm" data-action="preview-version" data-version-index="'+i+'">Preview</button><button class="btn sm danger" data-action="confirm-restore-version" data-version-index="'+i+'">Restore</button></div></div>';}).join('')||'<p class="writer-muted">No snapshots yet.</p>')+'</div>';DAL.modal('Version History',h,{wide:true,footer:'<button class="btn" data-action="close-modal">Close</button>'});};
DAL.previewVersion=function(i){var p=DAL.currentWriterProject(),v=p&&p.versions&&p.versions[i];if(!v)return;var snap=v.data||{},h='<div class="writer-status">'+new Date(v.ts).toLocaleString()+' · '+v.snapWords+' words</div><div class="writer-report-list">'+(snap.chapters||[]).map(function(c){return '<div class="writer-result"><strong>'+DAL.escapeHtml(c.title)+'</strong><span>'+DAL.escapeHtml(DAL.plainChapter(c)).slice(0,350)+'</span></div>';}).join('')+'</div>';DAL.modal('Snapshot Preview',h,{wide:true,footer:'<button class="btn" data-action="show-versions">Back</button><button class="btn danger" data-action="confirm-restore-version" data-version-index="'+i+'">Restore this snapshot</button>'});};
DAL.restoreVersionConfirm=function(i){var p=DAL.currentWriterProject();DAL.modal('Restore Snapshot','<p>This will replace the current project with the selected snapshot. The current state is first added to undo history.</p>',{footer:'<button class="btn" data-action="show-versions">Cancel</button><button class="btn danger" data-action="restore-version-now" data-version-index="'+i+'">Restore snapshot</button>'});};
DAL.toggleTypewriter=function(){var s=DAL.writerState();s.typewriter=!s.typewriter;DAL.saveState(true);var ed=document.getElementById('editorContent');if(ed)ed.closest('.editor-area').classList.toggle('typewriter-on',s.typewriter);DAL.toast('Typewriter scrolling '+(s.typewriter?'on':'off'),'info');};
DAL.typewriterScroll=function(editor){var s=DAL.writerState();if(!s.typewriter)return;var range=window.getSelection&&window.getSelection().rangeCount?window.getSelection().getRangeAt(0):null, surface=editor.closest('.editor-surface');if(!range||!surface)return;var rect=range.getBoundingClientRect(),sr=surface.getBoundingClientRect();if(rect.top)surface.scrollTop+=rect.top-(sr.top+sr.height/2);};

DAL.DROP.chapter=function(payload,zone,index){if(payload.kind!=='chapter')return;var p=DAL.currentWriterProject(),from=(p.chapters||[]).findIndex(function(c){return c.id===payload.id;});if(from<0)return;DAL.pushHistory();DAL.moveInArray(p.chapters,from,index===null?p.chapters.length:index);p.chapters.forEach(function(c,i){c.order=i;});DAL.writerSave(p);if(document.getElementById('modalBackdrop'))DAL.showCorkboard();else DAL.render();};
DAL.SELECT.chapter={label:function(id){var p=DAL.currentWriterProject(),c=p&&DAL.chapterById(p,id);return c?c.title:'Chapter';},copy:function(id){var p=DAL.currentWriterProject();return DAL.clone(DAL.chapterById(p,id));},remove:function(id){var p=DAL.currentWriterProject();DAL.pushHistory();p.chapters=p.chapters.filter(function(c){return c.id!==id;});if(DAL.selectedChapterId===id)DAL.selectedChapterId=p.chapters[0]&&p.chapters[0].id;DAL.writerSave(p);DAL.render();},duplicate:function(id){DAL.PASTE.chapter(DAL.SELECT.chapter.copy(id));}};
DAL.PASTE.chapter=function(payload){var p=DAL.currentWriterProject();if(!p||!payload)return;DAL.pushHistory();payload.id=DAL.uid('ch');payload.title=(payload.title||'Chapter')+' Copy';payload.createdAt=Date.now();payload.updatedAt=Date.now();p.chapters.push(payload);p.chapters.forEach(function(c,i){c.order=i;});DAL.selectedChapterId=payload.id;DAL.writerSave(p);DAL.render();};
DAL.CTX.chapter=function(id){var p=DAL.currentWriterProject(),i=(p.chapters||[]).findIndex(function(c){return c.id===id;});return [{heading:'Chapter'},{label:'Move up',action:'move-chapter',data:{cid:id,dir:-1},disabled:i<=0},{label:'Move down',action:'move-chapter',data:{cid:id,dir:1},disabled:i<0||i>=p.chapters.length-1},{divider:true},{label:'Duplicate',action:'edit-duplicate'},{label:'Delete',action:'edit-delete',danger:true}];};
DAL.SELECT.character={label:function(id){var p=DAL.currentWriterProject(),c=p&&(p.characters||[]).find(function(x){return x.id===id;});return c?c.name:'Character';},copy:function(id){var p=DAL.currentWriterProject();return DAL.clone((p.characters||[]).find(function(c){return c.id===id;}));},remove:function(id){var p=DAL.currentWriterProject();DAL.pushHistory();p.characters=p.characters.filter(function(c){return c.id!==id;});if(DAL.selectedCharId===id)DAL.selectedCharId=null;DAL.writerSave(p);DAL.render();},duplicate:function(id){DAL.PASTE.character(DAL.SELECT.character.copy(id));}};
DAL.PASTE.character=function(payload){var p=DAL.currentWriterProject();if(!p||!payload)return;DAL.pushHistory();payload.id=DAL.uid('char');payload.name=(payload.name||'Character')+' Copy';payload.createdAt=Date.now();p.characters.push(payload);DAL.selectedCharId=payload.id;DAL.writerSave(p);DAL.render();};
DAL.CTX.character=function(id){return [{heading:'Character'},{label:'Open',action:'select-character',data:{cid:id}},{label:'Duplicate',action:'edit-duplicate'},{divider:true},{label:'Delete',action:'edit-delete',danger:true}];};

DAL.handleWriterAction=function(action,el){
  var p=DAL.currentWriterProject(), i, m, o, d, c;
  if(action==='show-find'){DAL.showFindModal();return true;}
  if(action==='find-run'){DAL.readFindForm();DAL.showFindModal();return true;}
  if(action==='find-next' || action==='find-next-modal'){o=document.getElementById('findQuery')?DAL.readFindForm():DAL.findOptions();var list=DAL.findMatches(p,o);if(!list.length){DAL.toast('No matches found','info');return true;} DAL._findNext=(DAL._findNext||0)%list.length;DAL.openFindMatch(list[DAL._findNext++]);return true;}
  if(action==='find-open'){m=(DAL._findMatches||[])[parseInt(el.getAttribute('data-find-index'),10)];DAL.openFindMatch(m);return true;}
  if(action==='find-replace-one'){o=DAL.readFindForm();m=(DAL._findMatches||[])[parseInt(el.getAttribute('data-find-index'),10)];c=m&&DAL.chapterById(p,m.cid);if(c&&o.query){DAL.pushHistory();var n=DAL.replaceTextNodes(c,o,m.index);DAL.writerSave(p);DAL.toast(n?'Replaced one match':'Match is no longer available',n?'success':'info');DAL.showFindModal();}return true;}
  if(action==='find-replace-all'){o=DAL.readFindForm();if(!o.query)return true;var total=0;DAL.pushHistory();(p.chapters||[]).forEach(function(ch){if(o.scope==='manuscript'||ch.id===DAL.selectedChapterId)total+=DAL.replaceTextNodes(ch,o);});if(total)DAL.writerSave(p);DAL.toast(total+' replacement'+(total===1?'':'s')+' made',total?'success':'info');DAL.showFindModal();return true;}
  if(action==='show-comments'){DAL.showComments();return true;}
  if(action==='new-comment'){DAL.commentEditor(null);return true;}
  if(action==='edit-comment'){d=DAL.writerProject(p);c=d.comments.find(function(x){return x.id===el.getAttribute('data-comment-id');});if(c)DAL.commentEditor(c);return true;}
  if(action==='save-comment'){d=DAL.writerProject(p);var id=DAL._editingComment, body=(document.getElementById('commentBody')||{}).value||'', chapter=(document.getElementById('commentEditChapter')||{}).value||DAL.selectedChapterId, anchor=(document.getElementById('commentAnchor')||{}).value||'';c=id&&d.comments.find(function(x){return x.id===id;});if(c){c.body=body;c.chapterId=chapter;c.anchor=anchor;c.updatedAt=Date.now();}else d.comments.push({id:DAL.uid('comment'),chapterId:chapter,anchor:anchor,body:body,resolved:false,createdAt:Date.now()});DAL.writerSave(p);DAL.showComments();return true;}
  if(action==='resolve-comment'){d=DAL.writerProject(p);c=d.comments.find(function(x){return x.id===el.getAttribute('data-comment-id');});if(c){c.resolved=!c.resolved;DAL.writerSave(p);DAL.showComments();}return true;}
  if(action==='delete-comment'){d=DAL.writerProject(p);d.comments=d.comments.filter(function(x){return x.id!==el.getAttribute('data-comment-id');});DAL.writerSave(p);DAL.showComments();return true;}
  if(action==='show-sprint'){DAL.showSprint(false);return true;}
  if(action==='start-sprint'){var min=Math.max(1,parseInt((document.getElementById('sprintMinutes')||{}).value,10)||25),target=Math.max(0,parseInt((document.getElementById('sprintTarget')||{}).value,10)||0);DAL.writerState().sprint={projectId:p.id,startedAt:Date.now(),endsAt:Date.now()+min*60000,startWords:DAL.sprintWords(p),target:target};DAL.saveState(true);DAL.showSprint(false);return true;}
  if(action==='stop-sprint'){DAL.stopSprintTimer();DAL.stopSprintWidgetTimer();if(DAL.writerState().sprint)DAL.writerState().sprint=null;DAL.saveState(true);DAL.closeModal();DAL.renderSprintWidget();return true;}
  if(action==='toggle-sprint-widget'){var sw=DAL.sprintWidgetState();sw.visible=!sw.visible;if(sw.visible)sw.collapsed=false;DAL.saveState(true);DAL.renderSprintWidget();DAL.toast(sw.visible?'Sprint timer shown \u2014 drag it anywhere':'Sprint timer hidden');return true;}
  if(action==='collapse-sprint-widget'){var sc=DAL.sprintWidgetState();sc.collapsed=!sc.collapsed;DAL.saveState(true);DAL.renderSprintWidget();return true;}
  if(action==='show-readability'){DAL.showReadability();return true;}
  if(action==='show-beats'){DAL.showBeats();return true;}
  if(action==='apply-beats'){var tmpl=DAL.BEAT_TEMPLATES[el.getAttribute('data-template')],wd=DAL.writerProject(p);if(tmpl){wd.structure={template:el.getAttribute('data-template'),beats:tmpl.map(function(b){return {title:b[0],note:b[1],done:false,chapterId:''};})};DAL.writerSave(p);DAL.showBeats();}return true;}
  if(action==='toggle-beat'){wd=DAL.writerProject(p);i=parseInt(el.getAttribute('data-beat-index'),10);if(wd.structure&&wd.structure.beats[i]){wd.structure.beats[i].done=!wd.structure.beats[i].done;DAL.writerSave(p);}return true;}
  if(action==='attach-beat'){wd=DAL.writerProject(p);i=parseInt(el.getAttribute('data-beat-index'),10);if(wd.structure&&wd.structure.beats[i]){wd.structure.beats[i].chapterId=el.value;DAL.writerSave(p);}return true;}
  if(action==='show-corkboard'){DAL.showCorkboard();return true;}
  if(action==='show-versions'){DAL.showVersions();return true;}
  if(action==='take-snapshot'){var named=(document.getElementById('snapshotName')||{}).value||'';DAL.makeSnapshot(p,named.trim());DAL.toast('Snapshot saved','success');DAL.showVersions();return true;}
  if(action==='preview-version'){DAL.previewVersion(parseInt(el.getAttribute('data-version-index'),10));return true;}
  if(action==='confirm-restore-version'){DAL.restoreVersionConfirm(parseInt(el.getAttribute('data-version-index'),10));return true;}
  if(action==='restore-version-now'){i=parseInt(el.getAttribute('data-version-index'),10);var v=p.versions&&p.versions[i];if(v){DAL.pushHistory();var restored=DAL.clone(v.data);delete restored.versions;delete restored.history;Object.assign(p,restored);DAL.saveState(true);DAL.closeModal();DAL.render();DAL.toast('Snapshot restored','success');}return true;}
  if(action==='toggle-typewriter'){DAL.toggleTypewriter();return true;}
  if(action==='move-chapter'){i=(p.chapters||[]).findIndex(function(x){return x.id===el.getAttribute('data-cid');});var to=i+parseInt(el.getAttribute('data-dir'),10);if(i>=0&&to>=0&&to<p.chapters.length){DAL.pushHistory();var item=p.chapters.splice(i,1)[0];p.chapters.splice(to,0,item);p.chapters.forEach(function(x,n){x.order=n;});DAL.writerSave(p);DAL.render();}return true;}
  if(action==='toggle-character-deceased'){c=(p.characters||[]).find(function(x){return x.id===el.getAttribute('data-cid');});if(c){c.deceased=!c.deceased;DAL.writerSave(p);DAL.render();}return true;}
  if(action==='add-custom-field'){c=(p.characters||[]).find(function(x){return x.id===el.getAttribute('data-cid');});if(c){c.customFields=c.customFields||[];c.customFields.push({label:'New field',type:'text',value:''});DAL.writerSave(p);DAL.render();}return true;}
  if(action==='delete-custom-field'||action==='move-custom-field'){c=(p.characters||[]).find(function(x){return x.id===el.getAttribute('data-cid');});i=parseInt(el.getAttribute('data-cf-index'),10);if(c&&c.customFields&&c.customFields[i]){if(action==='delete-custom-field')c.customFields.splice(i,1);else {var next=i+parseInt(el.getAttribute('data-dir'),10);if(next>=0&&next<c.customFields.length){var field=c.customFields.splice(i,1)[0];c.customFields.splice(next,0,field);}}DAL.writerSave(p);DAL.render();}return true;}
  return false;
};
DAL._storyClickBase=DAL.handleStoryClick;
DAL.handleStoryClick=function(action,el,e){if(DAL.handleWriterAction(action,el,e))return;return DAL._storyClickBase(action,el,e);};

/* These fields are deliberately updated on input, matching the rest of the sheet
   and corkboard, while boolean/type controls settle on change. */
document.addEventListener('input',function(e){
  var el=e.target,p=DAL.currentWriterProject(),c;
  if(!p)return;
  if(el.hasAttribute('data-cork-field')){c=DAL.chapterById(p,el.getAttribute('data-cork-id'));if(c){c[el.getAttribute('data-cork-field')]=el.value;c.updatedAt=Date.now();DAL.writerSave(p);}return;}
  if(el.hasAttribute('data-cf-value')&&el.type==='checkbox'){c=(p.characters||[]).find(function(x){return x.id===DAL.selectedCharId;});if(c&&c.customFields){c.customFields[parseInt(el.getAttribute('data-cf-value'),10)].value=el.checked;DAL.writerSave(p);}return;}
  if(el.id==='editorContent') DAL.typewriterScroll(el);
});
document.addEventListener('change',function(e){
  var el=e.target,p=DAL.currentWriterProject(),c;
  if(!p)return;
  if(el.hasAttribute('data-cork-field')){c=DAL.chapterById(p,el.getAttribute('data-cork-id'));if(c){c[el.getAttribute('data-cork-field')]=el.value;c.updatedAt=Date.now();DAL.writerSave(p);if(el.getAttribute('data-cork-field')==='status')DAL.showCorkboard();}return;}
  if(el.hasAttribute('data-cf-type')||el.hasAttribute('data-cf-value')){c=(p.characters||[]).find(function(x){return x.id===DAL.selectedCharId;});if(c&&c.customFields){var n=parseInt(el.getAttribute('data-cf-type')||el.getAttribute('data-cf-value'),10),f=c.customFields[n];if(el.hasAttribute('data-cf-type')){f.type=el.value;if(f.type==='boolean')f.value=false;else if(f.type==='number')f.value=Number(f.value)||0;}else if(el.type==='checkbox')f.value=el.checked;else f.value=el.value;DAL.writerSave(p);if(el.hasAttribute('data-cf-type'))DAL.render();}return;}
  /* A <select data-action> commits on change, never on click, so its handler is
     unreachable without this. Checkboxes are deliberately excluded — they already
     fire through the click dispatcher, and routing both would toggle twice. */
  if(el.tagName === 'SELECT' && el.hasAttribute('data-action')) DAL.handleWriterAction(el.getAttribute('data-action'), el);
});


DAL._afterStoryRenderBase=DAL.afterStoryRender;
DAL.afterStoryRender=function(proj){DAL._afterStoryRenderBase(proj);var ed=document.getElementById('editorContent');if(ed){var tools=DAL.writerState();ed.closest('.editor-area').classList.toggle('typewriter-on',!!tools.typewriter);}};
