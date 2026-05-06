import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { getClearableGroupTabIds } = require('../group-clear.js');

test('group clear targets only unpinned tabs', () => {
  const tabs = [
    { id: 'tab-1', pinned: false },
    { id: 'tab-2', pinned: true },
    { id: 'tab-3' },
  ];

  assert.deepEqual(getClearableGroupTabIds(tabs), ['tab-1', 'tab-3']);
});
