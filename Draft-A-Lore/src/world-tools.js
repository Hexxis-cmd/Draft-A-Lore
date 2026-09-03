/* Draft A Lore — shared world bibles */
DAL = DAL || {};

DAL.projectBible = function(proj){ return proj && proj.bibleId && DAL.state.bibles ? DAL.state.bibles[proj.bibleId] || null : null; };
DAL.bibleProjects = function(bible){
  return DAL.state.projectOrder.map(function(id){return DAL.state.projects[id];}).filter(function(project){return project&&project.bibleId===bible.id;});
};
DAL.bibleRecords = function(bible, section){
  if(!bible)return [];
  if(section==='lore')return bible.lore.entries;
  return bible[section]||[];
};
DAL.bibleTitle = function(record, section){ return section==='characters'?record.name:(section==='glossary'?record.term:record.title); };
DAL.bibleFactsText = function(record){ return (record.facts||[]).map(function(fact){return fact.key+': '+fact.value;}).join('\n'); };
DAL.parseBibleFacts = function(text){
  return String(text||'').split(/\r?\n/).map(function(line){
    line=line.trim(); if(!line)return null;
    var at=line.indexOf(':');
    return {id:DAL.uid('fact'),key:(at<0?line:line.slice(0,at)).trim(),value:(at<0?'':line.slice(at+1)).trim()};
  }).filter(Boolean);
};

DAL.renderWorldBible = function(proj){
  var bible=DAL.projectBible(proj), html='<div class="world-bible">';
  html+='<div class="section-header"><div><div class="section-title">World Bible</div><p class="writer-muted">A shared, offline source of truth for connected books and campaigns.</p></div></div>';
  if(!bible){
    var options=(DAL.state.bibleOrder||[]).map(function(id){var item=DAL.state.bibles[id];return item?'<option value="'+item.id+'">'+DAL.escapeHtml(item.name)+'</option>':'';}).join('');
    html+='<div class="card bible-welcome"><h3>Connect this project to a world</h3><p>Use one pool of characters, lore, timeline events, and glossary terms across several projects. A project can be detached later without deleting either its manuscript or the Bible.</p>'+
      '<div class="writer-form-grid"><div class="form-group"><label class="form-label">Create a new Bible</label><input class="form-input" id="newBibleName" value="'+DAL.escapeHtml(proj.name+' World')+'"><button class="btn primary" data-action="bible-create">Create and connect</button></div>'+
      '<div class="form-group"><label class="form-label">Connect an existing Bible</label><select class="form-select" id="existingBible">'+(options||'<option value="">No Bibles on this device</option>')+'</select><button class="btn" data-action="bible-link"'+(options?'':' disabled')+'>Connect</button></div></div>'+
      '<button class="btn" data-action="bible-import">Import Bible (.json)</button></div></div>';
    return html;
  }
  var section=DAL._bibleSection||'characters';
  if(['characters','lore','timeline','glossary'].indexOf(section)<0)section='characters';
  var linked=DAL.bibleProjects(bible);
  html+='<div class="bible-head card"><div><strong>'+DAL.escapeHtml(bible.name)+'</strong><div class="writer-muted">Shared by '+linked.length+' project'+(linked.length===1?'':'s')+': '+DAL.escapeHtml(linked.map(function(item){return item.name;}).join(', '))+'</div></div><div class="writer-tool-actions"><button class="btn" data-action="bible-import-project">Add this project’s world records</button><button class="btn" data-action="bible-export">Export Bible</button><button class="btn" data-action="bible-import">Import another</button><button class="btn danger" data-action="bible-unlink">Detach project</button></div></div>';
  html+='<div class="bible-tabs">'+[['characters','Characters'],['lore','Lore'],['timeline','Timeline'],['glossary','Glossary']].map(function(tab){return '<button class="btn'+(tab[0]===section?' primary':'')+'" data-action="bible-section" data-section="'+tab[0]+'">'+tab[1]+' <span class="badge">'+DAL.bibleRecords(bible,tab[0]).length+'</span></button>';}).join('')+'</div>';
  var records=DAL.bibleRecords(bible,section), selected=records.find(function(item){return item.id===DAL._bibleRecordId;});
  html+='<div class="bible-layout"><div class="bible-list"><div class="bible-list-head"><strong>'+section.charAt(0).toUpperCase()+section.slice(1)+'</strong><button class="btn sm primary" data-action="bible-add">+ Add</button></div>';
  if(!records.length)html+='<div class="empty-state compact"><p>No shared '+section+' yet.</p><button class="btn primary" data-action="bible-add">Add the first record</button></div>';
  records.slice().sort(function(a,b){return String(DAL.bibleTitle(a,section)).localeCompare(String(DAL.bibleTitle(b,section)));}).forEach(function(record){html+='<button class="bible-record'+(selected&&selected.id===record.id?' is-selected':'')+'" data-action="bible-select" data-record-id="'+record.id+'"><strong>'+DAL.escapeHtml(DAL.bibleTitle(record,section))+'</strong><span>'+DAL.escapeHtml(section==='timeline'?(record.date||'Undated'):(record.status||record.folder||''))+'</span></button>';});
  html+='</div><div class="bible-editor">'+(selected?DAL.renderBibleEditor(selected,section):'<div class="empty-state compact"><p>Select a record to view and edit it.</p></div>')+'</div></div></div>';
  return html;
};

DAL.renderBibleEditor = function(record, section){
  var titleKey=section==='characters'?'name':(section==='glossary'?'term':'title');
  var html='<div class="form-group"><label class="form-label">'+(section==='glossary'?'Term':section==='characters'?'Name':'Title')+'</label><input class="form-input" data-bible-field="'+titleKey+'" value="'+DAL.escapeHtml(record[titleKey]||'')+'"></div>';
  if(section!=='timeline')html+='<div class="form-group"><label class="form-label">Aliases / alternate names</label><input class="form-input" data-bible-field="aliases" value="'+DAL.escapeHtml((record.aliases||[]).join(', '))+'"></div>';
  if(section==='characters')html+='<div class="writer-form-grid"><div class="form-group"><label class="form-label">Status</label><input class="form-input" data-bible-field="status" value="'+DAL.escapeHtml(record.status||'')+'" placeholder="alive, dead, missing…"></div><div class="form-group"><label class="form-label">Role</label><input class="form-input" data-bible-field="role" value="'+DAL.escapeHtml(record.role||'')+'"></div></div><div class="form-group"><label class="form-label">Details</label><textarea class="form-textarea tall" data-bible-field="details">'+DAL.escapeHtml(record.details||'')+'</textarea></div>';
  if(section==='lore')html+='<div class="writer-form-grid"><div class="form-group"><label class="form-label">Category</label><input class="form-input" data-bible-field="folder" value="'+DAL.escapeHtml(record.folder||'Miscellaneous')+'"></div><div class="form-group"><label class="form-label">Status</label><input class="form-input" data-bible-field="status" value="'+DAL.escapeHtml(record.status||'')+'" placeholder="active, destroyed, lost…"></div></div><div class="form-group"><label class="form-label">Entry</label><textarea class="form-textarea tall" data-bible-field="content">'+DAL.escapeHtml(record.content||'')+'</textarea></div>';
  if(section==='glossary')html+='<div class="form-group"><label class="form-label">Definition</label><textarea class="form-textarea tall" data-bible-field="definition">'+DAL.escapeHtml(record.definition||'')+'</textarea></div>';
  if(section==='timeline')html+='<div class="writer-form-grid"><div class="form-group"><label class="form-label">Date / era</label><input class="form-input" data-bible-field="date" value="'+DAL.escapeHtml(record.date||'')+'"></div><div class="form-group"><label class="form-label">Sort order</label><input class="form-input" type="number" data-bible-field="order" value="'+Number(record.order||0)+'"></div></div><div class="form-group"><label class="form-label">Location</label><input class="form-input" data-bible-field="location" value="'+DAL.escapeHtml(record.location||'')+'"></div><div class="form-group"><label class="form-label">Summary</label><textarea class="form-textarea tall" data-bible-field="summary">'+DAL.escapeHtml(record.summary||'')+'</textarea></div>';
  if(section!=='timeline')html+='<div class="form-group"><label class="form-label">Facts <span class="u-hint">one per line: label: value</span></label><textarea class="form-textarea" data-bible-field="facts">'+DAL.escapeHtml(DAL.bibleFactsText(record))+'</textarea></div>';
  html+='<div class="form-group"><label class="form-label">Tags</label><input class="form-input" data-bible-field="tags" value="'+DAL.escapeHtml((record.tags||[]).join(', '))+'"></div><button class="btn danger" data-action="bible-delete" data-record-id="'+record.id+'">Delete record</button>';
  return html;
};

DAL.importProjectIntoBible = function(proj,bible){
  var added=0;
  function has(list,key,value,extra){value=String(value||'').trim().toLowerCase();return list.some(function(item){return String(item[key]||'').trim().toLowerCase()===value&&(!extra||extra(item));});}
  (proj.characters||[]).forEach(function(character){if(has(bible.characters,'name',character.name))return;bible.characters.push({id:DAL.uid('bchar'),name:character.name||'Untitled',aliases:(character.aliases||[]).slice(),status:character.deceased?'dead':(character.status||''),role:character.role||'',details:[character.personality,character.backstory].filter(Boolean).join('\n\n'),tags:(character.tags||[]).slice(),facts:(character.customFields||[]).map(function(field){return{id:DAL.uid('fact'),key:field.label||'',value:String(field.value==null?'':field.value)};})});added++;});
  (((proj.lore||{}).entries)||[]).forEach(function(entry){if(has(bible.lore.entries,'title',entry.title))return;bible.lore.entries.push({id:DAL.uid('blore'),title:entry.title||'Untitled',folder:entry.folder||'Miscellaneous',content:entry.content||'',aliases:(entry.aliases||[]).slice(),status:entry.status||'',tags:(entry.tags||[]).slice(),facts:(entry.facts||[]).slice()});if(bible.lore.folders.indexOf(entry.folder)<0)bible.lore.folders.push(entry.folder);added++;});
  (proj.timeline||[]).forEach(function(event){if(has(bible.timeline,'title',event.title,function(item){return String(item.date||'')===String(event.date||'');}))return;bible.timeline.push({id:DAL.uid('bevent'),title:event.title||'Untitled',date:event.date||'',order:Number(event.order)||0,location:event.location||'',summary:event.summary||'',tags:(event.tags||[]).slice(),facts:[]});added++;});
  bible.updatedAt=Date.now(); return added;
};

DAL._worldClickBase=DAL.handleStoryClick;
DAL.handleStoryClick=function(action,el,e){
  var proj=DAL.state.projects[DAL.currentProjectId],bible=DAL.projectBible(proj),section=DAL._bibleSection||'characters',records,record,id;
  if(action==='bible-create'){var name=(document.getElementById('newBibleName')||{}).value||((proj&&proj.name)||'Shared World');bible=DAL.defaultBible(name.trim());DAL.state.bibles[bible.id]=bible;DAL.state.bibleOrder.push(bible.id);proj.bibleId=bible.id;DAL.saveState(true);DAL.render();DAL.toast('World Bible created','success');return;}
  if(action==='bible-link'){id=(document.getElementById('existingBible')||{}).value;if(id&&DAL.state.bibles[id]){proj.bibleId=id;DAL.saveState(true);DAL.render();DAL.toast('Project connected to '+DAL.state.bibles[id].name,'success');}return;}
  if(action==='bible-unlink'){proj.bibleId='';DAL._bibleRecordId=null;DAL.saveState(true);DAL.render();DAL.toast('Project detached; the shared Bible was kept.','info');return;}
  if(action==='bible-section'){DAL._bibleSection=el.getAttribute('data-section');DAL._bibleRecordId=null;DAL.render();return;}
  if(action==='bible-select'){DAL._bibleRecordId=el.getAttribute('data-record-id');DAL.render();return;}
  if(action==='bible-add'&&bible){records=DAL.bibleRecords(bible,section);record={id:DAL.uid('bible'),aliases:[],tags:[],facts:[]};if(section==='characters'){record.name='New Character';record.status='alive';record.role='';record.details='';}else if(section==='lore'){record.title='New Lore Entry';record.folder='Miscellaneous';record.content='';record.status='';}else if(section==='timeline'){record.title='New Event';record.date='';record.order=records.reduce(function(max,item){return Math.max(max,Number(item.order)||0);},0)+1;record.location='';record.summary='';}else{record.term='New Term';record.definition='';}records.push(record);DAL._bibleRecordId=record.id;bible.updatedAt=Date.now();DAL.saveState();DAL.render();return;}
  if(action==='bible-delete'&&bible){id=el.getAttribute('data-record-id');records=DAL.bibleRecords(bible,section);record=records.find(function(item){return item.id===id;});if(record&&confirm('Delete “'+DAL.bibleTitle(record,section)+'” from the shared Bible?')){if(section==='lore')bible.lore.entries=records.filter(function(item){return item.id!==id;});else bible[section]=records.filter(function(item){return item.id!==id;});DAL._bibleRecordId=null;bible.updatedAt=Date.now();DAL.saveState();DAL.render();}return;}
  if(action==='bible-import-project'&&bible){var count=DAL.importProjectIntoBible(proj,bible);DAL.saveState(true);DAL.render();DAL.toast(count?count+' project record'+(count===1?'':'s')+' added':'The shared Bible already has those records',count?'success':'info');return;}
  if(action==='bible-export'&&bible){DAL.downloadJSON(DAL.sanitizeFilename(bible.name)+'-bible.json',{kind:'draft-a-lore-bible',schemaVersion:DAL.SCHEMA_VERSION,bible:bible});DAL.toast('World Bible downloaded','success');return;}
  if(action==='bible-import'){var input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=function(){var file=input.files&&input.files[0];if(!file)return;file.text().then(function(text){var data=JSON.parse(text),incoming=DAL.normalizeBible(DAL.clone(data.bible||data));incoming.id=DAL.uid('bible');incoming.name+=(DAL.state.bibleOrder.some(function(existing){return DAL.state.bibles[existing]&&DAL.state.bibles[existing].name===incoming.name;})?' (imported)':'');DAL.state.bibles[incoming.id]=incoming;DAL.state.bibleOrder.push(incoming.id);if(proj)proj.bibleId=incoming.id;DAL.saveState(true);DAL.render();DAL.toast('World Bible imported and connected','success');}).catch(function(error){DAL.toast('Could not import that Bible: '+error.message,'error');});};input.click();return;}
  return DAL._worldClickBase(action,el,e);
};

document.addEventListener('input',function(event){
  var el=event.target;if(!el.hasAttribute||!el.hasAttribute('data-bible-field'))return;
  var proj=DAL.state.projects[DAL.currentProjectId],bible=DAL.projectBible(proj),section=DAL._bibleSection||'characters';if(!bible)return;
  var record=DAL.bibleRecords(bible,section).find(function(item){return item.id===DAL._bibleRecordId;});if(!record)return;
  var field=el.getAttribute('data-bible-field');
  if(field==='aliases'||field==='tags')record[field]=el.value.split(',').map(function(value){return value.trim();}).filter(Boolean);
  else if(field==='facts')record.facts=DAL.parseBibleFacts(el.value);
  else if(field==='order')record.order=Number(el.value)||0;
  else record[field]=el.value;
  record.updatedAt=Date.now();bible.updatedAt=Date.now();DAL.saveState();
});
