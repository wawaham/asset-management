export const budgetGroups = [
  { id: 'purchase', label: '아파트 매수 부대비용', items: [
    ['tax', '취득세 · 부가세목', '감면이 적용된다면 적용 후 금액', 'https://etax.seoul.go.kr/jsp/CtView.jsp?ctPage=%2Finfo%2FTaxinLife01.html'],
    ['broker', '중개보수 (복비)', '협의한 금액과 부가세 포함 여부 확인', 'https://land.seoul.go.kr/land/broker/brokerageCommission.do'],
    ['legal', '법무사 보수', '채권·인지 등 다른 행에 적은 비용 제외'],
    ['bond', '국민주택채권', '즉시 매도 시 실제 부담금', 'https://nhuf.molit.go.kr/FP/FP07/FP0705/FP070509.jsp'],
    ['registration', '인지대 · 등기 · 대출 부대비용'],
    ['purchaseExtra', '기타 매수비'],
  ] },
  { id: 'wedding', label: '결혼 · 신혼여행', items: [
    ['venue', '예식장 · 식대'], ['studio', '스드메 · 본식 촬영'],
    ['weddingExtra', '예물 · 혼주 · 기타 결혼비'], ['honeymoon', '신혼여행'],
  ] },
  { id: 'move', label: '입주 · 신혼 살림', items: [
    ['appliances', '가전'], ['furniture', '가구 · 생활용품'],
    ['repair', '수리 · 인테리어'], ['moving', '이사 · 입주청소'],
  ] },
];

export function parseManwon(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(Math.min(number, 1e9) * 10000) : 0;
}

const koreanOrder = new Intl.Collator('ko-KR', { numeric: true, sensitivity: 'base' });

export function sortWeddingGuests(guests, order) {
  if (order === 'registered') return guests;
  const compareNames = (a, b) => koreanOrder.compare(a.name, b.name);
  return [...guests].sort((a, b) => {
    if (order === 'relation') {
      const left = a.relation?.trim() || '';
      const right = b.relation?.trim() || '';
      return Number(!left) - Number(!right) || koreanOrder.compare(left, right) || compareNames(a, b);
    }
    if (order === 'expected' || order === 'received') {
      return parseManwon(b[order]) - parseManwon(a[order]) || compareNames(a, b);
    }
    return compareNames(a, b);
  });
}

export function summarizeGuestGifts(guests) {
  return (Array.isArray(guests) ? guests : []).reduce((totals, guest) => {
    const received = String(guest.received ?? '').trim();
    if (/\d/.test(received)) totals.received += parseManwon(received);
    else totals.expected += parseManwon(guest.expected);
    return totals;
  }, { received: 0, expected: 0 });
}

export function calculateHomeBudget(assetTotal, plan, guestGifts = { received: 0, expected: 0 }) {
  const excluded = parseManwon(plan.excluded);
  const reserve = parseManwon(plan.reserve);
  const loan = parseManwon(plan.loan);
  const target = parseManwon(plan.target);
  const retirementInwoong = parseManwon(plan.retirementInwoong);
  const retirementWoonjung = parseManwon(plan.retirementWoonjung);
  const extraHomeFunds = parseManwon(plan.extraHomeFunds);
  const addedHomeFunds = retirementInwoong + retirementWoonjung + extraHomeFunds;
  const groupTotals = budgetGroups.map(({ items }) => items.reduce((sum, [key]) => sum + parseManwon(plan[key]), 0));
  const [purchaseFees, wedding, move] = groupTotals;
  const extraGifts = parseManwon(plan.extraGifts);
  const listedGifts = guestGifts.received + guestGifts.expected;
  const giftIncome = listedGifts + extraGifts;
  const giftsInAssets = Math.min(guestGifts.received, parseManwon(plan.giftsInAssets));
  const weddingGiftCoverage = Math.min(wedding, giftIncome);
  const weddingOwnCost = wedding - weddingGiftCoverage;
  const giftReserve = giftIncome - weddingGiftCoverage;
  // Gifts are ring-fenced for wedding expenses and their own reserve.
  const cash = Math.max(0, assetTotal - excluded - giftsInAssets) + addedHomeFunds;
  const outlays = purchaseFees + weddingOwnCost + move + reserve;
  const ownBudget = Math.max(0, cash - outlays);
  const maxPrice = Math.max(0, cash + loan - outlays);
  const outlayGap = Math.max(0, outlays - cash);
  // A mortgage cannot cover more than the purchase price itself.
  const targetBalance = cash + Math.min(loan, target) - outlays - target;
  return { groupTotals, outlays, cash, ownBudget, maxPrice: outlayGap ? 0 : maxPrice, outlayGap, loan, target, targetBalance, excluded, reserve, listedGifts, giftIncome, giftsInAssets, weddingGiftCoverage, weddingOwnCost, giftReserve, retirementInwoong, retirementWoonjung, extraHomeFunds, addedHomeFunds };
}
