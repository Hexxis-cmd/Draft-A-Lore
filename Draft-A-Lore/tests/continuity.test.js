const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function api() {
  const document={addEventListener(){},createElement(){return{textContent:'',get innerHTML(){return this.textContent;}};}};
  const sandbox={DAL:{},document,window:{},navigator:{},localStorage:{},indexedDB:{},console,Date,Blob,Promise,setTimeout,clearTimeout,confirm(){return true;}};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','core.js'),'utf8'),sandbox);
  sandbox.DAL.state=sandbox.DAL.defaultState();sandbox.DAL.handleStoryClick=function(){};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','world-tools.js'),'utf8'),sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','continuity-tools.js'),'utf8'),sandbox);
  return sandbox.DAL;
}

test('continuity detects post-death appearances and stale world links',()=>{
  const DAL=api(),project=DAL.defaultProject('Novel','novel');
  project.chapters=[{id:'one',title:'One',order:0,contentHTML:'<p>Mara dies.</p>'},{id:'two',title:'Two',order:1,contentHTML:'<p>Mara walks into Haven.</p>'}];
  project.characters=[{id:'mara',name:'Mara',deceased:true,deathChapterId:'one',customFields:[]}];
  project.plots=[{id:'plot',title:'Quest',linkedCharacterIds:['missing'],linkedChapterIds:[]}];
  const report=DAL.runContinuity(project),rules=Array.from(report.issues,issue=>issue.rule);
  assert.ok(rules.includes('post-death-appearance'));
  assert.ok(rules.includes('stale-reference'));
  assert.equal(report.counts.error,2);
});

test('continuity compares project facts with the linked shared Bible',()=>{
  const DAL=api(),project=DAL.defaultProject('Novel','novel'),bible=DAL.defaultBible('World');
  project.characters=[{id:'mara',name:'Mara',customFields:[{label:'birth year',value:'12'}]}];
  bible.characters=[{id:'shared-mara',name:'Mara',aliases:[],status:'alive',facts:[{id:'f',key:'birth year',value:'14'}]}];
  DAL.state.bibles[bible.id]=bible;DAL.state.bibleOrder.push(bible.id);project.bibleId=bible.id;
  const conflict=DAL.runContinuity(project).issues.find(issue=>issue.rule==='contradictory-fact');
  assert.ok(conflict);
  assert.match(conflict.detail,/12/);
  assert.match(conflict.detail,/14/);
});

test('continuity flags uncatalogued recurring names and anchored event order',()=>{
  const DAL=api(),project=DAL.defaultProject('Novel','novel');
  project.chapters=[{id:'one',title:'One',order:0,contentHTML:'<p>Zorath arrives. Zorath sees The Sundering.</p>'},{id:'two',title:'Two',order:1,contentHTML:'<p>The Sundering begins.</p>'}];
  project.timeline=[{id:'event',title:'The Sundering',chapterId:'two',date:'Year 20',characterIds:[],plotIds:[]}];
  const rules=Array.from(DAL.runContinuity(project).issues,issue=>issue.rule);
  assert.ok(rules.includes('uncatalogued-name'));
  assert.ok(rules.includes('event-before-anchor'));
});

test('continuity checks plot introduction, resolution, and finished-project loose ends',()=>{
  const DAL=api(),project=DAL.defaultProject('Novel','novel');
  project.status='proofreading';
  project.chapters=[{id:'one',title:'One',order:0,contentHTML:''},{id:'two',title:'Two',order:1,contentHTML:''}];
  project.plots=[
    {id:'reversed',title:'Hidden Heir',status:'resolved',linkedChapterIds:[],linkedCharacterIds:[],introducedChapterId:'two',resolvedChapterId:'one'},
    {id:'open',title:'Missing Crown',status:'developing',linkedChapterIds:['one'],linkedCharacterIds:[],introducedChapterId:'one',resolvedChapterId:''}
  ];
  const rules=Array.from(DAL.runContinuity(project).issues,issue=>issue.rule);
  assert.ok(rules.includes('plot-order'));
  assert.ok(rules.includes('open-plot'));
});
