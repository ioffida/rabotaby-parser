import type { HhVacancySnippet } from "@/lib/hh/types";

/** HH still returns `BYR` on many Belarus vacancies; UI filter uses `BYN` — same denomination step. */
const BELARUS_RUBLE_CODES = new Set(["BYN", "BYR"]);

export function salaryCurrencyMatchesFilter(
  vacancyCurrency: string,
  filterCurrency: string,
): boolean {
  if (vacancyCurrency === filterCurrency) return true;
  if (
    BELARUS_RUBLE_CODES.has(vacancyCurrency) &&
    BELARUS_RUBLE_CODES.has(filterCurrency)
  ) {
    return true;
  }
  return false;
}

export type SalaryForkRangeFilter = {
  /** Inclusive lower bound of acceptable fork (same unit as vacancy salary). */
  userMin: number;
  /** Inclusive upper bound of acceptable fork. */
  userMax: number;
  /** Only vacancies with this `salary.currency` are considered (HH codes, e.g. BYN, RUR). */
  currency: string;
};

/**
 * Keep vacancies that have both salary bounds and whose entire fork [from, to] lies
 * inside [userMin, userMax] (inclusive), compatible currency (BYN/BYR treated as Belarus ruble).
 */
export function filterVacanciesBySalaryForkRange(
  items: HhVacancySnippet[],
  filter: SalaryForkRangeFilter,
): HhVacancySnippet[] {
  const { userMin, userMax, currency } = filter;
  return items.filter((v) => {
    const s = v.salary;
    if (!s || s.from == null || s.to == null) return false;
    if (!salaryCurrencyMatchesFilter(s.currency, currency)) return false;
    return s.from >= userMin && s.to <= userMax;
  });
}
