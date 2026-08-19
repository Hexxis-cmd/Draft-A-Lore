/* Draft A Lore — views.js
 * Copyright 2026 Daymien Vanhorn — https://github.com/Hexxis-cmd/Draft-A-Lore
 * Free for noncommercial use under PolyForm Noncommercial 1.0.0 + supplemental
 * terms (see LICENSE.md). Credit to the original author must remain visible.
 * Commercial use requires a license — see COMMERCIAL-LICENSE.md.
 */
/* ============================================
   DRAFT A LORE — Views Module
   Dashboard, Projects Hub, Settings, Library
   ============================================ */
DAL = DAL || {};

/* --- Dashboard --- */
DAL.renderDashboard = function(){
  var html = '<div style="max-width:900px;margin:0 auto">';
  var projects = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; }).filter(Boolean);
  var lastEdited = projects.length ? projects.reduce(function(a,b){ return (a.updatedAt||0) > (b.updatedAt||0) ? a : b; }) : null;
  var gwc = DAL.getGlobalWordCount();
  var streak = DAL.getWritingStreak();
  var hasProfile = DAL.state.authorName || DAL.state.authorBio || DAL.state.authorAvatar;

  // Continue Writing Banner
  if(lastEdited){
    var wc = DAL.getProjectWordCount(lastEdited);
    html += '<div class="card" style="margin-bottom:20px;border-left:3px solid var(--c-accent)">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">'+
        '<div><div style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-bottom:4px">CONTINUE WRITING</div>'+
        '<div style="font-family:var(--font-display);font-size:var(--ts-lg);font-weight:700">'+DAL.escapeHtml(lastEdited.name)+'</div>'+
        '<div style="display:flex;gap:8px;margin-top:4px">'+
          '<span class="badge accent">'+DAL.escapeHtml(lastEdited.type)+'</span>'+
          '<span class="badge">'+DAL.escapeHtml(lastEdited.status)+'</span>'+
          '<span class="badge">'+wc.total+' words</span>'+
          '<span class="badge">'+DAL.formatDate(lastEdited.updatedAt)+'</span>'+
        '</div></div>'+
        '<button class="btn primary" data-action="open-project" data-pid="'+lastEdited.id+'" data-tip="Open '+DAL.escapeHtml(lastEdited.name)+'">Continue Writing</button>'+
      '</div></div>';
  }

  // Author Profile Card
  html += '<div class="dashboard-profile-card">';
  html += '<div class="profile-card-header" style="display:flex;align-items:flex-start;gap:20px">';
  // Avatar
  var initials = (DAL.state.authorName||'?').split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();
  html += '<div class="profile-avatar">'+(DAL.state.authorAvatar?'<img src="'+DAL.state.authorAvatar+'">':DAL.escapeHtml(initials))+'</div>';
  // Name + bio
  html += '<div style="flex:1;min-width:0">';
  if(DAL.state.authorName){
    html += '<div class="profile-name">'+DAL.escapeHtml(DAL.state.authorName)+'</div>';
  } else {
    html += '<div class="profile-name" style="color:var(--c-text-muted)">Your Author Name</div>';
  }
  if(DAL.state.authorBio){
    html += '<div class="profile-bio">'+DAL.escapeHtml(DAL.state.authorBio)+'</div>';
  } else if(!hasProfile){
    html += '<div class="profile-bio" style="color:var(--c-text-faint)">Set up your author profile in Settings to add your name, bio, and photo. This appears on your book covers, title pages, and exports when auto-fill is enabled.</div>';
  } else {
    html += '<div class="profile-bio" style="color:var(--c-text-faint)">No bio written yet. Add one in Settings.</div>';
  }
  html += '</div>';
  // Edit button
  html += '<button class="btn sm" data-action="nav-settings" data-tip="Edit your profile in Settings">Edit Profile</button>';
  html += '</div>'; // end header
  // Stats row inside profile card
  if(hasProfile){
    html += '<div class="profile-card-stats">';
    html += '<div class="profile-stat"><span class="profile-stat-num">'+projects.length+'</span><span class="profile-stat-label">Projects</span></div>';
    html += '<div class="profile-stat"><span class="profile-stat-num">'+gwc.total.toLocaleString()+'</span><span class="profile-stat-label">Words Written</span></div>';
    html += '<div class="profile-stat"><span class="profile-stat-num">'+streak+'</span><span class="profile-stat-label">Day'+(streak!==1?'s':'')+' Streak</span></div>';
    html += '</div>';
  }
  html += '</div>'; // end profile card

  // Analytics Wrapper
  html += '<div class="dashboard-section-wrapper" style="margin-bottom:20px">';
  html += '<div class="section-header"><div class="section-title">Writing Analytics</div></div>';
  html += '<div class="card" style="padding:20px">';
  // Word count stats
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">'+
    '<div style="text-align:center"><div style="font-size:var(--ts-xl);font-weight:700;color:var(--c-accent)">'+gwc.manuscript.toLocaleString()+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted);text-transform:uppercase;margin-top:2px">Manuscript Words</div></div>'+
    '<div style="text-align:center"><div style="font-size:var(--ts-xl);font-weight:700;color:var(--c-accent)">'+gwc.supplementary.toLocaleString()+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted);text-transform:uppercase;margin-top:2px">Supplementary Words</div></div>'+
    '<div style="text-align:center"><div style="font-size:var(--ts-xl);font-weight:700;color:var(--c-accent)">'+gwc.total.toLocaleString()+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted);text-transform:uppercase;margin-top:2px">Total Words</div></div>'+
  '</div>';
  // Streak
  html += '<div style="display:flex;align-items:center;gap:12px;padding-top:16px;border-top:1px solid var(--c-divider)">'+
    '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--c-accent);flex-shrink:0">'+(streak>0?
      '<path d="M12 2C10 5 8 7 8 11a4 4 0 0 0 8 0c0-2-1-4-2-5"/><path d="M12 22c4 0 7-2 7-6 0-3-2-5-3-6"/><path d="M5 16c0 4 3 6 7 6"/><path d="M9 11c0 1 .5 2 1.5 2.5"/>'
      :'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6"/><path d="M9 11h4"/>')+
    '</svg>'+
    '<div><div style="font-weight:700;font-size:var(--ts-lg)">'+streak+' day'+(streak!==1?'s':'')+'</div><div style="font-size:var(--ts-xs);color:var(--c-text-muted)">Current writing streak</div></div>'+
  '</div>';
  html += '</div>'; // end card
  html += '</div>'; // end wrapper

  // Goals Wrapper
  var goals = [
    {label:'Daily', val:gwc.total, target:DAL.state.goalDaily, key:'goalDaily'},
    {label:'Weekly', val:gwc.total, target:DAL.state.goalWeekly, key:'goalWeekly'},
    {label:'Monthly', val:gwc.total, target:DAL.state.goalMonthly, key:'goalMonthly'},
    {label:'6-Month', val:gwc.total, target:DAL.state.goal6Month, key:'goal6Month'},
    {label:'Yearly', val:gwc.total, target:DAL.state.goalYearly, key:'goalYearly'}
  ];
  html += '<div class="dashboard-section-wrapper">';
  html += '<div class="section-header"><div class="section-title">Writing Goals</div></div>';
  html += '<div class="card" style="padding:20px">';
  goals.forEach(function(g){
    var pct = g.target > 0 ? Math.min(100, Math.round((g.val/g.target)*100)) : 0;
    html += '<div style="margin-bottom:12px">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px">'+
        '<span style="font-size:var(--ts-sm);font-weight:600">'+g.label+'</span>'+
        '<span style="font-size:var(--ts-xs);color:var(--c-text-muted)">'+g.val.toLocaleString()+' / <input type="number" style="width:80px;font-size:var(--ts-xs);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-sm);padding:1px 4px;color:var(--c-text)" value="'+g.target+'" data-goal="'+g.key+'"> words ('+pct+'%)</span>'+
      '</div>'+
      '<div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%"></div></div>'+
    '</div>';
  });
  html += '</div>';
  html += '</div>';
  html += '</div>';
  return html;
};

/* --- Projects --- */
DAL.renderProjects = function(){
  var projects = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; }).filter(Boolean);
  if(projects.length === 0){
    return '<div class="empty-state">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'+
      '<h3>No Projects Yet</h3><p>Create your first project to start writing.</p>'+
      '<button class="btn primary" data-action="new-project">Create Your First Project</button>'+
      '<div style="margin-top:8px"><button class="btn sm" data-action="import-project">Import from JSON</button></div>'+
    '</div>';
  }

  var html = '<div class="section-header"><div class="section-title">Projects</div>'+
    '<div style="display:flex;gap:8px">'+
      '<button class="btn sm" data-action="import-project" data-tip="Import a project from JSON">Import</button>'+
      '<button class="btn primary" data-action="new-project">New Project</button>'+
    '</div></div>';
  html += '<div class="card-grid">';
  projects.forEach(function(p){
    var wc = DAL.getProjectWordCount(p);
    var typeLabel = p.type === 'novel' ? 'Novel' : (p.type === 'rpg' ? 'RPG Adventure' : 'Dual');
    html += '<div class="card hoverable" style="cursor:pointer" data-action="open-project" data-pid="'+p.id+'" data-tip="Open '+DAL.escapeHtml(p.name)+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'+
        '<div style="font-weight:700;font-size:var(--ts-base)">'+DAL.escapeHtml(p.name)+'</div>'+
        '<div style="display:flex;gap:4px">'+
          '<button class="btn icon sm" data-action="project-settings" data-pid="'+p.id+'" data-tip="Edit settings" style="width:24px;height:24px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:4px;margin-bottom:8px">'+
        '<span class="badge accent">'+typeLabel+'</span>'+
        '<span class="badge">'+DAL.escapeHtml(p.status)+'</span>'+
      '</div>'+
      '<div style="font-size:var(--ts-xs);color:var(--c-text-muted)">'+wc.manuscript+' manuscript words</div>'+
      '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:4px">Edited '+DAL.formatDate(p.updatedAt)+'</div>'+
      '<div style="display:flex;gap:4px;margin-top:8px">'+
        '<button class="btn sm" data-action="export-project" data-pid="'+p.id+'" data-tip="Export project">Export</button>'+
        '<button class="btn sm danger" data-action="delete-project" data-pid="'+p.id+'" data-tip="Delete project">Delete</button>'+
      '</div>'+
    '</div>';
  });
  html += '</div>';
  return html;
};

DAL.showNewProjectModal = function(){
  var html = '<div class="form-group"><label class="form-label">Project Name</label><input class="form-input" id="npName" placeholder="My Great Novel"></div>'+
    '<div class="form-group"><label class="form-label">Project Type</label><select class="form-select" id="npType">'+
      '<option value="novel">Standard Novel</option>'+
      '<option value="rpg">RPG Adventure</option>'+
      '<option value="dual">Dual (Novel + RPG)</option>'+
    '</select></div>'+
    '<div class="form-group"><label class="form-label">Folder Connection</label>'+
    '<div style="display:flex;gap:8px;align-items:center">'+
      '<button class="btn sm" data-action="link-folder-new" data-tip="Link to a folder on your PC (Chrome/Edge)">Link to folder</button>'+
      '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)" id="npFolderName">No folder linked</span>'+
    '</div></div>';
  DAL.modal('Create New Project', html, { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="create-project">Create Project</button>' });
};

DAL.showProjectSettingsModal = function(pid){
  var p = DAL.state.projects[pid];
  if(!p) return;
  var html = '<div class="form-group"><label class="form-label">Project Name</label><input class="form-input" id="psName" value="'+DAL.escapeHtml(p.name)+'"></div>'+
    '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="psStatus">'+
      ['development','drafting','proofreading','completed','published'].map(function(s){ return '<option value="'+s+'"'+(p.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>'; }).join('')+
    '</select></div>'+
    '<div class="form-group"><label class="form-label">Folder Connection</label>'+
    '<div style="display:flex;gap:8px;align-items:center">'+
      '<button class="btn sm" data-action="link-folder" data-pid="'+pid+'" data-tip="Link folder">Link Folder</button>'+
      '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+(p.linkedFolderName||'Not linked')+'</span>'+
    '</div></div>'+
    '<div class="form-group"><label class="form-label">Cover</label>'+
    '<div style="display:flex;gap:8px;align-items:center">'+
      '<input type="text" class="form-input" id="psCoverTitle" value="'+DAL.escapeHtml(p.cover.title||'')+'" placeholder="Cover title" style="flex:1">'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
      '<input type="text" class="form-input" id="psCoverSubtitle" value="'+DAL.escapeHtml(p.cover.subtitle||'')+'" placeholder="Subtitle" style="flex:1">'+
      '<input type="text" class="form-input" id="psCoverAuthor" value="'+DAL.escapeHtml(p.cover.author||'')+'" placeholder="Author" style="flex:1">'+
    '</div></div>';
  DAL.modal('Project Settings', html, { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="save-project-settings" data-pid="'+pid+'">Save</button>' });
};

DAL.showDeleteConfirm = function(pid, step){
  var p = DAL.state.projects[pid];
  if(!p) return;
  if(step === 1){
    DAL.modal('Delete Project', '<p>Are you sure you want to delete "'+DAL.escapeHtml(p.name)+'"? This cannot be undone.</p><p style="margin-top:8px;color:var(--c-danger);font-weight:600">Click Delete again to confirm.</p>', { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" data-action="delete-project-confirm" data-pid="'+pid+'">Delete</button>' });
  }
};

/* --- Settings --- */
DAL.renderSettings = function(){
  var themes = [
    {id:'aurora',name:'Aurora',desc:'Midnight purple with pink-blue gradient brand'},
    {id:'dark',name:'Dark',desc:'Deep charcoal with warm gold accent'},
    {id:'light',name:'Light',desc:'Soft grey with warm brown accent'},
    {id:'fantasy-dark',name:'Fantasy Dark',desc:'Near-black with forest green and burgundy'},
    {id:'fantasy-light',name:'Fantasy Light',desc:'Warm parchment with sage and rose'}
  ];
  var html = '<div style="max-width:700px;margin:0 auto">';

  // Theme
  html += '<div class="section-header"><div class="section-title">Theme</div></div>';
  html += '<div class="card-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:20px">';
  themes.forEach(function(t){
    var active = DAL.state.appTheme === t.id;
    html += '<div class="card'+(active?'':' hoverable')+'" data-action="set-theme" data-theme="'+t.id+'" style="cursor:pointer;border:'+ (active?'2px solid var(--c-accent)':'1px solid var(--c-border)')+'">'+
      '<div style="font-weight:700;margin-bottom:4px">'+t.name+'</div>'+
      '<div style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-bottom:8px">'+t.desc+'</div>'+
      '<div style="display:flex;gap:4px"><div style="width:20px;height:20px;border-radius:4px;background:';
    if(t.id==='aurora') html += '#0a0814';
    else if(t.id==='dark') html += '#0F1116';
    else if(t.id==='light') html += '#EDEAE3';
    else if(t.id==='fantasy-dark') html += '#0C0E0A';
    else html += '#F0E6CC';
    html += '"></div><div style="width:20px;height:20px;border-radius:4px;background:';
    if(t.id==='aurora') html += 'linear-gradient(135deg,#6366F1,#8B5CF6,#EC4899)';
    else if(t.id==='dark') html += '#C9A24B';
    else if(t.id==='light') html += '#8E6B1E';
    else if(t.id==='fantasy-dark') html += '#A8821E';
    else html += '#7A5E1E';
    html += '"></div></div></div>';
  });
  html += '</div>';

  // Author Info
  html += '<div class="section-header"><div class="section-title">Author Information</div></div>';
  html += '<div class="card" style="margin-bottom:20px">';
  // Avatar upload
  html += '<div class="form-group"><label class="form-label">Author Photo</label>'+
    '<div style="display:flex;align-items:center;gap:12px">'+
    '<div class="author-avatar-preview">'+(DAL.state.authorAvatar?'<img src="'+DAL.state.authorAvatar+'">':DAL.escapeHtml((DAL.state.authorName||'?').charAt(0).toUpperCase()))+'</div>'+
    '<div>'+
      '<input type="file" id="authorAvatarInput" accept="image/*" style="display:none">'+
      '<button class="btn sm" data-action="upload-author-avatar" data-tip="Upload your author photo">Upload Photo</button>'+
      (DAL.state.authorAvatar?' <button class="btn sm danger" data-action="remove-author-avatar" data-tip="Remove your photo">Remove</button>':'')+
    '</div></div></div>';
  html += '<div class="form-group"><label class="form-label">Author Name (or Pen Name)</label><input class="form-input" id="setAuthorName" value="'+DAL.escapeHtml(DAL.state.authorName||'')+'" placeholder="Your name or alias"></div>'+
    '<div class="form-group"><label class="form-label">Meet the Author</label><textarea class="form-textarea" id="setAuthorBio" placeholder="Write a short bio that readers will see...">'+DAL.escapeHtml(DAL.state.authorBio||'')+'</textarea></div>'+
    '<div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="setAutoFill" '+(DAL.state.autoFillAuthor?'checked':'')+'><label for="setAutoFill" style="font-size:var(--ts-sm);cursor:pointer">Auto-fill author info into covers, title pages, and exports</label></div>'+
    '<button class="btn primary" style="margin-top:12px" data-action="save-author-info">Save Author Info</button></div>';

  // Font Import
  html += '<div class="section-header"><div class="section-title">Custom Fonts</div></div>';
  html += '<div class="card" style="margin-bottom:20px">'+
    '<p style="font-size:var(--ts-sm);color:var(--c-text-muted);margin-bottom:12px">Import .ttf, .otf, .woff, or .woff2 fonts. Available in all editors.</p>'+
    '<input type="file" id="fontImport" accept=".ttf,.otf,.woff,.woff2" style="display:none">'+
    '<button class="btn" data-action="import-font" data-tip="Import a custom font file">Import Font</button>'+
    '<div style="margin-top:12px">';
  if(DAL.state.customFonts.length){
    DAL.state.customFonts.forEach(function(f,i){
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--c-divider)">'+
        '<span style="font-size:var(--ts-sm)">'+DAL.escapeHtml(f.name)+'</span>'+
        '<button class="btn sm danger" data-action="remove-font" data-idx="'+i+'">Remove</button></div>';
    });
  } else {
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint)">No custom fonts imported.</div>';
  }
  html += '</div></div>';

  // Backup
  html += '<div class="section-header"><div class="section-title">Backup & Data</div></div>';
  html += '<div class="card" style="margin-bottom:20px">'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+
      '<button class="btn" data-action="backup-workspace" data-tip="Download all data as JSON">Download Backup</button>'+
      '<button class="btn" data-action="restore-workspace" data-tip="Restore from a backup JSON">Restore Backup</button>'+
      '<input type="file" id="restoreInput" accept=".json" style="display:none">'+
    '</div>'+
    '<div style="border-top:1px solid var(--c-divider);padding-top:12px">'+
      '<button class="btn danger" data-action="clear-data" data-tip="Permanently delete all data">Clear All Data</button>'+
    '</div></div>';

  // Version + credit. This attribution is required by the project license
  // (see LICENSE.md, Supplemental Term S4) and must stay visible in forks.
  html += '<div style="text-align:center;font-size:var(--ts-xs);color:var(--c-text-faint);padding:16px;line-height:1.7">'+
    'Draft A Lore v1.0.0<br>'+
    'Created by Daymien Vanhorn<br>'+
    '<a href="https://github.com/Hexxis-cmd/Draft-A-Lore" target="_blank" rel="noopener" style="color:var(--c-text-faint)">github.com/Hexxis-cmd/Draft-A-Lore</a><br>'+
    'Free for noncommercial use<br>Commercial use requires a license'+
  '</div>';
  html += '</div>';
  return html;
};

/* --- Library --- */
DAL.renderLibrary = function(){
  var projects = DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; }).filter(function(p){ return p && (p.status === 'completed' || p.status === 'published'); });
  if(projects.length === 0){
    return '<div class="empty-state">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'+
      '<h3>Library Empty</h3><p>Completed and published projects will appear here.</p></div>';
  }
  var colors = ['var(--c-accent)','var(--c-info)','var(--c-success)','var(--c-warning)','var(--c-danger)'];
  var html = '<div class="section-header"><div class="section-title">Completed Books Library</div></div>';
  html += '<div class="library-grid">';
  projects.forEach(function(p, i){
    var color = colors[i % colors.length];
    var author = p.cover.author || (DAL.state.autoFillAuthor ? DAL.state.authorName : '');
    html += '<div class="book-spine" data-action="open-reader" data-pid="'+p.id+'" style="background:linear-gradient(135deg,'+color+','+color+'88);color:#fff" data-tip="Read '+DAL.escapeHtml(p.name)+'">'+
      '<div class="book-spine-title">'+DAL.escapeHtml(p.cover.title||p.name)+'</div>'+
      (author ? '<div class="book-spine-author">'+DAL.escapeHtml(author)+'</div>' : '')+
    '</div>';
  });
  html += '</div>';
  return html;
};

DAL.renderBookReader = function(pid){
  var p = DAL.state.projects[pid];
  if(!p) return '<div class="empty-state"><h3>Project not found</h3></div>';
  var pages = [];
  // Cover page
  var author = p.cover.author || (DAL.state.autoFillAuthor ? DAL.state.authorName : '');
  pages.push({ type:'cover', html: '<div class="book-cover"><div class="book-cover-title">'+DAL.escapeHtml(p.cover.title||p.name)+'</div>'+(p.cover.subtitle?'<div style="font-size:var(--ts-sm);opacity:.7;margin-bottom:12px">'+DAL.escapeHtml(p.cover.subtitle)+'</div>':'')+(author?'<div class="book-cover-author">'+DAL.escapeHtml(author)+'</div>':'')+'</div>' });
  // TOC
  var tocHtml = '<h1>Table of Contents</h1>';
  if(p.chapters && p.chapters.length){
    p.chapters.forEach(function(ch, i){
      tocHtml += '<p style="cursor:pointer;color:var(--c-accent)" data-action="reader-goto" data-page="'+(i+2)+'">'+(i+1)+'. '+DAL.escapeHtml(ch.title)+'</p>';
    });
  }
  pages.push({ type:'toc', html: tocHtml });
  // Chapter pages
  if(p.chapters){
    p.chapters.forEach(function(ch){
      pages.push({ type:'chapter', html: '<h2>'+DAL.escapeHtml(ch.title)+'</h2>'+ch.contentHTML });
    });
  }
  if(DAL.readerPage >= pages.length) DAL.readerPage = 0;

  var html = '<div class="book-reader" data-book-theme="'+DAL.readerTheme+'">';
  html += '<div class="book-reader-toolbar">'+
    '<button class="btn sm" data-action="close-reader" data-tip="Close reader">← Back to Library</button>'+
    '<div style="margin-left:auto;display:flex;gap:4px;align-items:center">'+
      '<select class="form-select" style="width:auto;font-size:var(--ts-xs)" id="readerThemeSelect" data-action="reader-theme">'+
        '<option value="parchment"'+(DAL.readerTheme==='parchment'?' selected':'')+'>Parchment</option>'+
        '<option value="paper"'+(DAL.readerTheme==='paper'?' selected':'')+'>Paper</option>'+
        '<option value="night"'+(DAL.readerTheme==='night'?' selected':'')+'>Night</option>'+
        '<option value="sepia"'+(DAL.readerTheme==='sepia'?' selected':'')+'>Sepia</option>'+
      '</select>'+
    '</div></div>';
  html += '<div class="book-page-container"><div class="book-page" id="bookPage">'+pages[DAL.readerPage].html+'<div class="book-page-num">'+(DAL.readerPage+1)+' / '+pages.length+'</div></div></div>';
  html += '<div class="book-nav">'+
    '<button class="btn sm" data-action="reader-prev" '+(DAL.readerPage<=0?'disabled':'')+'>← Previous</button>'+
    '<span style="font-size:var(--ts-xs);color:var(--c-text-faint)">'+(DAL.readerPage+1)+' / '+pages.length+'</span>'+
    '<button class="btn sm" data-action="reader-next" '+(DAL.readerPage>=pages.length-1?'disabled':'')+'>Next →</button>'+
  '</div></div>';
  return html;
};

/* --- Click Handler (shared) --- */
DAL.handleClick = function(action, el, e){
  // Dashboard/Settings field changes
  if(action === 'set-theme'){ DAL.setTheme(el.getAttribute('data-theme')); DAL.render(); return; }

  if(action === 'save-author-info'){
    DAL.state.authorName = document.getElementById('setAuthorName').value;
    DAL.state.authorBio = document.getElementById('setAuthorBio').value;
    DAL.state.autoFillAuthor = document.getElementById('setAutoFill').checked;
    DAL.saveState(); DAL.render(); DAL.toast('Author info saved','success');
    return;
  }

  if(action === 'import-font'){ document.getElementById('fontImport').click(); return; }

  if(action === 'upload-author-avatar'){ document.getElementById('authorAvatarInput').click(); return; }

  if(action === 'remove-author-avatar'){
    DAL.state.authorAvatar = '';
    DAL.saveState(); DAL.render(); DAL.toast('Photo removed','info');
    return;
  }

  if(action === 'remove-font'){
    var idx = parseInt(el.getAttribute('data-idx'));
    DAL.state.customFonts.splice(idx, 1);
    DAL.saveState(); DAL.render(); DAL.toast('Font removed','info');
    return;
  }

  if(action === 'backup-workspace'){ DAL.downloadJSON('draftalore-backup-'+DAL.todayKey()+'.json', DAL.state); DAL.toast('Backup downloaded','success'); return; }

  if(action === 'restore-workspace'){ document.getElementById('restoreInput').click(); return; }

  if(action === 'clear-data'){
    DAL.modal('Clear All Data', '<p style="color:var(--c-danger)">This will permanently delete ALL projects, settings, and data.</p><p style="margin-top:8px;font-weight:600">Click Clear again to confirm.</p>', { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" data-action="clear-data-confirm">Clear Everything</button>' });
    return;
  }

  if(action === 'clear-data-confirm'){
    DAL._storage.removeItem('draftALore');
    DAL.state = DAL.defaultState();
    DAL.closeModal(); DAL.render(); DAL.toast('All data cleared','warning');
    return;
  }

  if(action === 'open-project'){
    var pid = el.getAttribute('data-pid');
    DAL.navigate('workspace', pid);
    return;
  }

  if(action === 'new-project'){ DAL.showNewProjectModal(); return; }

  if(action === 'create-project'){
    var name = document.getElementById('npName').value.trim() || 'Untitled Project';
    var type = document.getElementById('npType').value;
    var proj = DAL.defaultProject(name, type);
    DAL.state.projects[proj.id] = proj;
    DAL.state.projectOrder.push(proj.id);
    DAL.saveState(); DAL.closeModal();
    DAL.navigate('workspace', proj.id);
    DAL.toast('Project created','success');
    return;
  }

  if(action === 'import-project'){
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = function(){
      if(inp.files[0]) DAL.readJSON(inp.files[0], function(data, err){
        if(err){ DAL.toast('Invalid JSON file','error'); return; }
        if(!data.id || !data.name){ DAL.toast('Not a valid project file','error'); return; }
        data.id = DAL.uid('proj');
        DAL.state.projects[data.id] = data;
        DAL.state.projectOrder.push(data.id);
        DAL.saveState(); DAL.render(); DAL.toast('Project imported','success');
      });
    };
    inp.click();
    return;
  }

  if(action === 'project-settings'){ e.stopPropagation(); DAL.showProjectSettingsModal(el.getAttribute('data-pid')); return; }

  if(action === 'save-project-settings'){
    var spid = el.getAttribute('data-pid');
    var sp = DAL.state.projects[spid];
    if(sp){
      sp.name = document.getElementById('psName').value.trim() || sp.name;
      sp.status = document.getElementById('psStatus').value;
      sp.cover.title = document.getElementById('psCoverTitle').value;
      sp.cover.subtitle = document.getElementById('psCoverSubtitle').value;
      sp.cover.author = document.getElementById('psCoverAuthor').value;
      sp.updatedAt = Date.now();
      DAL.saveState(); DAL.closeModal(); DAL.render(); DAL.toast('Settings saved','success');
    }
    return;
  }

  if(action === 'export-project'){
    e.stopPropagation();
    var epid = el.getAttribute('data-pid');
    DAL.showExportModal(epid);
    return;
  }

  if(action === 'delete-project'){
    e.stopPropagation();
    DAL.showDeleteConfirm(el.getAttribute('data-pid'), 1);
    return;
  }

  if(action === 'delete-project-confirm'){
    var dpid = el.getAttribute('data-pid');
    delete DAL.state.projects[dpid];
    DAL.state.projectOrder = DAL.state.projectOrder.filter(function(id){ return id !== dpid; });
    DAL.saveState(); DAL.closeModal(); DAL.render(); DAL.toast('Project deleted','warning');
    return;
  }

  if(action === 'link-folder' || action === 'link-folder-new'){
    var lpid = el.getAttribute('data-pid') || (DAL.currentProjectId);
    DAL.linkFolder(lpid);
    return;
  }

  // Library / Reader
  if(action === 'open-reader'){
    DAL._readerPid = el.getAttribute('data-pid');
    DAL.readerPage = 0;
    DAL._inReader = true;
    document.getElementById('content').innerHTML = DAL.renderBookReader(DAL._readerPid);
    return;
  }

  if(action === 'close-reader'){
    DAL._inReader = false;
    DAL.navigate('library');
    return;
  }

  if(action === 'reader-prev'){
    if(DAL.readerPage > 0){ DAL.readerPage--; DAL.flipPage(); }
    return;
  }
  if(action === 'reader-next'){
    DAL.readerPage++; DAL.flipPage();
    return;
  }
  if(action === 'reader-goto'){
    DAL.readerPage = parseInt(el.getAttribute('data-page')) || 0;
    DAL.flipPage();
    return;
  }
  if(action === 'reader-theme'){
    DAL.readerTheme = el.value;
    document.querySelector('.book-reader').setAttribute('data-book-theme', DAL.readerTheme);
    return;
  }

  // Delegates to workspace/story-tools/adventure-tools
  if(DAL.handleWorkspaceClick) DAL.handleWorkspaceClick(action, el, e);
  if(DAL.handleStoryClick) DAL.handleStoryClick(action, el, e);
  if(DAL.handleAdventureClick) DAL.handleAdventureClick(action, el, e);
};

DAL.flipPage = function(){
  var page = document.getElementById('bookPage');
  if(page){
    page.classList.add('flipping');
    setTimeout(function(){
      document.getElementById('content').innerHTML = DAL.renderBookReader(DAL._readerPid);
    }, 250);
  } else {
    document.getElementById('content').innerHTML = DAL.renderBookReader(DAL._readerPid);
  }
};

/* --- Field change handlers (input events) --- */
document.addEventListener('input', function(e){
  var el = e.target;
  if(el.hasAttribute('data-field')){
    var field = el.getAttribute('data-field');
    if(field === 'authorName') DAL.state.authorName = el.value;
    else if(field === 'authorBio') DAL.state.authorBio = el.value;
    else if(field === 'autoFillAuthor') DAL.state.autoFillAuthor = el.checked;
    DAL.saveState();
  }
  if(el.hasAttribute('data-goal')){
    var key = el.getAttribute('data-goal');
    DAL.state[key] = parseInt(el.value) || 0;
    DAL.saveState();
  }
  // Illustration name editing
  if(el.hasAttribute('data-illustration-name')){
    var projIllName = DAL.state.projects[DAL.currentProjectId];
    var illIdx = parseInt(el.getAttribute('data-illustration-name'));
    if(projIllName.images && projIllName.images[illIdx]){
      projIllName.images[illIdx].name = el.value;
      DAL.saveState();
    }
  }
});

document.addEventListener('change', function(e){
  var el = e.target;
  if(el.id === 'authorAvatarInput' && el.files[0]){
    DAL.readImageAsDataURL(el.files[0], function(dataUrl){
      DAL.state.authorAvatar = dataUrl;
      DAL.saveState(); DAL.render(); DAL.toast('Author photo updated','success');
    });
    return;
  }
  if(el.id === 'fontImport' && el.files[0]){
    var file = el.files[0];
    var reader = new FileReader();
    reader.onload = function(ev){
      var name = file.name.replace(/\.[^.]+$/,'');
      DAL.state.customFonts.push({ name: name, dataUrl: ev.target.result });
      DAL.loadCustomFonts();
      DAL.saveState(); DAL.render();
      DAL.toast('Font imported: '+name,'success');
    };
    reader.readAsDataURL(file);
    return;
  }
  if(el.id === 'restoreInput' && el.files[0]){
    DAL.readJSON(el.files[0], function(data, err){
      if(err || !data.projects){ DAL.toast('Invalid backup file','error'); return; }
      DAL.modal('Restore Backup', '<p>This will replace ALL current data with the backup. Continue?</p>', { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" data-action="restore-confirm">Restore</button>' });
      DAL._pendingRestore = data;
    });
    return;
  }
  // Illustration upload (multiple files)
  if(el.id === 'illustrationUpload' && el.files.length){
    var projIll2 = DAL.state.projects[DAL.currentProjectId];
    if(!projIll2.images) projIll2.images = [];
    var remaining = el.files.length;
    Array.prototype.forEach.call(el.files, function(f){
      DAL.compressImage(f, 1200, 0.82, function(dataUrl){
        var name = f.name.replace(/\.[^.]+$/,'');
        projIll2.images.push({ id: DAL.uid('img'), name: name, dataUrl: dataUrl, category: 'other', usedIn: [] });
        remaining--;
        if(remaining === 0){
          DAL.saveState(); DAL.render();
          DAL.toast(el.files.length+' image'+(el.files.length!==1?'s':'')+' added to library','success');
        }
      });
    });
    return;
  }
  // Cover image upload
  if(el.id === 'coverImageInput' && el.files[0]){
    var projCov2 = DAL.state.projects[DAL.currentProjectId];
    DAL.compressImage(el.files[0], 800, 0.85, function(dataUrl){
      projCov2.cover.imageDataUrl = dataUrl;
      DAL.saveState(); DAL.render(); DAL.toast('Cover illustration set','success');
    });
    return;
  }
  // Chapter image upload
  if(el.id === 'chapterImageInput' && el.files[0]){
    var projChImg = DAL.state.projects[DAL.currentProjectId];
    var chImg = projChImg.chapters.find(function(c){ return c.id === DAL._uploadChapterCid; });
    if(chImg){
      if(!chImg.images) chImg.images = [];
      if(chImg.images.length >= 2){ DAL.toast('Max 2 images per chapter','error'); return; }
      DAL.compressImage(el.files[0], 1000, 0.82, function(dataUrl){
        var imgName = el.files[0].name.replace(/\.[^.]+$/,'');
        chImg.images.push({ id: DAL.uid('img'), name: imgName, dataUrl: dataUrl });
        DAL.saveState(); DAL.render(); DAL.toast('Chapter image added','success');
      });
    }
    DAL._uploadChapterCid = null;
    return;
  }
  // Illustration category change
  if(el.hasAttribute('data-illustration-category')){
    var projIllCat = DAL.state.projects[DAL.currentProjectId];
    var catIdx = parseInt(el.getAttribute('data-illustration-category'));
    if(projIllCat.images && projIllCat.images[catIdx]){
      projIllCat.images[catIdx].category = el.value;
      DAL.saveState();
    }
    return;
  }
  // Item image upload (adventure-tools)
  if(el.id === 'itemImageInput' && el.files[0]){
    var projItem = DAL.state.projects[DAL.currentProjectId];
    var advItem = DAL.ensureAdventure(projItem);
    var itemIdx2 = parseInt(DAL._uploadItemIdx);
    if(advItem.items && advItem.items[itemIdx2]){
      DAL.compressImage(el.files[0], 400, 0.8, function(dataUrl){
        advItem.items[itemIdx2].imageDataUrl = dataUrl;
        DAL.saveState(); DAL.render(); DAL.toast('Item illustration set','success');
      });
    }
    DAL._uploadItemIdx = null;
    return;
  }
  // Scene image upload (adventure-tools)
  if(el.id === 'sceneImageInput' && el.files[0]){
    var projScene = DAL.state.projects[DAL.currentProjectId];
    var advScene = DAL.ensureAdventure(projScene);
    var nodeScene = advScene.nodes.find(function(n){ return n.id === DAL._uploadSceneNodeId; });
    if(nodeScene){
      if(!nodeScene.images) nodeScene.images = [];
      DAL.compressImage(el.files[0], 800, 0.82, function(dataUrl){
        nodeScene.images.push({ id: DAL.uid('img'), name: el.files[0].name.replace(/\.[^.]+$/,''), dataUrl: dataUrl });
        DAL.saveState(); DAL.render(); DAL.toast('Scene illustration added','success');
      });
    }
    DAL._uploadSceneNodeId = null;
    return;
  }
});

// Restore confirm handler
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-action="restore-confirm"]');
  if(!el) return;
  if(DAL._pendingRestore){
    DAL.state = Object.assign(DAL.defaultState(), DAL._pendingRestore);
    DAL._pendingRestore = null;
    DAL.saveState(true); DAL.closeModal(); DAL.render();
    DAL.toast('Backup restored','success');
  }
});
