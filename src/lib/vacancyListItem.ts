import { formatSalaryRange } from "@/lib/format";
import type { HhVacancySnippet } from "@/lib/hh/types";

/** Slim vacancy row for API + UI list (right column). */
export type VacancyListItem = {
  id: string;
  name: string;
  url: string;
  employerName: string | null;
  salaryLabel: string | null;
};

const MAX_LIST_ITEMS = 300;

/** rabota.by mirrors HH vacancy ids; do not use alternate_url (often hh.ru). */
const RABOTA_VACANCY_QUERY =
  "hhtmFromLabel=employer_vacancy_tab&hhtmFrom=employer";

function vacancyUrl(v: HhVacancySnippet): string {
  return `https://rabota.by/vacancy/${v.id}?${RABOTA_VACANCY_QUERY}`;
}

function hasNumericSalary(v: HhVacancySnippet): boolean {
  if (!v.salary) return false;
  return v.salary.from != null || v.salary.to != null;
}

function toListItem(v: HhVacancySnippet): VacancyListItem {
  return {
    id: v.id,
    name: v.name,
    url: vacancyUrl(v),
    employerName: v.employer?.name?.trim() || null,
    salaryLabel: formatSalaryRange(v.salary),
  };
}

/**
 * Dedupe by id, prefer vacancies with salary first, then cap for payload size.
 */
export function buildVacancyListForResponse(
  items: HhVacancySnippet[],
): { items: VacancyListItem[]; uniqueLoaded: number } {
  const byId = new Map<string, HhVacancySnippet>();
  for (const v of items) {
    if (!byId.has(v.id)) byId.set(v.id, v);
  }
  const unique = [...byId.values()];
  const withSalary = unique.filter(hasNumericSalary);
  const withoutSalary = unique.filter((v) => !hasNumericSalary(v));
  const ordered = [...withSalary, ...withoutSalary].slice(0, MAX_LIST_ITEMS);
  return {
    items: ordered.map(toListItem),
    uniqueLoaded: unique.length,
  };
}
