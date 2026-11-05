import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateHomeBudget, parseManwon } from './planning-model.js';

test('subtracts every expense group and reserve before adding the planned mortgage', () => {
  const budget = calculateHomeBudget(400_000_000, {
    excluded: '5000', reserve: '2000', loan: '30000', target: '60000',
    tax: '1100', broker: '210', legal: '80', bond: '30', registration: '20', purchaseExtra: '10',
    venue: '1000', honeymoon: '500', appliances: '600', furniture: '400',
  });
  assert.deepEqual(budget.groupTotals, [14_500_000, 15_000_000, 10_000_000]);
  assert.equal(budget.ownBudget, 290_500_000);
  assert.equal(budget.maxPrice, 590_500_000);
  assert.equal(budget.targetBalance, -9_500_000);
});

test('a planned mortgage does not cover non-purchase cash needs', () => {
  const budget = calculateHomeBudget(20_000_000, { reserve: '3000', loan: '30000', target: '15000' });
  assert.equal(budget.maxPrice, 0);
  assert.equal(budget.outlayGap, 10_000_000);
  assert.equal(budget.targetBalance, -10_000_000);
});

test('an overestimated mortgage cannot inflate cash left over on a cheaper home', () => {
  const budget = calculateHomeBudget(50_000_000, { loan: '40000', target: '20000', reserve: '1000' });
  assert.equal(budget.targetBalance, 40_000_000);
});

test('fractional ten-thousand won input is converted to whole won', () => {
  assert.equal(parseManwon('1.2345'), 12345);
  assert.equal(parseManwon(''), 0);
  assert.equal(parseManwon('-100'), 0);
  assert.equal(parseManwon('Infinity'), 0);
});
