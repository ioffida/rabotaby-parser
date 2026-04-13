/** HH vacancy `salary.currency` codes supported for fork-range filtering. */
export const SALARY_FILTER_CURRENCIES = [
  "BYN",
  "RUR",
  "USD",
  "EUR",
  "KZT",
  "PLN",
] as const;

export const SALARY_FILTER_CURRENCY_SET = new Set<string>(
  SALARY_FILTER_CURRENCIES,
);
