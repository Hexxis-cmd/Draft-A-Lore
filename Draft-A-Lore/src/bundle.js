/* Cross-browser project bundles.

   A .dalz file is an ordinary ZIP archive containing the same readable project
   layout a linked folder uses. Keeping the ZIP code here lets the offline app
   move a complete project in browsers that cannot offer a directory picker. */

(function(){
  var MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
  var MAX_UNPACKED_BYTES = 1024 * 1024 * 1024;
  var MAX_ENTRY_BYTES = 512 * 1024 * 1024;
  var MAX_ENTRIES = 10000;
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
    if(data.length > MAX_ARCHIVE_BYTES) throw new Error('That bundle is larger than the 512 MB safety limit.');
    var end = findEndRecord(data), count = get16(data, end+10), at = get32(data, end+16), entries = [], i;
    if(get16(data, end+4) || get16(data, end+6) || count === 0xffff || get32(data, end+12) === 0xffffffff || at === 0xffffffff){
      throw new Error('ZIP64 bundles are not supported.');
    }
    if(count > MAX_ENTRIES) throw new Error('That bundle contains too many files.');
    var unpackedTotal = 0;
    for(i=0; i<count; i++){
      if(get32(data, at) !== 0x02014b50) throw new Error('The ZIP directory is damaged.');
      var flags = get16(data, at+8), method = get16(data, at+10), compressed = get32(data, at+20), size = get32(data, at+24);
      var nameLength = get16(data, at+28), extraLength = get16(data, at+30), commentLength = get16(data, at+32), localOffset = get32(data, at+42);
      if(at + 46 + nameLength + extraLength + commentLength > data.length) throw new Error('The ZIP directory is truncated.');
      var entryName = text(data.slice(at+46, at+46+nameLength)).replace(/\\/g, '/');
      if(entryName.charAt(0) === '/' || /^[a-z]:\//i.test(entryName) || entryName.indexOf('\0') >= 0 || /(^|\/)\.\.(\/|$)/.test(entryName)) throw new Error('The bundle contains an unsafe file path.');
      if(size > MAX_ENTRY_BYTES) throw new Error('The ZIP entry “'+entryName+'” is larger than the safety limit.');
      unpackedTotal += size;
      if(unpackedTotal > MAX_UNPACKED_BYTES) throw new Error('The expanded bundle is larger than the 1 GB safety limit.');
      if(method === 8 && compressed && size / compressed > 200) throw new Error('The ZIP entry “'+entryName+'” has an unsafe compression ratio.');
      entries.push({ name: entryName, flags: flags, method: method, compressed: compressed, size: size, crc:get32(data, at+16), offset: localOffset });
      at += 46 + nameLength + extraLength + commentLength;
    }
    function entryData(entry){
      if(entry.offset + 30 > data.length || get32(data, entry.offset) !== 0x04034b50) return Promise.reject(new Error('The ZIP entry “'+entry.name+'” is damaged.'));
      var localName = get16(data, entry.offset+26), localExtra = get16(data, entry.offset+28), from = entry.offset + 30 + localName + localExtra;
      if(from + entry.compressed > data.length) return Promise.reject(new Error('The ZIP entry “'+entry.name+'” is truncated.'));
      var packed = data.slice(from, from + entry.compressed);
      if(entry.method === 0){
        if(packed.length !== entry.size || crc32(packed) !== entry.crc) return Promise.reject(new Error('The ZIP entry “'+entry.name+'” failed its integrity check.'));
        return Promise.resolve(packed);
      }
      if(entry.method !== 8) return Promise.reject(new Error('The ZIP entry “'+entry.name+'” uses unsupported compression method '+entry.method+'.'));
      if(typeof DecompressionStream === 'undefined') return Promise.reject(new Error('The ZIP entry “'+entry.name+'” is deflated, but this browser cannot decompress deflated ZIP files.'));
      try{
        return new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(buffer){
          var unpacked = new Uint8Array(buffer);
          if(unpacked.length !== entry.size) throw new Error('The ZIP entry “'+entry.name+'” has an unexpected size.');
          if(crc32(unpacked) !== entry.crc) throw new Error('The ZIP entry “'+entry.name+'” failed its integrity check.');
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

  DAL.projectTextFiles = function(proj){
    if(!proj) throw new Error('Open a project before saving a bundle.');
    var snapshot = DAL.clone(proj), files = [];
    delete snapshot.folderHandle;
    var portable={project:snapshot};
    if(proj.bibleId&&DAL.state.bibles&&DAL.state.bibles[proj.bibleId]) portable.linkedBible=DAL.clone(DAL.state.bibles[proj.bibleId]);
    files.push(textFile('project.json', JSON.stringify(portable, null, 2)));
    (proj.chapters || []).forEach(function(ch, i){ files.push(textFile('chapters/'+String(i+1).padStart(2, '0')+'-'+DAL.sanitizeFilename(ch.title)+'.txt', chapterText(ch))); });
    (proj.characters || []).forEach(function(character){ files.push(textFile('characters/'+DAL.sanitizeFilename(character.name)+'.txt', character.backstory || '')); });
    ((proj.lore && proj.lore.entries) || []).forEach(function(entry){ files.push(textFile('lore/'+DAL.sanitizeFilename(entry.folder || 'miscellaneous')+'/'+DAL.sanitizeFilename(entry.title)+'.txt', entry.content || '')); });
    (proj.plots || []).forEach(function(plot){ files.push(textFile('plots/'+DAL.sanitizeFilename(plot.title)+'.txt', plot.description || '')); });
    return files;
  };

  DAL.projectAssetFiles = function(proj){
    DAL.ensureAssets(proj);
    var files = [], reads = [];
    DAL.ASSET_FOLDERS.forEach(function(folder){
      (proj.assets[folder.key] || []).forEach(function(asset){
        reads.push(function(){
          if(asset.inline){ files.push({ name:'Assets/'+folder.dir+'/'+asset.name, data:bytes(asset.inline), mime:asset.mime || '' }); return Promise.resolve(); }
          return DAL.blobStore.get(asset.id).then(function(record){
            if(!record || !record.blob) throw new Error('Asset “'+asset.name+'” is no longer available on this device.');
            return record.blob.arrayBuffer().then(function(buffer){ files.push({ name:'Assets/'+folder.dir+'/'+asset.name, data:new Uint8Array(buffer), mime:asset.mime || record.blob.type || '' }); });
          });
        });
      });
    });
    return reads.reduce(function(chain, read){ return chain.then(read); }, Promise.resolve()).then(function(){ return files; });
  };

  DAL.projectFolderFiles = function(proj){
    var textFiles;
    try{ textFiles = DAL.projectTextFiles(proj); }
    catch(error){ return Promise.reject(error); }
    return DAL.projectAssetFiles(proj).then(function(assetFiles){ return textFiles.concat(assetFiles); });
  };

  DAL.projectBundleBytes = function(proj){
    return DAL.projectFolderFiles(proj).then(function(files){ return DAL.makeZip(files); });
  };

  function base64(data){
    var binary = '', size = 0x8000;
    for(var i=0; i<data.length; i+=size) binary += String.fromCharCode.apply(null, data.subarray(i, i+size));
    return btoa(binary);
  }

  DAL.syncNativeAssets = function(proj, handle){
    var plugin = DAL.nativeFolderPlugin && DAL.nativeFolderPlugin();
    if(!plugin) return Promise.reject(new Error('Android folder access is unavailable.'));
    handle = handle || DAL.folderHandles[proj.id];
    return DAL.projectAssetFiles(proj).then(function(files){
      return files.reduce(function(chain, file){
        return chain.then(function(){ return plugin.writeFile({ projectId:proj.id, path:file.name, base64:base64(file.data), mime:file.mime || 'application/octet-stream' }); });
      }, Promise.resolve());
    }).then(function(){ if(handle) handle.assetsSynced = true; });
  };

  DAL.syncNativeFolder = function(proj, handle){
    var plugin = DAL.nativeFolderPlugin && DAL.nativeFolderPlugin();
    if(!plugin) return Promise.reject(new Error('Android folder access is unavailable.'));
    var files = DAL.projectTextFiles(proj).map(function(file){ return { path:file.name, text:text(file.data), mime:file.name === 'project.json' ? 'application/json' : 'text/plain' }; });
    return plugin.syncTextFiles({ projectId:proj.id, files:files }).then(function(){
      return handle.assetsSynced ? null : DAL.syncNativeAssets(proj, handle);
    });
  };

  function xml(value){ return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function docxFill(value){var m=String(value||'').match(/^#([0-9a-f]{6})$/i);if(m)return m[1].toUpperCase();m=String(value||'').match(/rgb\(\s*(\d+)\D+(\d+)\D+(\d+)/i);return m?[m[1],m[2],m[3]].map(function(n){return Math.max(0,Math.min(255,parseInt(n))).toString(16).padStart(2,'0');}).join('').toUpperCase():'';}
  function docxRuns(node, marks){
    marks = Object.assign({}, marks || {});
    if(node.nodeType === 3){
      if(!node.nodeValue) return '';
      var props = (marks.bold?'<w:b/>':'')+(marks.italic?'<w:i/>':'')+(marks.underline?'<w:u w:val="single"/>':'')+(marks.strike?'<w:strike/>':'')+(marks.highlight?'<w:shd w:val="clear" w:color="auto" w:fill="'+marks.highlight+'"/>':'');
      return '<w:r>'+(props?'<w:rPr>'+props+'</w:rPr>':'')+'<w:t xml:space="preserve">'+xml(node.nodeValue)+'</w:t></w:r>';
    }
    if(node.nodeType !== 1) return '';
    if(node.tagName === 'BR') return '<w:r><w:br/></w:r>';
    if(node.tagName === 'IMG') return node.getAttribute('alt') ? '<w:r><w:t>['+xml(node.getAttribute('alt'))+']</w:t></w:r>' : '';
    if(node.matches('B,STRONG')) marks.bold = true;
    if(node.matches('I,EM')) marks.italic = true;
    if(node.matches('U')) marks.underline = true;
    if(node.matches('S,STRIKE')) marks.strike = true;
    if(node.matches('.writer-highlight')) marks.highlight = docxFill(node.style.backgroundColor||node.getAttribute('data-color'));
    return Array.from(node.childNodes).map(function(child){ return docxRuns(child, marks); }).join('');
  }
  function docxParagraph(node, style, prefix){
    var runs = (prefix ? '<w:r><w:t>'+xml(prefix)+'</w:t></w:r>' : '') + docxRuns(node, {});
    if(!runs) runs = '<w:r><w:t></w:t></w:r>';
    return '<w:p>'+(style?'<w:pPr><w:pStyle w:val="'+style+'"/></w:pPr>':'')+runs+'</w:p>';
  }
  function docxTable(table){
    var rows=Array.from(table.rows||[]);if(!rows.length)return '';
    var borders='<w:tblBorders><w:top w:val="single" w:sz="4" w:color="808080"/><w:left w:val="single" w:sz="4" w:color="808080"/><w:bottom w:val="single" w:sz="4" w:color="808080"/><w:right w:val="single" w:sz="4" w:color="808080"/><w:insideH w:val="single" w:sz="4" w:color="B0B0B0"/><w:insideV w:val="single" w:sz="4" w:color="B0B0B0"/></w:tblBorders>';
    return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>'+borders+'</w:tblPr>'+rows.map(function(row){return '<w:tr>'+Array.from(row.cells).map(function(cell){var span=Math.max(1,parseInt(cell.getAttribute('colspan'))||1),props='<w:tcW w:w="0" w:type="auto"/>'+(span>1?'<w:gridSpan w:val="'+span+'"/>':'')+(cell.tagName==='TH'?'<w:shd w:val="clear" w:color="auto" w:fill="E7E7E7"/>':'');return '<w:tc><w:tcPr>'+props+'</w:tcPr>'+docxParagraph(cell,'')+'</w:tc>';}).join('')+'</w:tr>';}).join('')+'</w:tbl>';
  }
  function docxBody(html){
    var holder = document.createElement('div'); holder.innerHTML = DAL.sanitizeRichHTML(html || '');
    var out = [];
    function walk(parent){
      var inline = [];
      function flush(){ if(inline.length){ var wrap=document.createElement('span'); inline.forEach(function(n){wrap.appendChild(n.cloneNode(true));}); out.push(docxParagraph(wrap)); inline=[]; } }
      Array.from(parent.childNodes).forEach(function(node){
        if(node.nodeType === 1 && node.tagName === 'TABLE'){ flush(); out.push(docxTable(node)); }
        else if(node.nodeType === 1 && node.matches('HR.writer-page-break')){ flush(); out.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>'); }
        else if(node.nodeType === 1 && /^(P|DIV|H1|H2|H3|H4|BLOCKQUOTE|LI|PRE|ASIDE)$/.test(node.tagName)){
          flush();
          var style = /^H[1-4]$/.test(node.tagName) ? 'Heading'+node.tagName.slice(1) : (/^(BLOCKQUOTE|ASIDE)$/.test(node.tagName) ? 'Quote' : (node.tagName === 'PRE' ? 'Code' : ''));
          out.push(docxParagraph(node, style, node.tagName === 'LI' ? '• ' : ''));
        } else if(node.nodeType === 1 && /^(UL|OL|SECTION)$/.test(node.tagName)){ flush(); walk(node); }
        else inline.push(node);
      });
      flush();
    }
    walk(holder); return out.join('');
  }

  DAL.exportManuscriptDocx = function(proj){
    if(!proj || !(proj.chapters || []).length){ DAL.toast('Add a chapter before exporting a Word manuscript.', 'info'); return; }
    var body = '<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>'+xml((proj.cover&&proj.cover.title)||proj.name)+'</w:t></w:r></w:p>';
    var author = (proj.cover&&proj.cover.author) || (DAL.state.autoFillAuthor ? DAL.state.authorName : '');
    if(author) body += '<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr><w:r><w:t>'+xml(author)+'</w:t></w:r></w:p>';
    (proj.chapters || []).forEach(function(ch){ body += '<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:pageBreakBefore/></w:pPr><w:r><w:t>'+xml(ch.title)+'</w:t></w:r></w:p>'+docxBody(DAL.writerPublishHTML?DAL.writerPublishHTML(proj,ch):ch.contentHTML); });
    body += '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>';
    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'</w:body></w:document>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:i/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Normal"/><w:rPr><w:b/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720"/></w:pPr><w:rPr><w:i/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr></w:style></w:styles>';
    var files = [
      textFile('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'),
      textFile('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
      textFile('word/document.xml',documentXml), textFile('word/styles.xml',styles),
      textFile('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
    ];
    DAL.download(DAL.sanitizeFilename(proj.name)+'-manuscript.docx', DAL.makeZip(files), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    DAL.toast('Word manuscript exported.', 'success');
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
    if(file.size > MAX_ARCHIVE_BYTES){ DAL.toast('That bundle is larger than the 512 MB safety limit.', 'error'); return Promise.resolve(false); }
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

  function addBundleButton(after, projectId){
    if(!after || !after.parentNode || after.parentNode.querySelector('[data-action="save-project-bundle"]')) return;
    var button = document.createElement('button');
    button.className = 'btn sm bundle-save-button'; button.setAttribute('data-action', 'save-project-bundle'); button.setAttribute('data-pid', projectId || DAL.currentProjectId || '');
    button.textContent = 'Save bundle (.dalz)'; after.parentNode.insertBefore(button, after.nextSibling);
  }

  DAL.registerAfterRender(function(){
    Array.prototype.forEach.call(document.querySelectorAll('[data-action="link-folder"]'), function(button){ addBundleButton(button, button.getAttribute('data-pid')); });
  });

  DAL.registerActionHandler(function(action, el){
    if(action === 'save-project-bundle' || action === 'export-project-bundle'){
      DAL.exportProjectBundle(el && el.getAttribute ? el.getAttribute('data-pid') : null); return true;
    }
    if(action === 'import-project-bundle'){ DAL.chooseProjectBundle(); return true; }
    if(action === 'export-manuscript-docx'){ DAL.exportManuscriptDocx(DAL.state.projects[DAL.currentProjectId]); return true; }
    /* The existing File-menu import action now opens the complete choice dialog,
       so a bundle is reachable from every import surface without changing its
       long-standing data-action value. */
    if(action === 'import-project'){ DAL.openProjectImport(); return true; }
    return false;
  });

})();
