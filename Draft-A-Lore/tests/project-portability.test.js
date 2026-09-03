const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

function api() {
  const document = {
    addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    getElementById() { return null; }, body: {}, documentElement: {}
  };
  const sandbox = {
    DAL: {}, document, window: { addEventListener() {}, innerWidth: 1200 }, navigator: {},
    localStorage: {}, indexedDB: {}, crypto: webcrypto, console,
    setTimeout, clearTimeout, setInterval, clearInterval, Date, Promise, Blob, URL,
    TextEncoder, TextDecoder, structuredClone
  };
  vm.createContext(sandbox);
  for (const file of ['core.js', 'library.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8'), sandbox, { filename: file });
  }
  sandbox.DAL.sanitizeRichHTML = value => String(value || '');
  sandbox.DAL.ensureAssets = project => { if (!project.assets) project.assets = { images: [], sounds: [], fonts: [], documents: [] }; };
  sandbox.DAL.state = sandbox.DAL.defaultState();
  return sandbox.DAL;
}

test('a complete project keeps ordering, links, writing records, and RPG state after cross-platform import', () => {
  const DAL = api();
  const project = DAL.defaultProject('Portable Campaign', 'dual');
  project.chapters = [
    { id: 'chapter-5', title: 'Chapter Five', order: 0, contentHTML: '<p>Fifth chapter manuscript 15.</p>', images: [], createdAt: 1, updatedAt: 2 },
    { id: 'chapter-1', title: 'Chapter One', order: 1, contentHTML: '<p>Deliberately second in this project.</p>', images: [], createdAt: 3, updatedAt: 4 }
  ];
  project.characters = [{ id: 'hero', name: 'Hero', linkedPlotIds: ['quest'] }];
  project.relationships = [{ id: 'bond', fromCharId: 'hero', toCharId: 'guide', type: 'ally' }];
  project.plots = [{ id: 'quest', title: 'Quest', linkedChapterIds: ['chapter-5'], linkedCharacterIds: ['hero'] }];
  project.lore = { folders: ['Places'], entries: [{ id: 'city', folder: 'Places', title: 'City', linkedCharIds: ['hero'], linkedPlotIds: ['quest'] }] };
  project.timeline = [{ id: 'event', title: 'Arrival', chapterId: 'chapter-5', characterIds: ['hero'], plotIds: ['quest'] }];
  project.mindmap = { nodes: [{ id: 'idea-a', text: 'Cause' }, { id: 'idea-b', text: 'Effect' }], edges: [{ id: 'idea-edge', from: 'idea-a', to: 'idea-b' }] };
  project.writerTools = {
    comments: [{ id: 'comment', chapterId: 'chapter-5', body: 'Revise this verse.' }],
    highlights: [{ id: 'highlight', chapterId: 'chapter-5', color: '#fff59d' }],
    bookmarks: [{ id: 'bookmark', chapterId: 'chapter-5', name: 'Return here' }],
    footnotes: [{ id: 'footnote', chapterId: 'chapter-5', number: 1, text: 'Source note' }],
    sources: [{ id: 'source', title: 'Archive' }], structure: { beats: [{ id: 'beat', chapterId: 'chapter-5' }] }, exportOptions: { highlights: true }
  };
  project.adventure.stats = [{ id: 'health', key: 'health', label: 'Health', default: 10 }];
  project.adventure.traits = [{ id: 'brave', name: 'Brave' }];
  project.adventure.items = [{ id: 'key', name: 'Key', useEffects: [{ type: 'stat', key: 'health', op: 'add', value: 1 }] }];
  project.adventure.nodes = [
    { id: 'start', title: 'Start', choices: [{ id: 'choice', targetId: 'end', conditions: [{ type: 'trait', key: 'brave' }], effects: [{ type: 'inventory', key: 'key', op: 'give', value: 1 }] }], entryEffects: [] },
    { id: 'end', title: 'End', choices: [], entryEffects: [] }
  ];
  project.adventure.startNodeId = 'start';
  project.adventure.playtestState = { nodeId: 'start', stats: { health: 10 }, traits: ['brave'], inventory: { key: 1 } };

  const linkedBible = DAL.defaultBible('Shared Realm');
  linkedBible.characters.push({ id: 'shared-hero', name: 'Shared Hero', aliases: ['The Wanderer'], facts: [{ id: 'fact-1', key: 'birth year', value: '12' }] });
  linkedBible.lore.entries.push({ id: 'shared-city', title: 'Shared City', folder: 'Locations', content: 'Founded in Year 1.', aliases: [], facts: [] });
  project.bibleId = linkedBible.id;
  const imported = DAL.adoptImportedProject(JSON.parse(JSON.stringify({ project, linkedBible })));

  assert.notEqual(imported.id, project.id);
  assert.deepEqual(Array.from(imported.chapters, chapter => chapter.id), ['chapter-5', 'chapter-1']);
  assert.equal(imported.chapters[0].contentHTML, '<p>Fifth chapter manuscript 15.</p>');
  assert.deepEqual(Array.from(imported.plots[0].linkedChapterIds), ['chapter-5']);
  assert.equal(imported.timeline[0].chapterId, 'chapter-5');
  assert.equal(imported.writerTools.comments[0].chapterId, 'chapter-5');
  assert.equal(imported.writerTools.structure.beats[0].chapterId, 'chapter-5');
  assert.equal(JSON.stringify(imported.mindmap.edges[0]), JSON.stringify({ id: 'idea-edge', from: 'idea-a', to: 'idea-b' }));
  assert.equal(imported.adventure.nodes[0].choices[0].targetId, 'end');
  assert.equal(JSON.stringify(imported.adventure.playtestState.inventory), JSON.stringify({ key: 1 }));
  assert.ok(imported.bibleId);
  assert.notEqual(imported.bibleId, linkedBible.id);
  assert.equal(DAL.state.bibles[imported.bibleId].characters[0].aliases[0], 'The Wanderer');
  assert.equal(DAL.state.bibles[imported.bibleId].lore.entries[0].title, 'Shared City');
});
