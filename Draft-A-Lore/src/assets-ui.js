/* Asset manager view, audio binding controls and their actions. */

(function(){

  DAL.formatBytes = function(bytes){
    var n = Number(bytes) || 0;
    if(n < 1024) return n + ' B';
    if(n < 1024*1024) return (n/1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
    return (n/(1024*1024)).toFixed(n < 10*1024*1024 ? 1 : 0) + ' MB';
  };

  DAL.formatDuration = function(seconds){
    var s = Math.round(Number(seconds) || 0);
    if(!s) return '';
    var m = Math.floor(s/60);
    return m + ':' + String(s % 60).padStart(2, '0');
  };

  DAL.assetFolderKey = function(){
    if(!DAL._assetFolderKey) DAL._assetFolderKey = 'illustrations';
    return DAL._assetFolderKey;
  };

  /* --- Asset manager ------------------------------------------------------ */

  DAL.renderAssets = function(proj){
    DAL.ensureAssets(proj);
    DAL.tts.warm();
    var activeKey = DAL.assetFolderKey();
    var folder = DAL.assetFolder(activeKey);
    var list = proj.assets[activeKey] || [];

    var html = '<div class="section-header"><div class="section-title">Project Assets</div>'+
      '<button class="btn primary" data-action="asset-pick">+ Add Files</button></div>';

    html += '<p class="asset-intro">Everything here is stored with the project. Drop files straight onto a scene, chapter or character to attach them \u2014 no file paths to type. When a folder is linked, these appear on disk under <code>Assets/'+DAL.escapeHtml(folder ? folder.dir : '')+'</code>.</p>';

    html += '<div class="asset-tabs" role="tablist">';
    DAL.ASSET_FOLDERS.forEach(function(f){
      var count = (proj.assets[f.key] || []).length;
      html += '<button class="asset-tab'+(f.key === activeKey ? ' active' : '')+'" role="tab" aria-selected="'+(f.key === activeKey)+'" data-action="asset-folder" data-folder="'+f.key+'">'+
        '<span>'+DAL.escapeHtml(f.label)+'</span>'+
        '<span class="asset-tab-count">'+count+'</span></button>';
    });
    html += '</div>';

    html += '<div class="asset-dropzone" data-asset-drop="'+activeKey+'" data-action="asset-pick">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>'+
      '<div class="asset-dropzone-title">Drop files here, or click to choose</div>'+
      '<div class="asset-dropzone-hint">'+DAL.escapeHtml(folder ? folder.hint : '')+'</div></div>';

    html += '<div class="asset-usage" id="assetUsage">Measuring stored assets\u2026</div>';

    if(!list.length){
      html += '<div class="empty-state"><h3>No '+DAL.escapeHtml((folder ? folder.label : '').toLowerCase())+' yet</h3>'+
        '<p>'+DAL.escapeHtml(folder ? folder.hint : '')+'</p></div>';
    } else if(activeKey === 'sounds'){
      html += '<div class="asset-sound-list">';
      list.forEach(function(a){
        var src = DAL.assetSrc(proj, a.id);
        html += '<div class="asset-sound" data-drag="asset:'+a.id+'" data-ctx="asset" data-ctx-id="'+a.id+'">'+
          '<div class="asset-sound-head">'+
            '<span class="asset-sound-name" title="'+DAL.escapeHtml(a.name)+'">'+DAL.escapeHtml(a.name)+'</span>'+
            '<span class="asset-meta">'+DAL.formatBytes(a.size)+(a.duration ? ' \u00b7 '+DAL.formatDuration(a.duration) : '')+'</span>'+
            '<button class="btn sm danger" data-action="asset-delete" data-aid="'+a.id+'">Delete</button>'+
          '</div>'+
          (src ? '<audio class="asset-audio" controls preload="none" src="'+src+'"></audio>'
               : '<div class="asset-missing">Stored bytes could not be read. Re-import this file.</div>')+
        '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="asset-grid">';
      list.forEach(function(a){
        var src = DAL.assetSrc(proj, a.id);
        html += '<figure class="asset-card'+(activeKey === 'svgs' ? ' svg' : '')+'" data-drag="asset:'+a.id+'" data-ctx="asset" data-ctx-id="'+a.id+'">'+
          '<div class="asset-thumb">'+(src ? '<img src="'+src+'" alt="'+DAL.escapeHtml(a.name)+'" loading="lazy">' : '<span class="asset-missing">Missing bytes</span>')+'</div>'+
          '<figcaption>'+
            '<span class="asset-name" title="'+DAL.escapeHtml(a.name)+'">'+DAL.escapeHtml(a.name)+'</span>'+
            '<span class="asset-meta">'+DAL.formatBytes(a.size)+'</span>'+
          '</figcaption>'+
          '<button class="btn sm danger asset-card-del" data-action="asset-delete" data-aid="'+a.id+'" title="Delete asset">\u00d7</button>'+
        '</figure>';
      });
      html += '</div>';
    }

    html += DAL.renderAudioSettings(proj);
    return html;
  };

  /* Usage is asynchronous, so the figure is filled in after the view is on
     screen rather than blocking the render. */
  DAL.refreshAssetUsage = function(){
    var el = document.getElementById('assetUsage');
    if(!el) return;
    if(!DAL.blobStore.available()){
      el.textContent = 'This browser cannot store asset files, so images and audio will not persist.';
      return;
    }
    DAL.blobStore.usage().then(function(u){
      var quota = navigator.storage && navigator.storage.estimate ? navigator.storage.estimate() : Promise.resolve(null);
      return quota.then(function(est){
        var text = u.count + ' stored file' + (u.count === 1 ? '' : 's') + ' \u00b7 ' + DAL.formatBytes(u.bytes);
        if(est && est.quota) text += ' of about ' + DAL.formatBytes(est.quota) + ' available';
        el.textContent = text;
      });
    }).catch(function(){ el.textContent = 'Stored asset size is unavailable.'; });
  };

  /* --- Audio and narration settings -------------------------------------- */

  DAL.renderAudioSettings = function(proj){
    DAL.ensureAssets(proj);
    var a = proj.audio;
    var body = '';

    body += '<label class="form-check"><input type="checkbox" data-action="audio-mute"'+(a.muted ? ' checked' : '')+'> <span>Mute all project audio</span></label>';

    body += '<div class="form-row"><label class="form-label">Ambient volume <output>'+Math.round(a.ambientVolume*100)+'%</output></label>'+
      '<input class="form-range" type="range" min="0" max="100" value="'+Math.round(a.ambientVolume*100)+'" data-action="audio-vol" data-channel="ambient"></div>';
    body += '<div class="form-row"><label class="form-label">Voice volume <output>'+Math.round(a.voiceVolume*100)+'%</output></label>'+
      '<input class="form-range" type="range" min="0" max="100" value="'+Math.round(a.voiceVolume*100)+'" data-action="audio-vol" data-channel="voice"></div>';

    if(!DAL.tts.available()){
      body += '<p class="asset-note">This browser has no speech engine, so narration falls back to any voice clip you attach.</p>';
    } else {
      var voices = DAL.tts.voices();
      body += '<label class="form-check"><input type="checkbox" data-action="tts-enabled"'+(a.ttsEnabled ? ' checked' : '')+'> <span>Read scenes aloud when no voice clip is attached</span></label>';
      body += '<div class="form-row"><label class="form-label">Narration voice</label>'+
        '<select class="form-select" data-action="tts-voice">'+
          '<option value="">Browser default</option>'+
          voices.map(function(v){
            return '<option value="'+DAL.escapeHtml(v.name)+'"'+(a.ttsVoice === v.name ? ' selected' : '')+'>'+DAL.escapeHtml(v.name + ' (' + v.lang + ')')+'</option>';
          }).join('')+
        '</select>'+
        (voices.length ? '' : '<span class="asset-note">Voices are still loading.</span>')+
      '</div>';
      body += '<div class="form-row"><label class="form-label">Speed <output>'+a.ttsRate.toFixed(2)+'\u00d7</output></label>'+
        '<input class="form-range" type="range" min="50" max="200" value="'+Math.round(a.ttsRate*100)+'" data-action="tts-rate"></div>';
      body += '<div class="form-row"><label class="form-label">Pitch <output>'+a.ttsPitch.toFixed(2)+'</output></label>'+
        '<input class="form-range" type="range" min="0" max="200" value="'+Math.round(a.ttsPitch*100)+'" data-action="tts-pitch"></div>';
      body += '<div class="asset-preview-row"><button class="btn sm" data-action="tts-preview">Preview narration</button>'+
        '<button class="btn sm" data-action="audio-stop">Stop audio</button></div>';
    }

    return DAL.panel('project-audio', 'Audio & narration', body, { defaultOpen:false });
  };

  /* --- Binding controls -------------------------------------------------- */

  /* Rendered inside a scene or chapter editor. `kind` and `id` identify what the
     picked asset should attach to, so one control serves both sides of the app. */
  DAL.renderAudioBinding = function(proj, holder, kind, id){
    DAL.ensureAssets(proj);
    if(!holder.audio) holder.audio = { voice:'', ambient:'' };
    var sounds = proj.assets.sounds || [];
    /* Each row is its own drop zone and names the slot it fills, so dragging a
       sound onto "Ambient track" binds ambient rather than guessing from whatever
       happens to be empty. */
    function picker(slot, label, hint){
      var current = holder.audio[slot] || '';
      var html = '<div class="form-row audio-slot" data-drop="asset" data-asset-slot="'+slot+'">'+
        '<label class="form-label">'+DAL.escapeHtml(label)+'</label>';
      if(!sounds.length){
        html += '<p class="asset-note">No sounds imported yet. Add them in the Assets tool, then drop one here.</p>';
      } else {
        html += '<select class="form-select" data-action="bind-audio" data-slot="'+slot+'" data-holder="'+kind+'" data-hid="'+DAL.escapeHtml(id)+'">'+
          '<option value="">\u2014 none \u2014</option>'+
          sounds.map(function(s){
            return '<option value="'+s.id+'"'+(current === s.id ? ' selected' : '')+'>'+DAL.escapeHtml(s.name)+'</option>';
          }).join('')+
        '</select>';
      }
      html += '<span class="asset-note">'+DAL.escapeHtml(hint)+'</span></div>';
      return html;
    }
    var body = '<div class="audio-bind" data-drop="asset" data-asset-bind="'+kind+':'+DAL.escapeHtml(id)+'">'+
      picker('ambient', 'Ambient track', 'Loops quietly while this part is on screen.')+
      picker('voice', 'Voiceover clip', 'Plays once instead of the built-in narrator.')+
      '<label class="form-label">Narration script <span class="asset-note">Optional \u2014 leave empty to read the scene text itself.</span></label>'+
      '<textarea class="form-input" rows="2" data-action="bind-narration" data-holder="'+kind+'" data-hid="'+DAL.escapeHtml(id)+'" placeholder="Words for the narrator to speak">'+DAL.escapeHtml(holder.narration || '')+'</textarea>'+
      '<div class="asset-preview-row"><button class="btn sm" data-action="audio-test" data-holder="'+kind+'" data-hid="'+DAL.escapeHtml(id)+'">Test audio</button>'+
      '<button class="btn sm" data-action="audio-stop">Stop</button></div>'+
    '</div>';
    return DAL.panel('audio-bind-'+kind, 'Audio & narration', body, { defaultOpen:false });
  };

  DAL.audioHolder = function(proj, kind, id){
    if(kind === 'chapter') return (proj.chapters || []).filter(function(c){ return c.id === id; })[0] || null;
    if(kind === 'node'){
      var adv = proj.adventure;
      return adv ? DAL.rpg.nodeById(adv, id) : null;
    }
    return null;
  };

  DAL.holderText = function(proj, kind, holder){
    if(!holder) return '';
    if(kind === 'chapter') return DAL.plainChapter(holder);
    return holder.text || '';
  };

  /* --- File input -------------------------------------------------------- */

  /* One hidden input reused for every import, because a fresh input per folder
     leaves stale nodes in the DOM after each render. */
  DAL.openAssetPicker = function(folderKey){
    var proj = DAL.activeProject();
    if(!proj) return;
    var key = folderKey || DAL.assetFolderKey();
    var folder = DAL.assetFolder(key);
    var input = document.getElementById('assetFileInput');
    if(!input){
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'assetFileInput';
      input.multiple = true;
      input.hidden = true;
      document.body.appendChild(input);
      input.addEventListener('change', function(){
        var files = input.files;
        var target = input.getAttribute('data-folder') || null;
        if(files && files.length) DAL.receiveAssetFiles(files, target === 'auto' ? null : target);
        input.value = '';
      });
    }
    input.setAttribute('data-folder', key || 'auto');
    input.accept = folder ? folder.accept : '';
    input.click();
  };

  DAL.receiveAssetFiles = function(files, folderKey){
    var proj = DAL.activeProject();
    if(!proj) return Promise.resolve();
    if(!DAL.blobStore.available()){
      DAL.toast('This browser cannot store asset files.', 'error');
      return Promise.resolve();
    }
    DAL.toast('Importing ' + files.length + ' file' + (files.length === 1 ? '' : 's') + '\u2026', 'info');
    return DAL.importAssetFiles(proj, files, folderKey).then(function(res){
      if(res.added) DAL.toast('Added ' + res.added + ' asset' + (res.added === 1 ? '' : 's'), 'success');
      res.failed.forEach(function(msg){ DAL.toast(msg, 'error'); });
      DAL.render();
      DAL.refreshAssetUsage();
      DAL.syncAssetFolder();
    });
  };

  /* --- Native drag-and-drop of real files -------------------------------- */

  /* The in-app pointer drag system moves records between panels; files arriving
     from the desktop are a separate HTML5 dataTransfer flow. */
  function fileDropTarget(el){
    while(el && el !== document.body){
      if(el.getAttribute && (el.getAttribute('data-asset-drop') || el.getAttribute('data-asset-bind'))) return el;
      el = el.parentElement;
    }
    return null;
  }

  function hasFiles(e){
    var dt = e.dataTransfer;
    if(!dt) return false;
    if(dt.types) for(var i=0;i<dt.types.length;i++){ if(dt.types[i] === 'Files') return true; }
    return false;
  }

  document.addEventListener('dragover', function(e){
    if(!hasFiles(e)) return;
    var zone = fileDropTarget(e.target);
    if(!zone) return;
    e.preventDefault();
    zone.classList.add('file-drag-over');
  });

  document.addEventListener('dragleave', function(e){
    var zone = fileDropTarget(e.target);
    if(zone && !zone.contains(e.relatedTarget)) zone.classList.remove('file-drag-over');
  });

  document.addEventListener('drop', function(e){
    if(!hasFiles(e)) return;
    var zone = fileDropTarget(e.target);
    if(!zone) return;
    e.preventDefault();
    zone.classList.remove('file-drag-over');
    var files = e.dataTransfer.files;
    if(!files || !files.length) return;

    var bind = zone.getAttribute('data-asset-bind');
    if(bind){
      /* Dropped straight onto a scene or chapter: import, then attach in the slot
         the file's own type implies. */
      var parts = bind.split(':');
      DAL.attachDroppedFiles(files, parts[0], parts.slice(1).join(':'));
      return;
    }
    DAL.receiveAssetFiles(files, zone.getAttribute('data-asset-drop'));
  });

  DAL.attachDroppedFiles = function(files, kind, id){
    var proj = DAL.activeProject();
    if(!proj) return;
    var list = Array.prototype.slice.call(files);
    DAL.importAssetFiles(proj, list).then(function(res){
      res.failed.forEach(function(msg){ DAL.toast(msg, 'error'); });
      var holder = DAL.audioHolder(proj, kind, id);
      if(!holder){ DAL.render(); return; }
      if(!holder.audio) holder.audio = { voice:'', ambient:'' };
      var attached = [];
      list.forEach(function(file){
        var folderKey = DAL.assetFolderForFile(file);
        var asset = (proj.assets[folderKey] || []).filter(function(a){ return a.name === file.name; }).pop();
        if(!asset) return;
        if(folderKey === 'sounds'){
          /* An untaken ambient slot is the useful default for a bed; a second
             sound becomes the voice clip. */
          var slot = holder.audio.ambient ? 'voice' : 'ambient';
          holder.audio[slot] = asset.id;
          attached.push(file.name + ' \u2192 ' + slot);
        } else if(kind === 'node'){
          holder.images = holder.images || [];
          holder.images.push({ assetId: asset.id, name: asset.name });
          attached.push(file.name + ' \u2192 scene art');
        } else if(kind === 'chapter'){
          holder.imageAssetId = asset.id;
          attached.push(file.name + ' \u2192 chapter art');
        }
      });
      DAL.saveState();
      DAL.render();
      DAL.syncAssetFolder();
      if(attached.length) DAL.toast('Attached ' + attached.join(', '), 'success');
    });
  };

  /* --- Actions ----------------------------------------------------------- */

  DAL.handleAssetAction = function(action, el){
    /* The audio controls also appear in the library player, which has no
       "active project" in the workspace sense. */
    var proj = DAL.audioContextProject ? DAL.audioContextProject() : DAL.activeProject();
    if(!proj) return false;
    DAL.ensureAssets(proj);

    /* Read-aloud lives here because it needs the same project resolution as the
       rest of the audio controls: the reader is not the workspace project. */
    if(action === 'read-aloud'){
      if(DAL.readAloud.speaking){
        DAL.stopReadAloud();
        el.textContent = DAL.READ_ALOUD_LABEL;
        return true;
      }
      var cid = DAL._readAloudCid || '';
      var chapter = cid ? DAL.audioHolder(proj, 'chapter', cid) : null;
      if(DAL.startReadAloud(proj, chapter)) el.textContent = '\u25a0 Stop reading';
      return true;
    }

    if(action === 'asset-folder'){
      DAL._assetFolderKey = el.getAttribute('data-folder');
      DAL.render();
      DAL.refreshAssetUsage();
      return true;
    }

    if(action === 'asset-pick'){
      var zone = el.closest ? el.closest('[data-asset-drop]') : null;
      DAL.openAssetPicker(zone ? zone.getAttribute('data-asset-drop') : DAL.assetFolderKey());
      return true;
    }

    if(action === 'asset-delete'){
      var aid = el.getAttribute('data-aid');
      var asset = DAL.assetById(proj, aid);
      if(!asset) return true;
      if(!confirm('Delete “' + asset.name + '”? Any scene or chapter using it loses that attachment.')) return true;
      DAL.deleteAsset(proj, aid).then(function(){
        DAL.toast('Asset deleted', 'success');
        DAL.render();
        DAL.refreshAssetUsage();
      });
      return true;
    }

    if(action === 'audio-mute'){
      proj.audio.muted = !!el.checked;
      if(proj.audio.muted) DAL.audioBus.stopAll();
      DAL.audioBus.applyVolumes();
      DAL.saveState();
      DAL.render();
      return true;
    }

    if(action === 'audio-vol'){
      var channel = el.getAttribute('data-channel');
      var value = Math.min(1, Math.max(0, (parseInt(el.value, 10) || 0) / 100));
      if(channel === 'ambient') proj.audio.ambientVolume = value;
      else proj.audio.voiceVolume = value;
      DAL.audioBus.applyVolumes();
      var out = el.parentElement && el.parentElement.querySelector('output');
      if(out) out.textContent = Math.round(value*100) + '%';
      DAL.saveState();
      return true;
    }

    if(action === 'tts-enabled'){ proj.audio.ttsEnabled = !!el.checked; DAL.saveState(); return true; }
    if(action === 'tts-voice'){ proj.audio.ttsVoice = el.value || ''; DAL.saveState(); return true; }

    if(action === 'tts-rate' || action === 'tts-pitch'){
      var v = (parseInt(el.value, 10) || 0) / 100;
      if(action === 'tts-rate') proj.audio.ttsRate = Math.min(2, Math.max(0.5, v));
      else proj.audio.ttsPitch = Math.min(2, Math.max(0, v));
      var o = el.parentElement && el.parentElement.querySelector('output');
      if(o) o.textContent = action === 'tts-rate' ? proj.audio.ttsRate.toFixed(2) + '\u00d7' : proj.audio.ttsPitch.toFixed(2);
      DAL.saveState();
      return true;
    }

    if(action === 'tts-preview'){
      DAL.tts.speak('The lantern gutters, and the door ahead is already open.', proj);
      return true;
    }

    if(action === 'audio-stop'){ DAL.audioBus.stopAll(); return true; }

    if(action === 'bind-audio'){
      var holder = DAL.audioHolder(proj, el.getAttribute('data-holder'), el.getAttribute('data-hid'));
      if(holder){
        if(!holder.audio) holder.audio = { voice:'', ambient:'' };
        holder.audio[el.getAttribute('data-slot')] = el.value || '';
        DAL.saveState();
        DAL.toast(el.value ? 'Audio attached' : 'Audio removed', 'success');
      }
      return true;
    }

    if(action === 'bind-narration'){
      var h2 = DAL.audioHolder(proj, el.getAttribute('data-holder'), el.getAttribute('data-hid'));
      if(h2){ h2.narration = el.value; DAL.saveState(); }
      return true;
    }

    if(action === 'audio-test'){
      var kind = el.getAttribute('data-holder');
      var h3 = DAL.audioHolder(proj, kind, el.getAttribute('data-hid'));
      if(h3) DAL.presentScene(proj, h3, DAL.sceneNarrationText(h3, DAL.holderText(proj, kind, h3)));
      return true;
    }

    return false;
  };

  /* Dropping an asset from the Assets tool onto a scene, chapter or audio slot
     binds it there. The zone says what it is (data-asset-bind or a scene's
     data-nid) and may name a slot; the asset's folder decides sound versus art. */
  DAL.DROP = DAL.DROP || {};
  DAL.DROP['asset'] = function(payload, zone){
    var proj = DAL.activeProject();
    if(!proj) return;
    var scope = zone.closest('[data-asset-bind]');
    var bind = scope ? scope.getAttribute('data-asset-bind') : '';
    var nid = zone.getAttribute('data-nid') || (zone.closest('[data-nid]') ? zone.closest('[data-nid]').getAttribute('data-nid') : '');
    var kind, id;
    if(bind){ var p = bind.split(':'); kind = p[0]; id = p.slice(1).join(':'); }
    else if(nid){ kind = 'node'; id = nid; }
    else return;

    var holder = DAL.audioHolder(proj, kind, id);
    var asset = DAL.assetById(proj, payload.id);
    if(!holder || !asset) return;
    if(!holder.audio) holder.audio = { voice:'', ambient:'' };

    var wanted = zone.getAttribute('data-asset-slot') || '';
    if(wanted === 'ambient' || wanted === 'voice'){
      if(asset.folder !== 'sounds'){
        DAL.toast(asset.name + ' is artwork, not a sound. Drop it on the scene or chapter itself.', 'error');
        return;
      }
      holder.audio[wanted] = asset.id;
      DAL.toast(asset.name + ' set as the ' + (wanted === 'ambient' ? 'ambient track' : 'voiceover clip'), 'success');
    } else if(asset.folder === 'sounds'){
      /* No named slot: fill the ambient bed first, then the voice line. */
      var slot = holder.audio.ambient && !holder.audio.voice ? 'voice' : 'ambient';
      holder.audio[slot] = asset.id;
      DAL.toast(asset.name + ' set as the ' + (slot === 'ambient' ? 'ambient track' : 'voiceover clip'), 'success');
    } else {
      /* Scenes and chapters both keep artwork in `images`; the chapter strip shows
         at most two, so a third drop is refused rather than silently hidden. */
      holder.images = holder.images || [];
      if(kind === 'chapter' && holder.images.length >= 2){
        DAL.toast('This chapter already has two illustrations. Remove one first.', 'error');
        return;
      }
      holder.images.push({ assetId: asset.id, name: asset.name });
      DAL.toast(asset.name + ' added to the ' + (kind === 'chapter' ? 'chapter' : 'scene'), 'success');
    }
    DAL.saveState();
    DAL.render();
  };

  /* --- Event wiring ------------------------------------------------------ */

  /* Clicks reach view handlers through DAL.handleClick; wrapping it keeps asset
     actions out of the core dispatch chain. */
  var baseHandleClick = DAL.handleClick;

  /* Turning the page or leaving the reader has to silence the narrator, otherwise
     it carries on reading a page nobody is looking at. */
  var STOPS_READING = ['bp-next','bp-prev','bp-goto','reader-next','reader-prev','reader-goto','close-reader','switch-tool','nav'];

  DAL.handleClick = function(action, el, e){
    if(DAL.readAloud && DAL.readAloud.speaking && STOPS_READING.indexOf(action) !== -1) DAL.stopReadAloud();
    if(DAL.handleAssetAction(action, el)) return;
    if(baseHandleClick) baseHandleClick(action, el, e);
  };

  /* Dropdowns commit on change. Restricted to SELECT so checkbox actions are not
     handled twice — those already arrive as clicks. */
  document.addEventListener('change', function(e){
    var el = e.target;
    if(el.tagName !== 'SELECT' || !el.hasAttribute('data-action')) return;
    var action = el.getAttribute('data-action');
    if(action === 'bind-audio' || action === 'tts-voice') DAL.handleAssetAction(action, el);
  });

  /* Sliders and the narration script update live, without a re-render that would
     drop the drag or steal focus mid-sentence. */
  document.addEventListener('input', function(e){
    var el = e.target;
    if(!el.hasAttribute || !el.hasAttribute('data-action')) return;
    var action = el.getAttribute('data-action');
    if(action === 'audio-vol' || action === 'tts-rate' || action === 'tts-pitch' || action === 'bind-narration'){
      DAL.handleAssetAction(action, el);
    }
  });

  /* Object URLs have to exist before a view can reference them. Priming after a
     render and re-rendering only when something new resolved avoids a loop. */
  var baseAfterRender = DAL.afterRender;
  DAL.afterRender = function(){
    if(baseAfterRender) baseAfterRender();
    if(DAL.currentTool === 'assets') DAL.refreshAssetUsage();
    var proj = DAL.audioContextProject ? DAL.audioContextProject() : DAL.activeProject();
    if(!proj) return;
    DAL.ensureAssets(proj);
    var pending = DAL.allAssets(proj).filter(function(a){ return !a.inline && !DAL._assetUrls[a.id]; });
    if(!pending.length) return;
    DAL.primeAssetUrls(proj).then(function(){
      var resolved = pending.some(function(a){ return !!DAL._assetUrls[a.id]; });
      if(resolved) DAL.render();
    });
  };

  /* --- Folder sync ------------------------------------------------------- */

  /* Mirrors the asset registry into Assets/<Folder>/ inside a linked project
     folder, so a project handed to someone else carries its media with it. */
  DAL.syncAssetFolder = function(){
    var proj = DAL.activeProject();
    if(!proj || !proj.folderHandle || !DAL.getDir) return Promise.resolve();
    DAL.ensureAssets(proj);
    var root = proj.folderHandle;
    return DAL.getDir(root, 'Assets').then(function(assetsDir){
      return DAL.ASSET_FOLDERS.reduce(function(chain, folder){
        return chain.then(function(){
          var list = proj.assets[folder.key] || [];
          if(!list.length) return null;
          return DAL.getDir(assetsDir, folder.dir).then(function(dir){
            return list.reduce(function(inner, asset){
              return inner.then(function(){
                if(asset.inline) return DAL.writeFile(dir, asset.name, asset.inline);
                return DAL.blobStore.get(asset.id).then(function(rec){
                  if(!rec || !rec.blob) return null;
                  return DAL.writeFile(dir, asset.name, rec.blob);
                });
              }).catch(function(){ /* one unwritable file must not stop the rest */ });
            }, Promise.resolve());
          });
        });
      }, Promise.resolve());
    }).catch(function(){});
  };

})();
