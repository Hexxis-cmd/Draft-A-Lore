const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function api(){const document={addEventListener(){},getElementById(){return null;}};const sandbox={DAL:{},document,window:{},navigator:{},localStorage:{},indexedDB:{},console,Date,Blob,Promise,setTimeout,clearTimeout,Uint8Array,atob,File:class File{constructor(parts,name,options){this.parts=parts;this.name=name;this.type=options.type;}}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','core.js'),'utf8'),sandbox);const DAL=sandbox.DAL;DAL.state=DAL.defaultState();DAL.handleStoryClick=function(){};DAL.render=function(){};DAL.toast=function(){};vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src','sync-tools.js'),'utf8'),sandbox);return DAL;}

test('shared-folder sync stops when a remote copy changed',async()=>{const DAL=api(),project=DAL.defaultProject('Book','novel'),handle={checkedInitial:true};project.updatedAt=20;project.sync={mode:'shared',lastRemoteUpdatedAt:10,lastLocalUpdatedAt:15};DAL.readLinkedProject=async()=>({project:{id:project.id,updatedAt:30},updatedAt:30,data:{}});const allowed=await DAL.prepareFolderSync(project,handle);assert.equal(allowed,false);assert.equal(DAL.folderSyncHealth.status,'conflict');assert.equal(DAL._syncConflicts[project.id].updatedAt,30);});

test('known remote revision allows a local write without a false conflict',async()=>{const DAL=api(),project=DAL.defaultProject('Book','novel'),handle={checkedInitial:true};project.sync={mode:'shared',lastRemoteUpdatedAt:30,lastLocalUpdatedAt:20};DAL.readLinkedProject=async()=>({project:{id:project.id,updatedAt:30},updatedAt:30,data:{}});assert.equal(await DAL.prepareFolderSync(project,handle),true);});

test('backup mode avoids repeated folder reads after its safety check',async()=>{const DAL=api(),project=DAL.defaultProject('Book','novel'),handle={checkedInitial:true},original=DAL.readLinkedProject;let reads=0;DAL.readLinkedProject=async()=>{reads++;return original(project,handle);};assert.equal(await DAL.prepareFolderSync(project,handle),true);assert.equal(reads,0);});
