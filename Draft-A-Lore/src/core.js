/* Draft A Lore — core.js
 * Copyright 2026 Daymien Vanhorn — https://github.com/Hexxis-cmd/Draft-A-Lore
 * Free for noncommercial use under PolyForm Noncommercial 1.0.0 + supplemental
 * terms (see LICENSE.md). Credit to the original author must remain visible.
 * Commercial use requires a license — see COMMERCIAL-LICENSE.md.
 */
var DAL = DAL || {};
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

/* Rich manuscript HTML is the only intentionally stored markup. Project files
   are shareable, so imported or pasted markup is a trust boundary: keep the
   formatting the editor can create and discard executable/embedded content. */
DAL.sanitizeRichHTML = function(html){
  var template = document.createElement('template');
  template.innerHTML = String(html || '');
  var allowed = {
    P:1,BR:1,STRONG:1,B:1,EM:1,I:1,U:1,S:1,STRIKE:1,H1:1,H2:1,H3:1,H4:1,
    BLOCKQUOTE:1,UL:1,OL:1,LI:1,A:1,IMG:1,HR:1,SPAN:1,DIV:1,PRE:1,CODE:1,SUB:1,SUP:1,FONT:1,MARK:1,
    TABLE:1,THEAD:1,TBODY:1,TFOOT:1,TR:1,TH:1,TD:1,CAPTION:1,ASIDE:1
  };
  var safeStyle = { color:1, 'background-color':1, 'font-family':1, 'font-size':1, 'text-align':1 };
  Array.from(template.content.querySelectorAll('*')).forEach(function(el){
    if(!allowed[el.tagName]){
      el.replaceWith(document.createTextNode(el.textContent || ''));
      return;
    }
    Array.from(el.attributes).forEach(function(attr){
      var name = attr.name.toLowerCase(), value = String(attr.value || '').trim();
      var keep = name === 'alt' || name === 'title' ||
        (el.tagName === 'A' && name === 'href') ||
        (el.tagName === 'IMG' && name === 'src') ||
        (el.tagName === 'FONT' && ['color','face','size'].indexOf(name) >= 0) || name === 'style';
      if(name === 'class' && /^(writer-[a-z0-9_-]+)(\s+writer-[a-z0-9_-]+)*$/i.test(value)) keep = true;
      if(name === 'id' && /^dal-[a-z0-9_-]+$/i.test(value)) keep = true;
      if(/^data-(highlight-id|color|bookmark-id|footnote-id|checked|link-kind|link-id)$/.test(name)) keep = true;
      if(name === 'contenteditable' && value === 'false') keep = true;
      if((name === 'colspan' || name === 'rowspan') && /^\d{1,2}$/.test(value)) keep = true;
      if(!keep || name.indexOf('on') === 0){ el.removeAttribute(attr.name); return; }
      if(name === 'href' && !/^(https?:|mailto:|#)/i.test(value)) el.removeAttribute(attr.name);
      if(name === 'src' && !/^(data:image\/(png|jpeg|jpg|webp|gif|avif);base64,|blob:)/i.test(value)) el.removeAttribute(attr.name);
      if(name === 'style'){
        var cleaned = [];
        value.split(';').forEach(function(rule){
          var at = rule.indexOf(':'); if(at < 1) return;
          var prop = rule.slice(0, at).trim().toLowerCase(), val = rule.slice(at + 1).trim();
          if(safeStyle[prop] && !/url\s*\(|expression\s*\(|javascript:/i.test(val)) cleaned.push(prop+':'+val);
        });
        if(cleaned.length) el.setAttribute('style', cleaned.join(';')); else el.removeAttribute('style');
      }
    });
    if(el.tagName === 'A' && el.hasAttribute('href')) el.setAttribute('rel', 'noopener noreferrer');
  });
  return template.innerHTML;
};

DAL.safeImportedImage = function(value){
  value = String(value || '').trim();
  return /^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(value) ? value : '';
};

DAL.safeImportedFont = function(value){
  value = String(value || '').trim();
  return /^data:(font\/(ttf|otf|woff|woff2)|application\/(font-woff|octet-stream));base64,[a-z0-9+/=\s]+$/i.test(value) ? value : '';
};

DAL.SCHEMA_VERSION = 3;
DAL.normalizeProject = function(project, sanitize){
  if(!project || typeof project !== 'object' || Array.isArray(project)) throw new Error('That file does not contain a valid project.');
  var p = project;
  p.name = String(p.name || 'Imported Project').slice(0, 200);
  p.type = ['novel','rpg','dual'].indexOf(p.type) >= 0 ? p.type : 'novel';
  p.genres = Array.isArray(p.genres) ? p.genres.map(function(value){ return String(value || '').trim().slice(0, 80); }).filter(Boolean).slice(0, 5) : [];
  p.bibleId = typeof p.bibleId === 'string' ? p.bibleId : '';
  p.previewProfile=['responsive','phone','tablet','kindle','ipad','paperback','hardcover'].indexOf(p.previewProfile)>=0?p.previewProfile:'responsive';
  ['chapters','characters','relationships','plots','images','versions','history','redoStack','timeline'].forEach(function(key){
    if(!Array.isArray(p[key])) p[key] = [];
    else p[key] = p[key].filter(function(item){ return !!item && typeof item === 'object' && !Array.isArray(item); });
  });
  if(!p.cover || typeof p.cover !== 'object' || Array.isArray(p.cover)) p.cover = { title:p.name, subtitle:'', author:'', imageDataUrl:'' };
  if(sanitize) p.cover.imageDataUrl = DAL.safeImportedImage(p.cover.imageDataUrl);
  if(!p.lore || typeof p.lore !== 'object' || Array.isArray(p.lore)) p.lore = { folders:[], entries:[] };
  if(!Array.isArray(p.lore.folders)) p.lore.folders = [];
  if(!Array.isArray(p.lore.entries)) p.lore.entries = [];
  p.lore.entries = p.lore.entries.filter(function(entry){ return !!entry && typeof entry === 'object' && !Array.isArray(entry); });
  if(!p.mindmap || typeof p.mindmap !== 'object' || Array.isArray(p.mindmap)) p.mindmap = { nodes:[], edges:[] };
  if(!Array.isArray(p.mindmap.nodes)) p.mindmap.nodes = [];
  if(!Array.isArray(p.mindmap.edges)) p.mindmap.edges = [];
  p.mindmap.nodes = p.mindmap.nodes.filter(function(node){ return !!node && typeof node === 'object' && !Array.isArray(node); });
  p.mindmap.edges = p.mindmap.edges.filter(function(edge){ return !!edge && typeof edge === 'object' && !Array.isArray(edge); });
  p.chapters.forEach(function(ch, index){
    if(!ch || typeof ch !== 'object') p.chapters[index] = ch = DAL.defaultChapter('Chapter '+(index+1), index);
    if(!ch.id) ch.id = DAL.uid('ch');
    ch.title = String(ch.title || 'Untitled Chapter').slice(0, 300);
    ch.povCharacterId = typeof ch.povCharacterId==='string'?ch.povCharacterId:'';
    ch.contentHTML = sanitize ? DAL.sanitizeRichHTML(ch.contentHTML) : String(ch.contentHTML || '');
    if(!Array.isArray(ch.images)) ch.images = [];
    if(sanitize) ch.images.forEach(function(image){ if(image && typeof image === 'object'){ image.dataUrl = DAL.safeImportedImage(image.dataUrl); image.src = DAL.safeImportedImage(image.src); } });
  });
  if(sanitize){
    p.characters.forEach(function(character){ character.image = DAL.safeImportedImage(character.image); });
    p.images.forEach(function(image){ image.dataUrl = DAL.safeImportedImage(image.dataUrl); image.src = DAL.safeImportedImage(image.src); });
  }
  p.images.forEach(function(image){
    if(!image.id) image.id = DAL.uid('img');
    image.bookPage = Math.max(0, parseInt(image.bookPage, 10) || 0);
    image.pageFit = image.pageFit === 'cover' ? 'cover' : 'contain';
  });
  p.plots.forEach(function(plot){
    if(!plot.id) plot.id=DAL.uid('plot');
    plot.title=String(plot.title||'Untitled Plot Thread').slice(0,300);
    plot.linkedChapterIds=Array.isArray(plot.linkedChapterIds)?plot.linkedChapterIds.filter(function(id){return typeof id==='string';}):[];
    plot.linkedCharacterIds=Array.isArray(plot.linkedCharacterIds)?plot.linkedCharacterIds.filter(function(id){return typeof id==='string';}):[];
    plot.introducedChapterId=typeof plot.introducedChapterId==='string'?plot.introducedChapterId:'';
    plot.resolvedChapterId=typeof plot.resolvedChapterId==='string'?plot.resolvedChapterId:'';
  });
  if(p.cover.imageDataUrl){
    var coverImage = p.images.find(function(image){ return image.dataUrl === p.cover.imageDataUrl || image.src === p.cover.imageDataUrl; });
    if(!coverImage){
      coverImage = { id:DAL.uid('img'), name:'Cover', dataUrl:p.cover.imageDataUrl, category:'cover', usedIn:[] };
      p.images.push(coverImage);
    }
    p.images.forEach(function(image){ if(image !== coverImage && image.bookPage === 1) image.bookPage = 0; });
    coverImage.bookPage = 1;
    coverImage.pageFit = 'cover';
    coverImage.category = 'cover';
    p.cover.imageDataUrl = '';
  }
  if(!p.writerTools || typeof p.writerTools !== 'object' || Array.isArray(p.writerTools)) p.writerTools = {};
  ['comments','highlights','bookmarks','footnotes','sources'].forEach(function(key){
    if(!Array.isArray(p.writerTools[key])) p.writerTools[key] = [];
    else p.writerTools[key] = p.writerTools[key].filter(function(item){ return !!item && typeof item === 'object' && !Array.isArray(item); });
  });
  if(p.writerTools.structure !== null && (typeof p.writerTools.structure !== 'object' || Array.isArray(p.writerTools.structure))) p.writerTools.structure = null;
  if(!p.writerTools.exportOptions || typeof p.writerTools.exportOptions !== 'object' || Array.isArray(p.writerTools.exportOptions)) p.writerTools.exportOptions = {};
  if(!p.continuity || typeof p.continuity !== 'object' || Array.isArray(p.continuity)) p.continuity={live:false,ignored:{}};
  p.continuity.live=!!p.continuity.live;
  if(!p.continuity.ignored||typeof p.continuity.ignored!=='object'||Array.isArray(p.continuity.ignored))p.continuity.ignored={};
  if(!p.encyclopedia||typeof p.encyclopedia!=='object'||Array.isArray(p.encyclopedia))p.encyclopedia={auto:true,candidates:[],lastScannedAt:0};
  p.encyclopedia.auto=p.encyclopedia.auto!==false;
  p.encyclopedia.candidates=Array.isArray(p.encyclopedia.candidates)?p.encyclopedia.candidates.filter(function(item){return item&&typeof item==='object'&&!Array.isArray(item);}):[];
  if(!p.sync||typeof p.sync!=='object'||Array.isArray(p.sync))p.sync={mode:'backup',lastRemoteUpdatedAt:0,lastLocalUpdatedAt:0};
  p.sync.mode=p.sync.mode==='shared'?'shared':'backup';p.sync.lastRemoteUpdatedAt=Number(p.sync.lastRemoteUpdatedAt)||0;p.sync.lastLocalUpdatedAt=Number(p.sync.lastLocalUpdatedAt)||0;
  if(p.adventure && typeof p.adventure === 'object'){
    ['stats','traits','items','nodes'].forEach(function(key){
      if(!Array.isArray(p.adventure[key])) p.adventure[key] = [];
      else p.adventure[key] = p.adventure[key].filter(function(item){ return !!item && typeof item === 'object' && !Array.isArray(item); });
    });
    p.adventure.nodes.forEach(function(node){
      if(!node || typeof node !== 'object') return;
      if(!Array.isArray(node.images)) node.images = [];
      if(sanitize) node.images.forEach(function(image){ if(image && typeof image === 'object'){ image.dataUrl = DAL.safeImportedImage(image.dataUrl); image.src = DAL.safeImportedImage(image.src); } });
      if(!Array.isArray(node.choices)) node.choices = [];
      if(!Array.isArray(node.entryEffects)) node.entryEffects = [];
      node.entryEffects = node.entryEffects.filter(function(effect){ return !!effect && typeof effect === 'object' && !Array.isArray(effect); });
      node.choices = node.choices.filter(function(choice){ return !!choice && typeof choice === 'object' && !Array.isArray(choice); });
      node.choices.forEach(function(choice){
        if(!Array.isArray(choice.conditions)) choice.conditions = [];
        if(!Array.isArray(choice.effects)) choice.effects = [];
        choice.conditions = choice.conditions.filter(function(condition){ return !!condition && typeof condition === 'object' && !Array.isArray(condition); });
        choice.effects = choice.effects.filter(function(effect){ return !!effect && typeof effect === 'object' && !Array.isArray(effect); });
      });
    });
    if(sanitize) p.adventure.items.forEach(function(item){ if(item && typeof item === 'object') item.imageDataUrl = DAL.safeImportedImage(item.imageDataUrl); });
  }
  p.schemaVersion = DAL.SCHEMA_VERSION;
  return p;
};

DAL.defaultBible = function(name){
  return {
    id:DAL.uid('bible'), name:String(name || 'Shared World'), createdAt:Date.now(), updatedAt:Date.now(),
    characters:[], lore:{folders:['Locations','Factions','Magic / Technology','Relics & Artifacts','Cosmology & History','Miscellaneous'],entries:[]},
    timeline:[], glossary:[]
  };
};

DAL.normalizeBible = function(value){
  if(!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('That file does not contain a valid world bible.');
  var bible=value;
  bible.id=String(bible.id || DAL.uid('bible'));
  bible.name=String(bible.name || 'Shared World').slice(0,200);
  ['characters','timeline','glossary'].forEach(function(key){
    bible[key]=Array.isArray(bible[key])?bible[key].filter(function(item){return item&&typeof item==='object'&&!Array.isArray(item);}):[];
  });
  if(!bible.lore||typeof bible.lore!=='object'||Array.isArray(bible.lore)) bible.lore={folders:[],entries:[]};
  bible.lore.folders=Array.isArray(bible.lore.folders)?bible.lore.folders.map(function(folder){return String(folder||'').trim().slice(0,100);}).filter(Boolean):[];
  bible.lore.entries=Array.isArray(bible.lore.entries)?bible.lore.entries.filter(function(item){return item&&typeof item==='object'&&!Array.isArray(item);}):[];
  function record(item,prefix,titleKey){
    if(!item.id)item.id=DAL.uid(prefix);
    item[titleKey]=String(item[titleKey]||'Untitled').slice(0,300);
    item.aliases=Array.isArray(item.aliases)?item.aliases.map(function(alias){return String(alias||'').trim().slice(0,120);}).filter(Boolean):[];
    item.tags=Array.isArray(item.tags)?item.tags.map(function(tag){return String(tag||'').trim().slice(0,80);}).filter(Boolean):[];
    item.status=String(item.status||'').slice(0,80);
    item.facts=Array.isArray(item.facts)?item.facts.filter(function(fact){return fact&&typeof fact==='object'&&!Array.isArray(fact);}).map(function(fact){return {id:String(fact.id||DAL.uid('fact')),key:String(fact.key||'').trim().slice(0,120),value:String(fact.value||'').trim().slice(0,500)};}).filter(function(fact){return fact.key||fact.value;}):[];
    return item;
  }
  bible.characters=bible.characters.map(function(item){return record(item,'bchar','name');});
  bible.lore.entries=bible.lore.entries.map(function(item){item.folder=String(item.folder||'Miscellaneous').slice(0,100);item.content=String(item.content||'').slice(0,1000000);return record(item,'blore','title');});
  bible.glossary=bible.glossary.map(function(item){item.definition=String(item.definition||'').slice(0,10000);return record(item,'term','term');});
  bible.timeline=bible.timeline.map(function(item){item.date=String(item.date||'').slice(0,120);item.order=isFinite(Number(item.order))?Number(item.order):0;item.summary=String(item.summary||'').slice(0,100000);item.location=String(item.location||'').slice(0,300);return record(item,'bevent','title');});
  bible.createdAt=Number(bible.createdAt)||Date.now(); bible.updatedAt=Number(bible.updatedAt)||Date.now();
  return bible;
};

DAL.normalizeWorkspace = function(raw, sanitize){
  if(!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('That file does not contain a Draft A Lore workspace.');
  var state = DAL.defaultState();
  Object.keys(raw).forEach(function(key){ if(key !== '__proto__' && key !== 'constructor' && key !== 'prototype') state[key] = raw[key]; });
  if(!state.projects || typeof state.projects !== 'object' || Array.isArray(state.projects)) state.projects = {};
  if(!state.bibles || typeof state.bibles !== 'object' || Array.isArray(state.bibles)) state.bibles = {};
  Object.keys(state.bibles).forEach(function(id){
    if(id === '__proto__' || id === 'constructor' || id === 'prototype'){ delete state.bibles[id]; return; }
    try{ state.bibles[id]=DAL.normalizeBible(state.bibles[id]); }
    catch(e){ delete state.bibles[id]; }
  });
  Object.keys(state.projects).forEach(function(id){
    if(id === '__proto__' || id === 'constructor' || id === 'prototype'){ delete state.projects[id]; return; }
    try{ state.projects[id] = DAL.normalizeProject(state.projects[id], sanitize); }
    catch(e){ delete state.projects[id]; }
  });
  var order = Array.isArray(state.projectOrder) ? state.projectOrder.filter(function(id){ return !!state.projects[id]; }) : [];
  Object.keys(state.projects).forEach(function(id){ if(order.indexOf(id) < 0) order.push(id); });
  state.projectOrder = order;
  state.bibleOrder=(Array.isArray(state.bibleOrder)?state.bibleOrder:[]).filter(function(id){return !!state.bibles[id];});
  Object.keys(state.bibles).forEach(function(id){if(state.bibleOrder.indexOf(id)<0)state.bibleOrder.push(id);});
  Object.keys(state.projects).forEach(function(id){if(state.projects[id].bibleId&&!state.bibles[state.projects[id].bibleId])state.projects[id].bibleId='';});
  if(sanitize){
    state.authorAvatar = DAL.safeImportedImage(state.authorAvatar);
    state.customFonts = Array.isArray(state.customFonts) ? state.customFonts.filter(function(font){
      if(!font || typeof font !== 'object') return false;
      font.name = String(font.name || '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);
      font.dataUrl = DAL.safeImportedFont(font.dataUrl);
      return !!font.name && !!font.dataUrl;
    }) : [];
  }
  state.schemaVersion = DAL.SCHEMA_VERSION;
  return state;
};
DAL.defaultState = function(){
  return {
    schemaVersion: DAL.SCHEMA_VERSION,
    appTheme: 'aurora',
    authorName: '',
    authorBio: '',
    authorAvatar: '',
    autoFillAuthor: false,
    goalDaily: 500, goalWeekly: 3500, goalMonthly: 15000, goal6Month: 90000, goalYearly: 180000,
    projects: {},
    projectOrder: [],
    bibles: {},
    bibleOrder: [],
    customFonts: [],
    wordHistory: {},
    // Deliberately 1, not the current version: a saved state that predates this
    // field must fall through to the migration rather than be assumed current.
    historyVersion: 1,
    wordBaseline: null,
    dashboardLayout: { order: [], hidden: [], size: {} },
    analyticsRange: '30d',
    sidebarCollapsed: false,
    autosave: true,
    onlineFontsEnabled: false,
    clipboard: [],
    panels: {}
  };
};

DAL.defaultProject = function(name, type){
  var id = DAL.uid('proj');
  var proj = {
    id: id, name: name||'Untitled Project', type: type||'novel',
    genres: [], bibleId: '',
    status: 'development',
    createdAt: Date.now(), updatedAt: Date.now(),
    folderHandle: null, linkedFolderName: null,
    cover: { title: name||'Untitled', subtitle: '', author: '', imageDataUrl: '' },
    images: [],
    bookTheme: 'parchment', fontBody: '', fontHeading: '', fontSize: 16,
    previewProfile:'responsive', bookDesign:null,
    chapters: [], characters: [], relationships: [],
    plots: [], lore: { folders: ['Locations','Factions','Magic / Technology','Relics & Artifacts','Cosmology & History','Miscellaneous'], entries: [] },
    timeline: [],
    mindmap: { nodes: [], edges: [] },
    writerTools: { comments:[], highlights:[], bookmarks:[], footnotes:[], sources:[], structure:null, exportOptions:{} },
    continuity: { live:false, ignored:{} },
    encyclopedia: { auto:true, candidates:[], lastScannedAt:0 },
    sync: { mode:'backup', lastRemoteUpdatedAt:0, lastLocalUpdatedAt:0 },
    // A target of 0 means "no goal set", which is the honest default: a project
    // should not pretend to have a finish line nobody chose.
    goal: { target: 0, deadline: '' },
    // Zoom/scroll per board, filled in on first use by DAL.canvasView.
    canvasView: {},
    adventure: null,
    versions: [],
    history: [], redoStack: [], historyIndex: -1
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
  return { id: DAL.uid('ch'), title: title||'New Chapter', order: order||0, contentHTML: '', images: [], povCharacterId:'', updatedAt: Date.now(), createdAt: Date.now() };
};
DAL.state = null;
DAL.currentView = 'dashboard';
DAL.currentProjectId = null;
DAL.currentTool = null;
DAL.selectedChapterId = null;
DAL.selectedCharId = null;
DAL.selectedPlotId = null;
DAL.selectedLoreFolder = null;
DAL.selectedLoreEntry = null;
DAL.selectedTimelineId = null;
DAL.selectedNodeId = null;
DAL.connectMode = false;
DAL.connectFromNodeId = null;
/* Grab mode is a sticky canvas mode but deliberately not saved: reopening a
   board should always start in ordinary editing mode. */
DAL.grabMode = false;
DAL.distractionFree = false;
DAL.readerPage = 0;
DAL.readerTheme = 'parchment';

/* Reading preferences
   Typeface, text size, line spacing, page tint and drop caps belong to the
   person reading rather than to the project, so they live once in state and
   apply to the Book Preview, the library reader and the adventure player
   alike. Every stack below is made of fonts the operating system already has:
   the app must look identical with the network unplugged.

   The dyslexia-friendly entry is a real accessibility option, not decoration.
   Comic Sans and Trebuchet have the irregular letter shapes that make glyphs
   harder to transpose, and both ship with Windows, macOS and Android.

   Family names are quoted with apostrophes, never double quotes: these stacks
   are written into an inline style attribute, and a double quote would end the
   attribute early and break the page. */
DAL.READER_FONTS = [
  { id:'serif',     label:'Serif',              stack:"Georgia, 'Iowan Old Style', 'Times New Roman', serif" },
  { id:'oldstyle',  label:'Old style',          stack:"'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif" },
  { id:'sans',      label:'Sans',               stack:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { id:'humanist',  label:'Humanist',           stack:"Optima, Candara, 'Gill Sans', 'Trebuchet MS', sans-serif" },
  { id:'mono',      label:'Monospace',          stack:"ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace" },
  { id:'dyslexic',  label:'Dyslexia friendly',  stack:"'Comic Sans MS', 'Trebuchet MS', Verdana, sans-serif" }
];
DAL.READER_SIZES = [
  { id:'s',  label:'Small',       scale:0.9 },
  { id:'m',  label:'Medium',      scale:1 },
  { id:'l',  label:'Large',       scale:1.15 },
  { id:'xl', label:'Larger',      scale:1.32 },
  { id:'xxl',label:'Largest',     scale:1.5 }
];
DAL.READER_SPACING = [
  { id:'tight',   label:'Tight',   value:1.5 },
  { id:'normal',  label:'Normal',  value:1.8 },
  { id:'relaxed', label:'Relaxed', value:2.1 }
];

/* Reading preferences are read on every reader render, which makes this the
   right place to migrate an older save additively and to keep the legacy
   DAL.readerTheme global — still read in several views — pointing at the
   stored value. Defaults match how the app has always looked. */
DAL.readerPrefs = function(){
  if(!DAL.state) return { theme:'parchment', font:'serif', size:'m', spacing:'normal', dropCaps:true };
  var prefs = DAL.state.readerPrefs;
  if(!prefs || typeof prefs !== 'object'){ prefs = {}; DAL.state.readerPrefs = prefs; }
  if(!prefs.theme) prefs.theme = DAL.readerTheme || 'parchment';
  if(!prefs.font) prefs.font = 'serif';
  if(!prefs.size) prefs.size = 'm';
  if(!prefs.spacing) prefs.spacing = 'normal';
  if(prefs.dropCaps === undefined) prefs.dropCaps = true;
  DAL.readerTheme = prefs.theme;
  return prefs;
};

DAL.readerFontStack = function(id){
  var found = DAL.READER_FONTS.filter(function(f){ return f.id === id; })[0] || DAL.READER_FONTS[0];
  return found.stack;
};

/* The reader containers carry their typography as custom properties so one
   stylesheet rule serves all three readers and nothing needs hardcoding. */
DAL.readerStyleAttr = function(extraStyle){
  var p = DAL.readerPrefs();
  var size = DAL.READER_SIZES.filter(function(s){ return s.id === p.size; })[0] || DAL.READER_SIZES[1];
  var spacing = DAL.READER_SPACING.filter(function(s){ return s.id === p.spacing; })[0] || DAL.READER_SPACING[1];
  return ' data-book-theme="'+DAL.escapeHtml(p.theme)+'"'+
    ' data-drop-caps="'+(p.dropCaps ? 'on' : 'off')+'"'+
    ' style="--reader-font:'+DAL.readerFontStack(p.font)+';--reader-scale:'+size.scale+';--reader-spacing:'+spacing.value+(extraStyle?';'+extraStyle:'')+'"';
};

/* The reading controls are built once and reused by both book readers, so the
   Book Preview an author checks their work in and the reader their audience
   opens can never offer different settings. */
DAL.readerControlsBody = function(labelled){
  var p = DAL.readerPrefs();
  function options(list, current, idKey, labelKey){
    return list.map(function(o){
      return '<option value="'+o[idKey]+'"'+(current === o[idKey] ? ' selected' : '')+'>'+DAL.escapeHtml(o[labelKey])+'</option>';
    }).join('');
  }
  /* The sheet has room for real labels; the toolbar strip does not, so there the
     same controls rely on their title and aria-label. */
  function field(label, inner){
    return labelled
      ? '<label class="reader-field"><span class="reader-field-label">'+label+'</span>'+inner+'</label>'
      : inner;
  }
  return field('Typeface',
      '<select class="form-select reader-select" data-action="reader-font" title="Typeface" aria-label="Typeface">'+
        options(DAL.READER_FONTS, p.font, 'id', 'label')+'</select>')+
    field('Text size',
      '<select class="form-select reader-select" data-action="reader-text-size" title="Text size" aria-label="Text size">'+
        options(DAL.READER_SIZES, p.size, 'id', 'label')+'</select>')+
    field('Line spacing',
      '<select class="form-select reader-select" data-action="reader-spacing" title="Line spacing" aria-label="Line spacing">'+
        options(DAL.READER_SPACING, p.spacing, 'id', 'label')+'</select>')+
    field('Page tint',
      '<select class="form-select reader-select" data-action="reader-theme" title="Page tint" aria-label="Page tint">'+
        '<option value="parchment"'+(p.theme==='parchment'?' selected':'')+'>Parchment</option>'+
        '<option value="paper"'+(p.theme==='paper'?' selected':'')+'>Paper</option>'+
        '<option value="night"'+(p.theme==='night'?' selected':'')+'>Night</option>'+
        '<option value="sepia"'+(p.theme==='sepia'?' selected':'')+'>Sepia</option>'+
      '</select>')+
    '<button class="btn sm reader-dropcap-btn'+(p.dropCaps ? ' active' : '')+'" data-action="reader-drop-caps" '+
      'aria-pressed="'+(p.dropCaps ? 'true' : 'false')+'" title="Drop capitals at the start of each chapter">Drop caps</button>';
};

DAL.readerControls = function(opts){
  opts = opts || {};
  var withReadAloud = opts.readAloud !== false;
  return '<div class="reader-controls">'+
    ((withReadAloud && DAL.readAloudButton) ? DAL.readAloudButton() : '')+
    /* On a phone four stacked selects filled a quarter of the screen, so there
       the strip collapses to this one button and the controls open in a sheet.
       Both are always in the markup; the stylesheet decides which is shown. */
    '<button class="btn sm reader-settings-btn" data-action="reader-settings" '+
      'aria-label="Reading settings" title="Reading settings">Aa</button>'+
    '<span class="reader-controls-inline">'+DAL.readerControlsBody(false)+'</span>'+
  '</div>';
};

/* The phone sheet: the same controls, with labels, in a dialog. */
DAL.openReaderSettings = function(){
  DAL.modal('Reading settings',
    '<div class="reader-sheet">'+DAL.readerControlsBody(true)+'</div>',
    { footer: '<button class="btn primary" data-action="close-modal">Done</button>' });
};

/* One handler for every reading control, called from the click dispatcher and
   from the select-change dispatcher, so a preference cannot behave differently
   depending on which reader is open. Returns true when it took the action. */
DAL.applyReaderPref = function(action, el){
  if(action === 'reader-settings'){ DAL.openReaderSettings(); return true; }
  var prefs = DAL.readerPrefs(), touched = true;
  if(action === 'reader-theme'){ prefs.theme = el.value; DAL.readerTheme = el.value; }
  else if(action === 'reader-font'){ prefs.font = el.value; }
  else if(action === 'reader-text-size'){ prefs.size = el.value; }
  else if(action === 'reader-spacing'){ prefs.spacing = el.value; }
  else if(action === 'reader-drop-caps'){ prefs.dropCaps = !prefs.dropCaps; }
  else touched = false;
  if(!touched) return false;
  DAL.saveState(true);
  /* Repainting the open reader in place keeps the reader's page, scroll position
     and any narration running, which a full re-render would throw away. */
  var size = DAL.READER_SIZES.filter(function(s){ return s.id === prefs.size; })[0] || DAL.READER_SIZES[1];
  var spacing = DAL.READER_SPACING.filter(function(s){ return s.id === prefs.spacing; })[0] || DAL.READER_SPACING[1];
  var shells = document.querySelectorAll('.book-reader, .player-shell');
  for(var i = 0; i < shells.length; i++){
    var shell = shells[i];
    shell.setAttribute('data-book-theme', prefs.theme);
    shell.setAttribute('data-drop-caps', prefs.dropCaps ? 'on' : 'off');
    shell.style.setProperty('--reader-font', DAL.readerFontStack(prefs.font));
    shell.style.setProperty('--reader-scale', size.scale);
    shell.style.setProperty('--reader-spacing', spacing.value);
  }
  if(action === 'reader-drop-caps'){
    /* Both the toolbar strip and the phone sheet can be in the document, so
       every copy of the button is updated rather than only the first. */
    var btns = document.querySelectorAll('.reader-dropcap-btn');
    for(var b = 0; b < btns.length; b++){
      btns[b].classList.toggle('active', !!prefs.dropCaps);
      btns[b].setAttribute('aria-pressed', prefs.dropCaps ? 'true' : 'false');
    }
  }
  return true;
};
DAL.playtestState = null;
DAL.playtestHistory = [];
DAL.playtestStyle = 'book';
DAL._saveTimer = null;
DAL._versionTimer = null;
DAL._lastWordCount = 0;

DAL._memStore = null; // fallback when storage is blocked
DAL.storageHealth = { persistent:false, mode:'memory', lastSavedAt:0, lastError:'', bytes:0 };

// Storage abstraction — uses browser storage when available, in-memory fallback otherwise
DAL._storage = {
  _data: {},
  getItem: function(key){
    try { if(this._key) return window[this._key].getItem(key); } catch(e) { DAL.storageHealth.lastError = e.message || String(e); }
    return this._data[key] || null;
  },
  setItem: function(key, val){
    try {
      if(!this._key) throw new Error('Persistent browser storage is unavailable.');
      window[this._key].setItem(key, val);
      if(window[this._key].getItem(key) !== val) throw new Error('The saved data could not be verified.');
      return true;
    } catch(e) {
      this._data[key] = val;
      DAL.storageHealth.lastError = e && e.message ? e.message : String(e);
      return false;
    }
  },
  removeItem: function(key){
    try { if(this._key) window[this._key].removeItem(key); } catch(e) { DAL.storageHealth.lastError = e.message || String(e); }
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
    DAL.storageHealth.mode = 'localStorage';
    DAL.storageHealth.persistent = true;
    return true;
  } catch(e) {
    DAL._storage._key = null;
    DAL.storageHealth.mode = 'memory';
    DAL.storageHealth.persistent = false;
    DAL.storageHealth.lastError = e && e.message ? e.message : String(e);
    return false;
  }
};

DAL.stateDB = (function(){
  var opened = null, name = 'draftALoreState', storeName = 'workspace';
  function open(){
    if(opened) return opened;
    opened = new Promise(function(resolve, reject){
      if(typeof indexedDB === 'undefined'){ reject(new Error('IndexedDB is unavailable.')); return; }
      var req = indexedDB.open(name, 1);
      req.onupgradeneeded = function(){ if(!req.result.objectStoreNames.contains(storeName)) req.result.createObjectStore(storeName, { keyPath:'id' }); };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error || new Error('Could not open the workspace database.')); };
    });
    opened.catch(function(){ opened = null; });
    return opened;
  }
  function tx(mode, run){
    return open().then(function(db){ return new Promise(function(resolve, reject){
      var transaction = db.transaction(storeName, mode), request = run(transaction.objectStore(storeName));
      transaction.oncomplete = function(){ resolve(request && request.result); };
      transaction.onerror = function(){ reject(transaction.error || new Error('Workspace database transaction failed.')); };
      transaction.onabort = function(){ reject(transaction.error || new Error('Workspace database transaction was aborted.')); };
    }); });
  }
  return {
    get:function(){ return tx('readonly', function(store){ return store.get('current'); }); },
    put:function(json, savedAt){ return tx('readwrite', function(store){ return store.put({ id:'current', json:json, savedAt:savedAt }); }); },
    remove:function(){ return tx('readwrite', function(store){ return store.delete('current'); }); }
  };
})();

DAL.finishStateLoad = function(){
  if(!DAL.state.projects) DAL.state.projects = {};
  if(!DAL.state.projectOrder) DAL.state.projectOrder = [];
  if(!DAL.state.customFonts) DAL.state.customFonts = [];
  if(!DAL.state.wordHistory) DAL.state.wordHistory = {};
  if(!DAL.state.clipboard) DAL.state.clipboard = [];
  if(!DAL.state.panels) DAL.state.panels = {};
  Object.keys(DAL.state.projects).forEach(function(id){
    var proj = DAL.state.projects[id];
    if(!Array.isArray(proj.history)) proj.history = [];
    if(!Array.isArray(proj.redoStack)) proj.redoStack = [];
    if(DAL.writerProject) DAL.writerProject(proj);
  });
  DAL.migrateWordHistory();
  DAL.normalizeDashboardLayout();
  if(!DAL.analyticsRange(DAL.state.analyticsRange)) DAL.state.analyticsRange = '30d';
  DAL.state.autosave = (DAL.state.autosave !== false);
};

DAL.loadState = function(){
  DAL._initStorage();
  var saved = DAL._storage.getItem('draftALore'), localState = null;
  try{
    localState = saved ? DAL.normalizeWorkspace(JSON.parse(saved), false) : null;
  } catch(e){
    /* Keep the unreadable bytes recoverable. Never silently overwrite the only
       copy of a damaged workspace with a blank default. */
    try{ if(saved) window.localStorage.setItem('draftALoreRecovery-'+Date.now(), saved); }catch(ignore){}
    DAL._loadWarning = 'Saved data could not be read. A recovery copy was preserved on this device.';
  }
  var localSavedAt = parseInt(DAL._storage.getItem('draftALoreSavedAt'), 10) || 0;
  return DAL.stateDB.get().then(function(record){
    if(record && record.json && (!localState || (record.savedAt || 0) >= localSavedAt)){
      try{ DAL.state = DAL.normalizeWorkspace(JSON.parse(record.json), false); }
      catch(recordError){
        try{ window.localStorage.setItem('draftALoreRecovery-'+Date.now(), record.json); }catch(ignoreRecordRecovery){}
        DAL._loadWarning = 'The newest saved workspace was damaged. A recovery copy was preserved and the last readable copy was opened.';
        throw recordError;
      }
      DAL.storageHealth.mode = 'indexedDB';
      DAL.storageHealth.lastSavedAt = record.savedAt || 0;
      DAL.storageHealth.bytes = new Blob([record.json]).size;
    } else {
      DAL.state = localState || DAL.defaultState();
      if(localState){ DAL.storageHealth.lastSavedAt = localSavedAt; DAL.storageHealth.bytes = new Blob([saved]).size; }
    }
  }).catch(function(e){
    DAL.state = localState || DAL.defaultState();
    if(!localState) DAL.storageHealth.lastError = e && e.message ? e.message : String(e);
  }).then(function(){ DAL.finishStateLoad(); return DAL.state; });
};

DAL.saveState = function(immediate){
  if(immediate){ return DAL._doSave(); }
  if(DAL._saveTimer) clearTimeout(DAL._saveTimer);
  DAL.setSaveStatus('saving');
  DAL._saveTimer = setTimeout(function(){
    DAL._doSave();
    DAL._saveTimer = null;
  }, 450);
};

DAL._saveChain = Promise.resolve();
DAL._doSave = function(){
  try{
    DAL.checkVersionSnapshot();
    var toSave = Object.assign({}, DAL.state, { projects:{} });
    for(var pid in DAL.state.projects){
      var sourceProject = DAL.state.projects[pid];
      toSave.projects[pid] = Object.assign({}, sourceProject);
      delete toSave.projects[pid].folderHandle;
      /* Undo remains fully available for the running session. Persisting dozens
         of complete project copies made long manuscripts exceed browser quotas. */
      toSave.projects[pid].history = [];
      toSave.projects[pid].redoStack = [];
      toSave.projects[pid].historyIndex = -1;
    }
    var jsonStr = JSON.stringify(toSave);
    var savedAt = Date.now();
    DAL.storageHealth.bytes = new Blob([jsonStr]).size;
    var localOk = DAL._storage.setItem('draftALore', jsonStr);
    if(localOk) DAL._storage.setItem('draftALoreSavedAt', String(savedAt));
    DAL._saveChain = DAL._saveChain.catch(function(){ return null; }).then(function(){ return DAL.stateDB.put(jsonStr, savedAt); });
    return DAL._saveChain.then(function(){
      DAL.storageHealth.persistent = true;
      DAL.storageHealth.mode = 'indexedDB';
      DAL.storageHealth.lastSavedAt = savedAt;
      DAL.storageHealth.lastError = '';
      DAL.setSaveStatus('saved');
      DAL.queueFolderSync();
      return true;
    }).catch(function(dbError){
      if(localOk){
        DAL.storageHealth.persistent = true; DAL.storageHealth.mode = 'localStorage'; DAL.storageHealth.lastSavedAt = savedAt;
        DAL.setSaveStatus('saved'); DAL.queueFolderSync(); return true;
      }
      DAL.storageHealth.persistent = false; DAL.storageHealth.mode = 'memory';
      DAL.storageHealth.lastError = dbError && dbError.message ? dbError.message : DAL.storageHealth.lastError;
      DAL.setSaveStatus('memory');
      DAL.toast('Work is only in memory: '+DAL.storageHealth.lastError+'. Download a workspace backup now.', 'error');
      return false;
    });
  } catch(e){
    DAL.storageHealth.lastError = e.message || String(e);
    DAL.setSaveStatus('error');
    DAL.toast('Save failed: '+e.message, 'error');
    return false;
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
  else if(status === 'memory'){ cls = 'error'; label = 'Memory only'; tooltip = 'Persistent storage failed. Download a backup before closing.'; }
  else if(status === 'unsaved'){ cls = 'unsaved'; label = 'Unsaved'; tooltip = 'Not yet saved on this device'; }
  else { cls = 'ripple'; label = 'Saved'; tooltip = 'Saved on this device'; }
  dots.forEach(function(dot){ dot.className = 'save-dot ' + cls; });
  texts.forEach(function(t){ t.textContent = label; });
  indicators.forEach(function(indicator){ indicator.title = tooltip; });
  if(cls === 'ripple'){
    setTimeout(function(){ dots.forEach(function(d){ d.classList.remove('ripple'); }); }, 400);
  }
};
DAL.VERSION_BYTES_MAX = 30 * 1024 * 1024;
DAL.trimVersions = function(proj){
  if(!proj || !Array.isArray(proj.versions)) return;
  while(proj.versions.length > 25) proj.versions.shift();
  while(proj.versions.length > 3 && new Blob([JSON.stringify(proj.versions)]).size > DAL.VERSION_BYTES_MAX){
    var autoIndex=proj.versions.findIndex(function(version){return version.auto;});
    proj.versions.splice(autoIndex>=0?autoIndex:0,1);
  }
};
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
    DAL.trimVersions(proj);
  }
};

/* Project history stores pre-change snapshots; a new edit clears redo. */
DAL.HISTORY_MAX = 40;

// Fields that describe history or live handles, never the content being edited.
DAL.HISTORY_EXCLUDE = ['history', 'redoStack', 'historyIndex', 'versions', 'folderHandle'];

DAL.snapshotProject = function(proj){
  var snap = DAL.clone(proj);
  DAL.HISTORY_EXCLUDE.forEach(function(k){ delete snap[k]; });
  return snap;
};

/* Restore in place so every existing reference to the project object stays
   valid. Keys the snapshot lacks are dropped, otherwise undoing an addition
   would leave the added field behind. */
DAL.applySnapshot = function(proj, snap){
  Object.keys(proj).forEach(function(k){
    if(DAL.HISTORY_EXCLUDE.indexOf(k) < 0 && !(k in snap)) delete proj[k];
  });
  Object.assign(proj, snap);
};

DAL.pushHistory = function(){
  var proj = DAL.currentProjectId && DAL.state.projects[DAL.currentProjectId];
  if(!proj) return;
  if(!proj.history) proj.history = [];
  proj.history.push(DAL.snapshotProject(proj));
  if(proj.history.length > DAL.HISTORY_MAX) proj.history.shift();
  proj.redoStack = [];
  proj.historyIndex = proj.history.length - 1;
};

// Move one step between the two stacks; shared by undo and redo.
DAL.stepHistory = function(fromKey, toKey, message, emptyMessage){
  var proj = DAL.currentProjectId && DAL.state.projects[DAL.currentProjectId];
  if(!proj) return;
  if(!proj[fromKey] || !proj[fromKey].length){ DAL.toast(emptyMessage, 'warning'); return; }
  if(!proj[toKey]) proj[toKey] = [];
  proj[toKey].push(DAL.snapshotProject(proj));
  DAL.applySnapshot(proj, proj[fromKey].pop());
  proj.historyIndex = (proj.history || []).length - 1;
  DAL.saveState(); DAL.render();
  DAL.toast(message, 'info');
};

/* Manuscript text uses the browser's contenteditable undo stack. */
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
  // Keep project state in sync if a browser omits the input event.
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
  if(DAL.state.autosave === false){ DAL.setSaveStatus('unsaved'); }
  else { DAL.saveState(); }
  var wc = DAL.countWords(ed.innerHTML);
  var area = ed.closest('.editor-area');
  var footer = area ? area.querySelector('.editor-footer span') : null;
  if(footer) footer.textContent = wc + ' words';
};

DAL.undo = function(){
  if(DAL._driveEditorCommand('undo', 'Text change undone')) return;
  DAL.stepHistory('history', 'redoStack', 'Project change undone', 'No project change to undo');
};

DAL.redo = function(){
  if(DAL._driveEditorCommand('redo', 'Text change redone')) return;
  DAL.stepHistory('redoStack', 'history', 'Project change redone', 'No project change to redo');
};
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

/* Daily word history
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

/* Goal periods
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

/* Per-project goals
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

/* Analytics buckets
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



/* Dashboard layout
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

/* Canvas view (story graph + mind map)
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
DAL.modal = function(title, contentHTML, opts){
  opts = opts || {};
  DAL.closeModal();
  DAL._modalReturnFocus = document.activeElement;
  var backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'modalBackdrop';
  var titleId = 'modalTitle-'+DAL.uid('title');
  var inner = '<div class="modal' + (opts.wide?' wide':'') + '" role="dialog" aria-modal="true" aria-labelledby="'+titleId+'" tabindex="-1">';
  inner += '<div class="modal-header"><div class="modal-title" id="'+titleId+'">'+DAL.escapeHtml(title)+'</div><button class="modal-close" data-action="close-modal" aria-label="Close dialog">&times;</button></div>';
  inner += '<div class="modal-body">'+contentHTML+'</div>';
  if(opts.footer) inner += '<div class="modal-footer">'+opts.footer+'</div>';
  inner += '</div>';
  backdrop.innerHTML = inner;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', function(e){
    if(e.target === backdrop) DAL.closeModal();
  });
  backdrop.addEventListener('keydown', function(e){
    if(e.key !== 'Tab') return;
    var focusable = Array.from(backdrop.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'));
    if(!focusable.length){ e.preventDefault(); backdrop.querySelector('.modal').focus(); return; }
    var first = focusable[0], last = focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
  var initial = backdrop.querySelector('[autofocus],input:not([type="hidden"]),select,textarea,button:not(.modal-close),.modal-close');
  (initial || backdrop.querySelector('.modal')).focus();
  return backdrop;
};

DAL.closeModal = function(){
  var b = document.getElementById('modalBackdrop');
  if(b){
    b.remove();
    var back = DAL._modalReturnFocus; DAL._modalReturnFocus = null;
    if(back && document.contains(back) && back.focus) back.focus();
  }
};

/* Inline help for non-obvious writing and worldbuilding concepts. */
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
DAL.folderHandles = {};
DAL.folderSyncHealth = { status:'idle', lastSyncedAt:0, lastError:'' };
DAL._folderSyncChain = Promise.resolve();
DAL._folderSyncQueued = false;

DAL.nativeFolderPlugin = function(){
  if(DAL._nativeFolderPlugin) return DAL._nativeFolderPlugin;
  var capacitor = window.Capacitor;
  if(!capacitor || (capacitor.getPlatform && capacitor.getPlatform() !== 'android')) return null;
  DAL._nativeFolderPlugin = capacitor.Plugins && capacitor.Plugins.FolderSync;
  if(!DAL._nativeFolderPlugin && typeof capacitor.registerPlugin === 'function'){
    DAL._nativeFolderPlugin = capacitor.registerPlugin('FolderSync');
  }
  return DAL._nativeFolderPlugin || null;
};

/* Coalesce rapid editor saves and serialize disk writes. A second save that
   lands during a write schedules one more pass with the newest state. */
DAL.queueFolderSync = function(){
  if(DAL._suppressFolderSync) return;
  if(!DAL.currentProjectId || !DAL.folderHandles[DAL.currentProjectId]) return;
  DAL._folderSyncQueued = true;
  DAL._folderSyncChain = DAL._folderSyncChain.then(async function(){
    while(DAL._folderSyncQueued){ DAL._folderSyncQueued = false; await DAL.syncFolder(); }
  }).catch(function(e){
    DAL.folderSyncHealth.status = 'error';
    DAL.folderSyncHealth.lastError = e && e.message ? e.message : String(e);
  });
};

/* True when the browser can hand us a real directory handle.

   The File System Access API is desktop-Chromium only. It is absent in the
   Android WebView the packaged app runs in, in Firefox, and in Safari, so the
   Link Folder button has to say so rather than appearing to do nothing. */
DAL.canLinkFolder = function(){
  return typeof window.showDirectoryPicker === 'function' || !!DAL.nativeFolderPlugin();
};

DAL.linkFolder = async function(projectId){
  var nativePlugin = DAL.nativeFolderPlugin();
  if(nativePlugin){
    try{
      var result = await nativePlugin.chooseFolder({ projectId:projectId });
      if(!result || result.cancelled) return;
      DAL.folderHandles[projectId] = { native:true, name:result.name || 'Android folder', uri:result.uri || '', assetsSynced:false };
      var nativeProject = DAL.state.projects[projectId];
      if(nativeProject) nativeProject.linkedFolderName = result.name || 'Android folder';
      var pendingNativeLabel = document.getElementById('npFolderName');
      if(pendingNativeLabel && DAL._newProjectDraftId === projectId) pendingNativeLabel.textContent = result.name || 'Android folder';
      DAL.saveState(true);
      DAL.toast('Folder linked: '+(result.name || 'Android folder'), 'success');
      DAL.queueFolderSync();
    } catch(nativeError){
      DAL.toast('Failed to link folder: '+(nativeError.message || nativeError), 'error');
    }
    return;
  }
  if(!DAL.canLinkFolder()){
    // A modal rather than a toast: the old warning toast was easy to miss, which
    // made the button look like it did nothing at all. This says what the feature
    // needs and points at the export path that does work here.
    DAL.modal('Folder Sync Unavailable',
      '<p class="folder-sync-note">Linking a folder lets Draft A Lore write your project straight into a folder on your device as plain files, and keep it up to date as you write.</p>'+
      '<p class="folder-sync-note">It relies on the browser\u2019s File System Access API, which today only desktop Chrome, Edge, Brave and Opera provide. This build is running somewhere that does not offer it, so there is no folder picker to open.</p>'+
      '<p class="folder-sync-note"><strong>Use a project bundle instead.</strong> It writes the same content and assets to one portable file you can save anywhere, including a folder your cloud drive syncs.</p>',
      { footer: '<button class="btn" data-action="close-modal">Close</button>'+
                '<button class="btn primary" data-action="save-project-bundle" data-pid="'+projectId+'">Save project bundle (.dalz)</button>' });
    return;
  }
  try{
    var handle = await window.showDirectoryPicker();
    DAL.folderHandles[projectId] = handle;
    var proj = DAL.state.projects[projectId];
    if(proj){ proj.linkedFolderName = handle.name; }
    var pendingDesktopLabel = document.getElementById('npFolderName');
    if(pendingDesktopLabel && DAL._newProjectDraftId === projectId) pendingDesktopLabel.textContent = handle.name;
    DAL.toast('Folder linked: '+handle.name, 'success');
    DAL.saveState(true);
    DAL.queueFolderSync();
  } catch(e){
    if(e.name !== 'AbortError') DAL.toast('Failed to link folder: '+e.message, 'error');
  }
};

DAL.restoreNativeFolderLink = function(projectId){
  var plugin = DAL.nativeFolderPlugin();
  if(!plugin || DAL.folderHandles[projectId]) return Promise.resolve(DAL.folderHandles[projectId] || null);
  DAL._nativeFolderRestore = DAL._nativeFolderRestore || {};
  if(DAL._nativeFolderRestore[projectId]) return DAL._nativeFolderRestore[projectId];
  DAL._nativeFolderRestore[projectId] = plugin.getLinkedFolder({ projectId:projectId }).then(function(result){
    if(!result || !result.linked) return null;
    var handle = { native:true, name:result.name || 'Android folder', uri:result.uri || '', assetsSynced:false };
    DAL.folderHandles[projectId] = handle;
    var dot = document.querySelector('.sync-dot');
    if(DAL.currentProjectId === projectId && dot){ dot.classList.remove('unlinked'); dot.classList.add('linked'); dot.title='Folder linked'; }
    var button = document.querySelector('.ws-folder-btn');
    if(DAL.currentProjectId === projectId && button) button.textContent = 'Change Folder';
    return handle;
  }).catch(function(){ return null; }).finally(function(){ delete DAL._nativeFolderRestore[projectId]; });
  return DAL._nativeFolderRestore[projectId];
};

DAL.syncFolder = async function(){
  if(!DAL.currentProjectId) return;
  var proj = DAL.state.projects[DAL.currentProjectId];
  if(!proj) return;
  var handle = DAL.folderHandles[DAL.currentProjectId];
  if(!handle) return;
  try{
    DAL.folderSyncHealth.status = 'syncing';
    if(DAL.prepareFolderSync && !(await DAL.prepareFolderSync(proj,handle))) return false;
    if(handle.native){
      if(!DAL.syncNativeFolder) throw new Error('Android folder sync is not ready. Restart Draft A Lore and try again.');
      await DAL.syncNativeFolder(proj, handle);
      DAL.folderSyncHealth.status = 'synced';
      DAL.folderSyncHealth.lastSyncedAt = Date.now();
      DAL.folderSyncHealth.lastError = '';
      if(DAL.finishFolderSync) DAL.finishFolderSync(proj,handle);
      return true;
    }
    // Write project.json
    var projectData = DAL.clone(proj);
    delete projectData.folderHandle;
    var data={project:projectData};
    if(proj.bibleId&&DAL.state.bibles&&DAL.state.bibles[proj.bibleId])data.linkedBible=DAL.clone(DAL.state.bibles[proj.bibleId]);
    await DAL.writeFile(handle, 'project.json', JSON.stringify(data, null, 2));
    if(proj.chapters && proj.chapters.length){
      var chDir = await DAL.getDir(handle, 'chapters');
      for(var i=0; i<proj.chapters.length; i++){
        var ch = proj.chapters[i];
        var fname = String(i+1).padStart(2,'0')+'-'+DAL.sanitizeFilename(ch.title)+'.txt';
        var tmp = document.createElement('div'); tmp.innerHTML = ch.contentHTML;
        await DAL.writeFile(chDir, fname, tmp.textContent);
      }
    }
    if(proj.characters && proj.characters.length){
      var chDir2 = await DAL.getDir(handle, 'characters');
      for(var j=0; j<proj.characters.length; j++){
        var c = proj.characters[j];
        await DAL.writeFile(chDir2, DAL.sanitizeFilename(c.name)+'.txt', c.backstory||'');
      }
    }
    if(proj.lore && proj.lore.entries && proj.lore.entries.length){
      var loreDir = await DAL.getDir(handle, 'lore');
      for(var k=0; k<proj.lore.entries.length; k++){
        var entry = proj.lore.entries[k];
        var entryDir = await DAL.getDir(loreDir, DAL.sanitizeFilename(entry.folder||'miscellaneous'));
        await DAL.writeFile(entryDir, DAL.sanitizeFilename(entry.title)+'.txt', entry.content||'');
      }
    }
    if(proj.plots && proj.plots.length){
      var plotDir = await DAL.getDir(handle, 'plots');
      for(var m=0; m<proj.plots.length; m++){
        var p = proj.plots[m];
        await DAL.writeFile(plotDir, DAL.sanitizeFilename(p.title)+'.txt', p.description||'');
      }
    }
    if(DAL.syncAssetFolder) await DAL.syncAssetFolder(handle, proj);
    DAL.folderSyncHealth.status = 'synced';
    DAL.folderSyncHealth.lastSyncedAt = Date.now();
    DAL.folderSyncHealth.lastError = '';
    if(DAL.finishFolderSync) DAL.finishFolderSync(proj,handle);
    return true;
  } catch(e){
    DAL.folderSyncHealth.status = 'error';
    DAL.folderSyncHealth.lastError = e && e.message ? e.message : String(e);
    DAL.toast('Folder sync error: '+e.message, 'error');
    return false;
  }
};

DAL.getDir = async function(parent, name){
  if(!parent) throw new Error('The linked folder is no longer available.');
  return parent.getDirectoryHandle(name, {create:true});
};

DAL.writeFile = async function(dir, name, content){
  if(!dir) throw new Error('A destination folder could not be opened.');
  var file = await dir.getFileHandle(name, {create:true});
  var writable = await file.createWritable();
  try{ await writable.write(content); await writable.close(); }
  catch(e){ try{ await writable.abort(); }catch(ignore){} throw e; }
};
DAL.themeId = function(id){
  // A theme saved by an older or newer copy of the app may not exist here, and
  // an unknown id would leave the page with no palette at all.
  for(var i = 0; i < DAL.THEMES.length; i++){ if(DAL.THEMES[i].id === id) return id; }
  return 'aurora';
};

DAL.setTheme = function(theme){
  DAL.state.appTheme = DAL.themeId(theme);
  document.documentElement.setAttribute('data-theme', DAL.state.appTheme);
  DAL.updateFavicon();
  DAL.saveState(true);
};

DAL.updateFavicon = function(){
  var source = DAL.assetUrl('logo', 'logo.png');
  var image = new Image();
  image.onload = function(){
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    var context = canvas.getContext('2d');
    if(!context) return;
    var style = getComputedStyle(document.documentElement);
    var first = style.getPropertyValue('--c-brand-1').trim() || '#c084fc';
    var second = style.getPropertyValue('--c-brand-3').trim() || '#38bdf8';
    context.drawImage(image, 7, 7, 50, 50);
    context.globalCompositeOperation = 'source-in';
    var mark = context.createLinearGradient(8, 8, 56, 56);
    mark.addColorStop(0, first);
    mark.addColorStop(1, second);
    context.fillStyle = mark;
    context.fillRect(0, 0, 64, 64);
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = style.getPropertyValue('--c-bg').trim() || '#0f1116';
    context.fillRect(0, 0, 64, 64);
    var link = document.querySelector('link[rel~="icon"]') || document.createElement('link');
    link.rel = 'icon';
    link.href = canvas.toDataURL('image/png');
    if(!link.parentNode) document.head.appendChild(link);
  };
  image.src = source;
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

/* Optional online fonts
   System and imported fonts work fully offline. Google Fonts is an explicit,
   saved opt-in because loading it sends a normal network request to Google.
   Chosen online fonts still fall back to a readable system serif offline. */
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
    if(DAL.state.onlineFontsEnabled && DAL.isOnline()) DAL.loadOnlineFonts();
    else DAL.unloadOnlineFonts();
    if(DAL.currentView === 'settings') DAL.render();
  };
  apply();
  window.addEventListener('online', apply);
  window.addEventListener('offline', apply);
};
DAL.refreshOnlineFonts = function(){ if(DAL.state.onlineFontsEnabled && DAL.isOnline()) DAL.loadOnlineFonts(); else DAL.unloadOnlineFonts(); };
DAL.navigate = function(view, projectId, tool){
  if((window.innerWidth || 1024) < DAL.BREAKPOINTS.medium) DAL.state.sidebarCollapsed = true;
  DAL.projectSidebarOpen = false;
  DAL.chapterSidebarOpen = false;
  DAL.currentView = view;
  DAL.currentProjectId = projectId || null;
  DAL.currentTool = tool || null;
  DAL.selectedChapterId = null;
  DAL.selectedCharId = null;
  DAL.selectedPlotId = null;
  DAL.selectedLoreEntry = null;
  DAL.selectedTimelineId = null;
  DAL.selectedNodeId = null;
  DAL.connectMode = false;
  DAL.connectFromNodeId = null;
  DAL.grabMode = false;
  DAL.distractionFree = false;
  DAL.organizeDashboard = false;
  DAL.render();
};

/* Native Android Back follows the visual hierarchy: close the top layer, then
   step out of a tool or screen. False on Dashboard lets Android exit normally. */
DAL.handleAndroidBack = function(){
  if(document.getElementById('dalCtxMenu')){ DAL.closeContextMenu(); return true; }
  if(document.getElementById('dalMenuDropdown')){ DAL.closeMenu(); return true; }
  if(document.getElementById('modalBackdrop')){ DAL.closeModal(); return true; }
  if(DAL.chapterSidebarOpen){ DAL.chapterSidebarOpen=false; document.querySelector('.manuscript-layout')?.classList.remove('chapters-open'); return true; }
  if(DAL.projectSidebarOpen){ DAL.projectSidebarOpen=false; document.querySelector('.workspace')?.classList.remove('project-nav-open'); return true; }
  if((window.innerWidth || 1024) < DAL.BREAKPOINTS.medium && !DAL.state.sidebarCollapsed){
    DAL.state.sidebarCollapsed=true;
    document.querySelector('.sidebar')?.classList.add('collapsed');
    return true;
  }
  if(DAL.distractionFree){ DAL.distractionFree=false; document.body.classList.remove('distraction-free'); DAL.render(); return true; }
  if(DAL.grabMode){ DAL.setGrabMode(false); return true; }
  if(DAL.organizeDashboard){ DAL.organizeDashboard=false; DAL.render(); return true; }
  if(DAL.currentView === 'workspace'){
    if(DAL.selectedNodeId){ DAL.selectedNodeId=null; DAL.render(); return true; }
    DAL.navigate('projects'); return true;
  }
  if(DAL.currentView === 'player'){ DAL.navigate('library'); return true; }
  if(DAL.currentView !== 'dashboard'){ DAL.navigate('dashboard'); return true; }
  return false;
};
DAL.render = function(){
  document.documentElement.setAttribute('data-theme', DAL.themeId(DAL.state.appTheme));
  var app = document.getElementById('app');
  if(!app){
    app = DAL.buildShell();
  }
  document.querySelectorAll('.nav-item').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('data-nav') === DAL.currentView);
  });
  app.classList.toggle('in-workspace', DAL.currentView === 'workspace');
  document.querySelector('.sidebar')?.classList.toggle('collapsed', DAL.state.sidebarCollapsed);
  var mainMenuButton = document.querySelector('[data-action="toggle-sidebar"]');
  if(mainMenuButton) mainMenuButton.setAttribute('aria-expanded', String(!DAL.state.sidebarCollapsed));
  if(DAL.ensureScrim) DAL.ensureScrim();

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
    DAL.afterRender();
    return;
  }

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
  } else if(DAL.currentView === 'player'){
    if(topTitle) topTitle.textContent = 'Adventure';
    content.innerHTML = DAL.renderPlayer();
  } else if(DAL.currentView === 'settings'){
    if(topTitle) topTitle.textContent = 'Settings';
    content.innerHTML = DAL.renderSettings();
  }

  DAL.afterRender();
};

DAL.afterRenderHandlers = [];
DAL.registerAfterRender = function(handler){ if(typeof handler==='function') DAL.afterRenderHandlers.push(handler); };
DAL.afterRender = function(){ DAL.afterRenderHandlers.slice().forEach(function(handler){ handler(); }); };
DAL.registerAfterRender(function(){ DAL.initChartReadouts(); });
DAL.actionHandlers = [];
DAL.registerActionHandler = function(handler){ if(typeof handler==='function') DAL.actionHandlers.push(handler); };

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

/* Source for a bundled image asset.

   The web build embeds assets as data URIs on window.DAL_ASSETS so the built
   HTML is a single self-contained file. When src/ is served directly, or the
   asset was not embedded, this falls back to the plain filename beside the page. */
DAL.assetUrl = function(name, fallback){
  var assets = window.DAL_ASSETS;
  return (assets && assets[name]) || fallback;
};
DAL.buildShell = function(){
  var app = document.createElement('div');
  app.id = 'app';
  app.innerHTML =
    '<aside class="sidebar" id="sidebar">'+
      '<div class="sidebar-logo">'+
        '<span class="sidebar-logo-mark" role="img" aria-label="Draft A Lore"></span>'+
        '<span class="brand-text">Draft A Lore</span>'+
      '</div>'+
      '<nav class="sidebar-nav">'+
        '<div class="nav-item" data-nav="dashboard" data-action="nav-dashboard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span class="nav-label">Dashboard</span></div>'+
        '<div class="nav-item" data-nav="projects" data-action="nav-projects"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span class="nav-label">Projects</span></div>'+
        '<div class="nav-item" data-nav="library" data-action="nav-library"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h4v16H4z"/><path d="M10 4h4v16h-4z"/><path d="M17.5 4.5l3.2.8-3.4 14.2-3.2-.8z"/></svg><span class="nav-label">Library</span></div>'+
        '<div class="nav-item" data-nav="settings" data-action="nav-settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span class="nav-label">Settings</span></div>'+
      '</nav>'+
    '</aside>'+
    '<div class="main">'+
      '<div class="topbar">'+
        '<button class="topbar-btn" data-action="toggle-sidebar" aria-label="Open main menu" aria-controls="sidebar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>'+
        '<div class="topbar-title" id="topTitle">Dashboard</div>'+
        '<div class="search-box" id="searchBox" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" id="searchInput" placeholder="Search project..." data-action="search"></div>'+
      '</div>'+
      '<div class="content" id="content"></div>'+
    '</div>'+
    '<div class="toast-container" id="toastContainer"></div>';
  document.body.innerHTML = '';
  document.body.appendChild(app);
  var logoMark = app.querySelector('.sidebar-logo-mark');
  var logoUrl = DAL.assetUrl('logo', 'logo.png');
  logoMark.style.webkitMaskImage = 'url("'+logoUrl+'")';
  logoMark.style.maskImage = 'url("'+logoUrl+'")';
  DAL.initInfoTips();
  return app;
};

/* Adaptive Viewport
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
    var button = document.querySelector('[data-action="toggle-sidebar"]');
    if(button) button.setAttribute('aria-expanded', 'false');
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
DAL.requestPersistentStorage = function(){
  if(!navigator.storage) return Promise.resolve(false);
  var check = navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false);
  return check.then(function(already){
    if(already || !navigator.storage.persist) return already;
    return navigator.storage.persist();
  }).then(function(granted){ DAL.storageHealth.durable = !!granted; return !!granted; })
    .catch(function(){ DAL.storageHealth.durable = false; return false; });
};

DAL.init = function(){
  return DAL.loadState().catch(function(e){
    DAL.state = DAL.defaultState(); DAL.finishStateLoad();
    DAL._loadWarning = 'The workspace database could not be opened: '+(e && e.message ? e.message : 'unknown error');
  }).then(function(){
    DAL.requestPersistentStorage();
    DAL.loadCustomFonts();
    DAL.initOnlineFonts();
    DAL.buildShell();
    DAL.initAdaptive();
    DAL.render();
    DAL.updateFavicon();
    if(DAL._loadWarning){ DAL.toast(DAL._loadWarning, 'error'); DAL._loadWarning = ''; }

    // The localStorage mirror is written synchronously before the asynchronous
    // IndexedDB write, so manual-save mode still has an unload safety net.
    window.addEventListener('beforeunload', function(){
      if(DAL.state && DAL.state.autosave === false){ DAL.saveState(true); }
    });

    // Restore folder handles on load (need re-permission)
    // Note: File System Access API handles don't persist across sessions without re-granting

    setInterval(function(){ DAL.checkVersionSnapshot(); }, 60000);
    setInterval(function(){ DAL.updateWordHistory(); }, 30000);
  });
};

/* Themes
   One registry behind the Settings picker and the View menu, so adding a theme
   means adding its block in styles.css and one line here. Ids are stored in
   state.appTheme; never rename an existing id or saved settings break. */
DAL.THEMES = [
  { id:'aurora', name:'Aurora' },
  { id:'dark', name:'Midnight Ink' },
  { id:'light', name:'Daylight' },
  { id:'fantasy-dark', name:'Emberhold' },
  { id:'fantasy-light', name:'Gilded Vellum' },
  { id:'nebula', name:'Nebula' },
  { id:'ember', name:'Ember' },
  { id:'sakura', name:'Sakura' },
  { id:'moss', name:'Moss' },
  { id:'slate', name:'Slate' }
];

/* Workspace Menu Bar (File / Edit / View)
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
      { label: 'Word manuscript (.docx)', action: 'export-manuscript-docx' },
      { label: 'Portable project bundle (.dalz)', action: 'save-project-bundle' },
      { label: 'All export options…',    action: 'export-project' }
    ] },
    { label: 'Whole workspace', submenu: [
      { label: 'Download backup of all projects (.json)', action: 'backup-workspace' },
      { label: 'Restore backup of all projects…',         action: 'restore-workspace' }
    ] }
  ],
  edit: [
    { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
    { divider: true },
    { label: 'Copy',  action: 'edit-copy',  shortcut: 'Ctrl+C', when: 'selection' },
    { label: 'Cut',   action: 'edit-cut',   shortcut: 'Ctrl+X', when: 'selection' },
    { label: 'Paste', action: 'edit-paste', shortcut: 'Ctrl+V', when: 'clipboard' },
    { label: 'Duplicate', action: 'edit-duplicate', shortcut: 'Ctrl+D', when: 'selection' },
    { label: 'Delete',    action: 'edit-delete', shortcut: 'Del', danger: true, when: 'selection' },
    { divider: true },
    { label: 'Select All', action: 'edit-select-all', shortcut: 'Ctrl+A' },
    { label: 'Clipboard Board…', action: 'show-clipboard', shortcut: 'Ctrl+Shift+V' },
    { divider: true },
    { label: 'Find & Replace…', action: 'show-find', shortcut: 'Ctrl+F', when: 'writing' },
    { label: 'Find Next',       action: 'find-next', shortcut: 'F3', when: 'writing' }
  ],
  view: [
    { label: 'Theme', submenu: DAL.THEMES.map(function(t){
      return { label: t.name, action: 'set-theme', attr: t.id };
    }) },
    { divider: true },
    { label: 'Toggle Sidebar', action: 'toggle-sidebar', shortcut: 'Ctrl+\\' },
    { label: 'Focus Mode',     action: 'fullscreen',     shortcut: 'F11' },
    { label: 'Typewriter Scrolling', action: 'toggle-typewriter', when: 'writing' },
    { divider: true },
    { label: 'Zoom In',        action: 'sg-zoom-in',  shortcut: 'Ctrl+=', when: 'canvas' },
    { label: 'Zoom Out',       action: 'sg-zoom-out', shortcut: 'Ctrl+-', when: 'canvas' },
    { label: 'Reset Zoom',     action: 'sg-reset',    shortcut: 'Ctrl+0', when: 'canvas' },
    { divider: true },
    { label: 'Expand All Panels',   action: 'panels-expand' },
    { label: 'Collapse All Panels', action: 'panels-collapse' }
  ],
  tools: [
    { label: 'Search Entire Project…', action: 'project-search', shortcut: 'Ctrl+K' },
    { divider: true },
    { label: 'Version History…',   action: 'show-versions' },
    { label: 'Take Snapshot',      action: 'take-snapshot' },
    { divider: true },
    { label: 'Writing Sprint…',    action: 'show-sprint' },
    { label: 'Sprint Timer',       action: 'toggle-sprint-widget' },
    { label: 'Manuscript Report…', action: 'show-readability' },
    { label: 'Comments…',          action: 'show-comments' },
    { label: 'Review & Annotations…', action: 'writer-review', when: 'writing' },
    { label: 'Document Outline…', action: 'writer-outline', when: 'writing' },
    { label: 'References…', action: 'writer-references', when: 'writing' },
    { divider: true },
    { label: 'Story Structure Templates…', action: 'show-beats', when: 'writing' },
    { label: 'Corkboard',          action: 'show-corkboard', when: 'writing' },
    { divider: true },
    { label: 'Check Adventure Integrity…', action: 'show-integrity', when: 'adventure' }
  ]
};

DAL.activeProject = function(){
  return DAL.currentProjectId ? DAL.state.projects[DAL.currentProjectId] : null;
};

/* Whether a menu item applies right now. Items keyed to the other kind of
   project are dropped from the menu entirely, because a novelist never wants an
   adventure command; items that are merely unavailable at this moment stay
   visible but greyed, which is how a desktop menu teaches its own shortcuts. */
DAL.MENU_WHEN = {
  writing: function(p){ return !!p && p.type !== 'rpg'; },
  adventure: function(p){ return !!p && p.type !== 'novel'; },
  canvas: function(){ return DAL.currentTool === 'storygraph' || DAL.currentTool === 'mindmap'; },
  selection: function(){ return !!DAL.selection; },
  clipboard: function(){ return DAL.clipboard().length > 0; }
};

// Items whose condition describes the project, not the moment: hide, don't grey.
DAL.MENU_HIDE_WHEN = { writing: true, adventure: true };

DAL.menuItems = function(key){
  var defs = DAL.MENUS[key];
  if(!defs) return null;
  var proj = DAL.activeProject();
  var out = [];
  defs.forEach(function(item){
    if(item.when){
      var test = DAL.MENU_WHEN[item.when];
      if(test && !test(proj)){
        if(DAL.MENU_HIDE_WHEN[item.when]) return;
        item = Object.assign({}, item, { disabled: true });
      }
    }
    out.push(item);
  });
  // Hiding items can strip a group bare and leave stacked or trailing dividers.
  return out.filter(function(item, i){
    if(!item.divider) return true;
    if(!out.slice(0, i).some(function(p){ return !p.divider; })) return false;
    if(!out.slice(i + 1).some(function(n){ return !n.divider; })) return false;
    return !out[i - 1] || !out[i - 1].divider;
  });
};

DAL.closeMenu = function(){
  var m = document.getElementById('dalMenuDropdown');
  if(m) m.remove();
  DAL._openMenuKey = null;
  document.removeEventListener('click', DAL._menuOutsideHandler, true);
};

DAL.toggleMenu = function(trigger, key){
  var wasOpen = DAL._openMenuKey === key;
  DAL.closeMenu();
  // Clicking the open menu's own button closes it rather than reopening.
  if(wasOpen) return;
  var items = DAL.menuItems(key);
  if(!items || !items.length) return;
  var dd = document.createElement('div');
  dd.id = 'dalMenuDropdown';
  dd.className = 'menu-dropdown';
  dd.innerHTML = DAL.menuHtml(items);
  document.body.appendChild(dd);
  DAL.bindSubmenus(dd, items);
  DAL.bindMenuKeyboard(dd);
  var r = trigger.getBoundingClientRect();
  DAL.clampToViewport(dd, r.left, r.bottom + 4);
  DAL._openMenuKey = key;
  var firstItem = dd.querySelector('.menu-item:not(.disabled)');
  if(firstItem) firstItem.focus();
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
    if(DAL.closeContextMenu) DAL.closeContextMenu();
    return;
  }
  if(action === 'nav-dashboard') DAL.navigate('dashboard');
  else if(action === 'nav-projects') DAL.navigate('projects');
  else if(action === 'nav-settings') DAL.navigate('settings');
  else if(action === 'nav-library') DAL.navigate('library');
  else if(action === 'toggle-sidebar'){
    DAL.state.sidebarCollapsed = !DAL.state.sidebarCollapsed;
    DAL.saveState(true);
    document.querySelector('.sidebar')?.classList.toggle('collapsed', DAL.state.sidebarCollapsed);
    var menuButton = document.querySelector('[data-action="toggle-sidebar"]');
    if(menuButton) menuButton.setAttribute('aria-expanded', String(!DAL.state.sidebarCollapsed));
  }
  else if(action === 'manual-save'){ Promise.resolve(DAL.saveState(true)).then(function(ok){ DAL.toast(ok?'Saved':'Save failed',ok?'success':'error'); }); }
  else if(action === 'toggle-autosave'){ DAL.state.autosave = !DAL.state.autosave; DAL.saveState(true); DAL.render(); DAL.toast('Automatic saving on this device is '+(DAL.state.autosave ? 'on.' : 'off.'),'info'); }
  else if(action === 'toggle-online-fonts'){
    DAL.state.onlineFontsEnabled = !DAL.state.onlineFontsEnabled;
    DAL.saveState(true); DAL.refreshOnlineFonts(); DAL.render();
    DAL.toast(DAL.state.onlineFontsEnabled ? 'Online fonts enabled. Google Fonts will be contacted while online.' : 'Online fonts disabled.', 'info');
  }
  else if(action === 'show-privacy-policy') DAL.showPrivacyPolicy();
  else if(action === 'save-as'){ DAL.showSaveAsModal(); }
  else if(action === 'undo') DAL.undo();
  else if(action === 'redo') DAL.redo();
  else if(action === 'close-modal') DAL.closeModal();
  // Universal editing commands, resolved against whatever is selected.
  else if(['edit-select-all','edit-paste','edit-copy','edit-cut','edit-duplicate','edit-delete'].indexOf(action) >= 0){ DAL.handleEditAction(action); return; }
  else if(action === 'toggle-panel'){ DAL.togglePanel(el.getAttribute('data-panel'), el); return; }
  else if(action === 'panels-expand' || action === 'panels-collapse'){ DAL.setAllPanels(action === 'panels-expand'); return; }
  else if(action === 'show-clipboard'){ DAL.showClipboardBoard(); return; }
  else if(action === 'clip-paste'){
    var pasteEntry = DAL.clipboard().find(function(c){ return c.id === el.getAttribute('data-clip'); });
    DAL.closeModal();
    if(!DAL.clipPasteEntry(pasteEntry)) DAL.toast('That cannot be pasted here', 'info');
    return;
  }
  else if(action === 'clip-remove'){
    DAL.state.clipboard = DAL.clipboard().filter(function(c){ return c.id !== el.getAttribute('data-clip'); });
    DAL.saveState(true);
    DAL.showClipboardBoard();
    return;
  }
  else if(action === 'clip-clear'){
    DAL.state.clipboard = [];
    DAL.saveState(true);
    DAL.showClipboardBoard();
    return;
  }
  for(var handlerIndex=0;handlerIndex<DAL.actionHandlers.length;handlerIndex++){
    if(DAL.actionHandlers[handlerIndex](action,el,e)===true) return;
  }
  // Delegates to the original view-specific handler after registered modules.
  if(DAL.handleClick) DAL.handleClick(action, el, e);
};
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-action]');
  if(!el) return;
  var action = el.getAttribute('data-action');
  e.preventDefault();
  e.stopPropagation();
  DAL.runAction(action, el, e);
});

/* Keyboard shortcuts
   Anything typed into a field belongs to the field: the browser's own editing
   shortcuts must keep working there, so app-level bindings that would collide
   with text editing are skipped while a field has focus. Save, find and the
   clipboard board are deliberate exceptions, since those read as app commands
   wherever the cursor happens to be. */

DAL.inTextField = function(target){
  if(!target) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
};

/* Actions routed by shortcut go through runAction so a key press and a menu
   click can never drift apart. */
DAL.fireAction = function(action){
  DAL.runAction(action, document.body, {});
};

document.addEventListener('keydown', function(e){
  var typing = DAL.inTextField(e.target);
  var mod = e.ctrlKey || e.metaKey;

  if(mod && e.shiftKey && (e.key === 'V' || e.key === 'v')){ e.preventDefault(); DAL.showClipboardBoard(); return; }

  if(mod && !e.shiftKey){
    switch(e.key){
      case 's': e.preventDefault(); Promise.resolve(DAL.saveState(true)).then(function(ok){DAL.toast(ok?'Saved':'Save failed',ok?'success':'error');}); return;
      case 'k': e.preventDefault(); DAL.fireAction('project-search'); return;
      case 'f': e.preventDefault(); DAL.fireAction('show-find'); return;
      case '\\': e.preventDefault(); DAL.fireAction('toggle-sidebar'); return;
      case '=': case '+': if(!typing){ e.preventDefault(); DAL.fireAction('sg-zoom-in'); return; } break;
      case '-': if(!typing){ e.preventDefault(); DAL.fireAction('sg-zoom-out'); return; } break;
      case '0': if(!typing){ e.preventDefault(); DAL.fireAction('sg-reset'); return; } break;
    }
  }

  // Editing keys only apply outside fields, where the app owns the selection.
  if(mod && !typing){
    switch(e.key){
      case 'z': if(!e.shiftKey){ e.preventDefault(); DAL.undo(); return; } break;
      case 'y': e.preventDefault(); DAL.redo(); return;
      case 'c': e.preventDefault(); DAL.fireAction('edit-copy'); return;
      case 'x': e.preventDefault(); DAL.fireAction('edit-cut'); return;
      case 'v': e.preventDefault(); DAL.fireAction('edit-paste'); return;
      case 'd': e.preventDefault(); DAL.fireAction('edit-duplicate'); return;
      case 'a': e.preventDefault(); DAL.fireAction('edit-select-all'); return;
    }
    if(e.key === 'Z' && e.shiftKey){ e.preventDefault(); DAL.redo(); return; }
  }

  if(e.key === 'F3'){ e.preventDefault(); DAL.fireAction('find-next'); return; }
  if(e.key === 'F11'){ e.preventDefault(); DAL.fireAction('fullscreen'); return; }
  if((e.key === 'Delete' || e.key === 'Backspace') && !typing && DAL.selection){ e.preventDefault(); DAL.fireAction('edit-delete'); return; }

  if(e.key === 'Escape'){
    if(document.getElementById('dalCtxMenu')) DAL.closeContextMenu();
    else if(document.getElementById('dalMenuDropdown')) DAL.closeMenu();
    else if(DAL.distractionFree){ DAL.distractionFree = false; document.body.classList.remove('distraction-free'); DAL.render(); }
    else if(DAL.grabMode && !document.querySelector('.modal-backdrop')){ DAL.setGrabMode(false); }
    else if(DAL.organizeDashboard && !document.querySelector('.modal-backdrop')){ DAL.organizeDashboard = false; DAL.render(); }
    else { DAL.closeModal(); }
  }
});
