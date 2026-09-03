const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function audioApi() {
  class RejectedAudio {
    play() { return Promise.reject(new Error('playback blocked')); }
    pause() {}
  }
  const project = { id: 'project', assets: [], audio: { ambientVolume: 0.4, effectVolume: 0.8, voiceVolume: 1, muted: false } };
  const DAL = {
    state: { projects: { project } }, activeProject() { return project; },
    ensureAssets() {}, assetSrc() { return 'blob:test'; }, pushHistory() {}, saveState() {}, uid() { return 'id'; }
  };
  const sandbox = {
    DAL, Audio: RejectedAudio, Blob, Promise, Date, Uint8Array,
    window: {}, document: { createElement() { return {}; }, getElementById() { return null; }, querySelector() { return null; } },
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }, setTimeout, clearTimeout
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets-audio.js'), 'utf8'), sandbox, { filename: 'assets-audio.js' });
  DAL.audioBus.attach(project.id);
  return DAL.audioBus;
}

test('failed effect and voice playback release their audio channels', async () => {
  const bus = audioApi();

  assert.equal(await bus.playEffect({}, 'effect'), false);
  assert.equal(bus.effect, null);
  assert.equal(await bus.playVoice({}, 'voice'), false);
  assert.equal(bus.voice, null);
});
