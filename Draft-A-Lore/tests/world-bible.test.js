const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function api() {
  const document = { addEventListener() {}, createElement() { return { textContent:'', get innerHTML(){ return this.textContent; } }; } };
  const sandbox = { DAL:{}, document, window:{}, navigator:{}, localStorage:{}, indexedDB:{}, console, Date, Blob, Promise, setTimeout, clearTimeout, confirm(){return true;} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8'), sandbox);
  sandbox.DAL.state=sandbox.DAL.defaultState();
  sandbox.DAL.handleStoryClick=function(){};
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'world-tools.js'), 'utf8'), sandbox);
  return sandbox.DAL;
}

test('a shared Bible normalizes durable world records', () => {
  const DAL=api();
  const bible=DAL.normalizeBible({name:'Realm',characters:[{name:'Mara',aliases:['M'],facts:[{key:'birth year',value:'12'}]}],lore:{folders:['Cities'],entries:[{title:'Haven',folder:'Cities'}]},timeline:[{title:'Fall',order:'4'}],glossary:[{term:'Aether',definition:'Magic'}]});
  assert.ok(bible.id);
  assert.equal(bible.characters[0].facts[0].value,'12');
  assert.equal(bible.timeline[0].order,4);
  assert.equal(bible.glossary[0].definition,'Magic');
});

test('project records merge into a Bible once without duplicate names', () => {
  const DAL=api(), bible=DAL.defaultBible('Realm'), project=DAL.defaultProject('Book','dual');
  project.characters=[{name:'Mara',deceased:true,backstory:'Guard',customFields:[{label:'birth year',value:12}]}];
  project.lore.entries=[{title:'Haven',folder:'Locations',content:'A city.'}];
  project.timeline=[{title:'The Fall',date:'Year 12',order:2,summary:'Walls fell.'}];
  assert.equal(DAL.importProjectIntoBible(project,bible),3);
  assert.equal(DAL.importProjectIntoBible(project,bible),0);
  assert.equal(bible.characters[0].status,'dead');
  assert.equal(bible.characters[0].facts[0].value,'12');
});
