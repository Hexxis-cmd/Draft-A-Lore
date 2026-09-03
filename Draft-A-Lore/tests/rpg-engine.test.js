const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function engine() {
  const sandbox = { DAL: {} };
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'rpg-engine.js'), 'utf8'),
    sandbox,
    { filename: 'rpg-engine.js' }
  );
  return sandbox.DAL.rpg;
}

function adventure() {
  return {
    startNodeId: 'start',
    stats: [{ key: 'health', label: 'Health', type: 'number', default: 5, min: 0, max: 10 }],
    traits: [{ key: 'brave', label: 'Brave', default: false }],
    items: [{ id: 'potion', name: 'Potion', stackable: true, maxStack: 2, slot: 'none' }],
    nodes: [
      {
        id: 'start', title: 'Start', text: 'Begin', kind: 'scene', entryEffects: [],
        choices: [{
          label: 'Drink and continue', targetNodeId: 'end',
          conditions: [{ type: 'stat', key: 'health', op: '>=', value: 5 }],
          effects: [
            { type: 'stat', key: 'health', op: 'add', value: 20 },
            { type: 'inventory', key: 'potion', op: 'add', value: 5 },
            { type: 'trait', key: 'brave', op: 'set', value: true }
          ]
        }]
      },
      { id: 'end', title: 'End', text: 'Done', kind: 'ending', endingLabel: 'Finished', entryEffects: [], choices: [] }
    ],
    rules: { lockedChoices: 'lock', failures: [] }
  };
}

test('a valid run applies rules, clamps values, and reaches an ending', () => {
  const RPG = engine();
  const adv = adventure();
  const state = RPG.newState(adv);

  assert.equal(state.nodeId, 'start');
  assert.equal(RPG.choose(state, adv, 0).title, 'End');
  assert.equal(state.stats.health, 10);
  assert.equal(state.inventory.potion, 2);
  assert.equal(state.traits.brave, true);
  assert.deepEqual(JSON.parse(JSON.stringify(state.ended)), { kind: 'ending', label: 'Finished', message: '' });
});

test('locked and broken choices fail closed', () => {
  const RPG = engine();
  const adv = adventure();
  adv.nodes[0].choices[0].conditions[0].value = 99;
  const state = RPG.newState(adv);

  assert.equal(RPG.choose(state, adv, 0), null);
  adv.nodes[0].choices[0].conditions = [];
  adv.nodes[0].choices[0].targetNodeId = 'missing';
  assert.equal(RPG.choose(state, adv, 0), null);
});

test('the project audit catches unreachable, missing, and impossible paths', () => {
  const RPG = engine();
  const adv = adventure();
  adv.nodes.push({ id: 'orphan', title: 'Orphan', text: '', kind: 'scene', entryEffects: [], choices: [] });
  adv.nodes[0].choices.push({ label: 'Broken', targetNodeId: 'missing', conditions: [], effects: [] });
  adv.nodes[0].choices[0].conditions[0].value = 99;
  const report = RPG.audit(adv);
  const text = report.issues.map(issue => issue.text).join('\n');

  assert.ok(report.problems > 0);
  assert.match(text, /above its maximum/);
  assert.match(text, /does not lead anywhere|no longer exists/);
  assert.match(text, /No path from the opening scene/);
});

test('inventory capacity refuses an unusable consumable without spending it', () => {
  const RPG = engine();
  const adv = adventure();
  adv.rules.capacity = 1;
  adv.items = [
    { id: 'rock', name: 'Rock', weight: 1, stackable: false, slot: 'none' },
    { id: 'key', name: 'Key', weight: 1, stackable: false, slot: 'none' },
    { id: 'kit', name: 'Supply Kit', weight: 0, stackable: true, maxStack: 2, slot: 'none', consumable: true,
      useEffects: [{ type: 'inventory', key: 'key', op: 'add', value: 1 }] }
  ];
  adv.nodes[0].entryEffects = [
    { type: 'inventory', key: 'rock', op: 'add', value: 1 },
    { type: 'inventory', key: 'kit', op: 'add', value: 1 }
  ];
  const state = RPG.newState(adv);

  const result = RPG.useItem(state, adv, 'kit');
  assert.equal(result.ok, false);
  assert.match(result.reason, /capacity/i);
  assert.equal(state.inventory.kit, 1);
  assert.equal(state.inventory.key, undefined);
  assert.equal(state.inventory.rock, 1);
});

test('equipment obeys authored slots and can be put away again', () => {
  const RPG = engine();
  const adv = adventure();
  adv.gearSlots = [{ id: 'hand', label: 'Hand', allowedTypes: ['weapon'] }];
  adv.items = [{ id: 'sword', name: 'Sword', type: 'weapon', stackable: false, slot: 'hand' }];
  adv.nodes[0].entryEffects = [{ type: 'inventory', key: 'sword', op: 'add', value: 1 }];
  const state = RPG.newState(adv);

  assert.match(RPG.toggleEquip(state, adv, 'sword').text, /Equipped Sword/);
  assert.equal(state.equipped.hand, 'sword');
  assert.match(RPG.toggleEquip(state, adv, 'sword').text, /Unequipped Sword/);
  assert.equal(state.equipped.hand, undefined);
});

test('entry failure rules stop a run and report the authored ending', () => {
  const RPG = engine();
  const adv = adventure();
  adv.rules.failures = [{ statKey: 'health', op: '<=', value: 0, label: 'Defeated', message: 'Your strength is gone.' }];
  adv.nodes[0].entryEffects = [{ type: 'stat', key: 'health', op: 'set', value: 0 }];
  const state = RPG.newState(adv);

  assert.deepEqual(JSON.parse(JSON.stringify(state.ended)), {
    kind: 'failure', label: 'Defeated', message: 'Your strength is gone.'
  });
});
