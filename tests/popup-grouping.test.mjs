import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../popup.js', import.meta.url), 'utf8');
function grouping(now = Date.now()) {
  const groups = [];
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const context = vm.createContext({ Date: Clock, t: key => key, renderGroup: (label, tabs) => groups.push({ label, ids: Array.from(tabs, t => t.id) }) });
  vm.runInContext(source.slice(source.indexOf('function renderByTime(tabs)'), source.indexOf('// ---- 渲染一个分组 ----')), context);
  return { context, groups };
}

test('time groups always display latest first even when stored order is stale', () => {
  const now = Date.now();
  const { context, groups } = grouping(now);
  context.renderByTime([{ id: 'old', closedAt: now - 1000 }, { id: 'new', closedAt: now }]);
  assert.deepEqual(groups, [{ label: 'justNow', ids: ['new', 'old'] }]);
});

test('domain groups rank count, recency, then name; entries rank by time', () => {
  const { context, groups } = grouping();
  context.renderByDomain([
    { id: 'old', domain: 'z.example', closedAt: 1 },
    { id: 'single-old', domain: 'b.example', closedAt: 10 },
    { id: 'new', domain: 'z.example', closedAt: 2 },
    { id: 'single-new', domain: 'c.example', closedAt: 20 },
    { id: 'tie', domain: 'a.example', closedAt: 20 },
  ]);
  assert.deepEqual(groups, [
    { label: 'z.example', ids: ['new', 'old'] },
    { label: 'a.example', ids: ['tie'] },
    { label: 'c.example', ids: ['single-new'] },
    { label: 'b.example', ids: ['single-old'] },
  ]);
});

test('just-now takes precedence over midnight and expires after five minutes', () => {
  const now = new Date(2026, 8, 30, 0, 2).getTime();
  const tab = { id: 'previous-day', closedAt: now - 180000 };
  const first = grouping(now);
  first.context.renderByTime([tab]);
  assert.equal(first.groups[0].label, 'justNow');
  const later = grouping(now + 300000);
  later.context.renderByTime([tab]);
  assert.equal(later.groups[0].label, 'yesterday');
});

test('yesterday follows calendar days across DST changes', () => {
  const originalTZ = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const { context, groups } = grouping(new Date(2026, 2, 9, 0, 0).getTime());
    context.renderByTime([{ id: 'two-days-ago', closedAt: new Date(2026, 2, 7, 23, 30).getTime() }]);
    assert.equal(groups[0].label, 'earlier');
  } finally {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  }
});
