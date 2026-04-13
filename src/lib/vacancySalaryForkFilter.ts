import type { HhVacancySnippet } from "@/lib/hh/types";

export type SalaryForkRangeFilter = {
  /** Inclusive lower bound of acceptable fork (same unit as vacancy salary). */
  userMin: number;
  /** Inclusive upper bound of acceptable fork. */
  userMax: number;
  /** Only vacancies with this `salary.currency` are considered (HH codes, e.g. BYN, RUR). */
  currency: string;
};

/**
 * Keep vacancies that have both salary bounds and whose fork overlaps [userMin, userMax]
 * in the same currency (interval overlap).
 */
export function filterVacanciesBySalaryForkRange(
  items: HhVacancySnippet[],
  filter: SalaryForkRangeFilter,
): HhVacancySnippet[] {
  const { userMin, userMax, currency } = filter;
  return items.filter((v) => {
    const s = v.salary;
    if (!s || s.from == null || s.to == null) return false;
    if (s.currency !== currency) return false;
    return s.from <= userMax && s.to >= userMin;
  });
}
