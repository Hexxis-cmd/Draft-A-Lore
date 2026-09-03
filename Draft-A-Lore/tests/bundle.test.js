const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function bundleApi() {
  const sandbox = {
    DAL: { registerAfterRender() {}, registerActionHandler() {} }, TextEncoder, TextDecoder, Uint8Array, Date, Promise,
    Blob, Response, DecompressionStream
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'bundle.js'), 'utf8'), sandbox, { filename: 'bundle.js' });
  return sandbox.DAL;
}

test('project ZIP creation and reading round-trip exact bytes', async () => {
  const DAL = bundleApi();
  const source = new TextEncoder().encode('A portable project ✓');
  const zip = DAL.makeZip([{ name: 'project.json', data: source }]);
  const opened = DAL.readZip(zip);
  const result = await opened.read(opened.entries[0]);
  assert.deepEqual(Array.from(result), Array.from(source));
});

test('bundle reader rejects unsafe paths', () => {
  const DAL = bundleApi();
  for (const name of ['../project.json', '/project.json', 'C:/project.json']) {
    const zip = DAL.makeZip([{ name, data: new Uint8Array([1]) }]);
    assert.throws(() => DAL.readZip(zip), /unsafe file path/);
  }
});

test('bundle reader verifies stored-entry checksums', async () => {
  const DAL = bundleApi();
  const zip = DAL.makeZip([{ name: 'project.json', data: new Uint8Array([1, 2, 3, 4]) }]);
  const damaged = new Uint8Array(zip);
  damaged[30 + 'project.json'.length] ^= 0xff;
  const opened = DAL.readZip(damaged);
  await assert.rejects(opened.read(opened.entries[0]), /integrity check/);
});
