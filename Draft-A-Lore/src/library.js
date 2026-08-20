/* Library shelf, the adventure player, and project import with assets. */

(function(){

  /* Scene art predates the asset folder, so an image record may carry either an
     inline data URL or an asset id. Both have to keep rendering. */
  DAL.imageSrc = function(proj, img){
    if(!img) return '';
    if(img.assetId){
      var src = DAL.assetSrc(proj, img.assetId);
      if(src) return src;
    }
    return img.dataUrl || '';
  };

  /* --- Shelf -------------------------------------------------------------- */

  /* The shelf now carries adventures as well as books: an RPG project is
     finished work too, and previously had nowhere to be read from end to end. */
  DAL.libraryEntries = function(){
    return DAL.state.projectOrder.map(function(id){ return DAL.state.projects[id]; })
      .filter(function(p){ return p && (p.status === 'completed' || p.status === 'published'); })
      .map(function(p){
        var hasChapters = (p.chapters || []).length > 0;
        var hasScenes = p.adventure && (p.adventure.nodes || []).length > 0;
        var modes = [];
        if(hasChapters && p.type !== 'rpg') modes.push('read');
        if(hasScenes && p.type !== 'novel') modes.push('play');
        return { project: p, modes: modes };
      })
      .filter(function(entry){ return entry.modes.length > 0; });
  };

  DAL.renderLibrary = function(){
    var entries = DAL.libraryEntries();
    var html = '<div class="section-header"><div class="section-title">Library</div>'+
      '<button class="btn" data-action="library-import">Import Project\u2026</button></div>';

    if(!entries.length){
      return html + '<div class="empty-state">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'+
        '<h3>Library Empty</h3><p>Mark a project completed or published and it appears here, ready to read or play with its artwork and audio. You can also import a project shared with you.</p></div>';
    }

    html += '<p class="asset-intro">Read finished books or play through finished adventures exactly as a reader would, with artwork, formatting and audio switched on.</p>';
    var colors = ['var(--c-accent)','var(--c-info)','var(--c-success)','var(--c-warning)','var(--c-danger)'];
    html += '<div class="library-grid">';
    entries.forEach(function(entry, i){
      var p = entry.project;
      var color = colors[i % colors.length];
      var author = (p.cover && p.cover.author) || (DAL.state.autoFillAuthor ? DAL.state.authorName : '');
      var primary = entry.modes[0];
      var counts = [];
      if(p.chapters && p.chapters.length) counts.push(p.chapters.length + ' chapter' + (p.chapters.length === 1 ? '' : 's'));
      if(p.adventure && p.adventure.nodes && p.adventure.nodes.length) counts.push(p.adventure.nodes.length + ' scene' + (p.adventure.nodes.length === 1 ? '' : 's'));
      var sounds = ((p.assets && p.assets.sounds) || []).length;
      if(sounds) counts.push(sounds + ' sound' + (sounds === 1 ? '' : 's'));

      html += '<div class="book-spine" data-action="'+(primary === 'play' ? 'open-player' : 'open-reader')+'" data-pid="'+p.id+'" style="background:linear-gradient(135deg,'+color+','+color+'88);color:#fff">'+
        '<div class="book-spine-kind">'+(primary === 'play' ? 'Adventure' : 'Book')+'</div>'+
        '<div class="book-spine-title">'+DAL.escapeHtml((p.cover && p.cover.title) || p.name)+'</div>'+
        (author ? '<div class="book-spine-author">'+DAL.escapeHtml(author)+'</div>' : '')+
        (counts.length ? '<div class="book-spine-meta">'+DAL.escapeHtml(counts.join(' \u00b7 '))+'</div>' : '')+
        '<div class="book-spine-actions">'+
          (entry.modes.indexOf('read') >= 0 ? '<button class="btn sm" data-action="open-reader" data-pid="'+p.id+'">Read</button>' : '')+
          (entry.modes.indexOf('play') >= 0 ? '<button class="btn sm" data-action="open-player" data-pid="'+p.id+'">Play</button>' : '')+
        '</div>'+
      '</div>';
    });
    html += '</div>';
    return html;
  };

  /* --- Adventure player --------------------------------------------------- */

  /* A reader-facing run of a finished adventure: no author panels, no debug
     inspector, art and audio on by default. Kept apart from the playtester so
     neither has to compromise. */
  DAL.openPlayer = function(pid){
    var proj = DAL.state.projects[pid];
    if(!proj) return;
    var adv = proj.adventure;
    if(!adv || !(adv.nodes || []).length){ DAL.toast('This project has no scenes to play.', 'info'); return; }
    DAL.ensureAssets(proj);
    DAL.playerProjectId = pid;
    DAL.playerState = DAL.rpg.newState(adv);
    DAL.currentView = 'player';
    DAL.primeAssetUrls(proj).then(function(){
      DAL.render();
      DAL.playerPresent();
    });
  };

  DAL.closePlayer = function(){
    DAL.audioBus.stopAll();
    DAL.playerProjectId = null;
    DAL.playerState = null;
    DAL.navigate('library');
  };

  DAL.playerPresent = function(){
    var proj = DAL.state.projects[DAL.playerProjectId];
    if(!proj || !DAL.playerState) return;
    var node = DAL.rpg.currentNode(DAL.playerState, proj.adventure);
    if(!node) return;
    DAL.presentScene(proj, node, DAL.sceneNarrationText(node, node.text));
  };

  DAL.renderPlayer = function(){
    var proj = DAL.state.projects[DAL.playerProjectId];
    if(!proj) return '<div class="empty-state"><h3>Project not found</h3></div>';
    var adv = proj.adventure;
    var state = DAL.playerState;
    var node = DAL.rpg.currentNode(state, adv);
    if(!node) return '<div class="empty-state"><h3>This adventure has no opening scene</h3></div>';

    /* The player inherits the reader's typeface, text size, spacing and tint, so
       a reader sets up how they like to read once and every kind of story in the
       library obeys it. */
    var html = '<div class="player-shell"'+DAL.readerStyleAttr()+'>';
    html += '<div class="player-bar">'+
      '<button class="btn sm" data-action="close-player">\u2190 Library</button>'+
      '<div class="player-title">'+DAL.escapeHtml((proj.cover && proj.cover.title) || proj.name)+'</div>'+
      '<div class="player-bar-right">'+
        DAL.renderAudioBar(proj)+
        /* The same reading controls the book readers offer, minus the read-aloud
           button: the player's own audio bar already owns narration here. */
        DAL.readerControls({ readAloud:false })+
        '<button class="btn sm" data-action="player-restart">Restart</button>'+
      '</div></div>';

    html += '<article class="player-scene">';
    html += '<h1 class="player-scene-title">'+DAL.escapeHtml(node.title || '')+'</h1>';
    (node.images || []).forEach(function(img){
      var src = DAL.imageSrc(proj, img);
      if(!src) return;
      html += '<figure class="player-art"><img src="'+src+'" alt="'+DAL.escapeHtml(img.caption || img.name || '')+'">'+
        (img.caption ? '<figcaption>'+DAL.escapeHtml(img.caption)+'</figcaption>' : '')+'</figure>';
    });
    html += '<div class="player-text">'+DAL.escapeHtml(node.text || '').replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')+'</div>';

    var ending = node.kind === 'ending';
    if(ending){
      html += '<div class="player-ending"><div class="player-ending-label">'+DAL.escapeHtml(node.endingLabel || 'The End')+'</div>'+
        (node.endingMessage ? '<p>'+DAL.escapeHtml(node.endingMessage)+'</p>' : '')+
        '<button class="btn primary" data-action="player-restart">Play again</button></div>';
    } else {
      var states = DAL.rpg.choiceStates(node, state, adv);
      var shown = states.filter(function(s){ return !s.hidden; });
      if(!shown.length){
        html += '<div class="player-ending"><div class="player-ending-label">The path ends here</div>'+
          '<p>There is nothing further to choose from this scene.</p>'+
          '<button class="btn primary" data-action="player-restart">Play again</button></div>';
      } else {
        html += '<div class="player-choices">';
        shown.forEach(function(s){
          if(s.ok){
            html += '<button class="player-choice" data-action="player-choose" data-idx="'+s.index+'">'+DAL.escapeHtml(s.choice.label || 'Continue')+'</button>';
          } else {
            /* A locked choice still shows its requirement, so a reader learns what
               to go and do rather than staring at a dead button. */
            html += '<div class="player-choice locked" aria-disabled="true">'+DAL.escapeHtml(s.choice.label || 'Continue')+
              (s.unmet && s.unmet.length ? '<span class="player-choice-req">Requires: '+DAL.escapeHtml(s.unmet.join(', '))+'</span>' : '')+'</div>';
          }
        });
        html += '</div>';
      }
    }
    html += '</article>';

    html += DAL.renderPlayerStatus(proj, state, adv);
    html += '</div>';
    return html;
  };

  DAL.renderPlayerStatus = function(proj, state, adv){
    var stats = DAL.rpg.statRows(state, adv) || [];
    var items = DAL.rpg.inventoryRows(state, adv) || [];
    var traits = DAL.rpg.traitRows(state, adv) || [];
    if(!stats.length && !items.length && !traits.length) return '';
    var html = '<aside class="player-status">';
    if(stats.length){
      html += '<div class="player-status-group"><div class="player-status-title">Condition</div><dl>';
      stats.forEach(function(r){ html += '<div><dt>'+DAL.escapeHtml(r.label)+'</dt><dd>'+DAL.escapeHtml(String(r.value))+'</dd></div>'; });
      html += '</dl></div>';
    }
    if(items.length){
      html += '<div class="player-status-group"><div class="player-status-title">Carrying</div><ul>';
      items.forEach(function(r){ html += '<li>'+DAL.escapeHtml(r.name)+(r.qty > 1 ? ' \u00d7'+r.qty : '')+'</li>'; });
      html += '</ul></div>';
    }
    if(traits.length){
      html += '<div class="player-status-group"><div class="player-status-title">Traits</div><ul>';
      traits.forEach(function(r){ html += '<li>'+DAL.escapeHtml(r.label)+'</li>'; });
      html += '</ul></div>';
    }
    html += '</aside>';
    return html;
  };

  /* Shared transport controls, used by the player, the reader and the
     playtester so audio behaves the same in all three. */
  DAL.renderAudioBar = function(proj){
    DAL.ensureAssets(proj);
    var muted = proj.audio.muted;
    return '<div class="audio-bar">'+
      '<button class="btn sm icon" data-action="audio-mute-toggle" title="'+(muted ? 'Unmute audio' : 'Mute audio')+'" aria-pressed="'+(muted ? 'true' : 'false')+'">'+(muted ? '\u{1F507}' : '\u{1F50A}')+'</button>'+
      '<button class="btn sm icon" data-action="audio-replay" title="Replay narration">\u21BB</button>'+
      '<input class="form-range slim" type="range" min="0" max="100" value="'+Math.round(proj.audio.voiceVolume*100)+'" data-action="audio-vol" data-channel="voice" title="Voice volume" aria-label="Voice volume">'+
    '</div>';
  };

  /* --- Playtester audio and art ------------------------------------------ */

  /* The playtester keeps its author panels; this adds the transport bar and
     makes each scene change speak and play its bed. */
  var basePlaytest = DAL.renderPlaytest;
  DAL.renderPlaytest = function(proj){
    var html = basePlaytest.call(DAL, proj);
    DAL.ensureAssets(proj);
    var bar = '<div class="playtest-audio-bar">'+DAL.renderAudioBar(proj)+
      '<span class="asset-note">Scene audio and narration play here exactly as a reader hears them.</span></div>';
    html = html.replace('<div class="playtest-passage-title"', bar + '<div class="playtest-passage-title"');

    /* Present after the DOM settles, and only when the scene actually changed,
       so a re-render for an unrelated reason does not restart the narration. */
    var node = DAL.rpg.currentNode(DAL.playtestState, proj.adventure);
    if(node && DAL._ptSpokenNode !== node.id){
      DAL._ptSpokenNode = node.id;
      setTimeout(function(){
        if(DAL.currentTool === 'playtest') DAL.presentScene(proj, node, DAL.sceneNarrationText(node, node.text));
      }, 60);
    }
    return html;
  };

  /* --- Actions ----------------------------------------------------------- */

  var baseHandleClick = DAL.handleClick;
  DAL.handleClick = function(action, el, e){
    var proj;

    if(action === 'open-player'){ DAL.openPlayer(el.getAttribute('data-pid')); return; }
    if(action === 'close-player'){ DAL.closePlayer(); return; }

    if(action === 'player-restart'){
      proj = DAL.state.projects[DAL.playerProjectId];
      if(proj){
        DAL.playerState = DAL.rpg.newState(proj.adventure);
        DAL.audioBus.stopAll();
        DAL.render();
        DAL.playerPresent();
      }
      return;
    }

    if(action === 'player-choose'){
      proj = DAL.state.projects[DAL.playerProjectId];
      if(proj){
        var res = DAL.rpg.choose(DAL.playerState, proj.adventure, parseInt(el.getAttribute('data-idx'), 10));
        if(res && res.refusals && res.refusals.length) res.refusals.forEach(function(m){ DAL.toast(m, 'info'); });
        DAL.render();
        DAL.playerPresent();
      }
      return;
    }

    if(action === 'audio-mute-toggle'){
      proj = DAL.audioContextProject();
      if(proj){
        proj.audio.muted = !proj.audio.muted;
        if(proj.audio.muted) DAL.audioBus.stopAll();
        DAL.saveState();
        DAL.render();
        if(!proj.audio.muted) DAL.replayNarration();
      }
      return;
    }

    if(action === 'audio-replay'){ DAL.replayNarration(); return; }

    if(action === 'library-import'){ DAL.openProjectImport(); return; }

    if(baseHandleClick) baseHandleClick(action, el, e);
  };

  /* Audio controls appear in three different views, each with its own idea of
     "the current project". */
  DAL.audioContextProject = function(){
    if(DAL.currentView === 'player' && DAL.playerProjectId) return DAL.state.projects[DAL.playerProjectId];
    if(DAL._inReader && DAL._readerPid) return DAL.state.projects[DAL._readerPid];
    return DAL.activeProject();
  };

  DAL.replayNarration = function(){
    if(DAL.currentView === 'player'){ DAL.playerPresent(); return; }
    var proj = DAL.audioContextProject();
    if(!proj) return;
    if(DAL.currentTool === 'playtest'){
      var node = DAL.rpg.currentNode(DAL.playtestState, proj.adventure);
      if(node) DAL.presentScene(proj, node, DAL.sceneNarrationText(node, node.text));
    }
  };

  /* --- Import ------------------------------------------------------------ */

  /* Two shapes are accepted: a single project .json, or a folder chosen with the
     directory picker whose relative Assets/ tree is read in alongside it. A
     project shared between machines therefore arrives complete. */
  DAL.openProjectImport = function(){
    var canFolder = typeof window.showDirectoryPicker === 'function';
    var body = '<p>Bring in a project someone shared with you.</p>'+
      '<div class="import-choice">'+
        '<button class="btn block" data-action="import-project-file">Choose a project file (.json)</button>'+
        '<span class="asset-note">Artwork and audio come across only if they were embedded in the file.</span>'+
      '</div>';
    if(canFolder){
      body += '<div class="import-choice">'+
        '<button class="btn block primary" data-action="import-project-folder">Choose a project folder</button>'+
        '<span class="asset-note">Recommended. Reads <code>project.json</code> plus the whole <code>Assets/</code> folder beside it, so images and sound arrive too.</span>'+
      '</div>';
    } else {
      body += '<p class="asset-note">Folder import needs a desktop Chromium browser. In this browser, use a project file.</p>';
    }
    DAL.modal('Import Project', body);
  };

  DAL.importProjectFolder = function(){
    if(typeof window.showDirectoryPicker !== 'function'){
      DAL.toast('This browser cannot read folders.', 'error');
      return;
    }
    window.showDirectoryPicker().then(function(dir){
      DAL.closeModal();
      DAL.toast('Reading project folder\u2026', 'info');
      return dir.getFileHandle('project.json').then(function(h){ return h.getFile(); })
        .then(function(file){ return file.text(); })
        .then(function(text){
          var data = JSON.parse(text);
          var proj = DAL.adoptImportedProject(data);
          return DAL.readAssetsFolder(dir, proj).then(function(count){
            DAL.saveState();
            return DAL.primeAssetUrls(proj).then(function(){
              DAL.render();
              DAL.toast('Imported “' + proj.name + '” with ' + count + ' asset' + (count === 1 ? '' : 's'), 'success');
            });
          });
        })
        .catch(function(e){
          DAL.toast(e && e.name === 'NotFoundError'
            ? 'That folder has no project.json in it.'
            : 'Could not import that folder: ' + (e && e.message ? e.message : 'unknown error'), 'error');
        });
    }).catch(function(){ /* the user dismissed the picker */ });
  };

  /* Walks Assets/<Folder> and stores every file it recognises, rewriting the
     imported project's asset ids so bindings survive the move. */
  DAL.readAssetsFolder = function(dir, proj){
    return dir.getDirectoryHandle('Assets').then(function(assetsDir){
      var jobs = [];
      return DAL.ASSET_FOLDERS.reduce(function(chain, folder){
        return chain.then(function(){
          return assetsDir.getDirectoryHandle(folder.dir).then(function(sub){
            var files = [];
            /* for await is unavailable in this ES5 codebase, so the async
               iterator is drained by hand. */
            function drain(iter){
              return iter.next().then(function(step){
                if(step.done) return files;
                files.push(step.value[1]);
                return drain(iter);
              });
            }
            return drain(sub.entries()).then(function(handles){
              return handles.reduce(function(inner, handle){
                return inner.then(function(){
                  if(handle.kind !== 'file') return null;
                  return handle.getFile().then(function(file){
                    jobs.push(DAL.remapImportedAsset(proj, file, folder.key));
                  });
                });
              }, Promise.resolve());
            });
          }).catch(function(){ /* an absent subfolder is normal */ });
        });
      }, Promise.resolve()).then(function(){
        return Promise.all(jobs).then(function(res){ return res.filter(Boolean).length; });
      });
    }).catch(function(){ return 0; });
  };

  /* An imported project references assets by the ids of the machine it came
     from. Matching by filename and rewriting every binding is what makes a
     shared project playable rather than silently mute. */
  DAL.remapImportedAsset = function(proj, file, folderKey){
    DAL.ensureAssets(proj);
    var existing = (proj.assets[folderKey] || []).filter(function(a){ return a.name === file.name; })[0];
    return DAL.importAssetFile(proj, file, folderKey).then(function(record){
      if(existing) DAL.rebindAsset(proj, existing.id, record.id);
      return record;
    }).catch(function(){ return null; });
  };

  DAL.rebindAsset = function(proj, oldId, newId){
    if(!oldId || oldId === newId) return;
    function swap(holder){
      if(!holder || !holder.audio) return;
      ['voice','ambient'].forEach(function(slot){ if(holder.audio[slot] === oldId) holder.audio[slot] = newId; });
    }
    (proj.chapters || []).forEach(function(ch){
      swap(ch);
      if(ch.imageAssetId === oldId) ch.imageAssetId = newId;
    });
    if(proj.adventure){
      (proj.adventure.nodes || []).forEach(function(node){
        swap(node);
        (node.images || []).forEach(function(img){ if(img.assetId === oldId) img.assetId = newId; });
      });
    }
    (proj.illustrations || []).forEach(function(ill){ if(ill.assetId === oldId) ill.assetId = newId; });
    /* Drop the stale placeholder record now that everything points at the real
       imported file. */
    DAL.ASSET_FOLDERS.forEach(function(f){
      proj.assets[f.key] = (proj.assets[f.key] || []).filter(function(a){ return a.id !== oldId; });
    });
  };

  /* Gives the incoming project a fresh id so importing twice, or importing a
     project that started life on this machine, never overwrites local work. */
  DAL.adoptImportedProject = function(data){
    var proj = data && data.project ? data.project : data;
    if(!proj || typeof proj !== 'object') throw new Error('That file does not contain a project.');
    var id = DAL.uid('proj');
    proj.id = id;
    proj.folderHandle = undefined;
    delete proj.folderHandle;
    if(!proj.name) proj.name = 'Imported Project';
    if(DAL.state.projectOrder.indexOf(id) < 0) DAL.state.projectOrder.push(id);
    DAL.state.projects[id] = proj;
    DAL.ensureAssets(proj);
    return proj;
  };

  DAL.importProjectFile = function(){
    var input = document.getElementById('projectImportInput');
    if(!input){
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'projectImportInput';
      input.accept = 'application/json,.json';
      input.hidden = true;
      document.body.appendChild(input);
      input.addEventListener('change', function(){
        var file = input.files && input.files[0];
        input.value = '';
        if(!file) return;
        file.text().then(function(text){
          var proj = DAL.adoptImportedProject(JSON.parse(text));
          DAL.saveState();
          DAL.closeModal();
          DAL.render();
          DAL.toast('Imported “' + proj.name + '”', 'success');
        }).catch(function(e){ DAL.toast('Could not read that file: ' + e.message, 'error'); });
      });
    }
    input.click();
  };

  var importClick = DAL.handleClick;
  DAL.handleClick = function(action, el, e){
    if(action === 'import-project-folder'){ DAL.importProjectFolder(); return; }
    if(action === 'import-project-file'){ DAL.importProjectFile(); return; }
    if(importClick) importClick(action, el, e);
  };

})();
