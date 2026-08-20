/* Draft A Lore — rpg-engine.js
 * Copyright 2026 Daymien Vanhorn — https://github.com/Hexxis-cmd/Draft-A-Lore
 * Free for noncommercial use under PolyForm Noncommercial 1.0.0 + supplemental
 * terms (see LICENSE.md). Credit to the original author must remain visible.
 * Commercial use requires a license — see COMMERCIAL-LICENSE.md.
 */
/* ============================================
   DRAFT A LORE — Adventure Rules Engine
   The single authority on what an adventure's state is and how it changes.
   Every reader of the rules — the editor previews, the Playthrough tool, the
   validator and the exported game — goes through this object, so they cannot
   drift apart.

   Two constraints keep that promise, and both matter if you edit this file:
   1. Nothing here touches the DOM, storage or any other DAL function. State is
      passed in and returned; the engine is pure logic.
   2. Internal calls go through `RPG.`, never `DAL.rpg.`. RPG.engineSource()
      serialises this object into the exported HTML, where the same functions
      are rebuilt on a bare `var RPG = {}`. A `DAL.` reference would compile in
      the app and throw in the export.
   ============================================ */
DAL = DAL || {};

(function(){
  var RPG = {};

  /* Equipment slots an item can occupy. 'none' means the item is carried only. */
  RPG.SLOTS = ['head','body','weapon','accessory'];

  /* --- Definition lookups ------------------------------------------------ */

  RPG.statDef = function(adv, key){
    var list = adv.stats || [];
    for(var i=0;i<list.length;i++){ if(list[i].key === key) return list[i]; }
    return null;
  };

  RPG.traitDef = function(adv, key){
    var list = adv.traits || [];
    for(var i=0;i<list.length;i++){ if(list[i].key === key) return list[i]; }
    return null;
  };

  RPG.nodeById = function(adv, id){
    var list = adv.nodes || [];
    for(var i=0;i<list.length;i++){ if(list[i].id === id) return list[i]; }
    return null;
  };

  /* Items are addressed by id. Adventures authored before ids were used store
     the item's name instead, so every lookup accepts either and resolves to a
     definition when one exists. An unresolved key still works as a bare label,
     which is what keeps older saved work playable. */
  RPG.itemDef = function(adv, key){
    var list = adv.items || [];
    var i;
    for(i=0;i<list.length;i++){ if(list[i].id === key) return list[i]; }
    for(i=0;i<list.length;i++){
      if(String(list[i].name||'').toLowerCase() === String(key||'').toLowerCase()) return list[i];
    }
    return null;
  };

  /* The canonical inventory key for an item reference. */
  RPG.itemKey = function(adv, key){
    var def = RPG.itemDef(adv, key);
    return def ? def.id : key;
  };

  RPG.itemName = function(adv, key){
    var def = RPG.itemDef(adv, key);
    return def ? (def.name || 'Unnamed item') : (key || 'Unknown item');
  };

  RPG.statLabel = function(adv, key){
    var def = RPG.statDef(adv, key);
    return def ? (def.label || def.key) : (key || 'Unknown stat');
  };

  RPG.traitLabel = function(adv, key){
    var def = RPG.traitDef(adv, key);
    return def ? (def.label || def.key) : (key || 'Unknown trait');
  };

  RPG.nodeTitle = function(adv, id){
    var node = RPG.nodeById(adv, id);
    return node ? (node.title || 'Untitled scene') : (id ? 'Missing scene' : 'No scene');
  };

  /* Author-facing rules, with every default spelled out so an adventure saved
     before these existed behaves the way it always did. */
  RPG.rules = function(adv){
    var r = adv.rules || {};
    return {
      lockedChoices: r.lockedChoices === 'hide' ? 'hide' : 'lock',
      failures: r.failures || []
    };
  };

  /* --- Numbers ----------------------------------------------------------- */

  RPG.num = function(v, fallback){
    var n = parseFloat(v);
    return isNaN(n) ? (fallback || 0) : n;
  };

  RPG.hasLimit = function(v){
    return v !== undefined && v !== null && v !== '' && !isNaN(parseFloat(v));
  };

  /* Clamping is a property of the stat, not of the effect, so every write goes
     through here — set, add and subtract alike. */
  RPG.clampStat = function(def, value){
    if(!def || def.type !== 'number') return value;
    var n = RPG.num(value, 0);
    if(RPG.hasLimit(def.min)) n = Math.max(n, parseFloat(def.min));
    if(RPG.hasLimit(def.max)) n = Math.min(n, parseFloat(def.max));
    return n;
  };

  RPG.statStart = function(def){
    if(def.type === 'number') return RPG.clampStat(def, RPG.num(def['default'], 0));
    if(def.type === 'boolean') return def['default'] === true || def['default'] === 'true';
    return String(def['default'] === undefined || def['default'] === null ? '' : def['default']);
  };

  /* --- State ------------------------------------------------------------- */

  /* The authoritative runtime shape. Anything the rules can read lives here
     and nowhere else. */
  RPG.blankState = function(adv){
    var state = {
      stats: {}, traits: {}, inventory: {}, equipped: {}, flags: {}, visited: {},
      nodeId: null, ended: null, step: 0, log: []
    };
    (adv.stats || []).forEach(function(s){ state.stats[s.key] = RPG.statStart(s); });
    (adv.traits || []).forEach(function(t){
      state.traits[t.key] = t.defaultActive === true || t.defaultActive === 'true';
    });
    return state;
  };

  /* A fresh run, already standing in the opening scene with its entry effects
     applied — the start node is a scene like any other. */
  RPG.newState = function(adv){
    var state = RPG.blankState(adv);
    var startId = adv.startNodeId || ((adv.nodes || [])[0] && adv.nodes[0].id) || null;
    if(startId) RPG.enter(state, adv, startId, 'Opening scene');
    else state.nodeId = null;
    return state;
  };

  RPG.currentNode = function(state, adv){
    return RPG.nodeById(adv, state.nodeId);
  };

  RPG.count = function(state, adv, key){
    return RPG.num(state.inventory[RPG.itemKey(adv, key)], 0);
  };

  RPG.isEquipped = function(state, adv, key){
    var id = RPG.itemKey(adv, key);
    var slots = Object.keys(state.equipped || {});
    for(var i=0;i<slots.length;i++){ if(state.equipped[slots[i]] === id) return true; }
    return false;
  };

  RPG.visitCount = function(state, nodeId){
    return RPG.num(state.visited[nodeId], 0);
  };

  /* Flag keys are not declared up front, so the editor offers the ones the
     adventure already mentions. Collected from every effect and condition. */
  RPG.flagKeys = function(adv){
    var seen = {};
    var add = function(list){
      (list || []).forEach(function(e){ if(e && e.type === 'flag' && e.key) seen[e.key] = true; });
    };
    (adv.nodes || []).forEach(function(n){
      add(n.entryEffects);
      (n.choices || []).forEach(function(ch){ add(ch.effects); add(ch.conditions); });
    });
    return Object.keys(seen).sort();
  };

  /* --- Conditions -------------------------------------------------------- */

  RPG.compare = function(op, a, b){
    switch(op){
      case '>=': return RPG.num(a, 0) >= RPG.num(b, 0);
      case '<=': return RPG.num(a, 0) <= RPG.num(b, 0);
      case '>': return RPG.num(a, 0) > RPG.num(b, 0);
      case '<': return RPG.num(a, 0) < RPG.num(b, 0);
      case '==': return String(a) === String(b);
      case '!=': return String(a) !== String(b);
      default: return true;
    }
  };

  RPG.testCondition = function(cond, state, adv){
    if(!cond || !cond.type) return true;
    if(cond.type === 'stat'){
      if(!RPG.statDef(adv, cond.key)) return false;
      return RPG.compare(cond.op, state.stats[cond.key], cond.value);
    }
    if(cond.type === 'trait'){
      if(!RPG.traitDef(adv, cond.key)) return false;
      var active = state.traits[cond.key] === true;
      return cond.op === 'inactive' ? !active : active;
    }
    if(cond.type === 'item'){
      var count = RPG.count(state, adv, cond.key);
      if(cond.op === '!has') return count === 0;
      if(cond.op === 'count') return count >= RPG.num(cond.value, 1);
      if(cond.op === 'countLte') return count <= RPG.num(cond.value, 1);
      return count > 0;
    }
    if(cond.type === 'equipped'){
      var on = RPG.isEquipped(state, adv, cond.key);
      return cond.op === 'isNot' ? !on : on;
    }
    if(cond.type === 'slot'){
      var filled = !!(state.equipped || {})[cond.key];
      return cond.op === 'empty' ? !filled : filled;
    }
    if(cond.type === 'flag'){
      var set = (state.flags || {})[cond.key] === true;
      return cond.op === 'unset' ? !set : set;
    }
    if(cond.type === 'visited'){
      var seen = RPG.visitCount(state, cond.key) > 0;
      return cond.op === 'no' ? !seen : seen;
    }
    return true;
  };

  /* A choice's requirements, with the unmet ones named. `logic` is 'all' by
     default; 'any' means one satisfied requirement is enough. */
  RPG.testChoice = function(choice, state, adv){
    var conds = (choice && choice.conditions) || [];
    if(!conds.length) return { ok: true, unmet: [], logic: 'all' };
    var logic = choice.condLogic === 'any' ? 'any' : 'all';
    var unmet = [];
    var passed = 0;
    conds.forEach(function(cond){
      if(RPG.testCondition(cond, state, adv)) passed++;
      else unmet.push(RPG.describeCondition(cond, adv));
    });
    var ok = logic === 'any' ? passed > 0 : unmet.length === 0;
    return { ok: ok, unmet: unmet, logic: logic };
  };

  /* Whether a locked choice is shown greyed out or removed entirely. */
  RPG.choiceHidden = function(choice, adv){
    var mode = (choice && choice.whenLocked) || 'inherit';
    if(mode === 'hide') return true;
    if(mode === 'lock') return false;
    return RPG.rules(adv).lockedChoices === 'hide';
  };

  /* Every choice on a node, resolved: what is takeable, what is locked and
     why, and what the reader never sees. */
  RPG.choiceStates = function(node, state, adv){
    return ((node && node.choices) || []).map(function(ch, idx){
      var test = RPG.testChoice(ch, state, adv);
      return {
        index: idx,
        choice: ch,
        ok: test.ok,
        unmet: test.unmet,
        logic: test.logic,
        hidden: !test.ok && RPG.choiceHidden(ch, adv),
        broken: !ch.targetNodeId || !RPG.nodeById(adv, ch.targetNodeId)
      };
    });
  };

  RPG.openChoices = function(node, state, adv){
    return RPG.choiceStates(node, state, adv).filter(function(c){ return c.ok && !c.broken; });
  };

  /* A dead end is a scene the reader cannot leave that the author never marked
     as an ending — the distinction the author needs to see. */
  RPG.isDeadEnd = function(node, state, adv){
    if(!node || node.kind === 'ending') return false;
    return RPG.openChoices(node, state, adv).length === 0;
  };

  RPG.describeCondition = function(cond, adv){
    if(!cond || !cond.type) return 'no requirement';
    /* A half-filled row is reported as unfinished rather than described as if
       it meant something, which is what validation and the locked-choice
       reasons both need to say. */
    if(cond.type !== 'flag' && !cond.key) return 'an unfinished requirement';
    if(cond.type === 'stat'){
      var words = { '>=':'is at least', '<=':'is at most', '>':'is above', '<':'is below', '==':'equals', '!=':'is not' };
      return RPG.statLabel(adv, cond.key) + ' ' + (words[cond.op] || 'is') + ' ' + (cond.value === '' || cond.value === undefined ? '0' : cond.value);
    }
    if(cond.type === 'trait'){
      return (cond.op === 'inactive' ? 'does not have the trait ' : 'has the trait ') + RPG.traitLabel(adv, cond.key);
    }
    if(cond.type === 'item'){
      var name = RPG.itemName(adv, cond.key);
      if(cond.op === '!has') return 'is not carrying ' + name;
      if(cond.op === 'count') return 'is carrying at least ' + RPG.num(cond.value, 1) + ' × ' + name;
      if(cond.op === 'countLte') return 'is carrying at most ' + RPG.num(cond.value, 1) + ' × ' + name;
      return 'is carrying ' + name;
    }
    if(cond.type === 'equipped'){
      return (cond.op === 'isNot' ? 'does not have ' : 'has ') + RPG.itemName(adv, cond.key) + ' equipped';
    }
    if(cond.type === 'slot'){
      return cond.op === 'empty' ? 'has nothing in the ' + cond.key + ' slot' : 'has something in the ' + cond.key + ' slot';
    }
    if(cond.type === 'flag'){
      return 'the flag ' + (cond.key || '(unnamed)') + (cond.op === 'unset' ? ' is not set' : ' is set');
    }
    if(cond.type === 'visited'){
      return (cond.op === 'no' ? 'has not visited ' : 'has visited ') + RPG.nodeTitle(adv, cond.key);
    }
    return 'unrecognised requirement';
  };

  /* --- Effects ----------------------------------------------------------- */

  RPG.describeEffect = function(eff, adv){
    if(!eff || !eff.type) return 'does nothing';
    /* Same courtesy as conditions: an unfinished row says so instead of
       pretending to mean something. */
    if(eff.type !== 'flag' && eff.type !== 'end' && !eff.key) return 'an unfinished change';
    if(eff.type === 'stat'){
      var label = RPG.statLabel(adv, eff.key);
      var val = (eff.value === '' || eff.value === undefined) ? '0' : eff.value;
      if(eff.op === 'set') return label + ' becomes ' + val;
      if(eff.op === 'subtract') return label + ' -' + val;
      return label + ' +' + val;
    }
    if(eff.type === 'trait'){
      var tl = RPG.traitLabel(adv, eff.key);
      if(eff.op === 'toggle') return 'flip the trait ' + tl;
      if(eff.op === 'remove') return 'lose the trait ' + tl;
      if(eff.op === 'grant') return 'gain the trait ' + tl;
      return (eff.value === 'false' || eff.value === false ? 'lose the trait ' : 'gain the trait ') + tl;
    }
    if(eff.type === 'inventory'){
      var qty = Math.max(1, RPG.num(eff.value, 1));
      var name = RPG.itemName(adv, eff.key);
      return (eff.op === 'remove' ? 'lose ' : 'gain ') + name + (qty > 1 ? ' ×' + qty : '');
    }
    if(eff.type === 'equip'){
      if(eff.op === 'unequip') return 'unequip ' + RPG.itemName(adv, eff.key);
      return 'equip ' + RPG.itemName(adv, eff.key);
    }
    if(eff.type === 'flag'){
      return (eff.op === 'clear' ? 'clear the flag ' : 'set the flag ') + (eff.key || '(unnamed)');
    }
    if(eff.type === 'goto'){
      return 'send the reader to ' + RPG.nodeTitle(adv, eff.key);
    }
    if(eff.type === 'end'){
      return (eff.op === 'failure' ? 'end the run in failure' : 'end the run') + (eff.key ? ': ' + eff.key : '');
    }
    return 'unrecognised change';
  };

  /* Effects are applied in the order the author listed them. Each one that
     actually changes something appends a record, which is what the playthrough
     log and the exported game both display. */
  RPG.applyEffects = function(effects, state, adv){
    var result = { changes: [], redirect: null, ended: null };
    (effects || []).forEach(function(eff){
      if(!eff || !eff.type) return;
      var text = null;
      var kind = 'info';

      if(eff.type === 'stat'){
        var def = RPG.statDef(adv, eff.key);
        if(!def) return;
        var before = state.stats[eff.key];
        var next;
        if(def.type === 'number'){
          var cur = RPG.num(before, 0);
          if(eff.op === 'set') next = RPG.num(eff.value, 0);
          else if(eff.op === 'subtract') next = cur - RPG.num(eff.value, 0);
          else next = cur + RPG.num(eff.value, 0);
          next = RPG.clampStat(def, next);
        } else if(def.type === 'boolean'){
          next = eff.value === true || eff.value === 'true';
        } else {
          next = String(eff.value === undefined ? '' : eff.value);
        }
        if(String(next) === String(before)) return;
        state.stats[eff.key] = next;
        text = (def.label || def.key) + ': ' + before + ' → ' + next;
        kind = (def.type === 'number' && RPG.num(next, 0) < RPG.num(before, 0)) ? 'down' : 'up';

      } else if(eff.type === 'trait'){
        var tdef = RPG.traitDef(adv, eff.key);
        if(!tdef) return;
        var was = state.traits[eff.key] === true;
        var now;
        if(eff.op === 'toggle') now = !was;
        else if(eff.op === 'remove') now = false;
        else if(eff.op === 'grant') now = true;
        else now = !(eff.value === 'false' || eff.value === false);
        if(now === was) return;
        state.traits[eff.key] = now;
        text = (now ? 'Gained trait: ' : 'Lost trait: ') + (tdef.label || tdef.key);
        kind = now ? 'up' : 'down';

      } else if(eff.type === 'inventory'){
        var key = RPG.itemKey(adv, eff.key);
        if(!key) return;
        var idef = RPG.itemDef(adv, eff.key);
        var name = RPG.itemName(adv, eff.key);
        var qty = Math.max(1, RPG.num(eff.value, 1));
        var held = RPG.num(state.inventory[key], 0);
        if(eff.op === 'remove'){
          if(held <= 0) return;
          var taken = Math.min(held, qty);
          var left = held - taken;
          if(left > 0) state.inventory[key] = left;
          else {
            delete state.inventory[key];
            /* An item you no longer carry cannot stay equipped. */
            Object.keys(state.equipped || {}).forEach(function(slot){
              if(state.equipped[slot] === key) delete state.equipped[slot];
            });
          }
          text = 'Lost ' + name + (taken > 1 ? ' ×' + taken : '');
          kind = 'down';
        } else {
          /* A non-stackable item is a single object: holding one is holding it. */
          var cap = idef && idef.stackable ? Math.max(1, RPG.num(idef.maxStack, 1)) : 1;
          var next2 = Math.min(cap, held + qty);
          if(next2 === held) return;
          state.inventory[key] = next2;
          text = 'Gained ' + name + ((next2 - held) > 1 ? ' ×' + (next2 - held) : '');
          kind = 'up';
        }

      } else if(eff.type === 'equip'){
        var ekey = RPG.itemKey(adv, eff.key);
        var edef = RPG.itemDef(adv, eff.key);
        var slot = edef && edef.slot && edef.slot !== 'none' ? edef.slot : null;
        if(eff.op === 'unequip'){
          var found = null;
          Object.keys(state.equipped || {}).forEach(function(s){ if(state.equipped[s] === ekey) found = s; });
          if(!found) return;
          delete state.equipped[found];
          text = 'Unequipped ' + RPG.itemName(adv, eff.key);
          kind = 'down';
        } else {
          if(!slot) return;
          if(RPG.num(state.inventory[ekey], 0) <= 0) return;
          if(state.equipped[slot] === ekey) return;
          state.equipped[slot] = ekey;
          text = 'Equipped ' + RPG.itemName(adv, eff.key) + ' (' + slot + ')';
          kind = 'up';
        }

      } else if(eff.type === 'flag'){
        if(!eff.key) return;
        var setNow = eff.op !== 'clear';
        if(((state.flags || {})[eff.key] === true) === setNow) return;
        if(setNow) state.flags[eff.key] = true; else delete state.flags[eff.key];
        text = (setNow ? 'Flag set: ' : 'Flag cleared: ') + eff.key;

      } else if(eff.type === 'goto'){
        if(!RPG.nodeById(adv, eff.key)) return;
        result.redirect = eff.key;
        text = 'Sent to ' + RPG.nodeTitle(adv, eff.key);

      } else if(eff.type === 'end'){
        result.ended = {
          kind: eff.op === 'failure' ? 'failure' : 'ending',
          label: eff.key || (eff.op === 'failure' ? 'Run over' : 'The End'),
          message: eff.value || ''
        };
        text = 'Run ended: ' + result.ended.label;
        kind = eff.op === 'failure' ? 'down' : 'info';
      }

      if(text) result.changes.push({ text: text, kind: kind });
    });
    return result;
  };

  /* --- Failure rules ----------------------------------------------------- */

  /* Stat thresholds that stop a run — health hitting zero being the obvious
     one. The first matching rule wins so the outcome is never ambiguous. */
  RPG.failureHit = function(state, adv){
    var rules = RPG.rules(adv).failures;
    for(var i=0;i<rules.length;i++){
      var r = rules[i];
      if(!r || !r.statKey || !RPG.statDef(adv, r.statKey)) continue;
      if(RPG.compare(r.op || '<=', state.stats[r.statKey], r.value)) return r;
    }
    return null;
  };

  RPG.describeFailure = function(rule, adv){
    var words = { '>=':'reaches', '<=':'drops to', '>':'goes above', '<':'falls below', '==':'equals', '!=':'is not' };
    return RPG.statLabel(adv, rule.statKey) + ' ' + (words[rule.op || '<='] || 'reaches') + ' ' + RPG.num(rule.value, 0);
  };

  /* --- Movement ---------------------------------------------------------- */

  /* Entering a scene is a fixed sequence: arrive, count the visit, run the
     scene's entry effects, honour a redirect, then check for failure or an
     ending. Redirect chains are capped so a loop cannot hang the reader. */
  RPG.enter = function(state, adv, nodeId, reason){
    var entry = { nodeId: nodeId, title: RPG.nodeTitle(adv, nodeId), reason: reason || '', changes: [] };
    var hops = 0;

    while(nodeId && hops < 12){
      state.nodeId = nodeId;
      state.visited[nodeId] = RPG.visitCount(state, nodeId) + 1;
      var node = RPG.nodeById(adv, nodeId);
      if(!node) break;

      var res = RPG.applyEffects(node.entryEffects, state, adv);
      entry.changes = entry.changes.concat(res.changes);

      if(res.ended){ state.ended = res.ended; break; }

      var fail = RPG.failureHit(state, adv);
      if(fail){
        state.ended = { kind: 'failure', label: fail.label || 'Run over', message: fail.message || RPG.describeFailure(fail, adv) };
        break;
      }

      if(node.kind === 'ending'){
        state.ended = { kind: 'ending', label: node.endingLabel || node.title || 'The End', message: '' };
        break;
      }

      if(res.redirect && res.redirect !== nodeId){ nodeId = res.redirect; hops++; continue; }
      break;
    }

    if(hops >= 12) entry.changes.push({ text: 'Redirect loop stopped after 12 hops', kind: 'down' });
    entry.title = RPG.nodeTitle(adv, state.nodeId);
    state.step++;
    state.log.push(entry);
    return entry;
  };

  /* One reader decision, start to finish. Returns the log entry, or null when
     the choice was not actually available — the guard that keeps a stale
     rendering from letting a locked choice through. */
  RPG.choose = function(state, adv, choiceIndex){
    if(state.ended) return null;
    var node = RPG.currentNode(state, adv);
    if(!node) return null;
    var choice = (node.choices || [])[choiceIndex];
    if(!choice) return null;
    if(!RPG.testChoice(choice, state, adv).ok) return null;
    var target = RPG.nodeById(adv, choice.targetNodeId);
    if(!target) return null;

    var res = RPG.applyEffects(choice.effects, state, adv);
    var destination = res.redirect || choice.targetNodeId;

    if(res.ended){
      state.ended = res.ended;
      state.step++;
      var stop = { nodeId: state.nodeId, title: RPG.nodeTitle(adv, state.nodeId), reason: choice.label || 'Choice', changes: res.changes };
      state.log.push(stop);
      return stop;
    }

    var entry = RPG.enter(state, adv, destination, choice.label || 'Choice');
    entry.changes = res.changes.concat(entry.changes);
    return entry;
  };

  /* Reader-driven equipping from the inventory panel, held to the same rules
     as an equip effect. */
  RPG.toggleEquip = function(state, adv, itemKey){
    var def = RPG.itemDef(adv, itemKey);
    if(!def || !def.slot || def.slot === 'none') return null;
    var op = RPG.isEquipped(state, adv, itemKey) ? 'unequip' : 'equip';
    var res = RPG.applyEffects([{ type:'equip', op: op, key: itemKey }], state, adv);
    return res.changes[0] || null;
  };

  /* --- Snapshots --------------------------------------------------------- */

  /* Step Back needs a real previous state, not a rewound node id: a run that
     spent gold and walked back a scene should still be poorer. Snapshots are
     plain data, so a structural copy is enough. */
  RPG.snapshot = function(state){
    return JSON.parse(JSON.stringify(state));
  };

  /* --- Panels ------------------------------------------------------------ */

  /* One description of what the reader should see, used by the Playthrough
     inspector and the exported game so the two cannot disagree. */
  RPG.statRows = function(state, adv){
    return (adv.stats || []).map(function(s){
      var value = state.stats[s.key];
      var row = { key: s.key, label: s.label || s.key, type: s.type || 'number', value: value, min: null, max: null, ratio: null };
      if((s.type || 'number') === 'number' && RPG.hasLimit(s.max)){
        row.max = parseFloat(s.max);
        row.min = RPG.hasLimit(s.min) ? parseFloat(s.min) : 0;
        var span = row.max - row.min;
        row.ratio = span > 0 ? Math.max(0, Math.min(1, (RPG.num(value, 0) - row.min) / span)) : null;
      }
      return row;
    });
  };

  RPG.inventoryRows = function(state, adv){
    var keys = Object.keys(state.inventory || {});
    return keys.map(function(key){
      var def = RPG.itemDef(adv, key);
      return {
        key: key,
        name: RPG.itemName(adv, key),
        count: RPG.num(state.inventory[key], 0),
        symbol: def ? (def.symbol || '') : '',
        image: def ? (def.imageDataUrl || '') : '',
        slot: def && def.slot && def.slot !== 'none' ? def.slot : null,
        equipped: RPG.isEquipped(state, adv, key),
        missing: !def
      };
    }).sort(function(a, b){ return a.name.localeCompare(b.name); });
  };

  RPG.traitRows = function(state, adv){
    return (adv.traits || []).map(function(t){
      return { key: t.key, label: t.label || t.key, active: state.traits[t.key] === true, description: t.description || '' };
    });
  };

  RPG.equipRows = function(state, adv){
    return RPG.SLOTS.map(function(slot){
      var key = (state.equipped || {})[slot];
      return { slot: slot, key: key || null, name: key ? RPG.itemName(adv, key) : null };
    });
  };

  /* --- Checkup ----------------------------------------------------------- */

  /* Finds the mistakes a branching story hides from its author: scenes nobody
     can reach, choices that lead nowhere, and requirements or changes that name
     something the author has since deleted. Reports only, never repairs. */
  RPG.audit = function(adv){
    var issues = [];
    var nodes = adv.nodes || [];
    var byId = {};
    nodes.forEach(function(n){ byId[n.id] = n; });

    function add(level, scope, text, nodeId){
      issues.push({ level: level, scope: scope, text: text, nodeId: nodeId || null });
    }

    if(!nodes.length){
      add('problem', 'Story', 'There are no scenes yet, so there is nothing to play.');
      return { issues: issues, problems: 0, warnings: issues.length, ok: false };
    }

    var startId = adv.startNodeId;
    if(!startId || !byId[startId]){
      add('problem', 'Story', 'No opening scene is set, so a reader has nowhere to begin.');
    }

    /* Reachability follows choices and redirect effects, because a scene reached
       only by a redirect is still reachable. */
    var seen = {};
    var queue = startId && byId[startId] ? [startId] : [];
    if(queue.length) seen[startId] = true;
    while(queue.length){
      var node = byId[queue.shift()];
      if(!node) continue;
      var targets = [];
      (node.choices || []).forEach(function(ch){ if(ch.targetNodeId) targets.push(ch.targetNodeId); });
      var pools = [node.entryEffects || []];
      (node.choices || []).forEach(function(ch){ pools.push(ch.effects || []); });
      pools.forEach(function(list){
        list.forEach(function(eff){ if(eff && eff.type === 'goto' && eff.key) targets.push(eff.key); });
      });
      targets.forEach(function(t){
        if(byId[t] && !seen[t]){ seen[t] = true; queue.push(t); }
      });
    }

    var statKeys = {}, traitKeys = {}, itemKeys = {}, flagsUsed = {}, flagsSet = {};
    (adv.stats || []).forEach(function(s){ statKeys[s.key] = true; });
    (adv.traits || []).forEach(function(t){ traitKeys[t.key] = true; });
    (adv.items || []).forEach(function(it){
      itemKeys[it.id] = true;
      if(it.name) itemKeys[String(it.name).toLowerCase()] = true;
    });

    function knownItem(key){ return itemKeys[key] || itemKeys[String(key || '').toLowerCase()]; }

    function checkCondition(cond, where, nodeId){
      if(!cond) return;
      var t = cond.type || 'stat';
      if(t === 'flag'){
        if(!cond.key) add('problem', where, 'A requirement has no flag name, so it can never be met.', nodeId);
        else flagsUsed[cond.key] = true;
        return;
      }
      if(t === 'visited'){
        if(!cond.key) add('problem', where, 'A requirement does not say which scene must have been visited.', nodeId);
        else if(!byId[cond.key]) add('problem', where, 'A requirement points at a scene that no longer exists.', nodeId);
        return;
      }
      if(t === 'slot'){
        if(!cond.key) add('problem', where, 'A requirement does not say which gear slot to check.', nodeId);
        return;
      }
      if(!cond.key){
        add('problem', where, 'A requirement is unfinished, so the choice stays locked forever.', nodeId);
        return;
      }
      if(t === 'stat'){
        if(!statKeys[cond.key]){ add('problem', where, 'A requirement uses the stat "'+cond.key+'", which no longer exists.', nodeId); return; }
        var def = RPG.statDef(adv, cond.key);
        if(def && (def.type || 'number') === 'number'){
          var v = RPG.num(cond.value, 0);
          if(RPG.hasLimit(def.max) && (cond.op === '>=' || cond.op === '>') && v > parseFloat(def.max)){
            add('problem', where, 'A requirement waits for '+(def.label||cond.key)+' above its maximum of '+def.max+', which can never happen.', nodeId);
          }
          if(RPG.hasLimit(def.min) && (cond.op === '<=' || cond.op === '<') && v < parseFloat(def.min)){
            add('problem', where, 'A requirement waits for '+(def.label||cond.key)+' below its minimum of '+def.min+', which can never happen.', nodeId);
          }
        }
      } else if(t === 'trait'){
        if(!traitKeys[cond.key]) add('problem', where, 'A requirement uses the trait "'+cond.key+'", which no longer exists.', nodeId);
      } else if(t === 'item' || t === 'equipped'){
        if(!knownItem(cond.key)) add('problem', where, 'A requirement uses the item "'+cond.key+'", which no longer exists.', nodeId);
      }
    }

    function checkEffect(eff, where, nodeId){
      if(!eff) return;
      var t = eff.type || 'stat';
      if(t === 'end') return;
      if(t === 'flag'){
        if(!eff.key) add('problem', where, 'A change has no flag name, so it does nothing.', nodeId);
        else if(eff.op === 'set') flagsSet[eff.key] = true;
        return;
      }
      if(!eff.key){
        add('problem', where, 'A change is unfinished, so it does nothing.', nodeId);
        return;
      }
      if(t === 'stat'){
        if(!statKeys[eff.key]) add('problem', where, 'A change writes to the stat "'+eff.key+'", which no longer exists.', nodeId);
      } else if(t === 'trait'){
        if(!traitKeys[eff.key]) add('problem', where, 'A change writes to the trait "'+eff.key+'", which no longer exists.', nodeId);
      } else if(t === 'inventory'){
        if(!knownItem(eff.key)) add('problem', where, 'A change gives or takes the item "'+eff.key+'", which no longer exists.', nodeId);
      } else if(t === 'equip'){
        if(!knownItem(eff.key)) add('problem', where, 'A change equips the item "'+eff.key+'", which no longer exists.', nodeId);
        else {
          var item = RPG.itemDef(adv, eff.key);
          if(item && (!item.slot || item.slot === 'none')) add('warning', where, RPG.itemName(adv, eff.key)+' has no gear slot, so it cannot be equipped.', nodeId);
        }
      } else if(t === 'goto'){
        if(!byId[eff.key]) add('problem', where, 'A change sends the reader to a scene that no longer exists.', nodeId);
      }
    }

    nodes.forEach(function(node){
      var where = node.title || 'Untitled scene';
      if(!seen[node.id] && node.id !== startId){
        add('warning', where, 'No path from the opening scene reaches this one.', node.id);
      }
      if(!(node.text || '').trim()) add('warning', where, 'The scene has no text for the reader.', node.id);
      (node.entryEffects || []).forEach(function(eff){ checkEffect(eff, where, node.id); });
      var open = 0;
      (node.choices || []).forEach(function(ch){
        if(!(ch.label || '').trim()) add('warning', where, 'A choice has no label, so its button reads "Continue".', node.id);
        if(!ch.targetNodeId) add('problem', where, 'The choice "'+(ch.label || 'Continue')+'" does not lead anywhere yet.', node.id);
        else if(!byId[ch.targetNodeId]) add('problem', where, 'The choice "'+(ch.label || 'Continue')+'" leads to a scene that no longer exists.', node.id);
        else open++;
        (ch.conditions || []).forEach(function(cond){ checkCondition(cond, where, node.id); });
        (ch.effects || []).forEach(function(eff){ checkEffect(eff, where, node.id); });
      });
      var endsHere = node.kind === 'ending';
      var redirects = (node.entryEffects || []).some(function(eff){ return eff && eff.type === 'goto' && eff.key; });
      var closes = (node.entryEffects || []).some(function(eff){ return eff && eff.type === 'end'; });
      if(!open && !endsHere && !redirects && !closes){
        add('warning', where, 'Nothing leads out of this scene, and it is not marked as an ending.', node.id);
      }
      if(endsHere && !(node.endingLabel || '').trim()){
        add('warning', where, 'This ending has no name, so the closing screen falls back to the scene title.', node.id);
      }
    });

    RPG.rules(adv).failures.forEach(function(r){
      if(!r.statKey || !statKeys[r.statKey]){
        add('problem', 'Run-ending rules', 'A rule watches a stat that no longer exists, so it never fires.');
      }
      if(!(r.label || '').trim()){
        add('warning', 'Run-ending rules', 'A rule has no title, so its closing screen reads "Run over".');
      }
    });

    Object.keys(flagsUsed).forEach(function(f){
      if(!flagsSet[f]) add('warning', 'Flags', 'The flag "'+f+'" is required somewhere but never set, so those choices stay locked.');
    });

    if(!nodes.some(function(n){ return n.kind === 'ending'; }) && !RPG.rules(adv).failures.length){
      add('warning', 'Story', 'No scene is marked as an ending and no run-ending rule exists, so a run never formally finishes.');
    }

    var problems = issues.filter(function(i){ return i.level === 'problem'; }).length;
    return { issues: issues, problems: problems, warnings: issues.length - problems, ok: !issues.length };
  };

  /* --- Export ------------------------------------------------------------ */

  /* Everything above, as source text. The exported game runs these exact
     functions, which is the only honest way to promise that a download plays
     the way the Playthrough tool did. Presentation is not included — the
     export builds its own UI on top. */
  RPG.API = ['SLOTS','statDef','traitDef','nodeById','itemDef','itemKey','itemName','statLabel',
    'traitLabel','nodeTitle','rules','num','hasLimit','clampStat','statStart','blankState',
    'newState','currentNode','count','isEquipped','visitCount','flagKeys','compare',
    'testCondition','testChoice','choiceHidden','choiceStates','openChoices','isDeadEnd',
    'describeCondition','describeEffect','applyEffects','failureHit','describeFailure','enter',
    'choose','toggleEquip','snapshot','statRows','inventoryRows','traitRows','equipRows'];

  RPG.engineSource = function(){
    var out = 'var RPG={};\n';
    RPG.API.forEach(function(key){
      var value = RPG[key];
      out += 'RPG.' + key + '=' + (typeof value === 'function' ? value.toString() : JSON.stringify(value)) + ';\n';
    });
    return out;
  };

  DAL.rpg = RPG;
})();
