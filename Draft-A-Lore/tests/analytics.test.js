const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function api(){const document={addEventListener(){},createElement(){return{textContent:'',get innerHTML(){return this.textContent;}};}};const sandbox={DAL:{},document,window:{},navigator:{},localStorage:{},indexedDB:{},console,Date,Blob,Promise,setTimeout,clearTimeout};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','core.js'),'utf8'),sandbox);sandbox.DAL.state=sandbox.DAL.defaultState();sandbox.DAL.handleStoryClick=function(){};for(const file of ['world-tools.js','continuity-tools.js','analytics-tools.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',file),'utf8'),sandbox);return sandbox.DAL;}

test('pacing signals distinguish action dialogue from long reflection',()=>{const DAL=api(),fast=DAL.analyzePacing('<p>“Run!” Mara shouted. She sprinted, jumped, dodged, and fired.</p><p>“Move!”</p>'),slow=DAL.analyzePacing('<p>The long consideration of everything that had happened during the previous season remained with her as she carefully contemplated the many possible consequences of a choice that could not easily be reversed or understood.</p>');assert.ok(fast.score>slow.score);assert.ok(fast.dialogueRatio>slow.dialogueRatio);assert.ok(fast.actionDensity>slow.actionDensity);});

test('genre targets combine up to five selected genres',()=>{const DAL=api(),project=DAL.defaultProject('Book','novel');project.genres=['Thriller','Literary Fiction'];assert.deepEqual(Array.from(DAL.projectPacingTarget(project)),[46,69]);});

test('POV suggestion uses manuscript evidence without overwriting the authored POV',()=>{const DAL=api(),project=DAL.defaultProject('Book','novel'),chapter=DAL.defaultChapter('One',0);project.characters=[{id:'mara',name:'Mara',aliases:[],customFields:[]}];chapter.contentHTML='<p>Mara opened the gate. Mara entered. Mara waited.</p>';const suggested=DAL.suggestPOV(project,chapter);assert.equal(suggested.id,'mara');assert.equal(chapter.povCharacterId,'');});
