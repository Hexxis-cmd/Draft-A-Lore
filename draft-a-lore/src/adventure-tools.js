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
  var adv = proj.adventure;
  /* Fields added after the first release. Filled in additively so an adventure
     saved by an earlier build opens with its work intact. */
  if(!adv.stats) adv.stats = [];
  if(!adv.traits) adv.traits = [];
  if(!adv.items) adv.items = [];
  if(!adv.nodes) adv.nodes = [];
  if(!adv.rules) adv.rules = { lockedChoices: 'lock', failures: [] };
  if(!adv.rules.failures) adv.rules.failures = [];
  adv.items.forEach(function(it){ if(!it.id) it.id = DAL.uid('item'); });
  return adv;
};

/* --- Story Graph --- */
DAL.renderStoryGraph = function(proj){
  var adv = DAL.ensureAdventure(proj);
  if(!adv.nodes) adv.nodes = [];

  var html = '<div class="canvas-toolbar">'+
    '<button class="tb-btn" data-action="sg-add-node"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>'+
    '<button class="tb-btn" data-action="sg-connect" '+(DAL.connectMode?'style="background:var(--c-accent-soft);color:var(--c-accent)"':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>'+
    '<button class="tb-btn" data-action="sg-delete-sel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>'+
    '<span class="tb-sep" style="width:1px;height:20px;background:var(--c-border);margin:0 4px"></span>'+
    '<button class="tb-btn" data-action="sg-checkup" title="Story checkup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="9 11 12 14 20 6"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg></button>'+
    '<span class="tb-sep" style="width:1px;height:20px;background:var(--c-border);margin:0 4px"></span>'+
    DAL.canvasViewControls()+
    '<button class="tb-btn" data-action="fullscreen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>'+
  '</div>';

  html += '<div class="canvas-container" id="canvasContainer" style="height:calc(var(--app-h,100dvh) - var(--topbar-h) - 52px - 40px)"><div class="canvas-inner" id="canvasInner"><div class="canvas-stage" id="canvasStage">';
  html += '<svg class="canvas-svg" id="canvasSvg"></svg>';
  adv.nodes.forEach(function(n){
    var sel = n.id === DAL.selectedNodeId ? ' selected' : '';
    var isStart = n.id === adv.startNodeId ? ' start-node' : '';
    var preview = (n.text||'').substring(0,60);
    var choiceCount = (n.choices||[]).length;
    var choiceLabel = choiceCount + (choiceCount === 1 ? ' choice' : ' choices');
    html += '<div class="canvas-node'+sel+isStart+'" data-action="sg-select" data-nid="'+n.id+'" style="left:'+(n.x||0)+'px;top:'+(n.y||0)+'px">'+
      '<div class="canvas-node-title">'+DAL.escapeHtml(n.title||'Untitled')+'</div>'+
      '<div class="canvas-node-preview">'+DAL.escapeHtml(preview)+'</div>'+
      '<div class="canvas-node-badge">'+choiceLabel+'</div>'+
    '</div>';
  });
  if(!adv.nodes.length){
    html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;max-width:380px;color:var(--c-text-faint);font-size:var(--ts-sm)">'+
      '<div style="margin-bottom:8px;font-size:var(--ts-lg);color:var(--c-text-muted)">Story Graph</div>'+
      '<p style="line-height:1.6">This is where you build your branching narrative. Each node is a scene the reader experiences. Connect scenes with choices to create paths through your story.</p>'+
      '<p style="margin-top:8px">Click the + button above to create your first scene.</p>'+
    '</div>';
  }
  html += '</div></div></div>';

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
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-weight:700;font-size:var(--ts-sm)">Scene Editor</div><button class="btn sm" data-action="sg-close-detail">&times;</button></div>';

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
        '<button class="chapter-ill-remove" data-action="remove-scene-image" data-nid="'+node.id+'" data-img-idx="'+si+'">&times;</button>'+
        '</div>';
    });
    html += '</div>';
  }
  html += '<button class="btn sm" data-action="upload-scene-image" data-nid="'+node.id+'">+ Add Scene Image</button>';
  html += '<input type="file" id="sceneImageInput" accept="image/*" style="display:none">';
  html += '</div>';

  // Start node
  html += '<div class="form-group"><label class="form-label">Start Node</label><div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="nodeIsStart" '+(adv.startNodeId===node.id?'checked':'')+' data-action="sg-set-start" data-nid="'+node.id+'"><label for="nodeIsStart" style="font-size:var(--ts-sm);cursor:pointer">Set as adventure start</label></div></div>';

  // Ending scenes
  html += '<div class="form-group"><label class="form-label">Scene Kind '+DAL.infoIcon('A normal scene carries on through its choices. An ending scene closes the run the moment the reader arrives, and the closing screen shows the ending name you give it — useful for tracking which endings a reader has found.')+'</label>'+
    '<select class="form-select" data-node-field="kind" data-nid="'+node.id+'">'+
      '<option value="normal"'+(node.kind!=='ending'?' selected':'')+'>Normal scene</option>'+
      '<option value="ending"'+(node.kind==='ending'?' selected':'')+'>Ending — the run stops here</option>'+
    '</select>';
  if(node.kind === 'ending'){
    html += '<input class="form-input" style="margin-top:4px" value="'+DAL.escapeHtml(node.endingLabel||'')+'" data-node-field="endingLabel" data-nid="'+node.id+'" placeholder="Ending name, e.g. Crowned in Bone">';
  }
  html += '</div>';

  // What changes when the reader arrives
  html += '<div class="form-group"><label class="form-label">What Changes When Arriving</label><p style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-bottom:4px">Set up stats, traits, or items that change when the reader reaches this scene.</p><div id="entryEffectsList">';
  (node.entryEffects||[]).forEach(function(eff, i){
    html += DAL.renderEffectRow('entry', i, eff, adv);
  });
  html += '</div><button class="btn sm" data-action="sg-add-effect" data-nid="'+node.id+'" data-effect-type="entry">+ Add What Changes</button>';
  var entrySummary = DAL.describeEffectList(node.entryEffects, adv);
  if(entrySummary) html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:4px;font-style:italic">On arrival: '+DAL.escapeHtml(entrySummary)+'</div>';
  html += '</div>';

  // Choices
  html += '<div class="form-group"><label class="form-label">Choices '+DAL.infoIcon('A choice is a button the reader can tap to leave the current scene. Conditions (optional) hide a choice until the reader meets a requirement, e.g. a stat is high enough or a trait is set. Effects change the story state when the choice is picked — set a flag, raise a stat, give or take an item.')+'</label><p style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-bottom:4px">Each choice sends the reader to another scene. Add conditions to control when a choice appears.</p><div id="choicesList" style="display:flex;flex-direction:column;gap:8px">';
  (node.choices||[]).forEach(function(ch, i){
    html += '<div style="border:1px solid var(--c-border);border-radius:var(--radius);padding:8px;margin-bottom:4px">';
    html += '<input class="form-input" style="margin-bottom:4px" value="'+DAL.escapeHtml(ch.label||'')+'" data-choice-label="'+i+'" data-nid="'+node.id+'" placeholder="Choice label">';
    html += '<select class="form-select" style="margin-bottom:4px;font-size:var(--ts-xs)" data-choice-target="'+i+'" data-nid="'+node.id+'"><option value="">— Which scene does this lead to? —</option>';
    adv.nodes.forEach(function(n){ html += '<option value="'+n.id+'"'+(ch.targetNodeId===n.id?' selected':'')+'>'+DAL.escapeHtml(n.title||'Untitled')+'</option>'; });
    html += '</select>';
    var condCount = (ch.conditions||[]).length;
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-top:4px">Only show this choice if:</div><div id="choiceConds'+i+'">';
    (ch.conditions||[]).forEach(function(cond, ci){
      html += DAL.renderConditionRow(node.id, i, ci, cond, adv);
    });
    html += '</div><button class="btn sm" style="margin-top:2px" data-action="sg-add-cond" data-nid="'+node.id+'" data-choice-idx="'+i+'">+ Add Condition</button>';
    if(condCount > 1){
      html += ' <select class="form-select" style="width:auto;display:inline-block;font-size:var(--ts-xs)" data-choice-field="condLogic" data-nid="'+node.id+'" data-choice-idx="'+i+'">'+
        '<option value="all"'+(ch.condLogic!=='any'?' selected':'')+'>reader must meet all of them</option>'+
        '<option value="any"'+(ch.condLogic==='any'?' selected':'')+'>any one of them is enough</option></select>';
    }
    if(condCount){
      html += ' <select class="form-select" style="width:auto;display:inline-block;font-size:var(--ts-xs)" data-choice-field="whenLocked" data-nid="'+node.id+'" data-choice-idx="'+i+'">'+
        '<option value="inherit"'+(!ch.whenLocked||ch.whenLocked==='inherit'?' selected':'')+'>when unmet: follow story setting</option>'+
        '<option value="lock"'+(ch.whenLocked==='lock'?' selected':'')+'>when unmet: show it locked</option>'+
        '<option value="hide"'+(ch.whenLocked==='hide'?' selected':'')+'>when unmet: hide it</option></select>';
      html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:4px;font-style:italic">'+DAL.escapeHtml(DAL.describeChoiceGate(ch, adv))+'</div>';
    }
    html += '<div style="font-size:var(--ts-xs);color:var(--c-text-muted);margin-top:4px">What changes when this choice is picked:</div><div id="choiceEffs'+i+'">';
    (ch.effects||[]).forEach(function(eff, ei){
      html += DAL.renderEffectRow('choice'+i, ei, eff, adv, node.id, i);
    });
    html += '</div><button class="btn sm" style="margin-top:2px" data-action="sg-add-choice-effect" data-nid="'+node.id+'" data-choice-idx="'+i+'">+ Add What Changes</button>';
    var effSummary = DAL.describeEffectList(ch.effects, adv);
    if(effSummary) html += '<div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-top:4px;font-style:italic">'+DAL.escapeHtml(effSummary.charAt(0).toUpperCase()+effSummary.slice(1))+'</div>';
    html += '<button class="btn sm danger" style="margin-top:4px" data-action="sg-delete-choice" data-nid="'+node.id+'" data-choice-idx="'+i+'">Delete Choice</button>';
    html += '</div>';
  });
  html += '</div><button class="btn sm" data-action="sg-add-choice" data-nid="'+node.id+'">+ Add Choice</button></div>';

  html += '<button class="btn sm danger" style="margin-top:12px" data-action="sg-delete-node" data-nid="'+node.id+'">Delete Scene</button>';
  return html;
};

DAL.EFFECT_TYPES = [
  { value: 'stat', label: 'Stat' },
  { value: 'trait', label: 'Trait' },
  { value: 'inventory', label: 'Item' },
  { value: 'equip', label: 'Equipment' },
  { value: 'flag', label: 'Flag' },
  { value: 'goto', label: 'Send to' },
  { value: 'end', label: 'End story' }
];

DAL.EFFECT_OPS = {
  stat: [{ value: 'add', label: 'goes up by' }, { value: 'subtract', label: 'goes down by' }, { value: 'set', label: 'becomes' }],
  trait: [{ value: 'grant', label: 'is set' }, { value: 'remove', label: 'is cleared' }, { value: 'toggle', label: 'flips' }, { value: 'set', label: 'is set to' }],
  inventory: [{ value: 'give', label: 'is gained' }, { value: 'remove', label: 'is lost' }],
  equip: [{ value: 'equip', label: 'is equipped' }, { value: 'unequip', label: 'is put away' }],
  flag: [{ value: 'set', label: 'is set' }, { value: 'clear', label: 'is cleared' }],
  goto: [{ value: 'redirect', label: 'straight away' }],
  end: [{ value: 'ending', label: 'as an ending' }, { value: 'failure', label: 'as a failure' }]
};

DAL.effectDefaults = function(type){
  var ops = DAL.EFFECT_OPS[type] || DAL.EFFECT_OPS.stat;
  var eff = { type: type, key: '', op: ops[0].value, value: '' };
  if(type === 'stat') eff.value = 1;
  if(type === 'inventory') eff.value = 1;
  return eff;
};

/* Which effect shapes still need a typed value beside key and operator. */
DAL.effNeedsValue = function(eff){
  if(eff.type === 'stat') return true;
  if(eff.type === 'inventory') return true;
  if(eff.type === 'trait') return eff.op === 'set';
  if(eff.type === 'end') return true;
  return false;
};

DAL.renderEffectRow = function(prefix, idx, eff, adv, nid, choiceIdx){
  var type = prefix.indexOf('choice') === 0 ? 'choice' : 'entry';
  var lists = DAL.rpgPickLists(adv);
  var kind = eff.type || 'stat';
  var attrs = ' data-eff-type="'+type+'" data-nid="'+(nid||'')+'" data-choice-idx="'+(choiceIdx!==undefined?choiceIdx:'')+'" data-idx="'+idx+'"';
  function sel(field, opts, current, width, placeholder){
    return '<select class="form-select" style="'+width+';font-size:var(--ts-xs)" data-eff-field="'+field+'"'+attrs+'>'+
      DAL.rpgOptions(opts, current, placeholder)+'</select>';
  }
  var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;align-items:center">';
  html += sel('type', DAL.EFFECT_TYPES, kind, 'flex:1 1 42%;min-width:104px');

  if(kind === 'flag'){
    var listId = 'effflags_'+(nid||'x')+'_'+prefix+'_'+idx;
    html += '<input class="form-input" style="flex:1 1 42%;min-width:104px;font-size:var(--ts-xs)" list="'+listId+'" value="'+DAL.escapeHtml(eff.key||'')+'" data-eff-field="key"'+attrs+' placeholder="flag name">';
    html += '<datalist id="'+listId+'">';
    lists.flags.forEach(function(f){ html += '<option value="'+DAL.escapeHtml(f.value)+'"></option>'; });
    html += '</datalist>';
  } else if(kind === 'end'){
    /* An ending needs a label, not a reference to anything else. */
    html += '<input class="form-input" style="flex:1 1 42%;min-width:104px;font-size:var(--ts-xs)" value="'+DAL.escapeHtml(eff.key||'')+'" data-eff-field="key"'+attrs+' placeholder="ending name">';
  } else {
    var keyList = kind === 'stat' ? lists.stats : kind === 'trait' ? lists.traits :
      (kind === 'inventory' || kind === 'equip') ? lists.items : lists.nodes;
    var hint = kind === 'goto' ? '— which scene? —' : '— pick one —';
    html += sel('key', keyList, eff.key, 'flex:1 1 42%;min-width:104px', hint);
  }

  html += sel('op', DAL.EFFECT_OPS[kind] || DAL.EFFECT_OPS.stat, eff.op, 'flex:1 1 52%;min-width:126px');

  if(DAL.effNeedsValue(eff)){
    var v = (eff.value === undefined || eff.value === null) ? '' : eff.value;
    var ph = kind === 'inventory' ? 'qty' : (kind === 'end' ? 'message' : 'value');
    var w = kind === 'end' ? 'flex:1 1 60%;min-width:120px' : 'width:58px';
    html += '<input class="form-input" style="'+w+';font-size:var(--ts-xs)" value="'+DAL.escapeHtml(String(v))+'" data-eff-field="value"'+attrs+' placeholder="'+ph+'">';
  }

  html += '<button class="btn sm danger" style="width:24px;padding:0" data-action="sg-delete-effect"'+attrs+'>&times;</button>';
  html += '</div>';
  return html;
};

/* Plain sentence for a list of effects, used under the editor rows and in the
   playthrough change log. */
DAL.describeEffectList = function(effects, adv){
  var list = (effects||[]).filter(function(e){ return e && e.type; });
  if(!list.length) return '';
  return list.map(function(e){ return DAL.rpg.describeEffect(e, adv); }).join(', then ') + '.';
};

/* Option list for a picker. A stored value that matches nothing stays selected
   and is marked "missing" — renaming or deleting a stat must never silently
   repoint a condition at whatever happens to sit first in the list. */
DAL.rpgOptions = function(opts, current, placeholder){
  var html = '', found = false, cur = (current === undefined || current === null) ? '' : String(current);
  if(placeholder) html += '<option value=""'+(cur===''?' selected':'')+'>'+DAL.escapeHtml(placeholder)+'</option>';
  opts.forEach(function(o){
    if(o.value === cur) found = true;
    html += '<option value="'+DAL.escapeHtml(o.value)+'"'+(o.value===cur?' selected':'')+'>'+DAL.escapeHtml(o.label)+'</option>';
  });
  if(cur !== '' && !found) html += '<option value="'+DAL.escapeHtml(cur)+'" selected>'+DAL.escapeHtml(cur)+' — missing</option>';
  return html;
};

/* Every picker list the condition and effect rows draw from. Slots are inferred
   from the items that actually use them, so the list stays honest. */
DAL.rpgPickLists = function(adv){
  var lists = { stats: [], numStats: [], traits: [], items: [], nodes: [], slots: [], flags: [] };
  (adv.stats||[]).forEach(function(s){
    var row = { value: s.key, label: s.label || s.key };
    lists.stats.push(row);
    if((s.type||'number') === 'number') lists.numStats.push(row);
  });
  (adv.traits||[]).forEach(function(t){ lists.traits.push({ value: t.key, label: t.label || t.key }); });
  (adv.items||[]).forEach(function(it){ lists.items.push({ value: it.id || it.name, label: it.name || 'Untitled item' }); });
  (adv.nodes||[]).forEach(function(n){ lists.nodes.push({ value: n.id, label: n.title || 'Untitled scene' }); });
  var seen = {};
  (adv.items||[]).forEach(function(it){
    var s = it.slot || 'none';
    if(s === 'none' || seen[s]) return;
    seen[s] = 1;
    lists.slots.push({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) });
  });
  DAL.rpg.flagKeys(adv).forEach(function(f){ lists.flags.push({ value: f, label: f }); });
  return lists;
};

DAL.CONDITION_TYPES = [
  { value: 'stat', label: 'Stat' },
  { value: 'trait', label: 'Trait' },
  { value: 'item', label: 'Item held' },
  { value: 'equipped', label: 'Equipped' },
  { value: 'slot', label: 'Gear slot' },
  { value: 'flag', label: 'Flag' },
  { value: 'visited', label: 'Visited' }
];

DAL.CONDITION_OPS = {
  stat: [{ value: '>=', label: 'is at least' }, { value: '<=', label: 'is at most' },
         { value: '>', label: 'is more than' }, { value: '<', label: 'is less than' },
         { value: '==', label: 'equals' }, { value: '!=', label: 'does not equal' }],
  trait: [{ value: 'active', label: 'is set' }, { value: 'inactive', label: 'is not set' }],
  item: [{ value: 'has', label: 'is carried' }, { value: '!has', label: 'is not carried' },
         { value: 'count', label: 'count is at least' }, { value: 'countLte', label: 'count is at most' }],
  equipped: [{ value: 'is', label: 'is equipped' }, { value: 'isNot', label: 'is not equipped' }],
  slot: [{ value: 'filled', label: 'has something in it' }, { value: 'empty', label: 'is empty' }],
  flag: [{ value: 'set', label: 'is set' }, { value: 'unset', label: 'is not set' }],
  visited: [{ value: 'yes', label: 'has been visited' }, { value: 'no', label: 'has not been visited' }]
};

/* The sensible starting shape for a freshly switched condition type, so the
   stored operator always belongs to the chosen type. */
DAL.conditionDefaults = function(type){
  var ops = DAL.CONDITION_OPS[type] || DAL.CONDITION_OPS.stat;
  return { type: type, key: '', op: ops[0].value, value: type === 'stat' ? 0 : '' };
};

/* Which condition types still need a typed value beside key and operator. */
DAL.condNeedsValue = function(cond){
  if(cond.type === 'stat') return true;
  return cond.type === 'item' && (cond.op === 'count' || cond.op === 'countLte');
};

DAL.renderConditionRow = function(nid, choiceIdx, condIdx, cond, adv){
  var lists = DAL.rpgPickLists(adv);
  var type = cond.type || 'stat';
  var attrs = ' data-nid="'+nid+'" data-choice-idx="'+choiceIdx+'" data-cond-idx="'+condIdx+'"';
  function sel(field, opts, current, width, placeholder){
    return '<select class="form-select" style="'+width+';font-size:var(--ts-xs)" data-cond-field="'+field+'"'+attrs+'>'+
      DAL.rpgOptions(opts, current, placeholder)+'</select>';
  }
  var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;align-items:center">';
  html += sel('type', DAL.CONDITION_TYPES, type, 'flex:1 1 42%;min-width:104px');

  var keyList = type === 'stat' ? lists.stats :
    type === 'trait' ? lists.traits :
    (type === 'item' || type === 'equipped') ? lists.items :
    type === 'slot' ? lists.slots :
    type === 'visited' ? lists.nodes : lists.flags;
  var keyHint = type === 'slot' ? '— which slot? —' : (type === 'visited' ? '— which scene? —' : '— pick one —');

  if(type === 'flag'){
    /* Flags are declared by being used rather than in a table, so known flags
       are offered as suggestions without blocking a brand new name. */
    var listId = 'flags_'+nid+'_'+choiceIdx+'_'+condIdx;
    html += '<input class="form-input" style="flex:1;min-width:104px;font-size:var(--ts-xs)" list="'+listId+'" value="'+DAL.escapeHtml(cond.key||'')+'" data-cond-field="key"'+attrs+' placeholder="flag name">';
    html += '<datalist id="'+listId+'">';
    lists.flags.forEach(function(f){ html += '<option value="'+DAL.escapeHtml(f.value)+'"></option>'; });
    html += '</datalist>';
  } else {
    html += sel('key', keyList, cond.key, 'flex:1 1 42%;min-width:104px', keyHint);
  }

  html += sel('op', DAL.CONDITION_OPS[type] || DAL.CONDITION_OPS.stat, cond.op, 'flex:1 1 52%;min-width:126px');

  if(DAL.condNeedsValue(cond)){
    var v = (cond.value === undefined || cond.value === null) ? '' : cond.value;
    html += '<input class="form-input" style="width:58px;font-size:var(--ts-xs)" value="'+DAL.escapeHtml(String(v))+'" data-cond-field="value"'+attrs+' placeholder="value">';
  }

  html += '<button class="btn sm danger" style="width:24px;padding:0" data-action="sg-delete-cond"'+attrs+'>&times;</button>';
  html += '</div>';
  return html;
};

/* One plain sentence for the whole gate, so an author can read a choice's
   requirements without decoding the rows above it. */
DAL.describeChoiceGate = function(ch, adv){
  var conds = (ch.conditions||[]).filter(function(c){ return c && c.type; });
  if(!conds.length) return 'Always shown.';
  var joiner = (ch.condLogic === 'any') ? ' or ' : ' and ';
  var parts = conds.map(function(c){ return DAL.rpg.describeCondition(c, adv); });
  return 'Shown when ' + parts.join(joiner) + '.';
};

/* --- Stats & Traits --- */
DAL.renderStatsTraits = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var html = '<div style="max-width:800px">';

  html += '<p style="color:var(--c-text-muted);font-size:var(--ts-sm);margin-bottom:16px;line-height:1.6">Stats are numbers that track things like Health, Gold, or Strength. Traits are yes/no flags like \"Knows Lockpicking\" or \"Has Met the King.\" Both are used to control which choices appear for the reader.</p>';

  // Stats
  html += '<div class="section-header"><div class="section-title">Stats (Numbers) '+DAL.infoIcon('Stats are numeric values like Health, Gold or Charisma. Use them in conditions (e.g. only show a choice if Health > 5) and change them with effects when a choice is picked.')+'</div><button class="btn primary" data-action="sg-add-stat">+ Add Stat</button></div>';
  html += '<div class="card" style="margin-bottom:20px"><table class="stats-table"><thead><tr><th>Key</th><th>Label</th><th>Type</th><th>Default</th><th>Min '+DAL.infoIcon('The lowest this stat can go. Any change that would drop below it stops here instead, so Health cannot fall past zero and gold cannot go negative. Leave blank for no floor.')+'</th><th>Max '+DAL.infoIcon('The highest this stat can go. Healing past a full Health bar stops at the maximum. A maximum also gives the playthrough panel a bar to draw. Leave blank for no ceiling.')+'</th><th></th></tr></thead><tbody>';
  (adv.stats||[]).forEach(function(s, i){
    var numeric = (s.type||'number') === 'number';
    html += '<tr><td><input value="'+DAL.escapeHtml(s.key)+'" data-stat-field="key" data-idx="'+i+'"></td>'+
      '<td><input value="'+DAL.escapeHtml(s.label)+'" data-stat-field="label" data-idx="'+i+'"></td>'+
      '<td><select data-stat-field="type" data-idx="'+i+'"><option value="number"'+(s.type==='number'?' selected':'')+'>number</option><option value="text"'+(s.type==='text'?' selected':'')+'>text</option><option value="boolean"'+(s.type==='boolean'?' selected':'')+'>boolean</option></select></td>'+
      '<td><input value="'+DAL.escapeHtml(String(s.default))+'" data-stat-field="default" data-idx="'+i+'"></td>'+
      '<td>'+(numeric?'<input value="'+DAL.escapeHtml(s.min===undefined||s.min===null?'':String(s.min))+'" data-stat-field="min" data-idx="'+i+'" style="width:56px" placeholder="none">':'<span style="color:var(--c-text-faint)">—</span>')+'</td>'+
      '<td>'+(numeric?'<input value="'+DAL.escapeHtml(s.max===undefined||s.max===null?'':String(s.max))+'" data-stat-field="max" data-idx="'+i+'" style="width:56px" placeholder="none">':'<span style="color:var(--c-text-faint)">—</span>')+'</td>'+
      '<td><button class="btn sm danger" data-action="sg-delete-stat" data-idx="'+i+'">&times;</button></td></tr>';
  });
  if(!adv.stats||!adv.stats.length) html += '<tr><td colspan="7" style="text-align:center;color:var(--c-text-faint)">No stats defined</td></tr>';
  html += '</tbody></table></div>';

  // Traits
  html += '<div class="section-header"><div class="section-title">Traits (Yes/No Flags) '+DAL.infoIcon('Traits are simple on/off flags — e.g. “met the king”, “has sword”, “trusted by rebels”. They cost nothing to track and are perfect for branching conditions: show a choice only when a trait is set.')+'</div><button class="btn primary" data-action="sg-add-trait">+ Add Trait</button></div>';
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

  html += '<div style="margin-top:24px">'+DAL.renderFailureRules(adv)+'</div>';

  html += '</div>';
  return html;
};

/* The checkup is a modal rather than a tab: the tool strip is already full at
   phone width, and this is something an author opens, reads and closes. */
DAL.renderCheckup = function(adv){
  var report = DAL.rpg.audit(adv);
  if(report.ok){
    return '<p style="font-size:var(--ts-sm);color:var(--c-text-muted);line-height:1.6">Nothing to fix. Every scene can be reached, every choice leads somewhere, and every requirement names something that still exists.</p>';
  }
  var html = '<p style="font-size:var(--ts-sm);color:var(--c-text-muted);margin-bottom:12px;line-height:1.6">'+
    report.problems + (report.problems === 1 ? ' problem' : ' problems') + ' and ' +
    report.warnings + (report.warnings === 1 ? ' thing worth a look' : ' things worth a look') +
    '. Problems stop a reader; the rest are choices only you can make.</p>';
  ['problem','warning'].forEach(function(level){
    var rows = report.issues.filter(function(i){ return i.level === level; });
    if(!rows.length) return;
    html += '<div class="checkup-head">'+(level === 'problem' ? 'Problems' : 'Worth a look')+'</div>';
    rows.forEach(function(i){
      html += '<div class="checkup-row '+level+'">'+
        '<div class="checkup-scope">'+DAL.escapeHtml(i.scope)+'</div>'+
        '<div class="checkup-text">'+DAL.escapeHtml(i.text)+'</div>'+
        (i.nodeId ? '<button class="btn sm" data-action="checkup-goto" data-nid="'+DAL.escapeHtml(i.nodeId)+'">Open scene</button>' : '')+
      '</div>';
    });
  });
  return html;
};

DAL.openCheckup = function(){
  var proj = DAL.state.projects[DAL.currentProjectId];
  var adv = DAL.ensureAdventure(proj);
  DAL.modal('Story Checkup', DAL.renderCheckup(adv), { wide: true });
};

/* Rules that end a run on their own, without the author wiring an ending
   scene into every dangerous branch. */
/* Failure rules and scene kind are edited from both typed inputs and selects,
   so both handlers funnel through here. */
DAL.applyFailureField = function(el){
  var proj = DAL.state.projects[DAL.currentProjectId];
  var adv = DAL.ensureAdventure(proj);
  var rule = adv.rules.failures[parseInt(el.getAttribute('data-idx'))];
  if(!rule) return false;
  var field = el.getAttribute('data-failure-field');
  rule[field] = field === 'value' ? (parseFloat(el.value) || 0) : el.value;
  DAL.saveState();
  return true;
};

DAL.applyNodeField = function(el){
  var proj = DAL.state.projects[DAL.currentProjectId];
  var adv = DAL.ensureAdventure(proj);
  var node = DAL.rpg.nodeById(adv, el.getAttribute('data-nid'));
  if(!node) return false;
  node[el.getAttribute('data-node-field')] = el.value;
  DAL.saveState();
  return true;
};

DAL.renderFailureRules = function(adv){
  var numStats = (adv.stats||[]).filter(function(s){ return (s.type||'number') === 'number'; });
  var rules = DAL.rpg.rules(adv).failures;
  var html = '<div class="section-header"><div class="section-title">Run-Ending Rules '+DAL.infoIcon('A run-ending rule watches one stat and stops the story the moment it crosses a line — Health dropping to zero, or a Suspicion meter filling up. The reader sees the title and the closing line you write here.')+'</div><button class="btn primary" data-action="sg-add-failure"'+(numStats.length?'':' disabled')+'>+ Add Rule</button></div>';
  html += '<div class="card" style="margin-bottom:20px">';
  if(!numStats.length){
    html += '<div style="padding:12px;color:var(--c-text-faint);font-size:var(--ts-sm)">Add a number stat first, then a rule can watch it.</div>';
  } else {
    html += '<table class="stats-table"><thead><tr><th>Stat</th><th>When it</th><th>Value</th><th>Title</th><th>Closing Line</th><th></th></tr></thead><tbody>';
    rules.forEach(function(r, i){
      html += '<tr><td><select data-failure-field="statKey" data-idx="'+i+'">'+
        DAL.rpgOptions(numStats.map(function(s){ return { value: s.key, label: s.label || s.key }; }), r.statKey, '— pick a stat —')+'</select></td>'+
        '<td><select data-failure-field="op" data-idx="'+i+'">'+
        DAL.rpgOptions(DAL.FAILURE_OPS, r.op || '<=')+'</select></td>'+
        '<td><input value="'+DAL.escapeHtml(String(r.value === undefined ? 0 : r.value))+'" data-failure-field="value" data-idx="'+i+'" style="width:56px" inputmode="numeric"></td>'+
        '<td><input value="'+DAL.escapeHtml(r.label||'')+'" data-failure-field="label" data-idx="'+i+'" placeholder="Bled dry"></td>'+
        '<td><input value="'+DAL.escapeHtml(r.message||'')+'" data-failure-field="message" data-idx="'+i+'" placeholder="The hall goes quiet around you."></td>'+
        '<td><button class="btn sm danger" data-action="sg-delete-failure" data-idx="'+i+'">&times;</button></td></tr>';
      html += '<tr><td colspan="6" style="padding-top:0;font-size:var(--ts-xs);color:var(--c-text-faint);font-style:italic">'+
        (r.statKey && DAL.rpg.statDef(adv, r.statKey) ? 'The run ends when '+DAL.escapeHtml(DAL.rpg.describeFailure(r, adv))+'.' : 'This rule watches a stat that no longer exists, so it never fires.')+'</td></tr>';
    });
    if(!rules.length) html += '<tr><td colspan="6" style="text-align:center;color:var(--c-text-faint)">No run-ending rules — only ending scenes finish a run</td></tr>';
    html += '</tbody></table>';
  }
  html += '</div>';
  return html;
};

DAL.FAILURE_OPS = [
  { value: '<=', label: 'drops to or below' },
  { value: '<', label: 'falls below' },
  { value: '>=', label: 'reaches or passes' },
  { value: '>', label: 'goes above' },
  { value: '==', label: 'equals' },
  { value: '!=', label: 'is anything but' }
];


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
      '<button class="btn sm" style="font-size:10px;padding:2px 6px" data-action="upload-item-image" data-idx="'+i+'">'+(it.imageDataUrl?'Change':'Upload')+'</button>'+
      (it.imageDataUrl?'<button class="btn sm danger" style="font-size:10px;padding:2px 6px" data-action="remove-item-image" data-idx="'+i+'">Remove</button>':'')+
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

  var currentNode = DAL.rpg.currentNode(DAL.playtestState, adv);
  if(!currentNode){ DAL.initPlaytest(adv); currentNode = DAL.rpg.currentNode(DAL.playtestState, adv); }

  var html = '<div class="playtest-layout'+(DAL.playtestStyle==='terminal'?' terminal-mode':'')+'" style="height:calc(var(--app-h,100dvh) - var(--topbar-h) - 52px)">';
  // Main passage area
  html += '<div class="playtest-main">';
  html += '<div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap">'+
    '<button class="btn sm" data-action="pt-restart">Restart</button>'+
    '<button class="btn sm" data-action="pt-stepback">Step Back</button>'+
    '<button class="btn sm" data-action="pt-speedrun">Speed-run</button>'+
    '<div style="margin-left:auto;display:flex;gap:4px;align-items:center">'+
      /* The story-wide answer to "what does an unmet choice look like?", set
         where the author can see the result immediately. */
      '<select class="form-select" style="width:auto;font-size:var(--ts-xs)" data-adv-rule="lockedChoices" title="What readers see when they do not meet a choice\'s requirements">'+
        '<option value="lock"'+(DAL.rpg.rules(adv).lockedChoices!=='hide'?' selected':'')+'>Unmet choices: show locked</option>'+
        '<option value="hide"'+(DAL.rpg.rules(adv).lockedChoices==='hide'?' selected':'')+'>Unmet choices: hide</option>'+
      '</select>'+
      '<button class="btn sm" data-action="pt-style">'+(DAL.playtestStyle==='book'?'Terminal':'Book Page')+'</button>'+
    '</div></div>';

  html += '<div class="playtest-passage-title" style="font-family:var(--font-display);font-size:var(--ts-lg);font-weight:700;margin-bottom:12px">'+DAL.escapeHtml(currentNode.title||'')+'</div>';
  // Scene illustrations
  if(currentNode.images && currentNode.images.length){
    currentNode.images.forEach(function(img){
      html += '<div class="playtest-scene-image"><img src="'+img.dataUrl+'"></div>';
    });
  }
  html += '<div class="playtest-passage">'+DAL.escapeHtml(currentNode.text||'')+'</div>';

  // Choices, or the closing screen when there is nothing left to pick
  var choiceStates = DAL.rpg.choiceStates(currentNode, DAL.playtestState, adv);
  var openNow = choiceStates.filter(function(cs){ return !cs.hidden; }).length;
  if(DAL.playtestState.ended || !openNow){
    html += DAL.renderPlaytestEnd(adv, currentNode);
    html += DAL.renderPlaytestChanges(adv);
    html += DAL.renderPlaytestHistory(adv);
    html += '</div>';
    html += '<div class="playtest-inspector">' + DAL.renderPlaytestPanels(adv) + '</div></div>';
    return html;
  }
  html += '<div class="playtest-choices">';
  var shown = 0;
  choiceStates.forEach(function(cs){
    if(cs.hidden) return;
    shown++;
    if(cs.ok && !cs.broken){
      html += '<button class="playtest-choice" data-action="pt-choice" data-nid="'+currentNode.id+'" data-choice-idx="'+cs.index+'">'+DAL.escapeHtml(cs.choice.label||'Continue')+'</button>';
    } else {
      var why = cs.broken ? 'leads nowhere yet' : cs.unmet.join(cs.logic === 'any' ? ' or ' : ' and ');
      html += '<button class="playtest-choice disabled" disabled>'+DAL.escapeHtml(cs.choice.label||'Locked')+
        '<span class="playtest-choice-why">Needs: '+DAL.escapeHtml(why)+'</span></button>';
    }
  });
  if(!shown){
    html += '<div style="color:var(--c-text-faint);font-size:var(--ts-sm)">— End of this path —</div>';
  }
  html += '</div>';

  html += DAL.renderPlaytestChanges(adv);

  html += DAL.renderPlaytestHistory(adv);

  html += '</div>'; // end main

  // State inspector
  html += '<div class="playtest-inspector">';
  html += DAL.renderPlaytestPanels(adv);
  html += '</div>'; // end inspector
  html += '</div>'; // end layout
  return html;
};

/* The inspector is the whole point of a playthrough: every number the engine
   tracks, and what the last choice did to it. */
DAL.renderPlaytestHistory = function(adv){
  if(!DAL.playtestHistory || DAL.playtestHistory.length < 2) return '';
  var html = '<div style="margin-top:16px;border-top:1px solid var(--c-divider);padding-top:8px"><div style="font-size:var(--ts-xs);color:var(--c-text-faint);margin-bottom:4px">History:</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
  DAL.playtestHistory.forEach(function(nid, i){
    var n = (adv.nodes||[]).find(function(nn){ return nn.id === nid; });
    if(n) html += '<span style="font-size:var(--ts-xs);color:var(--c-text-muted)">'+(i+1)+'. '+DAL.escapeHtml(n.title||'Untitled')+'</span>'+(i < DAL.playtestHistory.length-1 ? ' \u2192 ' : '');
  });
  html += '</div></div>';
  return html;
};

/* The closing screen. An ending is a destination, a failure is a stop, and a
   scene with no way out is neither — the author needs to tell them apart. */
DAL.renderPlaytestEnd = function(adv, currentNode){
  var st = DAL.playtestState;
  var ended = st.ended;
  var failure = ended && ended.kind === 'failure';
  var html = '<div class="playtest-end'+(failure ? ' failure' : '')+'">';
  if(ended){
    html += '<div class="playtest-end-kind">'+(failure ? 'Run over' : 'Ending reached')+'</div>';
    html += '<div class="playtest-end-title">'+DAL.escapeHtml(ended.label || (failure ? 'Run over' : 'The End'))+'</div>';
    if(ended.message) html += '<div class="playtest-end-note">'+DAL.escapeHtml(ended.message)+'</div>';
  } else {
    html += '<div class="playtest-end-kind">Nowhere to go</div>';
    html += '<div class="playtest-end-title">'+DAL.escapeHtml(currentNode.title || 'This scene')+' has no way out</div>';
    html += '<div class="playtest-end-note">Readers who arrive here are stuck. Give the scene a choice, or mark it as an ending in the Story Graph.</div>';
  }
  html += '<div class="playtest-end-stats">Scenes visited: '+Object.keys(st.visited||{}).length+' · Choices made: '+st.step+'</div>';
  html += '<div class="playtest-end-actions">'+
    '<button class="btn primary sm" data-action="pt-restart">Play again</button>'+
    '<button class="btn sm" data-action="pt-stepback">Step back</button>'+
    '</div></div>';
  return html;
};

DAL.renderPlaytestPanels = function(adv){
  var st = DAL.playtestState;
  var prev = (DAL.playtestPast && DAL.playtestPast.length) ? DAL.playtestPast[DAL.playtestPast.length - 1] : null;
  var html = '';

  html += '<h4>Stats</h4>';
  var rows = DAL.rpg.statRows(st, adv);
  if(!rows.length) html += '<div class="playtest-empty">No stats defined</div>';
  rows.forEach(function(row){
    var before = prev ? prev.stats[row.key] : undefined;
    var delta = '';
    if(row.type === 'number' && prev && before !== undefined && before !== row.value){
      var diff = DAL.rpg.num(row.value, 0) - DAL.rpg.num(before, 0);
      delta = '<span class="playtest-delta '+(diff > 0 ? 'up' : 'down')+'">'+(diff > 0 ? '+' : '')+diff+'</span>';
    }
    var shown = row.value === '' || row.value === undefined || row.value === null ? '—' : String(row.value);
    if(row.max !== null) shown += ' / ' + row.max;
    html += '<div class="playtest-stat"><span>'+DAL.escapeHtml(row.label)+'</span><span>'+delta+DAL.escapeHtml(shown)+'</span></div>';
    if(row.ratio !== null){
      html += '<div class="playtest-bar"><div class="playtest-bar-fill" style="width:'+Math.round(row.ratio * 100)+'%"></div></div>';
    }
  });

  html += '<h4>Traits</h4>';
  var traits = DAL.rpg.traitRows(st, adv);
  var activeTraits = traits.filter(function(t){ return t.active; });
  if(!traits.length) html += '<div class="playtest-empty">No traits defined</div>';
  else if(!activeTraits.length) html += '<div class="playtest-empty">None set yet</div>';
  else activeTraits.forEach(function(t){
    html += '<div class="playtest-item"><span>'+DAL.escapeHtml(t.label)+'</span></div>';
  });

  html += '<h4>Inventory</h4>';
  var invRows = DAL.rpg.inventoryRows(st, adv);
  if(!invRows.length) html += '<div class="playtest-empty">Empty</div>';
  invRows.forEach(function(row){
    html += '<div class="playtest-item">';
    if(row.image) html += '<img src="'+row.image+'" class="playtest-item-thumb">';
    html += '<span>'+(row.symbol ? DAL.escapeHtml(row.symbol)+' ' : '')+DAL.escapeHtml(row.name)+(row.count > 1 ? ' ×'+row.count : '')+'</span>';
    /* Readers can equip what they carry, so the slot rules can be felt rather
       than only read about. */
    if(row.slot){
      html += '<button class="btn sm playtest-equip" data-action="pt-equip" data-item="'+DAL.escapeHtml(row.key)+'">'+(row.equipped ? 'Put away' : 'Equip')+'</button>';
    }
    html += '</div>';
  });

  var equipped = DAL.rpg.equipRows(st, adv).filter(function(r){ return r.key; });
  var usesSlots = (adv.items||[]).some(function(it){ return it.slot && it.slot !== 'none'; });
  if(usesSlots){
    html += '<h4>Equipped</h4>';
    if(!equipped.length) html += '<div class="playtest-empty">Nothing equipped</div>';
    equipped.forEach(function(r){
      html += '<div class="playtest-stat"><span>'+DAL.escapeHtml(r.slot.charAt(0).toUpperCase()+r.slot.slice(1))+'</span><span>'+DAL.escapeHtml(r.name)+'</span></div>';
    });
  }

  var flags = Object.keys(st.flags || {}).filter(function(k){ return st.flags[k]; });
  if(flags.length){
    html += '<h4>Flags</h4>';
    flags.sort().forEach(function(f){ html += '<div class="playtest-item"><span>'+DAL.escapeHtml(f)+'</span></div>'; });
  }

  html += '<h4>Current Scene</h4>';
  var node = DAL.rpg.currentNode(st, adv);
  html += '<div class="playtest-stat"><span>Scene</span><span>'+DAL.escapeHtml(node ? (node.title||'Untitled') : '—')+'</span></div>';
  html += '<div class="playtest-stat"><span>Step</span><span>'+st.step+'</span></div>';
  html += '<div class="playtest-stat"><span>Times here</span><span>'+DAL.rpg.visitCount(st, st.nodeId)+'</span></div>';
  return html;
};

/* What the last choice actually did, in the reader's own words. */
DAL.renderPlaytestChanges = function(adv){
  var st = DAL.playtestState;
  var entries = (st.log || []).slice(-1);
  if(!entries.length) return '';
  var last = entries[0];
  var changes = (last.changes || []).filter(function(c){ return c && c.text; });
  if(!changes.length && !last.note) return '';
  var html = '<div class="playtest-changes"><div class="playtest-changes-head">What just changed</div>';
  changes.forEach(function(c){
    html += '<div class="playtest-change '+(c.kind === 'up' ? 'up' : (c.kind === 'down' ? 'down' : ''))+'">'+DAL.escapeHtml(c.text)+'</div>';
  });
  if(last.note) html += '<div class="playtest-change">'+DAL.escapeHtml(last.note)+'</div>';
  html += '</div>';
  return html;
};

/* The playthrough owns no rules of its own: it holds a state object produced
   by DAL.rpg and a stack of snapshots for Step Back. */
DAL.initPlaytest = function(adv){
  DAL.playtestState = DAL.rpg.newState(adv);
  DAL.playtestPast = [];
  /* Scene ids in visit order, kept for the history trail. */
  DAL.playtestHistory = DAL.playtestState.nodeId ? [DAL.playtestState.nodeId] : [];
};

DAL.playtestPush = function(){
  DAL.playtestPast = DAL.playtestPast || [];
  DAL.playtestPast.push(DAL.rpg.snapshot(DAL.playtestState));
  if(DAL.playtestPast.length > 60) DAL.playtestPast.shift();
};

/* Kept as the names the rest of the app already calls, now thin passes through
   to the engine so there is only one implementation of the rules. */
DAL.checkConditions = function(conditions, adv){
  return DAL.rpg.testChoice({ conditions: conditions }, DAL.playtestState, adv).ok;
};

DAL.applyEffects = function(effects, adv){
  return DAL.rpg.applyEffects(effects, DAL.playtestState, adv);
};

/* --- RPG Export --- */
DAL.renderRPGExport = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var html = '<div style="max-width:700px"><div class="section-header"><div class="section-title">Export</div></div>';
  html += '<p class="export-intro">Save this adventure in a format others can play, or take the whole project with you.</p>';
  // Same registry the Export Project dialog uses, so the formats and wording match.
  html += DAL.renderExportGroups(proj);
  html += '</div>';
  return html;
};

/* --- Playable export -------------------------------------------------------
   The download runs the same engine the Playthrough tool runs: RPG.engineSource()
   serialises it verbatim, so a rule that works here works there. Only the
   presentation below is written twice, and it is deliberately plain — a single
   file with no dependencies that opens from a memory stick. */

/* Serialised into the exported file, so it must not reference anything from the
   app: only DATA and the RPG functions that ship beside it. */
DAL.exportedGameUI = function(){
  var state = RPG.newState(DATA);
  var past = [];

  function esc(t){
    return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function panels(){
    var html = '<h4>Stats</h4>';
    RPG.statRows(state, DATA).forEach(function(row){
      var shown = row.value === '' || row.value == null ? '\u2014' : String(row.value);
      if(row.max !== null) shown += ' / ' + row.max;
      html += '<div class="row"><span>' + esc(row.label) + '</span><span>' + esc(shown) + '</span></div>';
      if(row.ratio !== null) html += '<div class="bar"><i style="width:' + Math.round(row.ratio * 100) + '%"></i></div>';
    });
    var traits = RPG.traitRows(state, DATA).filter(function(t){ return t.active; });
    if(traits.length){
      html += '<h4>Traits</h4>';
      traits.forEach(function(t){ html += '<div class="row"><span>' + esc(t.label) + '</span></div>'; });
    }
    var inv = RPG.inventoryRows(state, DATA);
    html += '<h4>Carrying</h4>';
    if(!inv.length) html += '<div class="faint">Nothing</div>';
    inv.forEach(function(row){
      html += '<div class="row"><span>' + esc(row.name) + (row.count > 1 ? ' \u00d7' + row.count : '') + '</span>';
      if(row.slot) html += '<button class="mini" data-equip="' + esc(row.key) + '">' + (row.equipped ? 'Put away' : 'Equip') + '</button>';
      html += '</div>';
    });
    var worn = RPG.equipRows(state, DATA).filter(function(r){ return r.key; });
    if(worn.length){
      html += '<h4>Equipped</h4>';
      worn.forEach(function(r){
        var slot = r.slot.charAt(0).toUpperCase() + r.slot.slice(1);
        html += '<div class="row"><span>' + esc(slot) + '</span><span>' + esc(r.name) + '</span></div>';
      });
    }
    return html;
  }

  function changes(){
    var last = (state.log || [])[state.log.length - 1];
    if(!last || !last.changes || !last.changes.length) return '';
    var html = '<div class="changes">';
    last.changes.forEach(function(c){
      if(c && c.text) html += '<div class="' + (c.kind === 'up' ? 'up' : (c.kind === 'down' ? 'down' : '')) + '">' + esc(c.text) + '</div>';
    });
    return html + '</div>';
  }

  function render(){
    var node = RPG.currentNode(state, DATA);
    var html = '<div class="main">';
    if(node){
      html += '<h1>' + esc(node.title || '') + '</h1>';
      (node.images || []).forEach(function(img){ html += '<img class="scene" src="' + img.dataUrl + '" alt="">'; });
      html += '<div class="passage">' + esc(node.text || '').replace(/\n/g, '<br>') + '</div>';
    }
    var open = [];
    if(node && !state.ended){
      RPG.choiceStates(node, state, DATA).forEach(function(cs){
        if(cs.hidden) return;
        open.push(cs);
        if(cs.ok && !cs.broken){
          html += '<button class="choice" data-choice="' + cs.index + '">' + esc(cs.choice.label || 'Continue') + '</button>';
        } else {
          var why = cs.broken ? 'leads nowhere yet' : cs.unmet.join(cs.logic === 'any' ? ' or ' : ' and ');
          html += '<button class="choice locked" disabled>' + esc(cs.choice.label || 'Locked') + '<span>Needs: ' + esc(why) + '</span></button>';
        }
      });
    }
    if(state.ended || !open.length){
      var ended = state.ended;
      var failure = ended && ended.kind === 'failure';
      html += '<div class="end' + (failure ? ' failure' : '') + '">';
      html += '<div class="kind">' + (ended ? (failure ? 'Run over' : 'Ending reached') : 'The trail stops here') + '</div>';
      html += '<div class="title">' + esc(ended ? (ended.label || (failure ? 'Run over' : 'The End')) : (node ? node.title : 'The End')) + '</div>';
      if(ended && ended.message) html += '<div class="note">' + esc(ended.message) + '</div>';
      html += '<div class="faint">Scenes visited: ' + Object.keys(state.visited || {}).length + ' \u00b7 Choices made: ' + state.step + '</div>';
      html += '<div class="acts"><button class="mini" data-restart="1">Play again</button>' +
        (past.length ? '<button class="mini" data-back="1">Step back</button>' : '') + '</div></div>';
    }
    html += changes();
    html += '</div><div class="side">' + panels() + '</div>';
    document.getElementById('game').innerHTML = html;
  }

  document.getElementById('game').addEventListener('click', function(e){
    var el = e.target;
    while(el && el !== document.body && !el.hasAttribute('data-choice') && !el.hasAttribute('data-equip') &&
      !el.hasAttribute('data-restart') && !el.hasAttribute('data-back')) el = el.parentNode;
    if(!el || el === document.body) return;
    if(el.hasAttribute('data-restart')){ state = RPG.newState(DATA); past = []; render(); return; }
    if(el.hasAttribute('data-back')){ if(past.length) state = past.pop(); render(); return; }
    past.push(RPG.snapshot(state));
    if(past.length > 60) past.shift();
    var done = el.hasAttribute('data-equip')
      ? RPG.toggleEquip(state, DATA, el.getAttribute('data-equip'))
      : RPG.choose(state, DATA, parseInt(el.getAttribute('data-choice'), 10));
    if(!done) past.pop();
    render();
  });

  render();
};

DAL.exportedGameCSS = function(){
  /* The exported page is its own document with no design tokens to inherit, so
     its palette lives here and nowhere else. */
  return 'html{background:#14121c}' +
    'body{font-family:Georgia,"Iowan Old Style",serif;background:#14121c;color:#e8e4de;margin:0;padding:24px;line-height:1.7;display:flex;gap:24px;justify-content:center;flex-wrap:wrap}' +
    '#game{display:flex;gap:24px;flex-wrap:wrap;max-width:900px;width:100%}' +
    '.main{flex:1 1 420px;min-width:0}.side{flex:0 0 220px}' +
    'h1{font-size:24px;margin:0 0 12px}' +
    'h4{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#8d8698;margin:16px 0 4px}' +
    '.passage{font-size:18px;margin-bottom:20px;white-space:pre-wrap}' +
    'img.scene{max-width:100%;border-radius:8px;margin-bottom:12px;display:block}' +
    '.choice{display:block;width:100%;text-align:left;font:inherit;font-size:16px;padding:12px 16px;min-height:44px;background:#1e1b2b;border:1px solid #322c45;border-radius:8px;color:inherit;margin-bottom:8px;cursor:pointer}' +
    '.choice:hover{background:#282338}' +
    '.choice.locked{opacity:.55;cursor:default}' +
    '.choice.locked span{display:block;font-size:12px;font-style:italic;color:#8d8698;margin-top:2px}' +
    '.row{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:13px;padding:2px 0}' +
    '.bar{height:4px;background:#241f33;border-radius:3px;overflow:hidden;margin:1px 0 6px}.bar i{display:block;height:100%;background:#c9a24b}' +
    '.faint{font-size:12px;color:#8d8698}' +
    '.mini{font:inherit;font-size:12px;padding:6px 10px;min-height:32px;background:#241f33;border:1px solid #322c45;border-radius:6px;color:inherit;cursor:pointer}' +
    '.changes{margin-top:16px;border-top:1px solid #2a2437;padding-top:8px;font-size:12px;color:#8d8698}' +
    '.changes .up{color:#8fbf6b}.changes .down{color:#d98a8a}' +
    '.end{border:1px solid #322c45;border-left:3px solid #c9a24b;border-radius:8px;padding:16px;background:#1a1726}' +
    '.end.failure{border-left-color:#d98a8a}' +
    '.end .kind{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#8d8698}' +
    '.end .title{font-size:20px;margin:4px 0}' +
    '.end .note{font-size:14px;color:#b3adbd}' +
    '.acts{display:flex;gap:8px;margin-top:12px}' +
    '@media (max-width:640px){body{padding:16px}.side{flex:1 1 100%}.choice{font-size:16px}}';
};

DAL.exportPlayableHTML = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var data = {
    name: proj.name, startNodeId: adv.startNodeId, nodes: adv.nodes,
    stats: adv.stats, traits: adv.traits, items: adv.items, rules: adv.rules
  };
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + DAL.escapeHtml(proj.name || 'Adventure') + '</title>' +
    '<style>' + DAL.exportedGameCSS() + '</style></head><body><div id="game"></div>' +
    '<script>\nvar DATA=' + JSON.stringify(data) + ';\n' +
    DAL.rpg.engineSource() +
    '(' + DAL.exportedGameUI.toString() + ')();\n' +
    '<\/script></body></html>';
};

/* --- Twine export ----------------------------------------------------------
   SugarCube can express stats, traits, items and gated links, so those carry
   over. What cannot: gear slots, stack limits, min/max clamping, run-ending
   rules and visit counts. Rather than silently dropping them, the export writes
   what it kept and lists what it did not in a note passage. */
/* One passage name per scene, decided up front: links have to agree with the
   passage headings, the opening scene must be called Start, and two scenes with
   the same title cannot share a name. */
DAL.tweeNames = function(adv){
  var startId = adv.startNodeId || ((adv.nodes || [])[0] || {}).id;
  var used = {}, map = {};
  (adv.nodes || []).forEach(function(node){
    var name;
    if(node.id === startId){
      name = 'Start';
    } else {
      /* Passage names cannot carry the link and macro punctuation SugarCube uses. */
      name = String(node.title || node.id).replace(/[\[\]\{\}\|\$<>]/g, ' ').replace(/\s+/g, ' ').trim() || node.id;
      if(name === 'Start' || name === 'StoryInit' || name === 'StoryTitle' || name === 'StoryData') name = name + ' scene';
      if(used[name]){ var n = 2; while(used[name + ' ' + n]) n++; name = name + ' ' + n; }
    }
    used[name] = true;
    map[node.id] = name;
  });
  return map;
};

DAL.tweeCondition = function(cond, adv){
  var t = cond.type || 'stat';
  if(t === 'stat'){
    var op = cond.op === '==' ? 'is' : cond.op === '!=' ? 'isnot' : (cond.op || '>=');
    return '$' + cond.key + ' ' + op + ' ' + (DAL.rpg.num(cond.value, 0));
  }
  if(t === 'trait') return (cond.op === 'inactive' ? 'not ' : '') + '$trait_' + cond.key;
  if(t === 'flag') return (cond.op === 'unset' ? 'not ' : '') + '$flag_' + cond.key;
  if(t === 'item'){
    var key = DAL.rpg.itemKey(adv, cond.key) || cond.key;
    var have = '($item_' + key + ' ? $item_' + key + ' : 0)';
    if(cond.op === '!has') return have + ' lte 0';
    if(cond.op === 'count') return have + ' gte ' + DAL.rpg.num(cond.value, 1);
    if(cond.op === 'countLte') return have + ' lte ' + DAL.rpg.num(cond.value, 1);
    return have + ' gt 0';
  }
  return null;
};

DAL.tweeEffect = function(eff, adv){
  var t = eff.type || 'stat';
  if(t === 'stat'){
    if(eff.op === 'set') return '<<set $' + eff.key + ' to ' + JSON.stringify(eff.value) + '>>';
    var sign = eff.op === 'subtract' ? '-' : '+';
    return '<<set $' + eff.key + ' to $' + eff.key + ' ' + sign + ' ' + DAL.rpg.num(eff.value, 0) + '>>';
  }
  if(t === 'trait'){
    if(eff.op === 'toggle') return '<<set $trait_' + eff.key + ' to not $trait_' + eff.key + '>>';
    if(eff.op === 'remove') return '<<set $trait_' + eff.key + ' to false>>';
    if(eff.op === 'set') return '<<set $trait_' + eff.key + ' to ' + (String(eff.value) === 'true') + '>>';
    return '<<set $trait_' + eff.key + ' to true>>';
  }
  if(t === 'flag') return '<<set $flag_' + eff.key + ' to ' + (eff.op === 'clear' ? 'false' : 'true') + '>>';
  if(t === 'inventory'){
    var key = DAL.rpg.itemKey(adv, eff.key) || eff.key;
    var qty = Math.max(1, DAL.rpg.num(eff.value, 1));
    return '<<set $item_' + key + ' to Math.max(0, $item_' + key + (eff.op === 'remove' ? ' - ' : ' + ') + qty + ')>>';
  }
  return null;
};

DAL.TWEE_GAPS = {
  equipped: 'requirements about which item is worn',
  slot: 'requirements about whether a gear slot is filled',
  visited: 'requirements about scenes already visited'
};

DAL.exportTwee = function(proj){
  var adv = DAL.ensureAdventure(proj);
  var skipped = [];
  var lines = [':: StoryTitle', proj.name || 'Adventure', '',
    ':: StoryData', '{"format":"SugarCube","format-version":"2.36.1"}', ''];

  /* StoryInit holds the starting values, so Twine begins where the adventure
     begins rather than with every variable undefined. */
  var init = [];
  (adv.stats || []).forEach(function(s){
    init.push('<<set $' + s.key + ' to ' + JSON.stringify(DAL.rpg.statStart(s)) + '>>');
    if(DAL.rpg.hasLimit(s.min) || DAL.rpg.hasLimit(s.max)) skipped.push('the limits on ' + (s.label || s.key));
  });
  (adv.traits || []).forEach(function(t){ init.push('<<set $trait_' + t.key + ' to ' + (t.defaultActive === true) + '>>'); });
  (adv.items || []).forEach(function(it){
    init.push('<<set $item_' + it.id + ' to 0>>');
    if(it.slot && it.slot !== 'none') skipped.push('the gear slot on ' + (it.name || it.id));
    if(it.stackable && DAL.rpg.num(it.maxStack, 0) > 1) skipped.push('the stack limit on ' + (it.name || it.id));
  });
  DAL.rpg.flagKeys(adv).forEach(function(f){ init.push('<<set $flag_' + f + ' to false>>'); });
  if(init.length) lines.push(':: StoryInit', init.join('\n'), '');

  var startId = adv.startNodeId || ((adv.nodes || [])[0] || {}).id;
  var names = DAL.tweeNames(adv);
  function passage(id){ return names[id] || id; }
  var order = (adv.nodes || []).slice().sort(function(a, b){
    return a.id === startId ? -1 : b.id === startId ? 1 : 0;
  });

  order.forEach(function(node){
    var name = passage(node.id);
    var body = [];
    (node.entryEffects || []).forEach(function(eff){
      var line = DAL.tweeEffect(eff, adv);
      if(line) body.push(line);
      else if(eff.type === 'goto' && eff.key) body.push('<<goto "' + passage(eff.key) + '">>');
      else if(eff.type === 'end') skipped.push('an end-the-story change in ' + (node.title || node.id));
      else if(eff.type === 'equip') skipped.push('equipment changes in ' + (node.title || node.id));
    });
    if(node.text) body.push(node.text);
    (node.choices || []).forEach(function(ch){
      if(!ch.targetNodeId) return;
      var target = passage(ch.targetNodeId);
      var link = '[[' + String(ch.label || 'Continue').replace(/[\[\]\|]/g, ' ') + '->' + target + ']]';
      var setters = [];
      (ch.effects || []).forEach(function(eff){
        var line = DAL.tweeEffect(eff, adv);
        if(line) setters.push(line);
        else if(eff.type === 'equip') skipped.push('equipment changes in ' + (node.title || node.id));
        else if(eff.type === 'end') skipped.push('an end-the-story change in ' + (node.title || node.id));
      });
      var tests = [];
      (ch.conditions || []).forEach(function(cond){
        var test = DAL.tweeCondition(cond, adv);
        if(test) tests.push('(' + test + ')');
        else skipped.push(DAL.TWEE_GAPS[cond.type] || ('a ' + (cond.type || 'stat') + ' requirement'));
      });
      var row = link + (setters.length ? setters.join('') : '');
      if(tests.length){
        var joiner = ch.condLogic === 'any' ? ' or ' : ' and ';
        body.push('<<if ' + tests.join(joiner) + '>>' + row + '<</if>>');
      } else {
        body.push(row);
      }
    });
    if(node.kind === 'ending') body.push("''" + String(node.endingLabel || node.title || 'The End').replace(/'/g, '') + "''");
    lines.push(':: ' + name, body.join('\n'), '');
  });

  (DAL.rpg.rules(adv).failures || []).forEach(function(r){
    if(r.statKey) skipped.push('the run-ending rule on ' + DAL.rpg.statLabel(adv, r.statKey));
  });
  var unique = [];
  skipped.forEach(function(s){ if(unique.indexOf(s) === -1) unique.push(s); });
  lines.push(':: Not Carried Over [nobr]',
    unique.length
      ? 'Twine plays this story with stats, traits, items and gated links intact. These parts of the original did not survive the trip and need rebuilding by hand:\n' +
        unique.map(function(s){ return '* ' + s; }).join('\n')
      : 'Everything in this story is expressible in SugarCube, so nothing was left behind.',
    '');
  return lines.join('\n');
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
        node6.entryEffects.push(DAL.effectDefaults('stat'));
      } else {
        var chIdx = parseInt(el.getAttribute('data-choice-idx'));
        node6.choices[chIdx].effects = node6.choices[chIdx].effects || [];
        node6.choices[chIdx].effects.push(DAL.effectDefaults('stat'));
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
      node10.choices[chIdx4].conditions.push(DAL.conditionDefaults('stat'));
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
      node12.choices[chIdx6].effects.push(DAL.effectDefaults('stat'));
      DAL.saveState(); DAL.render();
    }
    return;
  }

  // Stats & Traits
  if(action === 'sg-checkup'){
    DAL.openCheckup();
    return;
  }
  if(action === 'checkup-goto'){
    DAL.closeModal();
    DAL.selectedNodeId = el.getAttribute('data-nid');
    DAL.render();
    return;
  }
  if(action === 'sg-add-failure'){
    var projF = DAL.state.projects[DAL.currentProjectId];
    var advF = DAL.ensureAdventure(projF);
    var firstNum = (advF.stats||[]).filter(function(s){ return (s.type||'number') === 'number'; })[0];
    advF.rules.failures.push({ id: DAL.uid(), statKey: firstNum ? firstNum.key : '', op: '<=', value: 0, label: '', message: '' });
    DAL.saveState(); DAL.render();
    return;
  }
  if(action === 'sg-delete-failure'){
    var projF2 = DAL.state.projects[DAL.currentProjectId];
    var advF2 = DAL.ensureAdventure(projF2);
    advF2.rules.failures.splice(parseInt(el.getAttribute('data-idx')), 1);
    DAL.saveState(); DAL.render();
    return;
  }
  if(action === 'sg-add-stat'){
    var proj13 = DAL.state.projects[DAL.currentProjectId];
    var adv13 = DAL.ensureAdventure(proj13);
    adv13.stats = adv13.stats || [];
    adv13.stats.push({ id: DAL.uid('stat'), key: 'newstat', label: 'New Stat', type: 'number', default: 0, min: '', max: '' });
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
    /* Stepping back restores the whole state, not just the scene: a run that
       spent gold on the way here is still poorer after going back. */
    if(DAL.playtestPast && DAL.playtestPast.length){
      DAL.playtestState = DAL.playtestPast.pop();
      if(DAL.playtestHistory && DAL.playtestHistory.length > 1) DAL.playtestHistory.pop();
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
    DAL.playtestPush();
    DAL.playtestState.ended = null;
    DAL.rpg.enter(DAL.playtestState, adv21, targetId, 'Jumped here');
    DAL.playtestHistory.push(DAL.playtestState.nodeId);
    DAL.closeModal(); DAL.render();
    return;
  }
  if(action === 'pt-equip'){
    /* Equipping is a reader action, so it is undoable like a choice. */
    var projEq = DAL.state.projects[DAL.currentProjectId];
    var advEq = DAL.ensureAdventure(projEq);
    DAL.playtestPush();
    var moved = DAL.rpg.toggleEquip(DAL.playtestState, advEq, el.getAttribute('data-item'));
    if(!moved){
      DAL.playtestPast.pop();
      DAL.toast('That item cannot be equipped','warning');
    }
    DAL.render();
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
    DAL.playtestPush();
    var entry = DAL.rpg.choose(DAL.playtestState, adv22, parseInt(el.getAttribute('data-choice-idx')));
    if(!entry){
      /* The engine refused: the choice is not actually available. */
      DAL.playtestPast.pop();
      DAL.toast('That choice is not available right now','warning');
      return;
    }
    DAL.playtestHistory.push(DAL.playtestState.nodeId);
    DAL.render();
    return;
  }

  // RPG Export
  if(action === 'export-twee'){
    var proj23 = DAL.exportTarget(el);
    if(!proj23) return;
    DAL.download(DAL.sanitizeFilename(proj23.name)+'.twee', DAL.exportTwee(proj23), 'text/plain');
    DAL.toast('Twine source downloaded.','success');
    return;
  }
  if(action === 'export-playable-html'){
    var proj24 = DAL.exportTarget(el);
    if(!proj24) return;
    DAL.download(DAL.sanitizeFilename(proj24.name)+'-game.html', DAL.exportPlayableHTML(proj24), 'text/html');
    DAL.toast('Playable adventure HTML downloaded.','success');
    return;
  }
  if(action === 'export-node-text'){
    var proj25 = DAL.exportTarget(el);
    if(!proj25) return;
    var adv25 = DAL.ensureAdventure(proj25);
    var nodeId = DAL.exportSelectValue('exportNodeSelect');
    var node25 = adv25.nodes.find(function(n){ return n.id === nodeId; });
    if(node25) DAL.download(DAL.sanitizeFilename(node25.title||'node')+'.txt', node25.text||'', 'text/plain');
    DAL.toast('Selected scene TXT downloaded.','success');
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
  if(el.hasAttribute('data-failure-field')){
    DAL.applyFailureField(el);
    return;
  }
  if(el.hasAttribute('data-node-field')){
    DAL.applyNodeField(el);
    return;
  }
  if(el.hasAttribute('data-stat-field')){
    var proj2 = DAL.state.projects[DAL.currentProjectId];
    var adv2 = DAL.ensureAdventure(proj2);
    var idx = parseInt(el.getAttribute('data-idx'));
    var field = el.getAttribute('data-stat-field');
    var val = el.value;
    if(field === 'default') val = adv2.stats[idx].type === 'number' ? (parseFloat(val)||0) : val;
    /* An empty limit means "no limit", so blanks are stored as blanks rather
       than coerced to zero. */
    if(field === 'min' || field === 'max') val = val === '' ? '' : (parseFloat(val)||0);
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
  if(el.hasAttribute('data-eff-field')){
    var efield = el.getAttribute('data-eff-field');
    var projE = DAL.state.projects[DAL.currentProjectId];
    var advE = DAL.ensureAdventure(projE);
    var nodeE = advE.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    var arrE = null;
    if(nodeE){
      if(el.getAttribute('data-eff-type') === 'entry') arrE = nodeE.entryEffects;
      else { var chE = nodeE.choices[parseInt(el.getAttribute('data-choice-idx'))]; arrE = chE && chE.effects; }
    }
    var effE = arrE && arrE[parseInt(el.getAttribute('data-idx'))];
    /* Written here as well as on input so a keyboard or assistive-technology
       pick is stored either way. */
    if(effE && efield !== 'type') effE[efield] = el.value;
    if(efield === 'type' && effE){
      /* Each effect kind has its own operators and value shape, so switching
         kind starts the row again rather than leaving a mismatched operator. */
      var freshEff = DAL.effectDefaults(el.value);
      effE.type = freshEff.type; effE.key = freshEff.key; effE.op = freshEff.op; effE.value = freshEff.value;
    }
    if(efield === 'type' || efield === 'op' || efield === 'key'){ DAL.saveState(); DAL.render(); }
    else DAL.saveState();
    return;
  }
  if(el.hasAttribute('data-cond-field')){
    var cfield = el.getAttribute('data-cond-field');
    var projK = DAL.state.projects[DAL.currentProjectId];
    var advK = DAL.ensureAdventure(projK);
    var nodeK = advK.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    var chK = nodeK && nodeK.choices[parseInt(el.getAttribute('data-choice-idx'))];
    var condK = chK && (chK.conditions||[])[parseInt(el.getAttribute('data-cond-idx'))];
    /* Selects are written here as well as on input, so a pick made with the
       keyboard or by assistive technology is stored either way. */
    if(condK && cfield !== 'type') condK[cfield] = el.value;
    if(cfield === 'type' || cfield === 'op' || cfield === 'key'){
      /* Switching type rewrites the row to a valid shape for that type; the
         operator and value fields differ between them. */
      if(cfield === 'type' && condK){
        var fresh = DAL.conditionDefaults(el.value);
        condK.type = fresh.type; condK.key = fresh.key; condK.op = fresh.op; condK.value = fresh.value;
      }
      DAL.saveState(); DAL.render();
    }
    return;
  }
  if(el.hasAttribute('data-failure-field')){
    if(DAL.applyFailureField(el)) DAL.render();
    return;
  }
  if(el.hasAttribute('data-node-field')){
    /* Switching a scene to an ending reveals its ending-name field. */
    if(DAL.applyNodeField(el)) DAL.render();
    return;
  }
  if(el.hasAttribute('data-adv-rule')){
    var projR = DAL.state.projects[DAL.currentProjectId];
    var advR = DAL.ensureAdventure(projR);
    advR.rules[el.getAttribute('data-adv-rule')] = el.value;
    DAL.saveState(); DAL.render();
    return;
  }
  if(el.hasAttribute('data-choice-field')){
    var projF = DAL.state.projects[DAL.currentProjectId];
    var advF = DAL.ensureAdventure(projF);
    var nodeF = advF.nodes.find(function(n){ return n.id === el.getAttribute('data-nid'); });
    var chF = nodeF && nodeF.choices[parseInt(el.getAttribute('data-choice-idx'))];
    if(chF){
      chF[el.getAttribute('data-choice-field')] = el.value;
      DAL.saveState(); DAL.render();
    }
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

/* Canvas interactions (pan, zoom, node dragging) live in story-tools.js and
   serve both the story graph and the mind map. There was once a second copy
   here, guarded by `||` so whichever file loaded first won — which silently
   broke story-graph dragging, because the build concatenates story-tools first.
   One implementation, no guard. */
