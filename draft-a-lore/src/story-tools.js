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

  var html = '<div class="workspace" style="width:100%;height:100%">';
  // Workspace sidebar
  html += '<aside class="workspace-sidebar" id="wsSidebar">';

  // Back button
  html += '<div style="padding:8px 12px;border-bottom:1px solid var(--c-border)"><button class="btn sm" data-action="nav-projects" data-tip="Back to Projects">← Projects</button></div>';

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
      ['export','Project Export','M12 3v12 M7 8l5-5 5 5 M5 21h14']
    ];
    storyTools.forEach(function(t){
      var active = DAL.currentTool === t[0] ? ' active' : '';
      html += '<div class="ws-nav-item'+active+'" data-action="ws-tool" data-tool="'+t[0]+'" data-tip="'+t[1]+'">'+(t[2]?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="'+t[2]+'"/></svg>':'')+'<span>'+t[1]+'</span></div>';
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
      html += '<div class="ws-nav-item'+active+'" data-action="ws-tool" data-tool="'+t[0]+'" data-tip="'+t[1]+'">'+(t[2]?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="'+t[2]+'"/></svg>':'')+'<span>'+t[1]+'</span></div>';
    });
  }

  html += '</aside>'; // end sidebar

  // Workspace topbar + main
  html += '<div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0">';
  html += '<div class="workspace-topbar">'+
    '<button class="btn sm" data-action="nav-projects" data-tip="Back to Projects">← Back</button>'+
    /* On phones the global top bar is hidden inside the workspace so the
       writing surface gets that height back, so undo/redo and the save
       indicator travel with the project header instead. */
    '<div class="ws-compact-actions">'+
      '<button class="topbar-btn" data-action="undo" aria-label="Undo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg></button>'+
      '<button class="topbar-btn" data-action="redo" aria-label="Redo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg></button>'+
      '<div class="save-status"><div class="save-dot"></div></div>'+
    '</div>'+
    '<input class="form-input" style="width:auto;font-weight:600" id="projNameInput" value="'+DAL.escapeHtml(proj.name)+'" data-tip="Click to rename">'+
    '<select class="form-select" style="width:auto;font-size:var(--ts-xs)" data-action="change-status" data-pid="'+proj.id+'">'+
      ['development','drafting','proofreading','completed','published'].map(function(s){ return '<option value="'+s+'"'+(proj.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>'; }).join('')+
    '</select>'+
    '<div style="margin-left:auto;display:flex;gap:8px;align-items:center;font-size:var(--ts-xs);color:var(--c-text-muted)">'+
      '<span data-tip="Manuscript / Supplementary / Total words"><strong style="color:var(--c-text)">'+wc.manuscript+'</strong> / <strong style="color:var(--c-text)">'+wc.supplementary+'</strong> / <strong style="color:var(--c-text)">'+wc.total+'</strong> words</span>'+
      '<span data-tip="Today word count">Today: <strong style="color:var(--c-accent)">'+(daily.manuscript+daily.supplementary)+'</strong></span>'+
      '<div class="sync-dot '+(DAL.folderHandles[proj.id]?'linked':'unlinked')+'" data-tip="'+(DAL.folderHandles[proj.id]?'Folder linked':'No folder linked')+'"></div>'+
      /* Folder sync needs the File System Access API, which mobile browsers
         don't implement — so the control is hidden rather than offered and
         then refused. */
      '<button class="btn sm ws-folder-btn" data-action="link-folder" data-pid="'+proj.id+'" data-tip="Link or relink folder">Link Folder</button>'+
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

  var html = '<div style="max-width:800px">';
  html += '<div class="section-header"><div class="section-title">'+DAL.escapeHtml(proj.name)+'</div><span class="badge accent">'+proj.type+'</span></div>';

  // Stats grid
  html += '<div class="card-grid ws-stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">'+
    '<div class="card" style="text-align:center"><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+(proj.chapters||[]).length+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Chapters</div></div>'+
    '<div class="card" style="text-align:center"><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+(proj.characters||[]).length+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Characters</div></div>'+
    '<div class="card" style="text-align:center"><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+(proj.plots||[]).length+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Plot Threads</div></div>'+
    '<div class="card" style="text-align:center"><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+(proj.lore&&proj.lore.entries||[]).length+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Lore Entries</div></div>'+
  '</div>';

  // Word counts
  html += '<div class="card" style="margin-bottom:16px;display:flex;gap:16px;justify-content:center;text-align:center">'+
    '<div><div style="font-size:var(--ts-lg);font-weight:700">'+wc.manuscript+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Manuscript</div></div>'+
    '<div><div style="font-size:var(--ts-lg);font-weight:700">'+wc.supplementary+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Supplementary</div></div>'+
    '<div><div style="font-size:var(--ts-lg);font-weight:700;color:var(--c-accent)">'+wc.total+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Total</div></div>'+
  '</div>';

  // Stale plots
  if(stalePlots.length){
    html += '<div class="card" style="margin-bottom:16px;border-left:3px solid var(--c-warning)">'+
      '<div style="font-weight:600;color:var(--c-warning);margin-bottom:8px">⚠ Stale Plot Threads</div>';
    stalePlots.forEach(function(p){
      html += '<div style="font-size:var(--ts-sm);padding:2px 0">'+DAL.escapeHtml(p.title)+' — untouched '+DAL.formatDate(p.lastTouched||p.createdAt)+'</div>';
    });
    html += '</div>';
  }

  // Quick links
  html += '<div class="card" style="margin-bottom:16px"><div style="font-weight:600;margin-bottom:8px">Quick Links</div><div class="quick-links">';
  var tools = proj.type === 'rpg' ? ['storygraph','stats','items','playtest','illustrations'] : ['manuscript','characters','illustrations','bookpreview','export'];
  if(proj.type === 'dual') tools = ['manuscript','characters','illustrations','storygraph','stats','items','playtest'];
  tools.forEach(function(t){
    var labels = {manuscript:'Manuscript',characters:'Characters',relationships:'Relationships',plots:'Plot Threads',lore:'Lore',illustrations:'Illustrations',mindmap:'Mind Map',bookpreview:'Book Preview',export:'Export',storygraph:'Story Graph',stats:'Stats & Traits',items:'Items',playtest:'Playthrough'};
    html += '<div class="quick-link" data-action="ws-tool" data-tool="'+t+'" data-tip="Go to '+labels[t]+'">'+labels[t]+'</div>';
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

  var html = '<div class="manuscript-layout" style="height:calc(var(--app-h,100dvh) - var(--topbar-h) - 52px)">';
  // Chapter list
  html += '<div class="chapter-list">'+
    '<div class="chapter-list-header"><span style="font-size:var(--ts-xs);font-weight:600;text-transform:uppercase;color:var(--c-text-muted)">Chapters</span><button class="btn sm primary" data-action="add-chapter" data-tip="Add a new chapter">+</button></div>'+
    '<div class="chapter-list-items" id="chapterList">';
  proj.chapters.forEach(function(ch, i){
    var active = ch.id === DAL.selectedChapterId ? ' active' : '';
    var wc = DAL.countWords(ch.contentHTML);
    html += '<div class="chapter-item'+active+'" data-action="select-chapter" data-cid="'+ch.id+'" data-tip="'+wc+' words">'+
      '<span class="drag-handle" data-action="reorder-chapter" data-cid="'+ch.id+'" data-tip="Drag to reorder">⋮⋮</span>'+
      '<span>'+(i+1)+'. '+DAL.escapeHtml(ch.title)+'</span>'+
    '</div>';
  });
  if(!proj.chapters.length){
    html += '<div style="padding:12px;font-size:var(--ts-xs);color:var(--c-text-faint);text-align:center">No chapters yet</div>';
  }
  html += '</div></div>';

  // Editor
  html += '<div class="editor-area">';
  html += '<div class="editor-toolbar" id="editorToolbar">';
  // Block format
  html += '<select data-action="format-block" data-tip="Block format"><option value="p">Body Text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Subheading</option></select>';
  // Font family
  var fonts = DAL.getFontList();
  html += '<select data-action="font-family" data-tip="Font family" style="width:100px">';
  fonts.forEach(function(f){ html += '<option value="'+f+'">'+f+'</option>'; });
  html += '</select>';
  // Font size
  html += '<select data-action="font-size" data-tip="Font size" style="width:50px">';
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
  fmtBtns.forEach(function(b){ html += '<button class="tb-btn" data-action="format-cmd" data-cmd="'+b[0]+'" data-tip="'+b[2]+'">'+b[1]+'</button>'; });
  html += '<span class="tb-sep"></span>';
  html += '<input type="color" data-action="text-color" data-tip="Text color" style="width:24px;height:24px;border:none;cursor:pointer">';
  html += '<span class="tb-sep"></span>';
  var aligns = [['justifyLeft','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>','Align Left'],['justifyCenter','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>','Center'],['justifyRight','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>','Right'],['justifyFull','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>','Justify']];
  aligns.forEach(function(a){ html += '<button class="tb-btn" data-action="format-cmd" data-cmd="'+a[0]+'" data-tip="'+a[2]+'">'+a[1]+'</button>'; });
  html += '<span class="tb-sep"></span>';
  html += '<button class="tb-btn" data-action="format-cmd" data-cmd="insertUnorderedList" data-tip="Bullet list"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg></button>';
  html += '<button class="tb-btn" data-action="format-cmd" data-cmd="insertOrderedList" data-tip="Numbered list"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4 M4 10h2 M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg></button>';
  html += '<button class="tb-btn" data-action="insert-image" data-tip="Insert image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></button>';
  html += '<button class="tb-btn" data-action="insert-hr" data-tip="Horizontal rule"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="4" y1="12" x2="20" y2="12"/></svg></button>';
  html += '<span class="tb-sep"></span>';
  html += '<button class="tb-btn" data-action="copy-chapter" data-tip="Copy chapter to clipboard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>';
  html += '<button class="tb-btn" data-action="export-chapter" data-tip="Export chapter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M12 3v12 M7 8l5-5 5 5 M5 21h14"/></svg></button>';
  html += '<button class="tb-btn" data-action="fullscreen" data-tip="Distraction-free mode"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>';
  html += '</div>'; // end toolbar

  // Chapter illustrations strip
  if(currentCh){
    html += '<div class="chapter-illustrations-strip">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:var(--ts-xs);font-weight:600;text-transform:uppercase;color:var(--c-text-muted)">Chapter Illustrations</span>'+
      '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+((currentCh.images||[]).length)+'/2</span>'+
      ((currentCh.images||[]).length < 2 ? '<button class="btn sm" data-action="upload-chapter-image" data-cid="'+currentCh.id+'" data-tip="Add an illustration to this chapter">+ Add Image</button>' : '')+
    '</div>';
    if(currentCh.images && currentCh.images.length){
      html += '<div style="display:flex;gap:8px">';
      currentCh.images.forEach(function(img, ii){
        html += '<div class="chapter-ill-thumb">'+
          '<img src="'+img.dataUrl+'">'+
          '<button class="chapter-ill-remove" data-action="remove-chapter-image" data-cid="'+currentCh.id+'" data-img-idx="'+ii+'" data-tip="Remove illustration">&times;</button>'+
          '</div>';
      });
      html += '</div>';
    }
    html += '<input type="file" id="chapterImageInput" accept="image/*" style="display:none">';
    html += '</div>';
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
        saveTimer = setTimeout(function(){ DAL.saveState(); }, 450);
        // Update word count
        var wc = DAL.countWords(editor.innerHTML);
        var footer = editor.parentElement.parentElement.querySelector('.editor-footer span');
        if(footer) footer.textContent = wc + ' words';
      }
    });
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
    html += '<div class="char-card" data-action="select-character" data-cid="'+c.id+'" data-tip="View '+DAL.escapeHtml(c.name)+'">'+
      '<div class="char-portrait">'+(c.image?'<img src="'+c.image+'">':DAL.escapeHtml(initials))+'</div>'+
      '<div class="char-name">'+DAL.escapeHtml(c.name)+'</div>'+
      '<div class="char-role">'+DAL.escapeHtml(c.role||'')+'</div>'+
    '</div>';
  });
  html += '</div>';
  return html;
};

DAL.renderCharacterDetail = function(proj, ch){
  var charWC = DAL.countWordsText(ch.appearance)+DAL.countWordsText(ch.personality)+DAL.countWordsText(ch.backstory)+DAL.countWordsText(ch.arc);
  var html = '<div style="max-width:700px">';
  html += '<div style="margin-bottom:16px"><button class="btn sm" data-action="back-to-characters" data-tip="Back to character list">← Back</button></div>';
  html += '<div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-start">';
  // Portrait
  html += '<div class="char-portrait" style="width:96px;height:96px;flex-shrink:0;font-size:32px;border-radius:var(--radius-lg)">'+(ch.image?'<img src="'+ch.image+'">':DAL.escapeHtml((ch.name||'?').charAt(0).toUpperCase()))+'</div>';
  html += '<div style="flex:1"><input class="form-input" id="charName" value="'+DAL.escapeHtml(ch.name||'')+'" placeholder="Character name" style="font-size:var(--ts-lg);font-weight:700;margin-bottom:4px"></div></div>';

  // Portrait upload
  html += '<div style="margin-bottom:12px"><input type="file" id="charPortrait" accept="image/*" style="display:none"><button class="btn sm" data-action="upload-portrait" data-cid="'+ch.id+'" data-tip="Upload portrait">Upload Portrait</button> '+(ch.image?'<button class="btn sm danger" data-action="remove-portrait" data-cid="'+ch.id+'">Remove</button>':'')+'</div>';

  html += '<div class="form-row" style="margin-bottom:12px">'+
    '<div class="form-group"><label class="form-label">Role</label><input class="form-input" data-char-field="role" value="'+DAL.escapeHtml(ch.role||'')+'" placeholder="Protagonist"></div>'+
    '<div class="form-group"><label class="form-label">Age</label><input class="form-input" data-char-field="age" value="'+DAL.escapeHtml(ch.age||'')+'" placeholder="25"></div>'+
    '<div class="form-group"><label class="form-label">Gender</label><input class="form-input" data-char-field="gender" value="'+DAL.escapeHtml(ch.gender||'')+'" placeholder="Female"></div></div>';

  var fields = [['appearance','Physical Appearance'],['personality','Personality'],['backstory','Backstory'],['arc','Character Arc / Goals']];
  fields.forEach(function(f){
    html += '<div class="form-group"><label class="form-label">'+f[1]+'</label><textarea class="form-textarea" data-char-field="'+f[0]+'" placeholder="Write '+f[1].toLowerCase()+'...">'+DAL.escapeHtml(ch[f[0]]||'')+'</textarea></div>';
  });

  // Custom fields
  if(ch.customFields && ch.customFields.length){
    html += '<div class="form-group"><label class="form-label">Custom Fields</label>';
    ch.customFields.forEach(function(cf, i){
      html += '<div style="display:flex;gap:4px;margin-bottom:4px"><input class="form-input" style="flex:1" value="'+DAL.escapeHtml(cf.label)+'" data-cf-label="'+i+'" placeholder="Label"><input class="form-input" style="flex:2" value="'+DAL.escapeHtml(cf.value)+'" data-cf-value="'+i+'" placeholder="Value"></div>';
    });
    html += '</div>';
  }
  html += '<button class="btn sm" data-action="add-custom-field" data-cid="'+ch.id+'" data-tip="Add a custom field">+ Add Custom Field</button>';

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

  var html = '<div class="section-header"><div class="section-title">Relationship Map</div><button class="btn primary" data-action="add-relationship" data-tip="Add a new relationship">+ Add Relationship</button></div>';
  html += '<div style="margin-bottom:12px"><label class="form-label">Center on character</label><select class="form-select" id="relCenterSelect" style="width:auto;display:inline-block">';
  proj.characters.forEach(function(c){
    html += '<option value="'+c.id+'"'+(c.id===center.id?' selected':'')+'>'+DAL.escapeHtml(c.name)+'</option>';
  });
  html += '</select></div>';

  html += '<div class="rel-map-container" id="relMapContainer" style="position:relative">';
  html += '<svg class="rel-svg" id="relSvg"></svg>';

  // Center node
  html += '<div class="rel-node center" id="relCenterNode" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)">'+
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
    html += '<div class="rel-node connected" data-action="rel-center-on" data-cid="'+item.char.id+'" style="position:absolute;left:'+x+'%;top:'+y+'%;transform:translate(-50%,-50%);border-color:'+color+'" data-tip="'+DAL.escapeHtml(item.rel.type||'relationship')+'">'+
      '<div style="font-weight:600;font-size:var(--ts-sm)">'+DAL.escapeHtml(item.char.name)+'</div>'+
      '<div style="font-size:var(--ts-xs);color:var(--c-text-muted)">'+DAL.escapeHtml(item.rel.type||'')+'</div></div>';
  });

  if(!connectedChars.length){
    html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,60px);text-align:center;color:var(--c-text-faint);font-size:var(--ts-sm)">No relationships yet. Click "Add Relationship" to connect characters.</div>';
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
      html += '<div class="plot-card" data-action="select-plot" data-pid="'+p.id+'" data-tip="View plot details">'+
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
      html += '<div class="plot-card" data-action="select-plot" data-pid="'+p.id+'" data-tip="View plot details">'+
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
  var html = '<div style="max-width:700px">';
  html += '<div style="margin-bottom:16px"><button class="btn sm" data-action="back-to-plots" data-tip="Back to plot list">← Back</button></div>';
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

  html += '<div style="display:flex;gap:8px"><button class="btn sm" data-action="mark-reviewed" data-pid="'+p.id+'" data-tip="Reset stale timer">Mark Reviewed</button><button class="btn sm danger" data-action="delete-plot" data-pid="'+p.id+'">Delete</button></div>';
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

  var html = '<div class="lore-layout" style="height:calc(var(--app-h,100dvh) - var(--topbar-h) - 52px)">';
  // Sidebar
  html += '<div class="lore-sidebar"><div style="padding:8px 12px;border-bottom:1px solid var(--c-border)"><span style="font-size:var(--ts-xs);font-weight:600;text-transform:uppercase;color:var(--c-text-muted)">Lore</span></div>';
  proj.lore.folders.forEach(function(f){
    var active = f === DAL.selectedLoreFolder ? ' active' : '';
    var count = proj.lore.entries.filter(function(e){ return e.folder === f; }).length;
    html += '<div class="lore-folder'+active+'" data-action="select-lore-folder" data-folder="'+DAL.escapeHtml(f)+'" data-tip="'+count+' entries">'+DAL.escapeHtml(f)+' ('+count+')</div>';
    // Show entries in this folder
    proj.lore.entries.filter(function(e){ return e.folder === f; }).forEach(function(e){
      html += '<div class="lore-entry-item" data-action="select-lore-entry" data-eid="'+e.id+'" data-tip="View entry">'+DAL.escapeHtml(e.title)+'</div>';
    });
  });
  html += '<div style="padding:8px 12px"><button class="btn sm" data-action="add-lore-folder" data-tip="Add a custom folder">+ Folder</button></div>';
  html += '</div>';

  // Main area
  var entries = proj.lore.entries.filter(function(e){ return e.folder === DAL.selectedLoreFolder; });
  html += '<div class="lore-main">';
  html += '<div class="section-header"><div class="section-title">'+DAL.escapeHtml(DAL.selectedLoreFolder)+'</div><button class="btn primary" data-action="add-lore-entry">+ Add Entry</button></div>';
  if(!entries.length){
    html += '<div class="empty-state"><h3>No Entries</h3><p>Add lore entries to this category.</p><button class="btn primary" data-action="add-lore-entry">Add Entry</button></div>';
  } else {
    entries.forEach(function(e){
      html += '<div class="card hoverable" style="margin-bottom:8px;cursor:pointer" data-action="select-lore-entry" data-eid="'+e.id+'" data-tip="View entry"><div style="font-weight:600">'+DAL.escapeHtml(e.title)+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-top:2px">'+(e.tags||[]).join(', ')+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:2px">'+DAL.formatDate(e.updatedAt)+'</div></div>';
    });
  }
  html += '</div></div>';
  return html;
};

DAL.renderLoreDetail = function(proj, entry){
  var html = '<div style="max-width:700px">';
  html += '<div style="margin-bottom:16px"><button class="btn sm" data-action="back-to-lore" data-tip="Back to lore list">← Back</button></div>';
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
  var html = '<div style="max-width:900px">';
  html += '<div class="section-header"><div class="section-title">Illustrations</div>'+
    '<div style="display:flex;gap:8px">'+
    '<input type="file" id="illustrationUpload" accept="image/*" multiple style="display:none">'+
    '<button class="btn primary" data-action="upload-illustration" data-tip="Upload images to this project">+ Upload Images</button>'+
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
      html += '<div class="illustration-thumb">'+(img.dataUrl?'<img src="'+img.dataUrl+'">':'<div class="illustration-placeholder">No image</div>')+'</div>';
      html += '<div class="illustration-info">';
      html += '<input class="form-input illustration-name-input" value="'+DAL.escapeHtml(img.name||'')+'" data-illustration-name="'+i+'" placeholder="Image name" data-tip="Rename this image">';
      html += '<div style="display:flex;align-items:center;gap:4px;margin-top:4px">';
      html += '<select class="form-select illustration-category" data-illustration-category="'+i+'" style="font-size:var(--ts-xs);flex:1" data-tip="Categorize this image">';
      var cats = ['Cover','Chapter Art','Character','Item Icon','Scene','Other'];
      cats.forEach(function(c){ html += '<option value="'+c.toLowerCase().replace(/\s/g,'-')+'"'+(img.category===c.toLowerCase().replace(/\s/g,'-')?' selected':'')+'>'+c+'</option>'; });
      html += '</select>';
      html += '<button class="btn sm danger" data-action="delete-illustration" data-idx="'+i+'" data-tip="Remove from library">&times;</button>';
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
    '<button class="tb-btn" data-action="mm-add-node" data-tip="Add idea node"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>'+
    '<button class="tb-btn" data-action="mm-connect" data-tip="'+(DAL.connectMode?'Cancel connect':'Connect mode')+'" '+(DAL.connectMode?'style="background:var(--c-accent-soft);color:var(--c-accent)"':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>'+
    '<button class="tb-btn" data-action="mm-delete-sel" data-tip="Delete selected"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>'+
  '</div>';
  html += '<div class="canvas-container" id="canvasContainer" style="height:calc(var(--app-h,100dvh) - var(--topbar-h) - 52px - 40px)"><div class="canvas-inner" id="canvasInner">';
  html += '<svg class="canvas-svg" id="canvasSvg"></svg>';
  mm.nodes.forEach(function(n){
    var sel = n.id === DAL.selectedNodeId ? ' selected' : '';
    var label = n.label || 'Idea';
    html += '<div class="canvas-node'+sel+'" data-action="mm-select" data-nid="'+n.id+'" style="left:'+(n.x||0)+'px;top:'+(n.y||0)+'px" data-tip="'+DAL.escapeHtml(label)+'">'+
      '<div class="canvas-node-title">'+DAL.escapeHtml(label)+'</div>'+
      (n.type?'<div class="canvas-node-badge">'+DAL.escapeHtml(n.type)+'</div>':'')+
    '</div>';
  });
  if(!mm.nodes.length){
    html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;max-width:400px;color:var(--c-text-faint);font-size:var(--ts-sm)">'+
      '<div style="margin-bottom:8px;font-size:var(--ts-lg);color:var(--c-text-muted)">What is a Mind Map?</div>'+
      '<p style="line-height:1.6">A mind map is a free-form visual brainstorming space. Use it to jot down ideas, connect them with lines, and see how different parts of your story relate to each other.</p>'+
      '<p style="margin-top:8px"><strong>Double-click</strong> the canvas to add an idea, <strong>click two nodes in Connect mode</strong> to link them, <strong>click a node</strong> to rename it, and <strong>click a line</strong> to remove it.</p>'+
    '</div>';
  }
  html += '</div></div>';
  return html;
};

DAL.initCanvasInteractions = function(proj){
  var container = document.getElementById('canvasContainer');
  var inner = document.getElementById('canvasInner');
  var svg = document.getElementById('canvasSvg');
  if(!container || !inner) return;

  var mm = proj.mindmap;
  if(!mm) return;

  // Draw edges
  if(svg){
    svg.innerHTML = '';
    (mm.edges||[]).forEach(function(edge){
      var from = mm.nodes.find(function(n){ return n.id === edge.from; });
      var to = mm.nodes.find(function(n){ return n.id === edge.to; });
      if(!from || !to) return;
      var x1 = (from.x||0)+70, y1 = (from.y||0)+20;
      var x2 = (to.x||0)+70, y2 = (to.y||0)+20;
      var mx = (x1+x2)/2;
      svg.innerHTML += '<path d="M'+x1+','+y1+' Q'+mx+','+((y1+y2)/2-20)+' '+x2+','+y2+'" fill="none" stroke="var(--c-border)" stroke-width="2" data-action="mm-delete-edge" data-eid="'+edge.id+'" style="pointer-events:stroke;cursor:pointer"/>';
    });
  }

  // Drag nodes
  var dragNode = null, dragOff = {x:0,y:0};
  container.addEventListener('mousedown', function(e){
    var nodeEl = e.target.closest('.canvas-node');
    if(nodeEl && !DAL.connectMode){
      var nid = nodeEl.getAttribute('data-nid');
      dragNode = mm.nodes.find(function(n){ return n.id === nid; });
      if(dragNode){
        var rect = inner.getBoundingClientRect();
        dragOff.x = e.clientX - rect.left - (dragNode.x||0);
        dragOff.y = e.clientY - rect.top - (dragNode.y||0);
        e.preventDefault();
      }
    }
  });
  container.addEventListener('mousemove', function(e){
    if(dragNode){
      var rect = inner.getBoundingClientRect();
      dragNode.x = e.clientX - rect.left - dragOff.x;
      dragNode.y = e.clientY - rect.top - dragOff.y;
      var el = container.querySelector('[data-nid="'+dragNode.id+'"]');
      if(el){ el.style.left = dragNode.x+'px'; el.style.top = dragNode.y+'px'; }
      DAL._canvasDirty = true;
    }
  });
  container.addEventListener('mouseup', function(){
    if(dragNode && DAL._canvasDirty){
      DAL._canvasDirty = false;
      DAL.saveState();
      DAL.initCanvasInteractions(proj);
    }
    dragNode = null;
  });

  // Double-click to add node
  container.addEventListener('dblclick', function(e){
    if(e.target === container || e.target === inner || e.target === svg){
      var rect = inner.getBoundingClientRect();
      var node = { id: DAL.uid('mm'), label: 'New Idea', type: 'idea', x: e.clientX - rect.left, y: e.clientY - rect.top };
      mm.nodes.push(node);
      DAL.saveState(); DAL.render();
    }
  });
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
    '<button class="btn sm" data-action="upload-cover" data-tip="Upload cover illustration">'+(proj.cover.imageDataUrl?'Change Image':'Upload Cover')+'</button>'+
    (proj.cover.imageDataUrl?'<button class="btn sm danger" data-action="remove-cover">Remove</button>':'')+
    '</div></div>' });
  var tocHtml = '<h1>Table of Contents</h1>';
  proj.chapters.forEach(function(ch, i){ tocHtml += '<p style="cursor:pointer;color:var(--c-accent)" data-action="bp-goto" data-page="'+(i+2)+'">'+(i+1)+'. '+DAL.escapeHtml(ch.title)+'</p>'; });
  pages.push({ html: tocHtml });
  proj.chapters.forEach(function(ch){
    var chHtml = '<h2>'+DAL.escapeHtml(ch.title)+'</h2>';
    // Chapter images
    if(ch.images && ch.images.length){
      ch.images.forEach(function(img){
        chHtml += '<div class="chapter-illustration"><img src="'+img.dataUrl+'">'+(img.name?'<div class="chapter-illustration-caption">'+DAL.escapeHtml(img.name)+'</div>':'')+'</div>';
      });
    }
    chHtml += ch.contentHTML;
    pages.push({ html: chHtml });
  });
  if(DAL.readerPage >= pages.length) DAL.readerPage = 0;

  var html = '<div class="book-reader" data-book-theme="'+DAL.readerTheme+'">';
  html += '<div class="book-reader-toolbar"><div style="font-weight:600">Book Preview</div><div style="margin-left:auto;display:flex;gap:4px;align-items:center"><select class="form-select" style="width:auto;font-size:var(--ts-xs)" data-action="reader-theme"><option value="parchment"'+(DAL.readerTheme==='parchment'?' selected':'')+'>Parchment</option><option value="paper"'+(DAL.readerTheme==='paper'?' selected':'')+'>Paper</option><option value="night"'+(DAL.readerTheme==='night'?' selected':'')+'>Night</option><option value="sepia"'+(DAL.readerTheme==='sepia'?' selected':'')+'>Sepia</option></select></div></div>';
  html += '<div class="book-page-container"><div class="book-page" id="bookPage">'+pages[DAL.readerPage].html+'<div class="book-page-num">'+(DAL.readerPage+1)+' / '+pages.length+'</div></div></div>';
  html += '<div class="book-nav"><button class="btn sm" data-action="bp-prev" '+(DAL.readerPage<=0?'disabled':'')+'>← Previous</button><span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+(DAL.readerPage+1)+' / '+pages.length+'</span><button class="btn sm" data-action="bp-next" '+(DAL.readerPage>=pages.length-1?'disabled':'')+'>Next →</button></div></div>';
  return html;
};

/* --- Story Export --- */
DAL.renderStoryExport = function(proj){
  var html = '<div style="max-width:700px"><div class="section-header"><div class="section-title">Export</div></div>';
  html += '<div class="card" style="margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">Full Project</div><div style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="btn" data-action="export-json" data-pid="'+proj.id+'" data-tip="Export as JSON (re-importable)">Export JSON</button>'+
    '<button class="btn" data-action="export-manuscript-txt" data-pid="'+proj.id+'" data-tip="Plain text manuscript">Manuscript (TXT)</button>'+
    '<button class="btn" data-action="export-manuscript-md" data-pid="'+proj.id+'" data-tip="Markdown manuscript">Manuscript (MD)</button>'+
    '<button class="btn" data-action="export-manuscript-html" data-pid="'+proj.id+'" data-tip="HTML manuscript">Manuscript (HTML)</button>'+
  '</div></div>';

  html += '<div class="card" style="margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">Individual Chapter</div><select class="form-select" id="exportChapterSelect" style="margin-bottom:8px">';
  (proj.chapters||[]).forEach(function(ch, i){ html += '<option value="'+ch.id+'">'+(i+1)+'. '+DAL.escapeHtml(ch.title)+'</option>'; });
  html += '</select><div style="display:flex;gap:8px"><button class="btn sm" data-action="export-chapter-txt" data-pid="'+proj.id+'">TXT</button><button class="btn sm" data-action="export-chapter-md" data-pid="'+proj.id+'">Markdown</button></div></div>';

  html += '<div class="card" style="margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">Cross-Project Transfer</div><p style="font-size:var(--ts-sm);color:var(--c-text-muted);margin-bottom:8px">Copy a character, lore entry, or plot thread into another project.</p>'+
    '<div class="form-row"><select class="form-select" id="transferType"><option value="character">Character</option><option value="lore">Lore Entry</option><option value="plot">Plot Thread</option></select>'+
    '<select class="form-select" id="transferItem"></select><select class="form-select" id="transferDest">';
  DAL.state.projectOrder.forEach(function(pid){
    if(pid !== proj.id){ var p = DAL.state.projects[pid]; if(p) html += '<option value="'+pid+'">'+DAL.escapeHtml(p.name)+'</option>'; }
  });
  html += '</select></div><button class="btn primary" style="margin-top:8px" data-action="transfer-item" data-pid="'+proj.id+'">Transfer</button></div>';

  // Version snapshots
  html += '<div class="card"><div style="font-weight:600;margin-bottom:8px">Version Snapshots</div>';
  html += '<button class="btn sm" data-action="save-version" data-pid="'+proj.id+'" data-tip="Save a version now">Save Version Now</button>';
  if(proj.versions && proj.versions.length){
    html += '<div style="margin-top:8px;max-height:200px;overflow-y:auto">';
    proj.versions.forEach(function(v, i){
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--c-divider)"><span style="font-size:var(--ts-xs)">'+new Date(v.ts).toLocaleString()+(v.auto?' (auto)':'')+' — '+v.snapWords+' words</span><button class="btn sm" data-action="restore-version" data-pid="'+proj.id+'" data-idx="'+i+'" data-tip="Restore this version">Restore</button></div>';
    });
    html += '</div>';
  } else {
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:8px">No versions saved yet</div>';
  }
  html += '</div></div>';
  return html;
};

DAL.showExportModal = function(pid){
  var proj = DAL.state.projects[pid];
  if(!proj) return;
  var html = '<div style="display:flex;flex-direction:column;gap:8px">'+
    '<button class="btn" data-action="export-json" data-pid="'+pid+'">Export as JSON</button>'+
    '<button class="btn" data-action="export-manuscript-txt" data-pid="'+pid+'">Manuscript as Plain Text</button>'+
    '<button class="btn" data-action="export-manuscript-md" data-pid="'+pid+'">Manuscript as Markdown</button>'+
    '<button class="btn" data-action="export-manuscript-html" data-pid="'+pid+'">Manuscript as HTML</button>'+
  '</div>';
  DAL.modal('Export Project', html, { footer: '<button class="btn" data-action="close-modal">Close</button>' });
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
    var proj25 = DAL.state.projects[el.getAttribute('data-pid')];
    var data = DAL.clone(proj25);
    delete data.history; delete data.versions; delete data.folderHandle;
    DAL.downloadJSON(DAL.sanitizeFilename(proj25.name)+'.json', data);
    DAL.closeModal(); DAL.toast('Project exported','success');
    return;
  }

  if(action === 'export-manuscript-txt' || action === 'export-manuscript-md' || action === 'export-manuscript-html'){
    var proj26 = DAL.state.projects[el.getAttribute('data-pid')];
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
    DAL.closeModal(); DAL.toast('Manuscript exported','success');
    return;
  }

  if(action === 'export-chapter-txt' || action === 'export-chapter-md'){
    var proj27 = DAL.state.projects[el.getAttribute('data-pid')];
    var chId = document.getElementById('exportChapterSelect').value;
    var ch7 = (proj27.chapters||[]).find(function(c){ return c.id === chId; });
    if(ch7){
      var tmp3 = document.createElement('div'); tmp3.innerHTML = ch7.contentHTML;
      if(action === 'export-chapter-md') DAL.download(DAL.sanitizeFilename(ch7.title)+'.md', '## '+ch7.title+'\n\n'+tmp3.textContent, 'text/markdown');
      else DAL.download(DAL.sanitizeFilename(ch7.title)+'.txt', ch7.title+'\n\n'+tmp3.textContent);
      DAL.toast('Chapter exported','success');
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
    } else if(action === 'reader-theme'){
      DAL.readerTheme = el.value;
      var reader = document.querySelector('.book-reader');
      if(reader) reader.setAttribute('data-book-theme', DAL.readerTheme);
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
