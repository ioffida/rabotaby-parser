import type { HhSalary } from "@/lib/hh/types";

/**
 * Format salary numbers for UI (Belarus locale).
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("ru-BY", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

/**
 * Human-readable salary range for a vacancy card (Russian labels for gross/net).
 */
export function formatSalaryRange(salary: HhSalary | null): string | null {
  if (!salary) return null;
  const { from, to, currency, gross } = salary;
  if (from == null && to == null) return null;
  const tax =
    gross === true
      ? ", до вычета налогов"
      : gross === false
        ? ", на руки"
        : "";
  if (from != null && to != null) {
    if (from === to) return `${formatMoney(from, currency)}${tax}`;
    return `${formatMoney(from, currency)} – ${formatMoney(to, currency)}${tax}`;
  }
  if (from != null) return `от ${formatMoney(from, currency)}${tax}`;
  return `до ${formatMoney(to!, currency)}${tax}`;
}
