const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function api() {
  const listeners = {};
  const document = {
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const DAL = {
    state: { projects: {} }, CTX: {}, SELECT: {}, PASTE: {}, DROP: {},
    registerAfterRender() {}, pushHistory() { this.historyCalls = (this.historyCalls || 0) + 1; }
  };
  const sandbox = {
    DAL, document, window: { addEventListener() {} }, console, Date,
    setTimeout, clearTimeout, setInterval, clearInterval, confirm() { return true; }
  };
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'adventure-tools.js'), 'utf8'),
    sandbox,
    { filename: 'adventure-tools.js' }
  );
  return { DAL, listeners };
}

test('an RPG editor control creates one undo point per focus session', () => {
  const { DAL, listeners } = api();
  const control = {
    _dalHistoryCaptured: false,
    matches(selector) { return selector.includes('[data-node-field]'); }
  };

  DAL.captureAdventureEdit(control);
  DAL.captureAdventureEdit(control);
  assert.equal(DAL.historyCalls, 1);

  for (const handler of listeners.focusout || []) handler({ target: control });
  DAL.captureAdventureEdit(control);
  assert.equal(DAL.historyCalls, 2);
});

test('unrelated controls do not create RPG undo points', () => {
  const { DAL } = api();
  DAL.captureAdventureEdit({ matches() { return false; } });
  assert.equal(DAL.historyCalls, undefined);
});

test('a newly created scene is immediately available to selection actions', () => {
  const { DAL } = api();
  DAL.currentProjectId = 'project';
  DAL.state.projects.project = {
    adventure: { stats: [], traits: [], flags: [], items: [], nodes: [], rules: { failures: [] } }
  };
  DAL.uid = () => 'new-scene';
  DAL.nodeSpawnPoint = () => ({ x: 40, y: 60 });
  DAL.saveState = () => {};
  DAL.render = () => {};
  DAL.select = (kind, id) => { DAL.selection = { kind, id }; };

  DAL.handleAdventureClick('sg-add-node', {}, {});

  assert.deepEqual(DAL.selection, { kind: 'rpg-node', id: 'new-scene' });
  assert.equal(DAL.selectedNodeId, 'new-scene');
});
