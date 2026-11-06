import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateHomeBudget, parseManwon, sortWeddingGuests, summarizeGuestGifts } from './planning-model.js';

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

test('guest sorting handles Korean names, relations, blank relations and numeric amounts', () => {
  const guests = [
    { name: '홍길동', relation: '친구', expected: '5', received: '15' },
    { name: '박지수', relation: '', expected: '50', received: '' },
    { name: '김민수', relation: '가족', expected: '10', received: '5' },
    { name: '이수진', relation: '친구', expected: '10', received: '20' },
  ];
  const names = (order) => sortWeddingGuests(guests, order).map(({ name }) => name);
  assert.deepEqual(names('name'), ['김민수', '박지수', '이수진', '홍길동']);
  assert.deepEqual(names('relation'), ['김민수', '이수진', '홍길동', '박지수']);
  assert.deepEqual(names('expected'), ['박지수', '김민수', '이수진', '홍길동']);
  assert.deepEqual(names('received'), ['이수진', '홍길동', '김민수', '박지수']);
  assert.deepEqual(names('registered'), ['홍길동', '박지수', '김민수', '이수진']);
});

test('budget uses received amounts in place of estimates, including explicit zero', () => {
  const gifts = summarizeGuestGifts([
    { owner: '인웅', expected: '30', received: '20' },
    { owner: '운정', expected: '50', received: '' },
    { owner: '운정', expected: '10', received: '0' },
  ]);
  assert.deepEqual(gifts, { received: 200_000, expected: 500_000 });
  const budget = calculateHomeBudget(10_000_000, { venue: '100', extraGifts: '30', giftsInAssets: '20', target: '1000' }, gifts);
  assert.equal(budget.listedGifts, 700_000);
  assert.equal(budget.giftIncome, 1_000_000);
  assert.equal(budget.giftContribution, 800_000);
  assert.equal(budget.maxPrice, 9_800_000);
  assert.equal(budget.targetBalance, -200_000);
});

test('already counted gifts can offset only received gifts, not estimates or additions', () => {
  const budget = calculateHomeBudget(10_000_000, { extraGifts: '20', giftsInAssets: '150' }, { received: 200_000, expected: 500_000 });
  assert.equal(budget.giftsInAssets, 200_000);
  assert.equal(budget.giftContribution, 700_000);
});
