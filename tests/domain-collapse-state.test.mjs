import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { createDomainCollapseState } = require('../domain-collapse-state.js');

test('domain groups are expanded by default and toggle within the current popup session', () => {
  const collapseState = createDomainCollapseState();

  assert.equal(collapseState.isCollapsed('example.com'), false);
  assert.equal(collapseState.toggle('example.com'), true);
  assert.equal(collapseState.isCollapsed('example.com'), true);
  assert.equal(collapseState.toggle('example.com'), false);
  assert.equal(collapseState.isCollapsed('example.com'), false);
});
