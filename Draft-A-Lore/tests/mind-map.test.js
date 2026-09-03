const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function mindMapApi() {
  let nextId = 0;
  const DAL = {
    CTX: {}, SELECT: {}, PASTE: {}, DROP: {}, CLIP_LABELS: {},
    state: { projects: {} },
    uid(prefix) { return (prefix || 'id') + '_' + (++nextId); },
    clone(value) { return JSON.parse(JSON.stringify(value)); },
    escapeHtml: String,
    infoIcon() { return ''; },
    registerAfterRender() {},
    pushHistory() { this.historyCalls = (this.historyCalls || 0) + 1; },
    saveState() { this.saveCalls = (this.saveCalls || 0) + 1; },
    render() { this.renderCalls = (this.renderCalls || 0) + 1; },
    toast() {}
  };
  const document = {
    addEventListener() {}, getElementById() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
  const sandbox = { DAL, document, window: { addEventListener() {} }, Date, setTimeout, clearTimeout, console };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'story-tools.js'), 'utf8'), sandbox, { filename: 'story-tools.js' });
  return DAL;
}

test('mind map connections reject self-links and duplicate lines', () => {
  const DAL = mindMapApi();
  const project = { mindmap: { nodes: [{ id: 'a' }, { id: 'b' }], edges: [] } };
  assert.equal(DAL.connectMindMapNodes(project, 'a', 'b'), true);
  assert.equal(project.mindmap.edges.length, 1);
  assert.equal(DAL.connectMindMapNodes(project, 'b', 'a'), false);
  assert.equal(DAL.connectMindMapNodes(project, 'a', 'a'), false);
  assert.equal(DAL.connectMindMapNodes(project, 'a', 'missing'), false);
  assert.equal(project.mindmap.edges.length, 1);
});

test('deleting a mind map idea also removes every attached connection', () => {
  const DAL = mindMapApi();
  DAL.currentProjectId = 'project';
  DAL.selectedNodeId = 'a';
  DAL.state.projects.project = {
    mindmap: {
      nodes: [{ id: 'a', label: 'First' }, { id: 'b', label: 'Second' }, { id: 'c', label: 'Third' }],
      edges: [{ id: 'ab', from: 'a', to: 'b' }, { id: 'ca', from: 'c', to: 'a' }, { id: 'bc', from: 'b', to: 'c' }]
    }
  };

  assert.equal(DAL.removeMindMapNode('a'), true);
  assert.deepEqual(DAL.state.projects.project.mindmap.nodes.map(node => node.id), ['b', 'c']);
  assert.deepEqual(DAL.state.projects.project.mindmap.edges.map(edge => edge.id), ['bc']);
  assert.equal(DAL.selectedNodeId, null);
  assert.equal(DAL.historyCalls, 1);
  assert.equal(DAL.saveCalls, 1);
  assert.equal(DAL.renderCalls, 1);
});
