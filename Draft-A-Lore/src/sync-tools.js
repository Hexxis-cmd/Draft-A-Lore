/* Draft A Lore — private folder-based cross-device synchronization */
DAL = DAL || {};
DAL._syncConflicts={};

DAL.readLinkedProject=async function(proj,handle){
  var text='';
  if(handle.native){var plugin=DAL.nativeFolderPlugin(),result=await plugin.readTextFile({projectId:proj.id,path:'project.json'});if(!result||!result.exists)return null;text=result.text||'';}
  else{try{var fileHandle=await handle.getFileHandle('project.json'),file=await fileHandle.getFile();text=await file.text();}catch(error){if(error&&error.name==='NotFoundError')return null;throw error;}}
  if(!text.trim())return null;var data=JSON.parse(text),remote=data&&data.project?data.project:data;if(!remote||typeof remote!=='object')throw new Error('The linked project.json is not a Draft A Lore project.');return{data:data,project:remote,updatedAt:Number(remote.updatedAt)||0};
};
DAL.prepareFolderSync=async function(proj,handle){
  if(handle.checkedInitial&&proj.sync.mode!=='shared')return true;
  var remote=await DAL.readLinkedProject(proj,handle);
  if(!remote){handle.checkedInitial=true;return true;}
  var sameId=remote.project.id===proj.id,known=Number(proj.sync.lastRemoteUpdatedAt)||0;
  if(sameId&&(remote.updatedAt===known||remote.updatedAt===Number(proj.updatedAt))){handle.checkedInitial=true;proj.sync.lastRemoteUpdatedAt=remote.updatedAt;return true;}
  DAL._syncConflicts[proj.id]=remote;DAL.folderSyncHealth.status='conflict';DAL.folderSyncHealth.lastError=sameId?'The linked copy changed on another device.':'That folder contains a different project.';handle.checkedInitial=false;if(DAL.currentTool==='sync')DAL.render();else DAL.toast('Device Sync needs your choice before it writes to the linked folder.','warning');return false;
};
DAL.finishFolderSync=function(proj,handle){handle.checkedInitial=true;proj.sync.lastRemoteUpdatedAt=Number(proj.updatedAt)||Date.now();proj.sync.lastLocalUpdatedAt=Number(proj.updatedAt)||Date.now();delete DAL._syncConflicts[proj.id];};

DAL.nativePullAssets=async function(proj){
  var plugin=DAL.nativeFolderPlugin();if(!plugin||!DAL.importAssetFile)return 0;var count=0;
  for(var f=0;f<DAL.ASSET_FOLDERS.length;f++){var folder=DAL.ASSET_FOLDERS[f],records=((proj.assets||{})[folder.key]||[]).slice();for(var i=0;i<records.length;i++){var old=records[i],result=await plugin.readFile({projectId:proj.id,path:'Assets/'+folder.dir+'/'+old.name});if(!result||!result.exists)continue;var raw=atob(result.base64||''),bytes=new Uint8Array(raw.length);for(var b=0;b<raw.length;b++)bytes[b]=raw.charCodeAt(b);var file=new File([bytes],old.name,{type:old.mime||'application/octet-stream'}),record=await DAL.importAssetFile(proj,file,folder.key);DAL.rebindAsset(proj,old.id,record.id);count++;}}
  return count;
};
DAL.applyRemoteProject=async function(local,remote,handle){
  var incoming=DAL.normalizeProject(DAL.clone(remote.project),true),localId=local.id,linkedName=local.linkedFolderName,history=local.history||[],redo=local.redoStack||[];
  var bibleData=remote.data&&remote.data.linkedBible;if(bibleData){var normalized=DAL.normalizeBible(DAL.clone(bibleData)),bibleId=local.bibleId&&DAL.state.bibles[local.bibleId]?local.bibleId:DAL.uid('bible');normalized.id=bibleId;DAL.state.bibles[bibleId]=normalized;if(DAL.state.bibleOrder.indexOf(bibleId)<0)DAL.state.bibleOrder.push(bibleId);incoming.bibleId=bibleId;}else if(!DAL.state.bibles[incoming.bibleId])incoming.bibleId='';
  incoming.id=localId;incoming.linkedFolderName=linkedName;incoming.history=history;incoming.redoStack=redo;incoming.sync={mode:local.sync.mode,lastRemoteUpdatedAt:remote.updatedAt,lastLocalUpdatedAt:remote.updatedAt};DAL.state.projects[localId]=incoming;
  var assets=0;if(handle.native)assets=await DAL.nativePullAssets(incoming);else if(DAL.readAssetsFolder)assets=await DAL.readAssetsFolder(handle,incoming);
  handle.checkedInitial=true;delete DAL._syncConflicts[localId];DAL._suppressFolderSync=true;try{await DAL.saveState(true);}finally{DAL._suppressFolderSync=false;}DAL.render();DAL.toast('Folder version opened'+(assets?' with '+assets+' assets':''),'success');return incoming;
};

DAL.renderSyncCenter=function(proj){
  var handle=DAL.folderHandles[proj.id],conflict=DAL._syncConflicts[proj.id],health=DAL.folderSyncHealth,html='<div class="sync-center"><div class="section-header"><div><div class="section-title">Device Sync</div><p class="writer-muted">Keep the same project structure across phone, tablet, web, and desktop through a folder you choose. Draft A Lore has no account and never receives your files.</p></div></div>';
  html+='<div class="card sync-status"><div class="sync-status-dot '+(handle?'linked':'')+'"></div><div><strong>'+(handle?'Linked to '+DAL.escapeHtml(handle.name||proj.linkedFolderName||'folder'):'No folder linked')+'</strong><p class="writer-muted">'+(handle?(health.status==='conflict'?'A choice is required before syncing.':health.lastSyncedAt?'Last synced '+new Date(health.lastSyncedAt).toLocaleString():'Ready to check the folder.'):'Choose a local folder or a folder from a provider already available in your device picker.')+'</p></div><div class="writer-tool-actions">'+(handle?'<button class="btn" data-action="sync-check">Check folder</button><button class="btn primary" data-action="sync-push">Save to folder</button><button class="btn danger" data-action="sync-unlink">Disconnect</button>':'<button class="btn primary" data-action="link-folder" data-pid="'+proj.id+'">Choose folder</button>')+'</div></div>';
  html+='<div class="card sync-mode"><h3>Sync behavior</h3><label><input type="radio" name="syncMode" data-sync-mode value="backup"'+(proj.sync.mode==='backup'?' checked':'')+'> <strong>Device backup</strong><span>Writes this project to the chosen folder. After the first safety check, this device remains the source.</span></label><label><input type="radio" name="syncMode" data-sync-mode value="shared"'+(proj.sync.mode==='shared'?' checked':'')+'> <strong>Shared across devices</strong><span>Checks the folder before every write and stops on conflicts. Use the same provider folder on each device.</span></label></div>';
  if(conflict){var remoteName=conflict.project.name||'Untitled',different=conflict.project.id!==proj.id;html+='<div class="card sync-conflict"><h3>'+(different?'Another project is already in this folder':'Both copies changed')+'</h3><p>The folder contains <strong>'+DAL.escapeHtml(remoteName)+'</strong>, updated '+new Date(conflict.updatedAt||0).toLocaleString()+'. Nothing was overwritten.</p><div class="writer-tool-actions"><button class="btn primary" data-action="sync-use-folder">Use folder version</button><button class="btn" data-action="sync-keep-local">Keep this device and overwrite folder</button><button class="btn" data-action="sync-import-copy">Import folder version as a separate project</button></div></div>';}
  html+='<div class="card"><h3>Portable alternative</h3><p class="writer-muted">A .dalz bundle carries the project, shared Bible snapshot, and assets. It is the safest handoff when automatic folder providers are unavailable.</p><button class="btn" data-action="save-project-bundle" data-pid="'+proj.id+'">Save project bundle (.dalz)</button><button class="btn" data-action="import-project-bundle">Import project bundle</button></div></div>';return html;
};

DAL._syncClickBase=DAL.handleStoryClick;
DAL.handleStoryClick=function(action,el,e){
  var proj=DAL.state.projects[DAL.currentProjectId],handle=proj&&DAL.folderHandles[proj.id],conflict=proj&&DAL._syncConflicts[proj.id];
  if(action==='sync-check'&&handle){handle.checkedInitial=false;DAL.prepareFolderSync(proj,handle).then(function(ok){if(ok)DAL.toast('The linked folder is current.','success');DAL.render();}).catch(function(error){DAL.folderSyncHealth.status='error';DAL.folderSyncHealth.lastError=error.message;DAL.render();DAL.toast('Could not check folder: '+error.message,'error');});return;}
  if(action==='sync-push'&&handle){DAL.queueFolderSync();DAL.toast('Folder sync queued','info');return;}
  if(action==='sync-unlink'&&proj){var plugin=handle&&handle.native&&DAL.nativeFolderPlugin();Promise.resolve(plugin?plugin.unlinkFolder({projectId:proj.id}):null).finally(function(){delete DAL.folderHandles[proj.id];delete DAL._syncConflicts[proj.id];proj.linkedFolderName='';DAL.saveState(true);DAL.render();DAL.toast('Folder disconnected; no files were deleted.','info');});return;}
  if(action==='sync-use-folder'&&conflict){DAL.applyRemoteProject(proj,conflict,handle).catch(function(error){DAL.toast('Could not open the folder copy: '+error.message,'error');});return;}
  if(action==='sync-keep-local'&&conflict){proj.sync.lastRemoteUpdatedAt=conflict.updatedAt;handle.checkedInitial=true;delete DAL._syncConflicts[proj.id];DAL.saveState(true);DAL.queueFolderSync();DAL.render();return;}
  if(action==='sync-import-copy'&&conflict){var copy=DAL.adoptImportedProject(conflict.data);DAL.saveState(true);DAL.toast('Imported “'+copy.name+'” as a separate project','success');DAL.render();return;}
  return DAL._syncClickBase(action,el,e);
};
document.addEventListener('change',function(event){var el=event.target;if(!el.hasAttribute||!el.hasAttribute('data-sync-mode'))return;var proj=DAL.state.projects[DAL.currentProjectId];if(proj){proj.sync.mode=el.value==='shared'?'shared':'backup';DAL.saveState(true);DAL.render();}});
