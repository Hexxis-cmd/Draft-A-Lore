/* Cross-browser project bundles.

   A .dalz file is an ordinary ZIP archive containing the same readable project
   layout a linked folder uses. Keeping the ZIP code here lets the offline app
   move a complete project in browsers that cannot offer a directory picker. */

(function(){
  var UTF8 = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  var UTF8_DECODER = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
  var CRC_TABLE = (function(){
    var table = [], i, j, c;
    for(i=0; i<256; i++){
      c = i;
      for(j=0; j<8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c >>> 0;
    }
    return table;
  })();

  function bytes(text){
    if(UTF8) return UTF8.encode(String(text));
    var encoded = unescape(encodeURIComponent(String(text))), out = new Uint8Array(encoded.length), i;
    for(i=0; i<encoded.length; i++) out[i] = encoded.charCodeAt(i);
    return out;
  }

  function text(data){
    if(UTF8_DECODER) return UTF8_DECODER.decode(data);
    var out = '', i;
    for(i=0; i<data.length; i++) out += String.fromCharCode(data[i]);
    return decodeURIComponent(escape(out));
  }

  function crc32(data){
    var crc = 0xffffffff, i;
    for(i=0; i<data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function put16(out, at, value){ out[at] = value & 255; out[at+1] = (value >>> 8) & 255; }
  function put32(out, at, value){
    out[at] = value & 255; out[at+1] = (value >>> 8) & 255;
    out[at+2] = (value >>> 16) & 255; out[at+3] = (value >>> 24) & 255;
  }
  function get16(data, at){ return data[at] | (data[at+1] << 8); }
  function get32(data, at){ return (data[at] | (data[at+1] << 8) | (data[at+2] << 16) | (data[at+3] << 24)) >>> 0; }
  function copy(out, at, data){ out.set(data, at); return at + data.length; }

  function dosTime(now){
    return ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xffff;
  }
  function dosDate(now){
    return (((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
  }

  /* STORE-only ZIPs are deliberately simple and work with the archive tools
     already present on Windows, macOS and common Unix installations. */
  DAL.makeZip = function(files){
    var now = new Date(), time = dosTime(now), date = dosDate(now), localSize = 0, centralSize = 0, offset = 0;
    var entries = (files || []).map(function(file){
      var name = bytes(file.name), data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
      var entry = { name: name, data: data, crc: crc32(data), time: time, date: date, offset: offset };
      offset += 30 + name.length + data.length;
      localSize += 30 + name.length + data.length;
      centralSize += 46 + name.length;
      return entry;
    });
    if(entries.length > 65535) throw new Error('This project has too many files for a ZIP bundle.');
    var out = new Uint8Array(localSize + centralSize + 22), at = 0, centralAt, i, e;
    for(i=0; i<entries.length; i++){
      e = entries[i];
      put32(out, at, 0x04034b50); put16(out, at+4, 20); put16(out, at+6, 0x0800); put16(out, at+8, 0);
      put16(out, at+10, e.time); put16(out, at+12, e.date); put32(out, at+14, e.crc);
      put32(out, at+18, e.data.length); put32(out, at+22, e.data.length); put16(out, at+26, e.name.length); put16(out, at+28, 0);
      at = copy(out, at+30, e.name); at = copy(out, at, e.data);
    }
    centralAt = at;
    for(i=0; i<entries.length; i++){
      e = entries[i];
      put32(out, at, 0x02014b50); put16(out, at+4, 20); put16(out, at+6, 20); put16(out, at+8, 0x0800); put16(out, at+10, 0);
      put16(out, at+12, e.time); put16(out, at+14, e.date); put32(out, at+16, e.crc);
      put32(out, at+20, e.data.length); put32(out, at+24, e.data.length); put16(out, at+28, e.name.length); put16(out, at+30, 0); put16(out, at+32, 0);
      put16(out, at+34, 0); put16(out, at+36, 0); put32(out, at+38, 0); put32(out, at+42, e.offset);
      at = copy(out, at+46, e.name);
    }
    put32(out, at, 0x06054b50); put16(out, at+4, 0); put16(out, at+6, 0); put16(out, at+8, entries.length); put16(out, at+10, entries.length);
    put32(out, at+12, at-centralAt); put32(out, at+16, centralAt); put16(out, at+20, 0);
    return out;
  };

  function findEndRecord(data){
    var start = Math.max(0, data.length - 65557), i;
    for(i=data.length-22; i>=start; i--){ if(get32(data, i) === 0x06054b50) return i; }
    throw new Error('That file is not a valid ZIP archive.');
  }

  /* The central directory carries the actual sizes, so this also handles ZIPs
     that use data descriptors. DEFLATE is read through the platform stream when
     available; our own output stays STORE-only to keep bundle creation small. */
  DAL.readZip = function(input){
    var data = input instanceof Uint8Array ? input : new Uint8Array(input);
    var end = findEndRecord(data), count = get16(data, end+10), at = get32(data, end+16), entries = [], i;
    if(get16(data, end+4) || get16(data, end+6) || count === 0xffff || get32(data, end+12) === 0xffffffff || at === 0xffffffff){
      throw new Error('ZIP64 bundles are not supported.');
    }
    for(i=0; i<count; i++){
      if(get32(data, at) !== 0x02014b50) throw new Error('The ZIP directory is damaged.');
      var flags = get16(data, at+8), method = get16(data, at+10), compressed = get32(data, at+20), size = get32(data, at+24);
      var nameLength = get16(data, at+28), extraLength = get16(data, at+30), commentLength = get16(data, at+32), localOffset = get32(data, at+42);
      if(at + 46 + nameLength + extraLength + commentLength > data.length) throw new Error('The ZIP directory is truncated.');
      entries.push({ name: text(data.slice(at+46, at+46+nameLength)), flags: flags, method: method, compressed: compressed, size: size, offset: localOffset });
      at += 46 + nameLength + extraLength + commentLength;
    }
    function entryData(entry){
      if(entry.offset + 30 > data.length || get32(data, entry.offset) !== 0x04034b50) return Promise.reject(new Error('The ZIP entry “'+entry.name+'” is damaged.'));
      var localName = get16(data, entry.offset+26), localExtra = get16(data, entry.offset+28), from = entry.offset + 30 + localName + localExtra;
      if(from + entry.compressed > data.length) return Promise.reject(new Error('The ZIP entry “'+entry.name+'” is truncated.'));
      var packed = data.slice(from, from + entry.compressed);
      if(entry.method === 0) return Promise.resolve(packed);
      if(entry.method !== 8) return Promise.reject(new Error('The ZIP entry “'+entry.name+'” uses unsupported compression method '+entry.method+'.'));
      if(typeof DecompressionStream === 'undefined') return Promise.reject(new Error('The ZIP entry “'+entry.name+'” is deflated, but this browser cannot decompress deflated ZIP files.'));
      try{
        return new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(buffer){
          var unpacked = new Uint8Array(buffer);
          if(unpacked.length !== entry.size) throw new Error('The ZIP entry “'+entry.name+'” has an unexpected size.');
          return unpacked;
        });
      } catch(err){ return Promise.reject(new Error('Could not decompress “'+entry.name+'”: '+err.message)); }
    }
    return { entries: entries, read: entryData };
  };

  function textFile(name, value){ return { name: name, data: bytes(value || '') }; }
  function chapterText(chapter){
    var holder = document.createElement('div');
    holder.innerHTML = chapter.contentHTML || '';
    return holder.textContent || '';
  }

  /* project.json remains the authoritative state snapshot. The parallel text
     files are intentionally the human-readable companions linked-folder sync
     writes, and Assets/ uses its existing standard folder names. */
  DAL.projectBundleBytes = function(proj){
    if(!proj) return Promise.reject(new Error('Open a project before saving a bundle.'));
    DAL.ensureAssets(proj);
    var snapshot = DAL.clone(proj), files = [], reads = [];
    delete snapshot.folderHandle;
    files.push(textFile('project.json', JSON.stringify(snapshot, null, 2)));
    (proj.chapters || []).forEach(function(ch, i){ files.push(textFile('chapters/'+String(i+1).padStart(2, '0')+'-'+DAL.sanitizeFilename(ch.title)+'.txt', chapterText(ch))); });
    (proj.characters || []).forEach(function(character){ files.push(textFile('characters/'+DAL.sanitizeFilename(character.name)+'.txt', character.backstory || '')); });
    ((proj.lore && proj.lore.entries) || []).forEach(function(entry){ files.push(textFile('lore/'+DAL.sanitizeFilename(entry.folder || 'miscellaneous')+'/'+DAL.sanitizeFilename(entry.title)+'.txt', entry.content || '')); });
    (proj.plots || []).forEach(function(plot){ files.push(textFile('plots/'+DAL.sanitizeFilename(plot.title)+'.txt', plot.description || '')); });
    DAL.ASSET_FOLDERS.forEach(function(folder){
      (proj.assets[folder.key] || []).forEach(function(asset){
        reads.push(function(){
          if(asset.inline) return Promise.resolve(bytes(asset.inline)).then(function(data){ files.push({ name: 'Assets/'+folder.dir+'/'+asset.name, data: data }); });
          return DAL.blobStore.get(asset.id).then(function(record){
            if(!record || !record.blob) throw new Error('Asset “'+asset.name+'” is no longer available on this device.');
            return record.blob.arrayBuffer().then(function(buffer){ return new Uint8Array(buffer); });
          }).then(function(data){ files.push({ name: 'Assets/'+folder.dir+'/'+asset.name, data: data }); });
        });
      });
    });
    return reads.reduce(function(chain, read){ return chain.then(read); }, Promise.resolve()).then(function(){ return DAL.makeZip(files); });
  };

  DAL.exportProjectBundle = function(projectId){
    var proj = DAL.state.projects[projectId || DAL.currentProjectId];
    if(!proj){ DAL.toast('Open a project before saving a bundle.', 'error'); return Promise.resolve(false); }
    DAL.toast('Packing project bundle…', 'info');
    return DAL.projectBundleBytes(proj).then(function(data){
      var blob = new Blob([data], { type:'application/zip' }), url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = DAL.sanitizeFilename(proj.name)+'.dalz';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      DAL.toast('Saved “'+proj.name+'” as a project bundle.', 'success');
      return true;
    }).catch(function(err){ DAL.toast('Could not save project bundle: '+err.message, 'error'); return false; });
  };

  function bundleProjectEntry(zip){
    var entry = zip.entries.filter(function(item){ return item.name === 'project.json'; })[0];
    if(entry) return entry;
    return zip.entries.filter(function(item){ return /(^|\/)project\.json$/.test(item.name); })[0] || null;
  }

  /* Asset records in project.json retain their source ids. Reusing the normal
     folder-import remapper writes new blobs into IndexedDB and repairs every
     scene, chapter and audio binding to the new local asset ids. */
  DAL.importProjectBundle = function(file){
    if(!file) return Promise.resolve(false);
    DAL.toast('Reading project bundle…', 'info');
    return file.arrayBuffer().then(function(buffer){
      var zip = DAL.readZip(buffer), projectEntry = bundleProjectEntry(zip);
      if(!projectEntry) throw new Error('That archive has no project.json.');
      var root = projectEntry.name.slice(0, -'project.json'.length);
      return zip.read(projectEntry).then(function(raw){
        var data;
        try{ data = JSON.parse(text(raw)); }catch(err){ throw new Error('project.json is not valid JSON.'); }
        var proj = DAL.adoptImportedProject(data), jobs = [];
        DAL.ASSET_FOLDERS.forEach(function(folder){
          var prefix = root+'Assets/'+folder.dir+'/';
          zip.entries.forEach(function(entry){
            if(entry.name.indexOf(prefix) !== 0 || entry.name.slice(prefix.length).indexOf('/') >= 0 || !entry.name.slice(prefix.length)) return;
            jobs.push(function(){
              return zip.read(entry).then(function(assetData){
                var name = entry.name.slice(prefix.length), matches = (proj.assets[folder.key] || []).filter(function(asset){ return asset.name === name; });
                var old = matches[0], blob = new Blob([assetData], { type: (old && old.mime) || '' });
                /* File is broadly available, but a named Blob has the same
                   import contract on older Safari releases that lack its
                   constructor. */
                var importedFile = typeof File === 'function' ? new File([blob], name, { type: blob.type }) : blob;
                if(!importedFile.name) importedFile.name = name;
                return DAL.remapImportedAsset(proj, importedFile, folder.key);
              });
            }());
          });
        });
        return jobs.reduce(function(chain, job){ return chain.then(function(results){ return job.then(function(result){ results.push(result); return results; }); }); }, Promise.resolve([])).then(function(results){
          var count = results.filter(Boolean).length;
          DAL.saveState();
          return DAL.primeAssetUrls(proj).then(function(){
            DAL.closeModal(); DAL.render();
            DAL.toast('Imported “'+proj.name+'” with '+count+' asset'+(count === 1 ? '' : 's'), 'success');
            return proj;
          });
        });
      });
    }).catch(function(err){ DAL.toast('Could not import that bundle: '+(err && err.message ? err.message : 'unknown error'), 'error'); return false; });
  };

  DAL.chooseProjectBundle = function(){
    var input = document.getElementById('projectBundleImportInput');
    if(!input){
      input = document.createElement('input'); input.type = 'file'; input.id = 'projectBundleImportInput';
      input.accept = '.dalz,.zip,application/zip,application/x-zip-compressed'; input.hidden = true;
      document.body.appendChild(input);
      input.addEventListener('change', function(){ var file = input.files && input.files[0]; input.value = ''; if(file) DAL.importProjectBundle(file); });
    }
    input.click();
  };

  var previousOpenProjectImport = DAL.openProjectImport;
  DAL.openProjectImport = function(){
    if(!DAL.modal) return previousOpenProjectImport ? previousOpenProjectImport() : null;
    var canFolder = typeof window.showDirectoryPicker === 'function';
    var body = '<p>Bring in a project someone shared with you.</p>'+
      '<div class="import-choice"><button class="btn block primary" data-action="import-project-bundle">Choose a project bundle (.dalz or .zip)</button>'+
      '<span class="asset-note">Recommended. A bundle includes <code>project.json</code>, readable companion files, and the complete <code>Assets/</code> folder.</span></div>'+
      '<div class="import-choice"><button class="btn block" data-action="import-project-file">Choose a project file (.json)</button>'+
      '<span class="asset-note">Artwork and audio come across only if they were embedded in the file.</span></div>';
    if(canFolder) body += '<div class="import-choice"><button class="btn block" data-action="import-project-folder">Choose a project folder</button><span class="asset-note">Reads <code>project.json</code> and the <code>Assets/</code> folder beside it.</span></div>';
    DAL.modal('Import Project', body);
  };

  var previousLinkFolder = DAL.linkFolder;
  DAL.linkFolder = function(projectId){
    if(DAL.canLinkFolder && DAL.canLinkFolder()) return previousLinkFolder ? previousLinkFolder(projectId) : null;
    DAL.modal('Save a Project Bundle',
      '<p class="folder-sync-note">This browser cannot keep a folder connected for automatic writes, but it can save the same portable project layout as one self-contained bundle.</p>'+
      '<p class="folder-sync-note">The <code>.dalz</code> bundle holds <code>project.json</code>, chapters, reference files, and every item in <code>Assets/</code>. Save it anywhere, including a synced drive, then import it in any browser.</p>',
      { footer:'<button class="btn" data-action="close-modal">Close</button><button class="btn primary" data-action="save-project-bundle" data-pid="'+(projectId || DAL.currentProjectId || '')+'">Save project bundle (.dalz)</button>' });
  };

  function addBundleButton(after, projectId){
    if(!after || !after.parentNode || after.parentNode.querySelector('[data-action="save-project-bundle"]')) return;
    var button = document.createElement('button');
    button.className = 'btn sm bundle-save-button'; button.setAttribute('data-action', 'save-project-bundle'); button.setAttribute('data-pid', projectId || DAL.currentProjectId || '');
    button.textContent = 'Save bundle (.dalz)'; after.parentNode.insertBefore(button, after.nextSibling);
  }

  var previousAfterRender = DAL.afterRender;
  DAL.afterRender = function(){
    if(previousAfterRender) previousAfterRender();
    Array.prototype.forEach.call(document.querySelectorAll('[data-action="link-folder"]'), function(button){ addBundleButton(button, button.getAttribute('data-pid')); });
  };

  /* Workspace rendering returns before core's normal afterRender hook, so its
     folder button is decorated here rather than relying on that later hook. */
  var previousRenderWorkspace = DAL.renderWorkspace;
  DAL.renderWorkspace = function(proj){
    var result = previousRenderWorkspace ? previousRenderWorkspace(proj) : null;
    Array.prototype.forEach.call(document.querySelectorAll('[data-action="link-folder"]'), function(button){ addBundleButton(button, button.getAttribute('data-pid')); });
    return result;
  };

  var previousProjectSettings = DAL.showProjectSettingsModal;
  DAL.showProjectSettingsModal = function(projectId){
    var result = previousProjectSettings ? previousProjectSettings(projectId) : null;
    var link = document.querySelector('.modal-backdrop [data-action="link-folder"]');
    if(link) addBundleButton(link, projectId);
    return result;
  };

  var previousExportGroups = DAL.exportGroups;
  DAL.exportGroups = function(proj){
    var groups = previousExportGroups ? previousExportGroups(proj) : [];
    groups.forEach(function(group){
      if(group.title === 'Whole project' && group.items && !group.items.some(function(item){ return item.action === 'export-project-bundle'; })){
        group.items.push({ action:'export-project-bundle', label:'Save project bundle (.dalz)' });
        group.note = 'A bundle is a portable ZIP with project.json, readable companion files and every project asset. Import it in any browser.';
      }
    });
    return groups;
  };

  var previousHandleClick = DAL.handleClick;
  DAL.handleClick = function(action, el, event){
    if(action === 'save-project-bundle' || action === 'export-project-bundle'){
      DAL.exportProjectBundle(el && el.getAttribute ? el.getAttribute('data-pid') : null); return;
    }
    if(action === 'import-project-bundle'){ DAL.chooseProjectBundle(); return; }
    /* The existing File-menu import action now opens the complete choice dialog,
       so a bundle is reachable from every import surface without changing its
       long-standing data-action value. */
    if(action === 'import-project'){ DAL.openProjectImport(); return; }
    if(previousHandleClick) previousHandleClick(action, el, event);
  };

})();
