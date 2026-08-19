/* Draft A Lore — adventure-tools.js
 * Copyright 2026 Daymien Vanhorn — https://github.com/Hexxis-cmd/Draft-A-Lore
 * Free for noncommercial use under PolyForm Noncommercial 1.0.0 + supplemental
 * terms (see LICENSE.md). Credit to the original author must remain visible.
 * Commercial use requires a license — see COMMERCIAL-LICENSE.md.
 */
/* ============================================
   DRAFT A LORE — Adventure Tools Module
   Story Graph, Stats & Traits, Inventory & Items, Playtest, RPG Export
   ============================================ */
DAL = DAL || {};

/* --- Ensure adventure exists --- */
DAL.ensureAdventure = function(proj){
  if(!proj.adventure){
    proj.adventure = DAL.defaultAdventure(proj.name);
  }
  return proj.adventure;
};

/* --- Story Graph --- */
DAL.renderStoryGraph = function(proj){
  var adv = DAL.ensureAdventure(proj);
  if(!adv.nodes) adv.nodes = [];

  var html = '<div class="canvas-toolbar">'+
    '<button class="tb-btn" data-action="sg-add-node" data-tip="Add node"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>'+
    '<button class="tb-btn" data-action="sg-connect" data-tip="'+(DAL.connectMode?'Cancel connect':'Connect mode')+'" '+(DAL.connectMode?'style="background:var(--c-accent-soft);color:var(--c-accent)"':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>'+
    '<button class="tb-btn" data-action="sg-delete-sel" data-tip="Delete selected"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>'+
    '<span class="tb-sep" style="width:1px;height:20px;background:var(--c-border);margin:0 4px"></span>'+
    '<button class="tb-btn" data-action="sg-zoom-in" data-tip="Zoom in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>'+
    '<button class="tb-btn" data-action="sg-zoom-out" data-tip="Zoom out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>'+
    '<button class="tb-btn" data-action="sg-reset" data-tip="Reset view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>'+
    '<span class="tb-sep" style="width:1px;height:20px;background:var(--c-border);margin:0 4px"></span>'+
    '<button class="tb-btn" data-action="fullscreen" data-tip="Distraction-free mode"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>'+
  '</div>';

  html += '<div class="canvas-container" id="canvasContainer" style="height:calc(var(--app-h,100dvh) - var(--topbar-h) - 52px - 40px)"><div class="canvas-inner" id="canvasInner" style="transform-origin:0 0">';
  html += '<svg class="canvas-svg" id="canvasSvg"></svg>';
  adv.nodes.forEach(function(n){
    var sel = n.id === DAL.selectedNodeId ? ' selected' : '';
    var isStart = n.id === adv.startNodeId ? ' start-node' : '';
    var preview = (n.text||'').substring(0,60);
    var choiceCount = (n.choices||[]).length;
    html += '<div class="canvas-node'+sel+isStart+'" data-action="sg-select" data-nid="'+n.id+'" style="left:'+(n.x||0)+'px;top:'+(n.y||0)+'px" data-tip="'+DAL.escapeHtml(n.title||'Untitled')+'">'+
      '<div class="canvas-node-title">'+DAL.escapeHtml(n.title||'Untitled')+'</div>'+
      '<div class="canvas-node-preview">'+DAL.escapeHtml(preview)+'</div>'+
      '<div class="canvas-node-badge">'+choiceCount+' choices</div>'+
    '</div>';
  });
  if(!adv.nodes.length){
    html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;max-width:380px;color:var(--c-text-faint);font-size:var(--ts-sm)">'+
      '<div style="margin-bottom:8px;font-size:var(--ts-lg);color:var(--c-text-muted)">Story Graph</div>'+
      '<p style="line-height:1.6">This is where you build your branching narrative. Each node is a scene the reader experiences. Connect scenes with choices to create paths through your story.</p>'+
      '<p style="margin-top:8px">Click the + button above to create your first scene.</p>'+
    '</div>';
  }
  html += '</div></div>';

  // Node detail side panel
  if(DAL.selectedNodeId){
    var node = adv.nodes.find(function(n){ return n.id === DAL.selectedNodeId; });
    if(node){
      html += '<div style="position:absolute;top:40px;right:0;width:320px;height:calc(100% - 40px);background:var(--c-surface);border-left:1px solid var(--c-border);overflow-y:auto;padding:16px;box-shadow:var(--shadow-lg);z-index:5" id="nodeDetailPanel">';
      html += DAL.renderNodeDetail(proj, adv, node);
      html += '</div>';
    }
  }

  return html;
};

DAL.renderNodeDetail = function(proj, adv, node){
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-weight:700;font-size:var(--ts-sm)">Scene Editor</div><button class="btn sm" data-action="sg-close-detail" data-tip="Close panel">&times;</button></div>';

  html += '<div class="form-group"><label class="form-label">Scene Title</label><input class="form-input" id="nodeTitle" value="'+DAL.escapeHtml(node.title||'')+'" placeholder="Scene title"></div>';
  html += '<div class="form-group"><label class="form-label">What the Reader Sees</label><textarea class="form-textarea" id="nodeText" style="min-height:100px" placeholder="Write the scene text that the reader will experience...">'+DAL.escapeHtml(node.text||'')+'</textarea></div>';

  // Scene illustrations
  html += '<div class="form-group"><label class="form-label">Scene Illustrations</label>'+
    '<p style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-bottom:4px">Add artwork that shows alongside this scene in the playthrough.</p>';
  if(node.images && node.images.length){
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">';
    node.images.forEach(function(img, si){
      html += '<div class="scene-ill-thumb">'+
        '<img src="'+img.dataUrl+'">'+
        '<button class="chapter-ill-remove" data-action="remove-scene-image" data-nid="'+node.id+'" data-img-idx="'+si+'" data-tip="Remove illustration">&times;</button>'+
        '</div>';
    });
    html += '</div>';
  }
  html += '<button class="btn sm" data-action="upload-scene-image" data-nid="'+node.id+'" data-tip="Add scene illustration">+ Add Scene Image</button>';
  html += '<input type="file" id="sceneImageInput" accept="image/*" style="display:none">';
  html += '</div>';

  // Start node
  html += '<div class="form-group"><label class="form-label">Start Node</label><div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="nodeIsStart" '+(adv.startNodeId===node.id?'checked':'')+' data-action="sg-set-start" data-nid="'+node.id+'"><label for="nodeIsStart" style="font-size:var(--ts-sm);cursor:pointer">Set as adventure start</label></div></div>';

  // What changes when the reader arrives
  html += '<div class="form-group"><label class="form-label">What Changes When Arriving</label><p style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-bottom:4px">Set up stats, traits, or items that change when the reader reaches this scene.</p><div id="entryEffectsList">';
  (node.entryEffects||[]).forEach(function(eff, i){
    html += DAL.renderEffectRow('entry', i, eff, adv);
  });
  html += '</div><button class="btn sm" data-action="sg-add-effect" data-nid="'+node.id+'" data-effect-type="entry">+ Add What Changes</button></div>';

  // Choices
  html += '<div class="form-group"><label class="form-label">Choices</label><p style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-bottom:4px">Each choice sends the reader to another scene. Add conditions to control when a choice appears.</p><div id="choicesList" style="display:flex;flex-direction:column;gap:8px">';
  (node.choices||[]).forEach(function(ch, i){
    html += '<div style="border:1px solid var(--c-border);border-radius:var(--radius);padding:8px;margin-bottom:4px">';
    html += '<input class="form-input" style="margin-bottom:4px" value="'+DAL.escapeHtml(ch.label||'')+'" data-choice-label="'+i+'" data-nid="'+node.id+'" placeholder="Choice label">';
    html += '<select class="form-select" style="margin-bottom:4px;font-size:var(--ts-xs)" data-choice-target="'+i+'" data-nid="'+node.id+'"><option value="">— Which scene does this lead to? —</option>';
    adv.nodes.forEach(function(n){ html += '<option value="'+n.id+'"'+(ch.targetNodeId===n.id?' selected':'')+'>'+DAL.escapeHtml(n.title||'Untitled')+'</option>'; });
    html += '</select>';
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-top:4px">Only show this choice if:</div><div id="choiceConds'+i+'">';
    (ch.conditions||[]).forEach(function(cond, ci){
      html += DAL.renderConditionRow(node.id, i, ci, cond, adv);
    });
    html += '</div><button class="btn sm" style="margin-top:2px" data-action="sg-add-cond" data-nid="'+node.id+'" data-choice-idx="'+i+'">+ Add Condition</button>';
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-top:4px">What changes when this choice is picked:</div><div id="choiceEffs'+i+'">';
    (ch.effects||[]).forEach(function(eff, ei){
      html += DAL.renderEffectRow('choice'+i, ei, eff, adv, node.id, i);
    });
    html += '</div><button class="btn sm" style="margin-top:2px" data-action="sg-add-choice-effect" data-nid="'+node.id+'" data-choice-idx="'+i+'">+ Add What Changes</button>';
    html += '<button class="btn sm danger" style="margin-top:4px" data-action="sg-delete-choice" data-nid="'+node.id+'" data-choice-idx="'+i+'">Delete Choice</button>';
    html += '</div>';
  });
  html += '</div><button class="btn sm" data-action="sg-add-choice" data-nid="'+node.id+'">+ Add Choice</button></div>';

  html += '<button class="btn sm danger" style="margin-top:12px" data-action="sg-delete-node" data-nid="'+node.id+'">Delete Scene</button>';
  return html;
};

DAL.renderEffectRow = function(prefix, idx, eff, adv, nid, choiceIdx){
  var type = prefix.startsWith('choice') ? 'choice' : 'entry';
  var html = '<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center">';
  html += '<select class="form-select" style="width:80px;font-size:var(--ts-xs)" data-eff-type="'+type+'" data-nid="'+(nid||'')+'" data-choice-idx="'+(choiceIdx!==undefined?choiceIdx:'')+'" data-idx="'+idx+'" data-eff-field="type">';
  ['stat','trait','inventory'].forEach(function(t){ html += '<option value="'+t+'"'+(eff.type===t?' selected':'')+'>'+t+'</option>'; });
  html += '</select>';

  if(eff.type === 'stat'){
    html += '<select class="form-select" style="flex:1;font-size:var(--ts-xs)" data-eff-field="key" data-eff-type="'+type+'" data-nid="'+(nid||'')+'" data-choice-idx="'+(choiceIdx!==undefined?choiceIdx:'')+'" data-idx="'+idx+'">';
    (adv.stats||[]).forEach(function(s){ html += '<option value="'+s.key+'"'+(eff.key===s.key?' selected':'')+'>'+DAL.escapeHtml(s.label)+'</option>'; });
    html += '</select>';
  } else if(eff.type === 'trait'){
    html += '<select class="form-select" style="flex:1;font-size:var(--ts-xs)" data-eff-field="key" data-eff-type="'+type+'" data-nid="'+(nid||'')+'" data-choice-idx="'+(choiceIdx!==undefined?choiceIdx:'')+'" data-idx="'+idx+'">';
    (adv.traits||[]).forEach(function(t){ html += '<option value="'+t.key+'"'+(eff.key===t.key?' selected':'')+'>'+DAL.escapeHtml(t.label)+'</option>'; });
    html += '</select>';
  } else {
    html += '<input class="form-input" style="flex:1;font-size:var(--ts-xs)" value="'+DAL.escapeHtml(eff.key||'')+'" data-eff-field="key" data-eff-type="'+type+'" data-nid="'+(nid||'')+'" data-choice-idx="'+(choiceIdx!==undefined?choiceIdx:'')+'" data-idx="'+idx+'" placeholder="item name">';
  }

  html += '<select class="form-select" style="width:80px;font-size:var(--ts-xs)" data-eff-field="op" data-eff-type="'+type+'" data-nid="'+(nid||'')+'" data-choice-idx="'+(choiceIdx!==undefined?choiceIdx:'')+'" data-idx="'+idx+'">';
  var ops = eff.type === 'stat' ? ['set','add','subtract'] : (eff.type === 'trait' ? ['toggle','set'] : ['give','remove']);
  ops.forEach(function(o){ html += '<option value="'+o+'"'+(eff.op===o?' selected':'')+'>'+o+'</option>'; });
  html += '</select>';

  if(eff.type === 'stat' || (eff.type === 'trait' && eff.op === 'set')){
    html += '<input class="form-input" style="width:60px;font-size:var(--ts-xs)" value="'+DAL.escapeHtml(String(eff.value||''))+'" data-eff-field="value" data-eff-type="'+type+'" data-nid="'+(nid||'')+'" data-choice-idx="'+(choiceIdx!==undefined?choiceIdx:'')+'" data-idx="'+idx+'" placeholder="val">';
  }

  html += '<button class="btn sm danger" style="width:24px;padding:0" data-action="sg-delete-effect" data-eff-type="'+type+'" data-nid="'+(nid||'')+'" data-choice-idx="'+(choiceIdx!==undefined?choiceIdx:'')+'" data-idx="'+idx+'">&times;</button>';
  html += '</div>';
  return html;
};

DAL.renderConditionRow = function(nid, choiceIdx, condIdx, cond, adv){
  var html = '<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center">';
  html += '<select class="form-select" style="width:80px;font-size:var(--ts-xs)" data-cond-field="type" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'">';
  ['stat','trait','item'].forEach(function(t){ html += '<option value="'+t+'"'+(cond.type===t?' selected':'')+'>'+t+'</option>'; });
  html += '</select>';

  if(cond.type === 'stat'){
    html += '<select class="form-select" style="flex:1;font-size:var(--ts-xs)" data-cond-field="key" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'">';
    (adv.stats||[]).forEach(function(s){ html += '<option value="'+s.key+'"'+(cond.key===s.key?' selected':'')+'>'+DAL.escapeHtml(s.label)+'</option>'; });
    html += '</select>';
    html += '<select class="form-select" style="width:50px;font-size:var(--ts-xs)" data-cond-field="op" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'">';
    ['>=','<=','>','<','==','!='].forEach(function(o){ html += '<option value="'+o+'"'+(cond.op===o?' selected':'')+'>'+o+'</option>'; });
    html += '</select>';
    html += '<input class="form-input" style="width:50px;font-size:var(--ts-xs)" value="'+DAL.escapeHtml(String(cond.value||''))+'" data-cond-field="value" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'" placeholder="val">';
  } else if(cond.type === 'trait'){
    html += '<select class="form-select" style="flex:1;font-size:var(--ts-xs)" data-cond-field="key" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'">';
    (adv.traits||[]).forEach(function(t){ html += '<option value="'+t.key+'"'+(cond.key===t.key?' selected':'')+'>'+DAL.escapeHtml(t.label)+'</option>'; });
    html += '</select>';
    html += '<select class="form-select" style="width:80px;font-size:var(--ts-xs)" data-cond-field="op" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'"><option value="active"'+(cond.op==='active'?' selected':'')+'>active</option><option value="inactive"'+(cond.op==='inactive'?' selected':'')+'>inactive</option></select>';
  } else {
    html += '<input class="form-input" style="flex:1;font-size:var(--ts-xs)" value="'+DAL.escapeHtml(cond.key||'')+'" data-cond-field="key" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'" placeholder="item name">';
    html += '<select class="form-select" style="width:80px;font-size:var(--ts-xs)" data-cond-field="op" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'"><option value="has"'+(cond.op==='has'?' selected':'')+'>has</option><option value="!has"'+(cond.op==='!has'?' selected':'')+'>!has</option><option value="count"'+(cond.op==='count'?' selected':'')+'>count >=</option></select>';
    if(cond.op === 'count') html += '<input class="form-input" style="width:40px;font-size:var(--ts-xs)" value="'+DAL.escapeHtml(String(cond.value||''))+'" data-cond-field="value" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'" placeholder="n">';
  }

  html += '<button class="btn sm danger" style="width:24px;padding:0" data-action="sg-delete-cond" data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'">&times;</button>';
  html += '</div>';
  return html;
};

/* --- Stats & Traits --- */
DAL.renderStatsTraits = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var html = '<div style="max-width:800px">';

  html += '<p style="color:var(--c-text-muted);font-size:var(--ts-sm);margin-bottom:16px;line-height:1.6">Stats are numbers that track things like Health, Gold, or Strength. Traits are yes/no flags like \"Knows Lockpicking\" or \"Has Met the King.\" Both are used to control which choices appear for the reader.</p>';

  // Stats
  html += '<div class="section-header"><div class="section-title">Stats (Numbers)</div><button class="btn primary" data-action="sg-add-stat">+ Add Stat</button></div>';
  html += '<div class="card" style="margin-bottom:20px"><table class="stats-table"><thead><tr><th>Key</th><th>Label</th><th>Type</th><th>Default</th><th></th></tr></thead><tbody>';
  (adv.stats||[]).forEach(function(s, i){
    html += '<tr><td><input value="'+DAL.escapeHtml(s.key)+'" data-stat-field="key" data-idx="'+i+'"></td>'+
      '<td><input value="'+DAL.escapeHtml(s.label)+'" data-stat-field="label" data-idx="'+i+'"></td>'+
      '<td><select data-stat-field="type" data-idx="'+i+'"><option value="number"'+(s.type==='number'?' selected':'')+'>number</option><option value="text"'+(s.type==='text'?' selected':'')+'>text</option><option value="boolean"'+(s.type==='boolean'?' selected':'')+'>boolean</option></select></td>'+
      '<td><input value="'+DAL.escapeHtml(String(s.default))+'" data-stat-field="default" data-idx="'+i+'"></td>'+
      '<td><button class="btn sm danger" data-action="sg-delete-stat" data-idx="'+i+'">&times;</button></td></tr>';
  });
  if(!adv.stats||!adv.stats.length) html += '<tr><td colspan="5" style="text-align:center;color:var(--c-text-faint)">No stats defined</td></tr>';
  html += '</tbody></table></div>';

  // Traits
  html += '<div class="section-header"><div class="section-title">Traits (Yes/No Flags)</div><button class="btn primary" data-action="sg-add-trait">+ Add Trait</button></div>';
  html += '<div class="card"><table class="stats-table"><thead><tr><th>Key</th><th>Label</th><th>Description</th><th>Default</th><th></th></tr></thead><tbody>';
  (adv.traits||[]).forEach(function(t, i){
    html += '<tr><td><input value="'+DAL.escapeHtml(t.key)+'" data-trait-field="key" data-idx="'+i+'"></td>'+
      '<td><input value="'+DAL.escapeHtml(t.label)+'" data-trait-field="label" data-idx="'+i+'"></td>'+
      '<td><input value="'+DAL.escapeHtml(t.description)+'" data-trait-field="description" data-idx="'+i+'"></td>'+
      '<td><select data-trait-field="defaultActive" data-idx="'+i+'"><option value="true"'+(t.defaultActive?' selected':'')+'>active</option><option value="false"'+(!t.defaultActive?' selected':'')+'>inactive</option></select></td>'+
      '<td><button class="btn sm danger" data-action="sg-delete-trait" data-idx="'+i+'">&times;</button></td></tr>';
  });
  if(!adv.traits||!adv.traits.length) html += '<tr><td colspan="5" style="text-align:center;color:var(--c-text-faint)">No traits defined</td></tr>';
  html += '</tbody></table></div>';

  html += '</div>';
  return html;
};

/* --- Inventory & Items --- */
DAL.renderItems = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var html = '<div style="max-width:900px">';
  html += '<p style="color:var(--c-text-muted);font-size:var(--ts-sm);margin-bottom:16px;line-height:1.6">Define the items readers can find during your story — keys, weapons, potions, treasure. Upload illustrations to show what each item looks like. Items can be checked in conditions to control which choices appear.</p>';
  html += '<div class="section-header"><div class="section-title">Items</div><button class="btn primary" data-action="sg-add-item">+ Add Item</button></div>';
  html += '<div class="card"><table class="stats-table"><thead><tr><th>Image</th><th>Name</th><th>Description</th><th>Stackable</th><th>Max Stack</th><th>Slot</th><th>Icon</th><th></th></tr></thead><tbody>';
  (adv.items||[]).forEach(function(it, i){
    html += '<tr><td><div class="item-image-cell">'+
      (it.imageDataUrl?'<img src="'+it.imageDataUrl+'" class="item-thumb">':'<div class="item-thumb-placeholder">—</div>')+
      '<div style="display:flex;flex-direction:column;gap:2px">'+
      '<button class="btn sm" style="font-size:10px;padding:2px 6px" data-action="upload-item-image" data-idx="'+i+'" data-tip="Upload item illustration">'+(it.imageDataUrl?'Change':'Upload')+'</button>'+
      (it.imageDataUrl?'<button class="btn sm danger" style="font-size:10px;padding:2px 6px" data-action="remove-item-image" data-idx="'+i+'" data-tip="Remove illustration">Remove</button>':'')+
      '</div></div></td>'+
      '<td><input value="'+DAL.escapeHtml(it.name)+'" data-item-field="name" data-idx="'+i+'"></td>'+
      '<td><input value="'+DAL.escapeHtml(it.description)+'" data-item-field="description" data-idx="'+i+'"></td>'+
      '<td><select data-item-field="stackable" data-idx="'+i+'"><option value="false"'+(!it.stackable?' selected':'')+'>No</option><option value="true"'+(it.stackable?' selected':'')+'>Yes</option></select></td>'+
      '<td><input value="'+DAL.escapeHtml(String(it.maxStack||1))+'" data-item-field="maxStack" data-idx="'+i+'" style="width:40px"></td>'+
      '<td><select data-item-field="slot" data-idx="'+i+'"><option value="none"'+(it.slot==='none'||!it.slot?' selected':'')+'>none</option><option value="head"'+(it.slot==='head'?' selected':'')+'>head</option><option value="body"'+(it.slot==='body'?' selected':'')+'>body</option><option value="weapon"'+(it.slot==='weapon'?' selected':'')+'>weapon</option><option value="accessory"'+(it.slot==='accessory'?' selected':'')+'>accessory</option></select></td>'+
      '<td><input value="'+DAL.escapeHtml(it.symbol||'')+'" data-item-field="symbol" data-idx="'+i+'" style="width:30px;text-align:center"></td>'+
      '<td><button class="btn sm danger" data-action="sg-delete-item" data-idx="'+i+'">&times;</button></td></tr>';
  });
  if(!adv.items||!adv.items.length) html += '<tr><td colspan="8" style="text-align:center;color:var(--c-text-faint)">No items defined</td></tr>';
  html += '</tbody></table></div>';
  html += '<input type="file" id="itemImageInput" accept="image/*" style="display:none">';
  html += '</div>';
  return html;
};

/* --- RPG Playtest --- */
DAL.renderPlaytest = function(proj){
  var adv = DAL.ensureAdventure(proj);
  if(!adv.nodes || !adv.nodes.length){
    return '<div class="empty-state"><h3>No Scenes Yet</h3><p>Add scenes in the Story Graph first, then come back here to play through your story.</p></div>';
  }
  if(!adv.startNodeId) adv.startNodeId = adv.nodes[0].id;

  // Initialize playtest state
  if(!DAL.playtestState){
    DAL.initPlaytest(adv);
  }

  var currentNode = adv.nodes.find(function(n){ return n.id === DAL.playtestState.currentNodeId; });
  if(!currentNode){ DAL.initPlaytest(adv); currentNode = adv.nodes.find(function(n){ return n.id === DAL.playtestState.currentNodeId; }); }

  var html = '<div class="playtest-layout'+(DAL.playtestStyle==='terminal'?' terminal-mode':'')+'" style="height:calc(var(--app-h,100dvh) - var(--topbar-h) - 52px)">';
  // Main passage area
  html += '<div class="playtest-main">';
  html += '<div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap">'+
    '<button class="btn sm" data-action="pt-restart" data-tip="Restart from beginning">Restart</button>'+
    '<button class="btn sm" data-action="pt-stepback" data-tip="Go back one step">Step Back</button>'+
    '<button class="btn sm" data-action="pt-speedrun" data-tip="Jump to any node">Speed-run</button>'+
    '<div style="margin-left:auto;display:flex;gap:4px">'+
      '<button class="btn sm" data-action="pt-style" data-tip="Toggle Book/Terminal style">'+(DAL.playtestStyle==='book'?'Terminal':'Book Page')+'</button>'+
    '</div></div>';

  html += '<div class="playtest-passage-title" style="font-family:var(--font-display);font-size:var(--ts-lg);font-weight:700;margin-bottom:12px">'+DAL.escapeHtml(currentNode.title||'')+'</div>';
  // Scene illustrations
  if(currentNode.images && currentNode.images.length){
    currentNode.images.forEach(function(img){
      html += '<div class="playtest-scene-image"><img src="'+img.dataUrl+'"></div>';
    });
  }
  html += '<div class="playtest-passage">'+DAL.escapeHtml(currentNode.text||'')+'</div>';

  // Choices
  html += '<div class="playtest-choices">';
  var visibleChoices = (currentNode.choices||[]).filter(function(ch){ return DAL.checkConditions(ch.conditions, adv); });
  var hiddenChoices = (currentNode.choices||[]).filter(function(ch){ return !DAL.checkConditions(ch.conditions, adv); });

  visibleChoices.forEach(function(ch){
    html += '<button class="playtest-choice" data-action="pt-choice" data-nid="'+currentNode.id+'" data-target="'+ch.targetNodeId+'">'+DAL.escapeHtml(ch.label||'Continue')+'</button>';
  });
  if(hiddenChoices.length){
    hiddenChoices.forEach(function(ch){
      html += '<button class="playtest-choice disabled" disabled>'+DAL.escapeHtml(ch.label||'Locked')+' (locked)</button>';
    });
  }
  if(!visibleChoices.length && !hiddenChoices.length){
    html += '<div style="color:var(--c-text-faint);font-size:var(--ts-sm)">— End of this path —</div>';
  }
  html += '</div>';

  // History trail
  if(DAL.playtestHistory && DAL.playtestHistory.length > 1){
    html += '<div style="margin-top:16px;border-top:1px solid var(--c-divider);padding-top:8px"><div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-bottom:4px">History:</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
    DAL.playtestHistory.forEach(function(nid, i){
      var n = adv.nodes.find(function(nn){ return nn.id === nid; });
      if(n) html += '<span style="font-size:var(--ts-xs);color:var(--c-text-muted)">'+(i+1)+'. '+DAL.escapeHtml(n.title)+'</span>'+(i<DAL.playtestHistory.length-1?' → ':'');
    });
    html += '</div></div>';
  }

  html += '</div>'; // end main

  // State inspector
  html += '<div class="playtest-inspector">';
  html += '<h4>Stats</h4>';
  Object.keys(DAL.playtestState.stats||{}).forEach(function(key){
    var stat = (adv.stats||[]).find(function(s){ return s.key === key; });
    html += '<div class="playtest-stat"><span>'+DAL.escapeHtml(stat?stat.label:key)+'</span><span>'+DAL.escapeHtml(String(DAL.playtestState.stats[key]))+'</span></div>';
  });
  html += '<h4>Active Traits</h4>';
  var activeTraits = Object.keys(DAL.playtestState.traits||{}).filter(function(k){ return DAL.playtestState.traits[k]; });
  if(activeTraits.length){
    activeTraits.forEach(function(key){
      var trait = (adv.traits||[]).find(function(t){ return t.key === key; });
      html += '<div class="playtest-item">'+DAL.escapeHtml(trait?trait.label:key)+'</div>';
    });
  } else {
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint)">None active</div>';
  }
  html += '<h4>Inventory</h4>';
  var inv = DAL.playtestState.inventory || {};
  var invKeys = Object.keys(inv);
  if(invKeys.length){
    invKeys.forEach(function(name){
      var itemDef = (adv.items||[]).find(function(it){ return it.name === name; });
      html += '<div class="playtest-item">'+
        (itemDef && itemDef.imageDataUrl?'<img src="'+itemDef.imageDataUrl+'" class="playtest-item-thumb">':'')+
        '<span>'+DAL.escapeHtml(inv[name].symbol||'')+' '+DAL.escapeHtml(name)+(inv[name].count>1?' ×'+inv[name].count:'')+'</span></div>';
    });
  } else {
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint)">Empty</div>';
  }
  html += '<h4>Current Node</h4><div class="playtest-stat"><span>ID</span><span>'+DAL.escapeHtml(DAL.playtestState.currentNodeId)+'</span></div>';
  html += '</div>'; // end inspector
  html += '</div>'; // end layout
  return html;
};

DAL.initPlaytest = function(adv){
  var stats = {};
  (adv.stats||[]).forEach(function(s){
    stats[s.key] = s.type === 'number' ? (parseFloat(s.default)||0) : (s.type === 'boolean' ? (s.default===true||s.default==='true') : String(s.default||''));
  });
  var traits = {};
  (adv.traits||[]).forEach(function(t){
    traits[t.key] = t.defaultActive === true || t.defaultActive === 'true';
  });
  DAL.playtestState = { stats: stats, traits: traits, inventory: {}, currentNodeId: adv.startNodeId || (adv.nodes[0]&&adv.nodes[0].id) };
  DAL.playtestHistory = [DAL.playtestState.currentNodeId];
};

DAL.checkConditions = function(conditions, adv){
  if(!conditions || !conditions.length) return true;
  return conditions.every(function(cond){
    if(cond.type === 'stat'){
      var val = DAL.playtestState.stats[cond.key];
      if(val === undefined) return false;
      switch(cond.op){
        case '>=': return parseFloat(val) >= parseFloat(cond.value);
        case '<=': return parseFloat(val) <= parseFloat(cond.value);
        case '>': return parseFloat(val) > parseFloat(cond.value);
        case '<': return parseFloat(val) < parseFloat(cond.value);
        case '==': return String(val) === String(cond.value);
        case '!=': return String(val) !== String(cond.value);
        default: return true;
      }
    } else if(cond.type === 'trait'){
      var active = DAL.playtestState.traits[cond.key];
      return cond.op === 'active' ? active : !active;
    } else if(cond.type === 'item'){
      var count = (DAL.playtestState.inventory[cond.key]||{count:0}).count;
      if(cond.op === 'has') return count > 0;
      if(cond.op === '!has') return count === 0;
      if(cond.op === 'count') return count >= parseInt(cond.value);
      return true;
    }
    return true;
  });
};

DAL.applyEffects = function(effects, adv){
  if(!effects) return;
  effects.forEach(function(eff){
    if(eff.type === 'stat'){
      if(eff.op === 'set') DAL.playtestState.stats[eff.key] = parseFloat(eff.value)||eff.value;
      else if(eff.op === 'add') DAL.playtestState.stats[eff.key] = (parseFloat(DAL.playtestState.stats[eff.key])||0) + (parseFloat(eff.value)||0);
      else if(eff.op === 'subtract') DAL.playtestState.stats[eff.key] = (parseFloat(DAL.playtestState.stats[eff.key])||0) - (parseFloat(eff.value)||0);
    } else if(eff.type === 'trait'){
      if(eff.op === 'toggle') DAL.playtestState.traits[eff.key] = !DAL.playtestState.traits[eff.key];
      else if(eff.op === 'set') DAL.playtestState.traits[eff.key] = eff.value === 'true' || eff.value === true;
    } else if(eff.type === 'inventory'){
      if(eff.op === 'give'){
        if(!DAL.playtestState.inventory[eff.key]) DAL.playtestState.inventory[eff.key] = { count: 0, symbol: '' };
        DAL.playtestState.inventory[eff.key].count++;
        var itemDef = (adv.items||[]).find(function(it){ return it.name === eff.key; });
        if(itemDef) DAL.playtestState.inventory[eff.key].symbol = itemDef.symbol || '';
      } else if(eff.op === 'remove'){
        if(DAL.playtestState.inventory[eff.key] && DAL.playtestState.inventory[eff.key].count > 0){
          DAL.playtestState.inventory[eff.key].count--;
          if(DAL.playtestState.inventory[eff.key].count <= 0) delete DAL.playtestState.inventory[eff.key];
        }
      }
    }
  });
};

/* --- RPG Export --- */
DAL.renderRPGExport = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var html = '<div style="max-width:700px"><div class="section-header"><div class="section-title">Export Your Adventure</div></div>';
  html += '<p style="color:var(--c-text-muted);font-size:var(--ts-sm);margin-bottom:16px;line-height:1.6">Export your adventure in different formats so others can play it or so you can import it into other tools.</p>';
  html += '<div class="card" style="margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">Export Formats</div><div style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="btn" data-action="export-twee" data-pid="'+proj.id+'" data-tip="Twine/Tweego compatible">Export for Twine</button>'+
    '<button class="btn" data-action="export-playable-html" data-pid="'+proj.id+'" data-tip="Self-contained HTML game">Standalone HTML</button>'+
    '<button class="btn" data-action="export-json" data-pid="'+proj.id+'" data-tip="Re-importable JSON">Export JSON</button>'+
  '</div></div>';
  html += '<div class="card"><div style="font-weight:600;margin-bottom:8px">Export a Single Scene</div><select class="form-select" id="exportNodeSelect" style="margin-bottom:8px">';
  (adv.nodes||[]).forEach(function(n){ html += '<option value="'+n.id+'">'+DAL.escapeHtml(n.title||'Untitled')+'</option>'; });
  html += '</select><button class="btn sm" data-action="export-node-text" data-pid="'+proj.id+'">Export Scene Text</button></div>';
  html += '</div>';
  return html;
};

DAL.exportTwee = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var twee = ':: StoryTitle\n'+DAL.escapeHtml(proj.name)+'\n\n';
  twee += ':: StoryData\n{"format":"SugarCube","format-version":"2.30.0"}\n\n';
  if(adv.startNodeId){
    var startNode = adv.nodes.find(function(n){ return n.id === adv.startNodeId; });
    if(startNode){
      twee += ':: Start\n'+(startNode.text||'')+'\n';
      (startNode.choices||[]).forEach(function(ch){
        twee += '[['+ch.label+'->'+DAL.sanitizeFilename(ch.targetNodeId||'')+'_node]]';
      });
      twee += '\n';
    }
  }
  adv.nodes.forEach(function(n){
    if(n.id === adv.startNodeId) return;
    twee += ':: '+DAL.sanitizeFilename(n.id)+'_node\n'+(n.text||'')+'\n';
    (n.choices||[]).forEach(function(ch){
      twee += '[['+ch.label+'->'+DAL.sanitizeFilename(ch.targetNodeId||'')+'_node]]';
    });
    twee += '\n';
  });
  return twee;
};

DAL.exportPlayableHTML = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var data = JSON.stringify({ name: proj.name, startNodeId: adv.startNodeId, nodes: adv.nodes, stats: adv.stats, traits: adv.traits, items: adv.items });
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+DAL.escapeHtml(proj.name)+'</title><style>'+
    'body{font-family:Georgia,serif;background:#1a1a2e;color:#e0e0e0;max-width:600px;margin:0 auto;padding:40px;line-height:1.8}'+
    '.passage{font-size:18px;margin-bottom:20px}.choice{display:block;padding:10px 16px;background:#16213e;border:1px solid #0f3460;border-radius:8px;cursor:pointer;color:#e0e0e0;margin-bottom:8px}.choice:hover{background:#0f3460}.choice.disabled{opacity:.4;cursor:default}'+
    '.stats{font-size:12px;color:#888;margin-top:20px;border-top:1px solid #333;padding-top:8px}'+
    '</style></head><body><div id="game"></div><script>'+
    'var DATA='+data+';var state={stats:{},traits:{},inv:{},nodeId:DATA.startNodeId||DATA.nodes[0].id};'+
    'DATA.stats.forEach(function(s){state.stats[s.key]=s.type==="number"?parseFloat(s.default)||0:s.default;});'+
    'DATA.traits.forEach(function(t){state.traits[t.key]=t.defaultActive;});'+
    'function checkCond(c){if(!c)return true;return c.every(function(cond){if(cond.type==="stat"){var v=state.stats[cond.key];switch(cond.op){case">=":return v>=parseFloat(cond.value);case"<=":return v<=parseFloat(cond.value);case">":return v>parseFloat(cond.value);case"<":return v<parseFloat(cond.value);default:return true;}}if(cond.type==="trait"){return cond.op==="active"?state.traits[cond.key]:!state.traits[cond.key];}if(cond.type==="item"){var cnt=(state.inv[cond.key]||{count:0}).count;if(cond.op==="has")return cnt>0;if(cond.op==="!has")return cnt===0;if(cond.op==="count")return cnt>=parseInt(cond.value);}return true;});}'+
    'function applyEff(effects){if(!effects)return;effects.forEach(function(eff){if(eff.type==="stat"){if(eff.op==="set")state.stats[eff.key]=parseFloat(eff.value)||eff.value;else if(eff.op==="add")state.stats[eff.key]=(parseFloat(state.stats[eff.key])||0)+(parseFloat(eff.value)||0);else if(eff.op==="subtract")state.stats[eff.key]=(parseFloat(state.stats[eff.key])||0)-(parseFloat(eff.value)||0);}else if(eff.type==="trait"){if(eff.op==="toggle")state.traits[eff.key]=!state.traits[eff.key];else if(eff.op==="set")state.traits[eff.key]=eff.value==="true";}else if(eff.type==="inventory"){if(eff.op==="give"){if(!state.inv[eff.key])state.inv[eff.key]={count:0};state.inv[eff.key].count++;}else if(eff.op==="remove"){if(state.inv[eff.key]&&state.inv[eff.key].count>0){state.inv[eff.key].count--;if(state.inv[eff.key].count<=0)delete state.inv[eff.key];}}}});}'+
    'function render(){var node=DATA.nodes.find(function(n){return n.id===state.nodeId;});if(!node)return;var html="<div class=\'passage\'>"+(node.text||"")+"</div>";var choices=(node.choices||[]);choices.forEach(function(ch){if(checkCond(ch.conditions)){html+="<div class=\'choice\' onclick=\'choose(\""+ch.targetNodeId+"\","+JSON.stringify(ch.effects)+")\'>"+(ch.label||"Continue")+"</div>";}else{html+="<div class=\'choice disabled\'>"+(ch.label||"Locked")+"</div>";}});html+="<div class=\'stats\'>";Object.keys(state.stats).forEach(function(k){html+=k+": "+state.stats[k]+" ";});html+="</div>";document.getElementById("game").innerHTML=html;}'+
    'function choose(targetId,effects){applyEff(effects);state.nodeId=targetId;applyEff((DATA.nodes.find(function(n){return n.id===targetId;})||{}).entryEffects);render();}'+
    'render();'+
    '</script></body></html>';
  return html;
};

/* --- Adventure Click Handler --- */
DAL.handleAdventureClick = function(action, el, e){
  if(action === 'sg-add-node'){
    var proj = DAL.state.projects[DAL.currentProjectId];
    var adv = DAL.ensureAdventure(proj);
    var node = { id: DAL.uid('node'), title: 'New Node', text: '', x: 300, y: 200, entryEffects: [], choices: [] };
    adv.nodes.push(node);
    if(!adv.startNodeId) adv.startNodeId = node.id;
    DAL.selectedNodeId = node.id;
    proj.updatedAt = Date.now();
    DAL.saveState(); DAL.render();
    return;
  }

  if(action === 'sg-select'){
    if(DAL.connectMode){
      if(!DAL.selectedNodeId){
        DAL.selectedNodeId = el.getAttribute('data-nid');
        DAL.toast('Select another node to connect','info');
      } else {
        var proj2 = DAL.state.projects[DAL.currentProjectId];
        var adv2 = DAL.ensureAdventure(proj2);
        var fromNode = adv2.nodes.find(function(n){ return n.id === DAL.selectedNodeId; });
        if(fromNode){
          fromNode.choices = fromNode.choices || [];
          fromNode.choices.push({ id: DAL.uid('choice'), label: 'Continue', targetNodeId: el.getAttribute('data-nid'), conditions: [], effects: [] });
        }
        DAL.connectMode = false;
        DAL.selectedNodeId = null;
        DAL.saveState(); DAL.render();
      }
    } else {
      DAL.selectedNodeId = el.getAttribute('data-nid');
      DAL.render();
    }
    return;
  }

  if(action === 'sg-connect'){
    DAL.connectMode = !DAL.connectMode;
    DAL.selectedNodeId = null;
    DAL.render();
    return;
  }

  if(action === 'sg-delete-sel'){
    var proj3 = DAL.state.projects[DAL.currentProjectId];
    var adv3 = DAL.ensureAdventure(proj3);
    if(DAL.selectedNodeId){
      adv3.nodes = adv3.nodes.filter(function(n){ return n.id !== DAL.selectedNodeId; });
      adv3.nodes.forEach(function(n){
        n.choices = (n.choices||[]).filter(function(ch){ return ch.targetNodeId !== DAL.selectedNodeId; });
      });
      if(adv3.startNodeId === DAL.selectedNodeId) adv3.startNodeId = adv3.nodes[0] ? adv3.nodes[0].id : null;
      DAL.selectedNodeId = null;
      proj3.updatedAt = Date.now();
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'sg-close-detail'){
    DAL.selectedNodeId = null;
    DAL.render();
    return;
  }

  if(action === 'sg-delete-node'){
    var proj4 = DAL.state.projects[DAL.currentProjectId];
    var adv4 = DAL.ensureAdventure(proj4);
    var nid = el.getAttribute('data-nid');
    adv4.nodes = adv4.nodes.filter(function(n){ return n.id !== nid; });
    adv4.nodes.forEach(function(n){ n.choices = (n.choices||[]).filter(function(ch){ return ch.targetNodeId !== nid; }); });
    if(adv4.startNodeId === nid) adv4.startNodeId = adv4.nodes[0] ? adv4.nodes[0].id : null;
    DAL.selectedNodeId = null;
    proj4.updatedAt = Date.now();
    DAL.saveState(); DAL.render();
    return;
  }

  if(action === 'sg-set-start'){
    var proj5 = DAL.state.projects[DAL.currentProjectId];
    var adv5 = DAL.ensureAdventure(proj5);
    adv5.startNodeId = el.checked ? el.getAttribute('data-nid') : null;
    DAL.saveState();
    return;
  }

  if(action === 'sg-add-effect'){
    var proj6 = DAL.state.projects[DAL.currentProjectId];
    var adv6 = DAL.ensureAdventure(proj6);
    var node6 = adv6.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    if(node6){
      var effType = el.getAttribute('data-effect-type');
      if(effType === 'entry'){
        node6.entryEffects = node6.entryEffects || [];
        node6.entryEffects.push({ type:'stat', key: '', op: 'add', value: 0 });
      } else {
        var chIdx = parseInt(el.getAttribute('data-choice-idx'));
        node6.choices[chIdx].effects = node6.choices[chIdx].effects || [];
        node6.choices[chIdx].effects.push({ type:'stat', key: '', op: 'add', value: 0 });
      }
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'sg-delete-effect'){
    var proj7 = DAL.state.projects[DAL.currentProjectId];
    var adv7 = DAL.ensureAdventure(proj7);
    var node7 = adv7.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    var effType = el.getAttribute('data-eff-type');
    var effIdx = parseInt(el.getAttribute('data-idx'));
    if(node7){
      if(effType === 'entry'){
        node7.entryEffects.splice(effIdx, 1);
      } else {
        var chIdx2 = parseInt(el.getAttribute('data-choice-idx'));
        node7.choices[chIdx2].effects.splice(effIdx, 1);
      }
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'sg-add-choice'){
    var proj8 = DAL.state.projects[DAL.currentProjectId];
    var adv8 = DAL.ensureAdventure(proj8);
    var node8 = adv8.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    if(node8){
      node8.choices = node8.choices || [];
      node8.choices.push({ id: DAL.uid('choice'), label: 'New Choice', targetNodeId: '', conditions: [], effects: [] });
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'sg-delete-choice'){
    var proj9 = DAL.state.projects[DAL.currentProjectId];
    var adv9 = DAL.ensureAdventure(proj9);
    var node9 = adv9.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    if(node9){
      var chIdx3 = parseInt(el.getAttribute('data-choice-idx'));
      node9.choices.splice(chIdx3, 1);
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'sg-add-cond'){
    var proj10 = DAL.state.projects[DAL.currentProjectId];
    var adv10 = DAL.ensureAdventure(proj10);
    var node10 = adv10.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    if(node10){
      var chIdx4 = parseInt(el.getAttribute('data-choice-idx'));
      node10.choices[chIdx4].conditions = node10.choices[chIdx4].conditions || [];
      node10.choices[chIdx4].conditions.push({ type: 'stat', key: '', op: '>=', value: 0 });
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'sg-delete-cond'){
    var proj11 = DAL.state.projects[DAL.currentProjectId];
    var adv11 = DAL.ensureAdventure(proj11);
    var node11 = adv11.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    if(node11){
      var chIdx5 = parseInt(el.getAttribute('data-choice-idx'));
      var condIdx = parseInt(el.getAttribute('data-cond-idx'));
      node11.choices[chIdx5].conditions.splice(condIdx, 1);
      DAL.saveState(); DAL.render();
    }
    return;
  }

  if(action === 'sg-add-choice-effect'){
    var proj12 = DAL.state.projects[DAL.currentProjectId];
    var adv12 = DAL.ensureAdventure(proj12);
    var node12 = adv12.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    if(node12){
      var chIdx6 = parseInt(el.getAttribute('data-choice-idx'));
      node12.choices[chIdx6].effects = node12.choices[chIdx6].effects || [];
      node12.choices[chIdx6].effects.push({ type:'stat', key: '', op: 'add', value: 0 });
      DAL.saveState(); DAL.render();
    }
    return;
  }

  // Stats & Traits
  if(action === 'sg-add-stat'){
    var proj13 = DAL.state.projects[DAL.currentProjectId];
    var adv13 = DAL.ensureAdventure(proj13);
    adv13.stats = adv13.stats || [];
    adv13.stats.push({ id: DAL.uid('stat'), key: 'newstat', label: 'New Stat', type: 'number', default: 0 });
    DAL.saveState(); DAL.render();
    return;
  }
  if(action === 'sg-delete-stat'){
    var proj14 = DAL.state.projects[DAL.currentProjectId];
    var adv14 = DAL.ensureAdventure(proj14);
    adv14.stats.splice(parseInt(el.getAttribute('data-idx')), 1);
    DAL.saveState(); DAL.render();
    return;
  }
  if(action === 'sg-add-trait'){
    var proj15 = DAL.state.projects[DAL.currentProjectId];
    var adv15 = DAL.ensureAdventure(proj15);
    adv15.traits = adv15.traits || [];
    adv15.traits.push({ id: DAL.uid('trait'), key: 'newtrait', label: 'New Trait', description: '', defaultActive: false });
    DAL.saveState(); DAL.render();
    return;
  }
  if(action === 'sg-delete-trait'){
    var proj16 = DAL.state.projects[DAL.currentProjectId];
    var adv16 = DAL.ensureAdventure(proj16);
    adv16.traits.splice(parseInt(el.getAttribute('data-idx')), 1);
    DAL.saveState(); DAL.render();
    return;
  }

  // Items
  if(action === 'sg-add-item'){
    var proj17 = DAL.state.projects[DAL.currentProjectId];
    var adv17 = DAL.ensureAdventure(proj17);
    adv17.items = adv17.items || [];
    adv17.items.push({ id: DAL.uid('item'), name: 'New Item', description: '', stackable: false, maxStack: 1, slot: 'none', symbol: '', imageDataUrl: '' });
    DAL.saveState(); DAL.render();
    return;
  }
  if(action === 'sg-delete-item'){
    var proj18 = DAL.state.projects[DAL.currentProjectId];
    var adv18 = DAL.ensureAdventure(proj18);
    adv18.items.splice(parseInt(el.getAttribute('data-idx')), 1);
    DAL.saveState(); DAL.render();
    return;
  }
  if(action === 'upload-item-image'){
    DAL._uploadItemIdx = el.getAttribute('data-idx');
    document.getElementById('itemImageInput').click();
    return;
  }
  if(action === 'remove-item-image'){
    var projItemRm = DAL.state.projects[DAL.currentProjectId];
    var advItemRm = DAL.ensureAdventure(projItemRm);
    var itemIdxRm = parseInt(el.getAttribute('data-idx'));
    if(advItemRm.items && advItemRm.items[itemIdxRm]){
      advItemRm.items[itemIdxRm].imageDataUrl = '';
      DAL.saveState(); DAL.render();
    }
    return;
  }
  if(action === 'upload-scene-image'){
    DAL._uploadSceneNodeId = el.getAttribute('data-nid');
    document.getElementById('sceneImageInput').click();
    return;
  }
  if(action === 'remove-scene-image'){
    var projSceneRm = DAL.state.projects[DAL.currentProjectId];
    var advSceneRm = DAL.ensureAdventure(projSceneRm);
    var nodeSceneRm = advSceneRm.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    var sceneImgIdx = parseInt(el.getAttribute('data-img-idx'));
    if(nodeSceneRm && nodeSceneRm.images){
      nodeSceneRm.images.splice(sceneImgIdx, 1);
      DAL.saveState(); DAL.render();
    }
    return;
  }

  // Playtest
  if(action === 'pt-restart'){
    var proj19 = DAL.state.projects[DAL.currentProjectId];
    var adv19 = DAL.ensureAdventure(proj19);
    DAL.initPlaytest(adv19);
    DAL.render();
    return;
  }
  if(action === 'pt-stepback'){
    if(DAL.playtestHistory && DAL.playtestHistory.length > 1){
      DAL.playtestHistory.pop();
      var prevId = DAL.playtestHistory[DAL.playtestHistory.length-1];
      if(DAL.playtestState) DAL.playtestState.currentNodeId = prevId;
      DAL.render();
    } else {
      DAL.toast('Nothing to step back to','warning');
    }
    return;
  }
  if(action === 'pt-speedrun'){
    var proj20 = DAL.state.projects[DAL.currentProjectId];
    var adv20 = DAL.ensureAdventure(proj20);
    var html = '<div class="form-group"><label class="form-label">Jump to node</label><select class="form-select" id="speedrunSelect">';
    adv20.nodes.forEach(function(n){ html += '<option value="'+n.id+'">'+DAL.escapeHtml(n.title||'Untitled')+'</option>'; });
    html += '</select></div>';
    DAL.modal('Speed-run: Jump to Node', html, { footer: '<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="pt-speedrun-go">Jump</button>' });
    return;
  }
  if(action === 'pt-speedrun-go'){
    var proj21 = DAL.state.projects[DAL.currentProjectId];
    var adv21 = DAL.ensureAdventure(proj21);
    var targetId = document.getElementById('speedrunSelect').value;
    DAL.playtestState.currentNodeId = targetId;
    DAL.playtestHistory.push(targetId);
    DAL.closeModal(); DAL.render();
    return;
  }
  if(action === 'pt-style'){
    DAL.playtestStyle = DAL.playtestStyle === 'book' ? 'terminal' : 'book';
    DAL.render();
    return;
  }
  if(action === 'pt-choice'){
    var proj22 = DAL.state.projects[DAL.currentProjectId];
    var adv22 = DAL.ensureAdventure(proj22);
    var fromNodeId = el.getAttribute('data-nid');
    var targetId = el.getAttribute('data-target');
    var fromNode = adv22.nodes.find(function(n){ return n.id === fromNodeId; });
    var choice = fromNode ? (fromNode.choices||[]).find(function(ch){ return ch.targetNodeId === targetId; }) : null;
    if(choice) DAL.applyEffects(choice.effects, adv22);
    var targetNode = adv22.nodes.find(function(n){ return n.id === targetId; });
    if(targetNode) DAL.applyEffects(targetNode.entryEffects, adv22);
    DAL.playtestState.currentNodeId = targetId;
    DAL.playtestHistory.push(targetId);
    DAL.render();
    return;
  }

  // RPG Export
  if(action === 'export-twee'){
    var proj23 = DAL.state.projects[el.getAttribute('data-pid')];
    DAL.download(DAL.sanitizeFilename(proj23.name)+'.twee', DAL.exportTwee(proj23), 'text/plain');
    DAL.toast('Twee file exported','success');
    return;
  }
  if(action === 'export-playable-html'){
    var proj24 = DAL.state.projects[el.getAttribute('data-pid')];
    DAL.download(DAL.sanitizeFilename(proj24.name)+'-game.html', DAL.exportPlayableHTML(proj24), 'text/html');
    DAL.toast('Playable HTML exported','success');
    return;
  }
  if(action === 'export-node-text'){
    var proj25 = DAL.state.projects[el.getAttribute('data-pid')];
    var adv25 = DAL.ensureAdventure(proj25);
    var nodeId = document.getElementById('exportNodeSelect').value;
    var node25 = adv25.nodes.find(function(n){ return n.id === nodeId; });
    if(node25) DAL.download(DAL.sanitizeFilename(node25.title||'node')+'.txt', node25.text||'', 'text/plain');
    DAL.toast('Node text exported','success');
    return;
  }
};

/* --- Field bindings for adventure tools --- */
document.addEventListener('input', function(e){
  var el = e.target;
  if(el.id === 'nodeTitle' || el.id === 'nodeText'){
    var proj = DAL.state.projects[DAL.currentProjectId];
    if(!proj) return;
    var adv = DAL.ensureAdventure(proj);
    var node = adv.nodes.find(function(n){ return n.id === DAL.selectedNodeId; });
    if(node){
      if(el.id === 'nodeTitle') node.title = el.value;
      else node.text = el.value;
      proj.updatedAt = Date.now();
      DAL.saveState();
    }
    return;
  }
  if(el.hasAttribute('data-stat-field')){
    var proj2 = DAL.state.projects[DAL.currentProjectId];
    var adv2 = DAL.ensureAdventure(proj2);
    var idx = parseInt(el.getAttribute('data-idx'));
    var field = el.getAttribute('data-stat-field');
    var val = el.value;
    if(field === 'default') val = adv2.stats[idx].type === 'number' ? (parseFloat(val)||0) : val;
    if(field === 'defaultActive') return; // handled by change
    adv2.stats[idx][field] = val;
    DAL.saveState();
    return;
  }
  if(el.hasAttribute('data-trait-field')){
    var proj3 = DAL.state.projects[DAL.currentProjectId];
    var adv3 = DAL.ensureAdventure(proj3);
    var idx2 = parseInt(el.getAttribute('data-idx'));
    var field2 = el.getAttribute('data-trait-field');
    adv3.traits[idx2][field2] = el.value;
    DAL.saveState();
    return;
  }
  if(el.hasAttribute('data-item-field')){
    var proj4 = DAL.state.projects[DAL.currentProjectId];
    var adv4 = DAL.ensureAdventure(proj4);
    var idx3 = parseInt(el.getAttribute('data-idx'));
    var field3 = el.getAttribute('data-item-field');
    var val3 = el.value;
    if(field3 === 'maxStack') val3 = parseInt(val3)||1;
    if(field3 === 'stackable') val3 = val3 === 'true';
    adv4.items[idx3][field3] = val3;
    DAL.saveState();
    return;
  }
  if(el.hasAttribute('data-choice-label')){
    var proj5 = DAL.state.projects[DAL.currentProjectId];
    var adv5 = DAL.ensureAdventure(proj5);
    var nid = el.getAttribute('data-nid');
    var node5 = adv5.nodes.find(function(n){ return n.id === nid; });
    if(node5){
      var cIdx = parseInt(el.getAttribute('data-choice-label'));
      node5.choices[cIdx].label = el.value;
      DAL.saveState();
    }
    return;
  }
  if(el.hasAttribute('data-eff-field')){
    var proj6 = DAL.state.projects[DAL.currentProjectId];
    var adv6 = DAL.ensureAdventure(proj6);
    var nid2 = el.getAttribute('data-nid');
    var node6 = adv6.nodes.find(function(n){ return n.id === nid2; });
    if(node6){
      var effType = el.getAttribute('data-eff-type');
      var effIdx2 = parseInt(el.getAttribute('data-idx'));
      var field4 = el.getAttribute('data-eff-field');
      var arr;
      if(effType === 'entry') arr = node6.entryEffects;
      else { var cIdx2 = parseInt(el.getAttribute('data-choice-idx')); arr = node6.choices[cIdx2].effects; }
      if(arr && arr[effIdx2]) arr[effIdx2][field4] = el.value;
      DAL.saveState();
    }
    return;
  }
  if(el.hasAttribute('data-cond-field')){
    var proj7 = DAL.state.projects[DAL.currentProjectId];
    var adv7 = DAL.ensureAdventure(proj7);
    var nid3 = el.getAttribute('data-nid');
    var node7 = adv7.nodes.find(function(n){ return n.id === nid3; });
    if(node7){
      var cIdx3 = parseInt(el.getAttribute('data-choice-idx'));
      var condIdx2 = parseInt(el.getAttribute('data-cond-idx'));
      var field5 = el.getAttribute('data-cond-field');
      if(node7.choices[cIdx3] && node7.choices[cIdx3].conditions[condIdx2]){
        node7.choices[cIdx3].conditions[condIdx2][field5] = el.value;
        DAL.saveState();
      }
    }
    return;
  }
});

/* --- Change handler for adventure tool selects --- */
document.addEventListener('change', function(e){
  var el = e.target;
  if(el.hasAttribute('data-choice-target')){
    var proj = DAL.state.projects[DAL.currentProjectId];
    var adv = DAL.ensureAdventure(proj);
    var nid = el.getAttribute('data-nid');
    var node = adv.nodes.find(function(n){ return n.id === nid; });
    if(node){
      var cIdx = parseInt(el.getAttribute('data-choice-target'));
      node.choices[cIdx].targetNodeId = el.value;
      DAL.saveState();
    }
    return;
  }
  if(el.hasAttribute('data-eff-field') && el.getAttribute('data-eff-field') === 'type'){
    // Re-render to update effect row
    DAL.saveState(); DAL.render();
    return;
  }
  if(el.hasAttribute('data-cond-field') && el.getAttribute('data-cond-field') === 'type'){
    DAL.saveState(); DAL.render();
    return;
  }
  if(el.hasAttribute('data-stat-field') && el.getAttribute('data-stat-field') === 'type'){
    DAL.saveState(); DAL.render();
    return;
  }
  if(el.hasAttribute('data-trait-field') && el.getAttribute('data-trait-field') === 'defaultActive'){
    var proj2 = DAL.state.projects[DAL.currentProjectId];
    var adv2 = DAL.ensureAdventure(proj2);
    var idx = parseInt(el.getAttribute('data-idx'));
    adv2.traits[idx].defaultActive = el.value === 'true';
    DAL.saveState();
    return;
  }
  if(el.hasAttribute('data-item-field') && (el.getAttribute('data-item-field') === 'stackable' || el.getAttribute('data-item-field') === 'slot')){
    var proj3 = DAL.state.projects[DAL.currentProjectId];
    var adv3 = DAL.ensureAdventure(proj3);
    var idx2 = parseInt(el.getAttribute('data-idx'));
    var field = el.getAttribute('data-item-field');
    if(field === 'stackable') adv3.items[idx2].stackable = el.value === 'true';
    else adv3.items[idx2].slot = el.value;
    DAL.saveState();
    return;
  }
});

/* --- Canvas interactions for story graph --- */
DAL.initCanvasInteractions = DAL.initCanvasInteractions || function(proj){
  var container = document.getElementById('canvasContainer');
  var inner = document.getElementById('canvasInner');
  var svg = document.getElementById('canvasSvg');
  if(!container || !inner) return;

  // Determine if this is a story graph or mind map
  var isStoryGraph = DAL.currentTool === 'storygraph';
  var data = isStoryGraph ? DAL.ensureAdventure(proj) : (proj.mindmap || { nodes: [], edges: [] });

  // Draw edges (choices for story graph, edges for mind map)
  if(svg){
    svg.innerHTML = '';
    if(isStoryGraph){
      // Draw choice connections
      data.nodes.forEach(function(n){
        (n.choices||[]).forEach(function(ch){
          if(!ch.targetNodeId) return;
          var to = data.nodes.find(function(nn){ return nn.id === ch.targetNodeId; });
          if(!to) return;
          var x1 = (n.x||0)+70, y1 = (n.y||0)+20;
          var x2 = (to.x||0)+70, y2 = (to.y||0)+20;
          var mx = (x1+x2)/2;
          svg.innerHTML += '<path d="M'+x1+','+y1+' Q'+mx+','+((y1+y2)/2-20)+' '+x2+','+y2+'" fill="none" stroke="var(--c-border)" stroke-width="2" marker-end="url(#arrowhead)"/>';
        });
      });
    } else {
      // Mind map edges
      (data.edges||[]).forEach(function(edge){
        var from = data.nodes.find(function(n){ return n.id === edge.from; });
        var to = data.nodes.find(function(n){ return n.id === edge.to; });
        if(!from || !to) return;
        var x1 = (from.x||0)+70, y1 = (from.y||0)+20;
        var x2 = (to.x||0)+70, y2 = (to.y||0)+20;
        var mx = (x1+x2)/2;
        svg.innerHTML += '<path d="M'+x1+','+y1+' Q'+mx+','+((y1+y2)/2-20)+' '+x2+','+y2+'" fill="none" stroke="var(--c-border)" stroke-width="2" data-action="mm-delete-edge" data-eid="'+edge.id+'" style="pointer-events:stroke;cursor:pointer"/>';
      });
    }
  }

  // Drag nodes
  var dragNode = null, dragOff = {x:0,y:0};
  container.onmousedown = function(e){
    var nodeEl = e.target.closest('.canvas-node');
    if(nodeEl && !DAL.connectMode){
      var nid = nodeEl.getAttribute('data-nid');
      dragNode = data.nodes.find(function(n){ return n.id === nid; });
      if(dragNode){
        var rect = inner.getBoundingClientRect();
        dragOff.x = e.clientX - rect.left - (dragNode.x||0);
        dragOff.y = e.clientY - rect.top - (dragNode.y||0);
        e.preventDefault();
      }
    }
  };
  container.onmousemove = function(e){
    if(dragNode){
      var rect = inner.getBoundingClientRect();
      dragNode.x = e.clientX - rect.left - dragOff.x;
      dragNode.y = e.clientY - rect.top - dragOff.y;
      var el = container.querySelector('[data-nid="'+dragNode.id+'"]');
      if(el){ el.style.left = dragNode.x+'px'; el.style.top = dragNode.y+'px'; }
      DAL._canvasDirty = true;
    }
  };
  container.onmouseup = function(){
    if(dragNode && DAL._canvasDirty){
      DAL._canvasDirty = false;
      DAL.saveState();
      // Redraw edges
      DAL.initCanvasInteractions(proj);
    }
    dragNode = null;
  };

  // Double-click to add node (mind map only)
  if(!isStoryGraph){
    container.ondblclick = function(e){
      if(e.target === container || e.target === inner || e.target === svg){
        var rect = inner.getBoundingClientRect();
        var node = { id: DAL.uid('mm'), label: 'New Idea', type: 'idea', x: e.clientX - rect.left, y: e.clientY - rect.top };
        proj.mindmap = proj.mindmap || { nodes: [], edges: [] };
        proj.mindmap.nodes.push(node);
        DAL.saveState(); DAL.render();
      }
    };
  }
};
