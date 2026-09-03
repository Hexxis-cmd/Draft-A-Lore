const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function storyTools() {
  const listeners = { addEventListener() {} };
  const sandbox = {
    DAL: { state: { writerTools: { projects: {} } }, registerAfterRender() {}, DROP: {}, SELECT: {}, PASTE: {}, CTX: {} },
    document: listeners,
    window: listeners,
    setInterval() {}, clearInterval() {}, setTimeout() {}, clearTimeout() {},
    confirm() { return true; }, Date
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'story-tools.js'), 'utf8'), sandbox, { filename: 'story-tools.js' });
  return sandbox.DAL;
}

test('deleting a character removes every live reference to it', () => {
  const DAL = storyTools();
  const project = {
    id: 'project', relationships: [{ fromCharId: 'gone', toCharId: 'kept' }],
    plots: [{ linkedCharacterIds: ['gone', 'kept'] }],
    lore: { entries: [{ linkedCharIds: ['gone', 'kept'] }] },
    timeline: [{ characterIds: ['gone', 'kept'] }]
  };

  DAL.removeProjectReferences(project, 'character', 'gone');

  assert.deepEqual(project.relationships, []);
  assert.deepEqual(project.plots[0].linkedCharacterIds, ['kept']);
  assert.deepEqual(project.lore.entries[0].linkedCharIds, ['kept']);
  assert.deepEqual(project.timeline[0].characterIds, ['kept']);
});

test('deleting plots and chapters clears inverse links without deleting notes', () => {
  const DAL = storyTools();
  DAL.state.writerTools.projects.project = {
    comments: [{ chapterId: 'chapter', body: 'Keep this revision note' }],
    structure: { beats: [{ chapterId: 'chapter' }] }
  };
  const project = {
    id: 'project', characters: [{ linkedPlotIds: ['plot', 'kept'] }],
    plots: [{ linkedChapterIds: ['chapter', 'kept'] }],
    lore: { entries: [{ linkedPlotIds: ['plot', 'kept'] }] },
    timeline: [{ plotIds: ['plot', 'kept'], chapterId: 'chapter' }]
  };

  DAL.removeProjectReferences(project, 'plot', 'plot');
  DAL.removeProjectReferences(project, 'chapter', 'chapter');

  assert.deepEqual(project.characters[0].linkedPlotIds, ['kept']);
  assert.deepEqual(project.lore.entries[0].linkedPlotIds, ['kept']);
  assert.deepEqual(project.timeline[0].plotIds, ['kept']);
  assert.equal(project.timeline[0].chapterId, '');
  assert.deepEqual(project.plots[0].linkedChapterIds, ['kept']);
  assert.equal(project.writerTools.structure.beats[0].chapterId, '');
  assert.equal(project.writerTools.comments[0].body, 'Keep this revision note');
  assert.equal(DAL.state.writerTools.projects.project, undefined);
});
