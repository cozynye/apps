import type { PurchasesIntroPrice } from 'react-native-purchases';

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

export function trialDays(intro: PurchasesIntroPrice | null): number | null {
  if (!intro || intro.price !== 0) return null;
  const perUnit = UNIT_DAYS[intro.periodUnit];
  return perUnit ? perUnit * intro.periodNumberOfUnits : null;
}

export function savePercent(annualPrice: number, monthlyPrice: number): number | null {
  if (monthlyPrice <= 0) return null;
  const percent = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);
  return percent > 0 ? percent : null;
}
