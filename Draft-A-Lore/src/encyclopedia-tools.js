/* Draft A Lore — rule-based living encyclopedia and in-editor world lookup */
DAL = DAL || {};

DAL.encyclopediaKind = function(name,context){
  var text=String(context||'').toLowerCase();
  var named=String(name||'').toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(new RegExp(named+'[^.!?]{0,55}\\b(born|died|said|asked|walked|spoke|he|she|they)\\b','i').test(text))return 'character';
  if(/\b(city|village|town|realm|kingdom|forest|mountain|river|temple|castle|station|planet|district|island)\b/.test(text))return 'place';
  if(/\b(spell|magic|ritual|curse|enchantment|mana|aether|power)\b/.test(text))return 'magic';
  if(/\b(sword|ring|amulet|key|weapon|artifact|relic|potion|shield|crown|book)\b/.test(text))return 'item';
  if(/\b(war|battle|coronation|festival|cataclysm|sundering|uprising|rebellion)\b/.test(text)&&/\b(?:year\s*)?-?\d+\b/i.test(text))return 'event';
  if(/^the\s/i.test(name))return 'term';
  return 'character';
};
DAL.encyclopediaFacts = function(name,context){
  var facts=[],safe=String(name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),patterns=[
    ['birth year',new RegExp(safe+'[^.!?]{0,45}?(?:born|birth)\\s*(?:in|:)?\\s*(?:year\\s*)?(-?\\d+)','i')],
    ['death year',new RegExp(safe+'[^.!?]{0,45}?(?:died|killed)\\s*(?:in|:)?\\s*(?:year\\s*)?(-?\\d+)','i')],
    ['founded',new RegExp(safe+'[^.!?]{0,45}?founded\\s*(?:in|:)?\\s*(?:year\\s*)?(-?\\d+)','i')],
    ['destroyed',new RegExp(safe+'[^.!?]{0,45}?(?:fell|destroyed)\\s*(?:in|:)?\\s*(?:year\\s*)?(-?\\d+)','i')]
  ];
  patterns.forEach(function(pair){var match=String(context||'').match(pair[1]);if(match)facts.push({id:DAL.uid('fact'),key:pair[0],value:match[1]});});return facts;
};

DAL.runEncyclopediaScan = function(proj){
  var known={};(DAL.continuityRecords?DAL.continuityRecords(proj):[]).forEach(function(record){known[DAL.continuityKey(record.name)]=true;(record.aliases||[]).forEach(function(alias){known[DAL.continuityKey(alias)]=true;});});
  var previous={};((proj.encyclopedia&&proj.encyclopedia.candidates)||[]).forEach(function(candidate){previous[candidate.key]=candidate;});
  var found={},sources=[];
  (proj.chapters||[]).forEach(function(chapter){sources.push({kind:'chapter',id:chapter.id,title:chapter.title,text:DAL.continuityText(chapter.contentHTML)});});
  (((proj.adventure||{}).nodes)||[]).forEach(function(node){sources.push({kind:'scene',id:node.id,title:node.title,text:DAL.continuityText(node.text)});});
  sources.forEach(function(source){var match,re=/\b[A-Z][A-Za-z’'-]{2,}(?:\s+[A-Z][A-Za-z’'-]{2,}){0,2}\b/g;while((match=re.exec(source.text))){var name=match[0].trim(),key=DAL.continuityKey(name);if(!key||known[key]||/^(the|this|that|chapter|however|after|before|when|where|year)$/.test(key))continue;var start=Math.max(0,match.index-90),context=source.text.slice(start,match.index+name.length+130).trim();if(!found[key])found[key]={key:key,id:(previous[key]&&previous[key].id)||DAL.uid('candidate'),name:name,kind:DAL.encyclopediaKind(name,context),mentions:0,sourceIds:[],sourceKind:source.kind,sourceId:source.id,sourceTitle:source.title,context:context,facts:[],status:(previous[key]&&previous[key].status)||'active'};found[key].mentions++;if(found[key].sourceIds.indexOf(source.id)<0)found[key].sourceIds.push(source.id);var facts=DAL.encyclopediaFacts(name,context);facts.forEach(function(fact){if(!found[key].facts.some(function(existing){return DAL.continuityKey(existing.key)===DAL.continuityKey(fact.key)&&String(existing.value)===String(fact.value);}))found[key].facts.push(fact);});}});
  var candidates=Object.keys(found).map(function(key){return found[key];}).filter(function(candidate){return candidate.mentions>=2||candidate.facts.length;}).sort(function(a,b){return b.mentions-a.mentions||a.name.localeCompare(b.name);});
  proj.encyclopedia=proj.encyclopedia||{auto:true,candidates:[]};proj.encyclopedia.candidates=candidates;proj.encyclopedia.lastScannedAt=Date.now();return candidates;
};

DAL.renderEncyclopedia = function(proj){
  var data=proj.encyclopedia||{auto:true,candidates:[],lastScannedAt:0},filter=DAL._encyclopediaFilter||'active',bible=DAL.projectBible&&DAL.projectBible(proj),list=(data.candidates||[]).filter(function(candidate){return filter==='all'||candidate.status===filter;});
  var html='<div class="encyclopedia-view"><div class="section-header"><div><div class="section-title">Living Encyclopedia</div><p class="writer-muted">Finds recurring people, places, objects, events, and concepts in prose. You review every suggestion before it becomes project data.</p></div><button class="btn primary" data-action="encyclopedia-scan">Scan project</button></div>';
  html+='<div class="card encyclopedia-settings"><label><input type="checkbox" data-action="encyclopedia-auto"'+(data.auto!==false?' checked':'')+'> Refresh suggestions while I write</label><span class="writer-muted">Rule-based and fully offline. Nothing is sent anywhere.</span></div>';
  html+='<div class="continuity-filters"><button class="btn sm'+(filter==='active'?' primary':'')+'" data-action="encyclopedia-filter" data-filter="active">Suggestions</button><button class="btn sm'+(filter==='added'?' primary':'')+'" data-action="encyclopedia-filter" data-filter="added">Added</button><button class="btn sm'+(filter==='dismissed'?' primary':'')+'" data-action="encyclopedia-filter" data-filter="dismissed">Dismissed</button><button class="btn sm'+(filter==='all'?' primary':'')+'" data-action="encyclopedia-filter" data-filter="all">All</button>'+(data.lastScannedAt?'<span class="writer-muted">Last scan '+new Date(data.lastScannedAt).toLocaleString()+'</span>':'')+'</div>';
  html+='<div class="encyclopedia-list">'+(list.length?list.map(function(candidate){return '<article class="encyclopedia-candidate"><div><span class="badge">'+DAL.escapeHtml(candidate.kind)+'</span> <strong>'+DAL.escapeHtml(candidate.name)+'</strong><p>'+DAL.escapeHtml(candidate.context)+'</p><span class="writer-muted">'+candidate.mentions+' mention'+(candidate.mentions===1?'':'s')+' · '+DAL.escapeHtml(candidate.sourceTitle||'')+(candidate.facts.length?' · '+candidate.facts.map(function(fact){return fact.key+': '+fact.value;}).join(', '):'')+'</span></div><div class="writer-tool-actions"><button class="btn sm" data-action="encyclopedia-open" data-candidate="'+candidate.id+'">Open source</button>'+(candidate.status==='active'?'<button class="btn sm primary" data-action="encyclopedia-add-project" data-candidate="'+candidate.id+'">Add to project</button>'+(bible?'<button class="btn sm" data-action="encyclopedia-add-bible" data-candidate="'+candidate.id+'">Add to Bible</button>':'')+'<button class="btn sm" data-action="encyclopedia-dismiss" data-candidate="'+candidate.id+'">Dismiss</button>':'<button class="btn sm" data-action="encyclopedia-restore" data-candidate="'+candidate.id+'">Restore suggestion</button>')+'</div></article>';}).join(''):'<div class="empty-state compact"><p>'+(data.lastScannedAt?'No suggestions in this view.':'Run the scanner after writing some prose.')+'</p></div>')+'</div></div>';return html;
};

DAL.addEncyclopediaCandidate = function(proj,candidate,toBible){
  var bible=toBible&&DAL.projectBible&&DAL.projectBible(proj),target=bible||proj,kind=candidate.kind,exists=false;
  function same(item,key){return DAL.continuityKey(item[key])===DAL.continuityKey(candidate.name);}
  if(kind==='character'){
    var characters=target.characters||(target.characters=[]);exists=characters.some(function(item){return same(item,'name');});if(!exists)characters.push(toBible?{id:DAL.uid('bchar'),name:candidate.name,aliases:[],status:'',role:'',details:candidate.context,tags:[],facts:DAL.clone(candidate.facts)}:{id:DAL.uid('char'),name:candidate.name,role:'',age:'',gender:'',appearance:'',personality:'',backstory:candidate.context,arc:'',customFields:candidate.facts.map(function(fact){return{label:fact.key,value:fact.value,type:'text'};}),tags:[],image:'',linkedPlotIds:[],deceased:false,deathChapterId:'',createdAt:Date.now()});
  }else if(kind==='event'){
    var timeline=target.timeline||(target.timeline=[]);exists=timeline.some(function(item){return same(item,'title');});if(!exists)timeline.push({id:DAL.uid(toBible?'bevent':'event'),title:candidate.name,date:(candidate.facts[0]&&candidate.facts[0].value)||'',order:timeline.length+1,location:'',summary:candidate.context,tags:[],characterIds:[],plotIds:[],chapterId:''});
  }else{
    var lore=target.lore||(target.lore={folders:[],entries:[]}),folder=kind==='place'?'Locations':(kind==='magic'?'Magic / Technology':(kind==='item'?'Relics & Artifacts':'Miscellaneous'));exists=lore.entries.some(function(item){return same(item,'title');});if(!exists)lore.entries.push({id:DAL.uid(toBible?'blore':'lore'),title:candidate.name,folder:folder,content:candidate.context,aliases:[],status:'',tags:[],facts:DAL.clone(candidate.facts),linkedCharIds:[],linkedPlotIds:[],createdAt:Date.now(),updatedAt:Date.now()});if(lore.folders.indexOf(folder)<0)lore.folders.push(folder);
  }
  if(!exists){candidate.status='added';candidate.addedTo=toBible?'bible':'project';if(bible)bible.updatedAt=Date.now();proj.updatedAt=Date.now();DAL.saveState(true);}return !exists;
};

DAL.writerLookupText = function(){
  var selected=DAL._writerRange&&String(DAL._writerRange).trim();if(selected)return selected.slice(0,120);
  var selection=window.getSelection&&window.getSelection();if(!selection||!selection.rangeCount)return '';
  var node=selection.anchorNode,offset=selection.anchorOffset;if(!node||node.nodeType!==3)return '';
  var text=node.nodeValue||'',left=text.slice(0,offset).match(/[A-Za-z0-9’'-]+$/),right=text.slice(offset).match(/^[A-Za-z0-9’'-]+/);return ((left&&left[0])||'')+((right&&right[0])||'');
};

DAL.renderLiveContinuityBar = function(proj,ch){
  if(!ch||!proj.continuity||!proj.continuity.live)return '';
  var report=DAL._continuityReports&&DAL._continuityReports[proj.id],ignored=proj.continuity.ignored||{},issues=report?report.issues.filter(function(issue){return issue.target&&issue.target.kind==='chapter'&&issue.target.id===ch.id&&!ignored[issue.signature];}):[];
  return '<div class="live-continuity" id="liveContinuity">'+(report?(issues.length?'<button class="btn sm" data-action="continuity-live-open">'+issues.length+' continuity '+(issues.length===1?'issue':'issues')+' in this chapter</button><span>'+issues.filter(function(issue){return issue.severity==='error';}).length+' errors · '+issues.filter(function(issue){return issue.severity==='warning';}).length+' warnings · '+issues.filter(function(issue){return issue.severity==='note';}).length+' notes</span>':'<span>Continuity: no active issues in this chapter</span>'):'<span>Continuity checking will update after you type.</span>')+'</div>';
};
DAL.applyLiveContinuityMarks = function(proj,ch){
  if(typeof CSS==='undefined'||!CSS.highlights||typeof Highlight==='undefined')return;
  ['error','warning','note'].forEach(function(level){CSS.highlights.delete('dal-continuity-'+level);});
  if(!proj||!ch||!proj.continuity.live)return;
  var editor=document.getElementById('editorContent'),report=DAL._continuityReports&&DAL._continuityReports[proj.id];if(!editor||!report)return;
  var ranges={error:[],warning:[],note:[]},issues=report.issues.filter(function(issue){return issue.target&&issue.target.kind==='chapter'&&issue.target.id===ch.id&&issue.needle&&!proj.continuity.ignored[issue.signature];});
  issues.forEach(function(issue){var walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT),node,pattern=DAL.continuityPattern(issue.needle),match;while((node=walker.nextNode())){pattern.lastIndex=0;while((match=pattern.exec(node.nodeValue||''))){var range=new Range(),start=match.index+match[1].length;range.setStart(node,start);range.setEnd(node,start+match[2].length);ranges[issue.severity].push(range);if(!match[0].length)pattern.lastIndex++;}}});
  Object.keys(ranges).forEach(function(level){if(ranges[level].length)CSS.highlights.set('dal-continuity-'+level,new Highlight(...ranges[level]));});
};
DAL.scheduleWorldAnalysis = function(proj,ch){
  clearTimeout(DAL._worldAnalysisTimer);DAL._worldAnalysisTimer=setTimeout(function(){if(proj.encyclopedia&&proj.encyclopedia.auto)DAL.runEncyclopediaScan(proj);if(proj.continuity&&proj.continuity.live)DAL.runContinuity(proj);DAL.saveState();var live=document.getElementById('liveContinuity');if(live){var holder=document.createElement('div');holder.innerHTML=DAL.renderLiveContinuityBar(proj,ch);live.replaceWith(holder.firstElementChild);}DAL.applyLiveContinuityMarks(proj,ch);},900);
};

DAL._encyclopediaClickBase=DAL.handleStoryClick;
DAL.handleStoryClick=function(action,el,e){
  var proj=DAL.state.projects[DAL.currentProjectId],candidate=proj&&proj.encyclopedia&&(proj.encyclopedia.candidates||[]).find(function(item){return item.id===el.getAttribute('data-candidate');});
  if(action==='encyclopedia-scan'){DAL.runEncyclopediaScan(proj);DAL.saveState();DAL.render();DAL.toast('Encyclopedia suggestions refreshed','success');return;}
  if(action==='encyclopedia-auto'){proj.encyclopedia.auto=el.checked;DAL.saveState(true);return;}
  if(action==='encyclopedia-filter'){DAL._encyclopediaFilter=el.getAttribute('data-filter');DAL.render();return;}
  if(action==='encyclopedia-add-project'||action==='encyclopedia-add-bible'){if(candidate){var added=DAL.addEncyclopediaCandidate(proj,candidate,action==='encyclopedia-add-bible');DAL.render();DAL.toast(added?'Record added':'That record already exists',added?'success':'info');}return;}
  if(action==='encyclopedia-dismiss'||action==='encyclopedia-restore'){if(candidate){candidate.status=action==='encyclopedia-dismiss'?'dismissed':'active';DAL.saveState();DAL.render();}return;}
  if(action==='encyclopedia-open'&&candidate){if(candidate.sourceKind==='chapter'){DAL.currentTool='manuscript';DAL.selectedChapterId=candidate.sourceId;}else{DAL.currentTool='storygraph';DAL.selectedNodeId=candidate.sourceId;}DAL.render();return;}
  if(action==='world-lookup'){var term=DAL.writerLookupText();DAL.showProjectSearch(term);return;}
  if(action==='continuity-live-open'){DAL.currentTool='continuity';DAL._continuityFilter='active';DAL.render();return;}
  return DAL._encyclopediaClickBase(action,el,e);
};

DAL._encyclopediaAfterRender=DAL.afterStoryRender;
DAL.afterStoryRender=function(proj){DAL._encyclopediaAfterRender(proj);if(DAL.currentTool==='manuscript'){var ch=(proj.chapters||[]).find(function(item){return item.id===DAL.selectedChapterId;});setTimeout(function(){DAL.applyLiveContinuityMarks(proj,ch);},0);}};
