import assert from 'node:assert/strict';
import test from 'node:test';
import { getAssetMonthContext } from './asset-months.js';

const october = {
  month: '2026-10',
  rows: [
    { owner: '인웅', category: 'ISA', amount: 120000, memo: 'monthly' },
    { owner: '운정', category: 'cash', amount: 0, memo: '' },
  ],
};
const september = { month: '2026-09', rows: [{ amount: 90000 }] };
const december = { month: '2026-12', rows: [{ amount: 150000 }] };

test('a new month carries the latest earlier record, regardless of snapshot order', () => {
  const context = getAssetMonthContext([october, december, september], '2026-11');
  assert.equal(context.selectedSnapshot, null);
  assert.equal(context.previousSnapshot, october);
  assert.deepEqual(context.previousSnapshot.rows, october.rows);
});

test('an existing month keeps its own record, including an empty record', () => {
  const november = { month: '2026-11', rows: [] };
  const context = getAssetMonthContext([november, october], '2026-11');
  assert.equal(context.selectedSnapshot, november);
  assert.equal(context.previousSnapshot, october);
});

test('gaps and year boundaries use the closest earlier saved month', () => {
  assert.equal(getAssetMonthContext([october, december], '2027-02').previousSnapshot, december);
});

test('a month without earlier records never copies future records', () => {
  assert.deepEqual(getAssetMonthContext([october], '2026-09'), {
    selectedSnapshot: null,
    previousSnapshot: null,
  });
  assert.deepEqual(getAssetMonthContext([], '2026-11'), {
    selectedSnapshot: null,
    previousSnapshot: null,
  });
});
