const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function api(){
  const document={addEventListener(){},createElement(){return{textContent:'',get innerHTML(){return this.textContent;}};},getElementById(){return null;}};
  const sandbox={DAL:{},document,window:{getSelection(){return null;}},navigator:{},localStorage:{},indexedDB:{},console,Date,Blob,Promise,setTimeout,clearTimeout,confirm(){return true;}};
  vm.createContext(sandbox);
  for(const file of ['core.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',file),'utf8'),sandbox);
  sandbox.DAL.state=sandbox.DAL.defaultState();sandbox.DAL.handleStoryClick=function(){};sandbox.DAL.afterStoryRender=function(){};sandbox.DAL.saveState=function(){};
  for(const file of ['world-tools.js','continuity-tools.js','encyclopedia-tools.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',file),'utf8'),sandbox);
  return sandbox.DAL;
}

test('living encyclopedia extracts recurring records and explicit facts',()=>{
  const DAL=api(),project=DAL.defaultProject('Book','novel');
  project.chapters=[{id:'one',title:'One',contentHTML:'<p>Mara crossed the city of Haven. Mara was born in Year 12. Haven guarded the river.</p>'}];
  const candidates=DAL.runEncyclopediaScan(project),mara=candidates.find(item=>item.name==='Mara'),haven=candidates.find(item=>item.name==='Haven');
  assert.ok(mara);
  assert.equal(mara.kind,'character');
  assert.equal(mara.facts[0].key,'birth year');
  assert.ok(haven);
  assert.equal(haven.kind,'place');
});

test('accepted encyclopedia suggestions create real project records once',()=>{
  const DAL=api(),project=DAL.defaultProject('Book','novel'),candidate={id:'candidate',name:'Haven',kind:'place',context:'The city of Haven.',facts:[],status:'active'};
  assert.equal(DAL.addEncyclopediaCandidate(project,candidate,false),true);
  assert.equal(DAL.addEncyclopediaCandidate(project,candidate,false),false);
  assert.equal(project.lore.entries.length,1);
  assert.equal(project.lore.entries[0].folder,'Locations');
  assert.equal(candidate.status,'added');
});
