import { savePercent, trialDays } from './pricing';

const intro = (price: number, periodUnit: string, periodNumberOfUnits: number) =>
  ({ price, priceString: '', cycles: 1, period: '', periodUnit, periodNumberOfUnits }) as never;

describe('trialDays', () => {
  it('converts a free intro period to days', () => {
    expect(trialDays(intro(0, 'DAY', 7))).toBe(7);
    expect(trialDays(intro(0, 'WEEK', 1))).toBe(7);
  });

  it('ignores paid intro offers and missing intros', () => {
    expect(trialDays(intro(0.99, 'WEEK', 1))).toBeNull();
    expect(trialDays(null)).toBeNull();
  });
});

describe('savePercent', () => {
  it('compares yearly with 12 × monthly', () => {
    expect(savePercent(199000, 29000)).toBe(43); // plan prices: matches the A9 mockup badge
    expect(savePercent(400000, 29000)).toBeNull();
    expect(savePercent(100, 0)).toBeNull();
  });
});
