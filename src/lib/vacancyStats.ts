import type { HhVacancySnippet } from "@/lib/hh/types";

/**
 * Representative monthly amount for one vacancy snippet.
 * Uses midpoint when both ends exist; otherwise the single bound.
 */
export function salaryMidpoint(salary: NonNullable<HhVacancySnippet["salary"]>): number | null {
  const { from, to } = salary;
  if (from != null && to != null) return (from + to) / 2;
  if (from != null) return from;
  if (to != null) return to;
  return null;
}

export type CurrencyStats = {
  currency: string;
  count: number;
  grossCount: number;
  netCount: number;
  min: number;
  max: number;
  mean: number;
  median: number;
};

export type VacancyStatsResult = {
  /** Total vacancies reported by HH for this query */
  found: number;
  /** Items we actually loaded (HH caps search depth) */
  fetched: number;
  withSalary: number;
  withoutSalary: number;
  byCurrency: CurrencyStats[];
};

function medianSorted(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function aggregateVacancySalaries(items: HhVacancySnippet[]): VacancyStatsResult {
  const byCurrency = new Map<
    string,
    { values: number[]; gross: number; net: number }
  >();

  let withSalary = 0;
  for (const v of items) {
    if (!v.salary) continue;
    const mid = salaryMidpoint(v.salary);
    if (mid == null) continue;
    withSalary += 1;
    const cur = v.salary.currency;
    let bucket = byCurrency.get(cur);
    if (!bucket) {
      bucket = { values: [], gross: 0, net: 0 };
      byCurrency.set(cur, bucket);
    }
    bucket.values.push(mid);
    if (v.salary.gross === true) bucket.gross += 1;
    else if (v.salary.gross === false) bucket.net += 1;
  }

  const stats: CurrencyStats[] = [];
  for (const [currency, bucket] of byCurrency) {
    const values = bucket.values.sort((a, b) => a - b);
    const sum = values.reduce((s, x) => s + x, 0);
    stats.push({
      currency,
      count: values.length,
      grossCount: bucket.gross,
      netCount: bucket.net,
      min: values[0]!,
      max: values[values.length - 1]!,
      mean: sum / values.length,
      median: medianSorted(values),
    });
  }

  stats.sort((a, b) => b.count - a.count);

  return {
    found: 0,
    fetched: items.length,
    withSalary,
    withoutSalary: items.length - withSalary,
    byCurrency: stats,
  };
}

export function mergeStatsFound(
  base: VacancyStatsResult,
  found: number,
): VacancyStatsResult {
  return { ...base, found };
}
