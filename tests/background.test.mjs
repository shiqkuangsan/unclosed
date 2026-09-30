import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function worker(initial = []) {
  let records = structuredClone(initial);
  let listener;
  let failNextWrite = false;
  const timers = new Map();
  let timerId = 0;
  const event = { addListener() {} };
  const context = vm.createContext({
    console, Date, Math, URL,
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    chrome: {
      tabs: { query: async () => [], onCreated: event, onUpdated: event, onRemoved: event },
      webNavigation: { onBeforeNavigate: event, onCommitted: event },
      storage: { local: {
        get: async () => ({ closedTabs: structuredClone(records) }),
        set: async ({ closedTabs }) => {
          if (failNextWrite) { failNextWrite = false; throw new Error('write failed'); }
          records = structuredClone(closedTabs);
        },
      }, onChanged: event },
      runtime: { onInstalled: event, onStartup: event, onMessage: { addListener(fn) { listener = fn; } } },
      action: { setBadgeText() {}, setBadgeBackgroundColor() {}, setBadgeTextColor() {} },
    },
  });
  vm.runInContext(fs.readFileSync(new URL('../background.js', import.meta.url), 'utf8'), context);
  return {
    context, timers,
    records: () => records,
    failWrite: () => { failNextWrite = true; },
    request(message) {
      return new Promise((resolve, reject) => {
        if (listener(message, {}, resolve) !== true) reject(new Error('Unsupported message'));
      });
    },
  };
}
const tab = (id, offset = 0) => ({ id, title: id, url: `https://example.com/${id}`, domain: 'example.com', closedAt: Date.now() + offset, closeCount: 1, pinned: false });

test('repeat URL closes sort by latest time', async () => {
  const w = worker();
  const now = Date.now();
  for (const [id, offset] of [['A', 0], ['B', 1], ['A', 2]]) w.context.bufferClose({ ...tab(id), closedAt: now + offset });
  await w.context.flushBuffer();
  assert.deepEqual(w.records().map(t => t.id), ['A', 'B']);
  assert.equal(w.records()[0].closeCount, 2);
});

test('manual flush cancels the previous batch timer', async () => {
  const w = worker();
  w.context.bufferClose(tab('A'));
  await w.context.flushBuffer();
  assert.equal(w.timers.size, 0);
  w.context.bufferClose(tab('B'));
  assert.equal(w.timers.size, 1);
});

test('serialized deletion cannot resurrect records during a flush', async () => {
  const w = worker([tab('old')]);
  w.context.bufferClose(tab('new'));
  const pending = w.context.flushBuffer();
  const result = await w.request({ type: 'history', action: 'remove', ids: ['old'] });
  await pending;
  assert.equal(result.ok, true);
  assert.deepEqual(w.records().map(t => t.id), ['new']);
});

test('failed flush retains records for retry without duplication', async () => {
  const w = worker();
  w.context.bufferClose(tab('A'));
  w.failWrite();
  await assert.rejects(w.context.flushBuffer());
  await w.context.flushBuffer();
  assert.deepEqual(w.records().map(t => t.id), ['A']);
  assert.equal(w.records()[0].closeCount, 1);
});

test('group clear checks pinned state at execution, not stale popup state', async () => {
  const w = worker([tab('A')]);
  await w.request({ type: 'history', action: 'toggle-pin', id: 'A' });
  await w.request({ type: 'history', action: 'clear', ids: ['A'] });
  assert.equal(w.records().length, 1);
  assert.equal(w.records()[0].pinned, true);
});

test('imports normalize fields, deduplicate within the file and enforce retention', async () => {
  const w = worker();
  const rows = Array.from({ length: 510 }, (_, i) => tab(String(i), -i));
  const result = await w.request({ type: 'history', action: 'import', tabs: [...rows, rows[0], { url: 'javascript:alert(1)', closedAt: Date.now() }, null] });
  assert.equal(result.ok, true);
  assert.equal(w.records().length, 500);
  assert.equal(new Set(w.records().map(t => t.id)).size, 500);
  assert.equal(w.records().every(t => typeof t.title === 'string'), true);
});

test('retention keeps pins even beyond the ordinary record limit', async () => {
  const w = worker();
  const rows = [...Array.from({ length: 500 }, (_, i) => tab(String(i))), { ...tab('pin'), closedAt: 1, pinned: true }];
  assert.equal(w.context.enforceLimit(rows).some(t => t.id === 'pin'), true);
});

test('unrelated flush preserves imported same-URL history and pin state', async () => {
  const newer = { ...tab('newer'), url: 'https://same.example/', pinned: true, closeCount: 3 };
  const older = { ...tab('older', -1000), url: newer.url, closeCount: 2 };
  const w = worker([newer, older]);
  w.context.bufferClose(tab('unrelated', 1));
  await w.context.flushBuffer();
  assert.equal(w.records().length, 3);
  assert.equal(w.records().find(t => t.id === 'newer').pinned, true);
  w.context.bufferClose({ ...tab('repeat', 2), url: newer.url });
  await w.context.flushBuffer();
  const merged = w.records().filter(t => t.url === newer.url);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].pinned, true);
  assert.equal(merged[0].closeCount, 6);
});
