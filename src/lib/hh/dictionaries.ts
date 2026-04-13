/**
 * HeadHunter vacancy search filter values (public API).
 * Labels are for UI (Russian).
 */

export type FilterOption = { id: string; label: string };

/** HH `experience` */
export const VACANCY_EXPERIENCE_OPTIONS: FilterOption[] = [
  { id: "", label: "Любой опыт" },
  { id: "noExperience", label: "Нет опыта" },
  { id: "between1And3", label: "От 1 года до 3 лет" },
  { id: "between3And6", label: "От 3 до 6 лет" },
  { id: "moreThan6", label: "Более 6 лет" },
];

/** HH `schedule` */
export const VACANCY_SCHEDULE_OPTIONS: FilterOption[] = [
  { id: "", label: "Любой график" },
  { id: "fullDay", label: "Полный день" },
  { id: "shift", label: "Сменный график" },
  { id: "flexible", label: "Гибкий график" },
  { id: "remote", label: "Удалённая работа" },
  { id: "flyInFlyOut", label: "Вахтовый метод" },
];

/** HH `employment` */
export const VACANCY_EMPLOYMENT_OPTIONS: FilterOption[] = [
  { id: "", label: "Любая занятость" },
  { id: "full", label: "Полная занятость" },
  { id: "part", label: "Частичная занятость" },
  { id: "project", label: "Проектная работа" },
  { id: "volunteer", label: "Волонтёрство" },
  { id: "probation", label: "Стажировка" },
];

const EXPERIENCE_IDS = new Set(
  VACANCY_EXPERIENCE_OPTIONS.map((o) => o.id).filter(Boolean),
);
const SCHEDULE_IDS = new Set(
  VACANCY_SCHEDULE_OPTIONS.map((o) => o.id).filter(Boolean),
);
const EMPLOYMENT_IDS = new Set(
  VACANCY_EMPLOYMENT_OPTIONS.map((o) => o.id).filter(Boolean),
);

export function isAllowedExperience(value: string): boolean {
  return !value || EXPERIENCE_IDS.has(value);
}

export function isAllowedSchedule(value: string): boolean {
  return !value || SCHEDULE_IDS.has(value);
}

export function isAllowedEmployment(value: string): boolean {
  return !value || EMPLOYMENT_IDS.has(value);
}

export function labelForOption(
  options: FilterOption[],
  id: string,
): string | null {
  if (!id) return null;
  return options.find((o) => o.id === id)?.label ?? id;
}
