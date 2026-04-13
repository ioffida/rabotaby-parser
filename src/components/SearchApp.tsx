"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { formatMoney } from "@/lib/format";
import type { AppLogPayload } from "@/lib/logger";
import { serializeAppLog } from "@/lib/logger";
import {
  labelForOption,
  VACANCY_EMPLOYMENT_OPTIONS,
  VACANCY_EXPERIENCE_OPTIONS,
  VACANCY_SCHEDULE_OPTIONS,
} from "@/lib/hh/dictionaries";
import { SALARY_FILTER_CURRENCIES } from "@/lib/hh/salaryFilterCurrencies";
import type { VacancyListItem } from "@/lib/vacancyListItem";
import type { VacancyStatsResult } from "@/lib/vacancyStats";

type FlatArea = { id: string; name: string; depth: number };

type AreasPayload = {
  country: { id: string; name: string };
  areas: FlatArea[];
};

type StatsPayload = {
  stats: VacancyStatsResult;
  query: {
    text: string;
    area: string[];
    exact_match?: boolean;
    only_with_salary: boolean;
    salary_range_only?: boolean;
    salary_filter_from?: number | null;
    salary_filter_to?: number | null;
    salary_filter_currency?: string | null;
    experience: string | null;
    schedule: string | null;
    employment: string | null;
  };
  items?: VacancyListItem[];
  listMeta?: { shown: number; uniqueLoaded: number };
  error?: string;
  log?: AppLogPayload;
};

function indentLabel(depth: number, name: string): string {
  if (depth <= 0) return name;
  return `${"— ".repeat(depth)}${name}`;
}

/** Small "?" with CSS-only hover/focus tooltip (no extra deps). */
function FilterHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        tabIndex={0}
        aria-label="Подсказка по фильтру"
        className="flex size-5 cursor-help items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[10px] font-semibold text-slate-500 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-1.5 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-normal leading-relaxed text-slate-700 shadow-lg opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 sm:left-auto sm:right-0 sm:translate-x-0"
      >
        {text}
      </span>
    </span>
  );
}

export function SearchApp() {
  const [areasData, setAreasData] = useState<AreasPayload | null>(null);
  const [areasError, setAreasError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);

  /** HH `area` ids — multiple regions allowed */
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [schedule, setSchedule] = useState("");
  const [employment, setEmployment] = useState("");
  const [exactMatch, setExactMatch] = useState(false);
  const [onlyWithSalary, setOnlyWithSalary] = useState(false);
  const [salaryRangeOnly, setSalaryRangeOnly] = useState(false);
  const [salaryFilterFrom, setSalaryFilterFrom] = useState("");
  const [salaryFilterTo, setSalaryFilterTo] = useState("");
  const [salaryFilterCurrency, setSalaryFilterCurrency] = useState("BYN");

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<VacancyStatsResult | null>(null);
  const [lastQuery, setLastQuery] = useState<StatsPayload["query"] | null>(
    null,
  );
  const [vacancyList, setVacancyList] = useState<VacancyListItem[]>([]);
  const [listMeta, setListMeta] = useState<
    NonNullable<StatsPayload["listMeta"]> | null
  >(null);
  const [clientLog, setClientLog] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/areas");
        const body = (await res.json()) as AreasPayload & {
          error?: string;
          log?: AppLogPayload;
        };
        if (!res.ok) {
          setAreasError(body.error ?? "Failed to load regions");
          if (body.log) setClientLog(serializeAppLog(body.log));
          return;
        }
        if (!cancelled) {
          setAreasData(body);
          setSelectedAreaIds((prev) =>
            prev.length ? prev : [body.country.id],
          );
        }
      } catch (e) {
        if (!cancelled) {
          setAreasError(String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/suggests?${new URLSearchParams({ text: q }).toString()}`,
        );
        const body = (await res.json()) as { items?: string[] };
        setSuggestions(body.items ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [text]);

  const runAnalysis = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedAreaIds.length) return;
    setLoading(true);
    setClientLog(null);
    setStats(null);
    setVacancyList([]);
    setListMeta(null);
    try {
      let forkFrom: number | null = null;
      let forkTo: number | null = null;
      if (salaryRangeOnly) {
        const fromN = Number.parseInt(salaryFilterFrom.trim(), 10);
        const toN = Number.parseInt(salaryFilterTo.trim(), 10);
        if (
          !Number.isFinite(fromN) ||
          !Number.isFinite(toN) ||
          fromN < 0 ||
          toN < 0 ||
          fromN > toN
        ) {
          setClientLog(
            "Укажите суммы «от» и «до» (целые неотрицательные числа, от ≤ до).",
          );
          setLoading(false);
          return;
        }
        forkFrom = fromN;
        forkTo = toN;
      }

      const params = new URLSearchParams({ text: trimmed });
      for (const id of selectedAreaIds) params.append("area", id);
      if (exactMatch) params.set("exact_match", "1");
      if (onlyWithSalary) params.set("only_with_salary", "1");
      if (salaryRangeOnly && forkFrom != null && forkTo != null) {
        params.set("salary_range_only", "1");
        params.set("salary_filter_from", String(forkFrom));
        params.set("salary_filter_to", String(forkTo));
        params.set("salary_filter_currency", salaryFilterCurrency);
      }
      if (experience) params.set("experience", experience);
      if (schedule) params.set("schedule", schedule);
      if (employment) params.set("employment", employment);
      const res = await fetch(`/api/vacancies/stats?${params.toString()}`);
      const body = (await res.json()) as StatsPayload;
      if (!res.ok) {
        setClientLog(
          body.log
            ? serializeAppLog(body.log)
            : (body.error ?? `HTTP ${res.status}`),
        );
        return;
      }
      setStats(body.stats);
      setLastQuery(body.query);
      setVacancyList(body.items ?? []);
      setListMeta(body.listMeta ?? null);
    } catch (e) {
      setClientLog(String(e));
    } finally {
      setLoading(false);
    }
  }, [
    employment,
    exactMatch,
    experience,
    onlyWithSalary,
    salaryFilterCurrency,
    salaryFilterFrom,
    salaryFilterTo,
    salaryRangeOnly,
    schedule,
    selectedAreaIds,
    text,
  ]);

  const toggleArea = useCallback((id: string) => {
    setSelectedAreaIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  const areaCheckboxes = useMemo(() => {
    if (!areasData) return null;
    return areasData.areas.map((a) => {
      const checked = selectedAreaIds.includes(a.id);
      return (
        <label
          key={a.id}
          className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleArea(a.id)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="leading-snug">{indentLabel(a.depth, a.name)}</span>
        </label>
      );
    });
  }, [areasData, selectedAreaIds, toggleArea]);

  const selectedAreaTags = useMemo(() => {
    if (!areasData) return [];
    const byId = new Map(areasData.areas.map((a) => [a.id, a.name]));
    return selectedAreaIds.map((id) => ({
      id,
      name: byId.get(id) ?? id,
    }));
  }, [areasData, selectedAreaIds]);

  const selectedAreaSummary = useMemo(() => {
    if (!areasData || !lastQuery?.area?.length) return null;
    const byId = new Map(areasData.areas.map((a) => [a.id, a.name]));
    return lastQuery.area
      .map((id) => byId.get(id) ?? id)
      .join(" · ");
  }, [areasData, lastQuery]);

  const filterSummaryParts = useMemo(() => {
    if (!lastQuery) return [];
    const parts: string[] = [];
    const ex = lastQuery.experience
      ? labelForOption(VACANCY_EXPERIENCE_OPTIONS, lastQuery.experience)
      : null;
    const sch = lastQuery.schedule
      ? labelForOption(VACANCY_SCHEDULE_OPTIONS, lastQuery.schedule)
      : null;
    const emp = lastQuery.employment
      ? labelForOption(VACANCY_EMPLOYMENT_OPTIONS, lastQuery.employment)
      : null;
    if (ex) parts.push(`опыт: ${ex}`);
    if (sch) parts.push(`график: ${sch}`);
    if (emp) parts.push(`занятость: ${emp}`);
    return parts;
  }, [lastQuery]);

  const copyClientLog = async () => {
    if (clientLog) await navigator.clipboard.writeText(clientLog);
  };

  return (
    <div className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-8 w-full space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
          rabota.by · HeadHunter public API
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Аналитика вакансий по заработной плате
        </h1>
        <p className="w-full max-w-none text-sm leading-relaxed text-slate-600">
          Введите должность, отметьте один или несколько регионов и получите
          вилки зарплат (min / max по вакансиям), среднее и медиану по данным из
          открытого API
        </p>
      </header>

      <div className="grid w-full min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-8 lg:col-span-5">
      {areasError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <p className="font-medium">Не удалось загрузить регионы</p>
          <p className="mt-1 text-rose-800">{areasError}</p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <label
              htmlFor="position"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              Должность
            </label>
            <input
              id="position"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => {
                window.setTimeout(() => setShowSuggest(false), 200);
              }}
              placeholder="Например: продавец-консультант"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-500/30 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4"
            />
            {showSuggest && suggestions.length > 0 ? (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-slate-800 hover:bg-sky-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setText(s);
                        setShowSuggest(false);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Регионы (можно несколько)
            </span>
            <p className="mb-2 text-xs text-slate-500">
              Отметьте галочками нужные города или область. Минимум один регион.
            </p>
            {selectedAreaTags.length > 0 ? (
              <div
                className="mb-3 flex flex-wrap gap-1.5"
                aria-label="Выбранные регионы"
              >
                {selectedAreaTags.map(({ id, name }) => (
                  <span
                    key={id}
                    className="rounded-md bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : null}
            <div
              className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 px-1 py-2"
              role="group"
              aria-label="Регионы"
            >
              {!areasData ? (
                <p className="px-2 py-2 text-sm text-slate-500">Загрузка…</p>
              ) : (
                areaCheckboxes
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="experience"
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                Опыт работы
              </label>
              <select
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/30"
              >
                {VACANCY_EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o.id || "any"} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="schedule"
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                График работы
              </label>
              <select
                id="schedule"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/30"
              >
                {VACANCY_SCHEDULE_OPTIONS.map((o) => (
                  <option key={o.id || "any"} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1">
              <label
                htmlFor="employment"
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                Тип занятости
              </label>
              <select
                id="employment"
                value={employment}
                onChange={(e) => setEmployment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/30"
              >
                {VACANCY_EMPLOYMENT_OPTIONS.map((o) => (
                  <option key={o.id || "any"} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={exactMatch}
                  onChange={(e) => setExactMatch(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="min-w-0 flex-1 leading-snug">
                  Искать точную фразу только в названии вакансии
                </span>
              </label>
              <FilterHint text="Ищет строгое совпадение введенной фразы именно в заголовке вакансии, игнорируя описание и название компании." />
            </div>
            <div className="flex items-start gap-2">
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyWithSalary}
                  onChange={(e) => setOnlyWithSalary(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="min-w-0 flex-1 leading-snug">
                  Только вакансии с указанной зарплатой
                </span>
              </label>
              <FilterHint text="Отсеивает вакансии, в которых работодатель не указал размер заработной платы (по договоренности)." />
            </div>
            <div className="flex items-start gap-2">
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={salaryRangeOnly}
                  onChange={(e) => setSalaryRangeOnly(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="min-w-0 flex-1 leading-snug">
                  Только с вилками ОТ и ДО
                </span>
              </label>
              <FilterHint text="После загрузки выдачи остаются вакансии с полной вилкой «от–до» в выбранной валюте, причём вся вилка должна лежать внутри указанных сумм «от» и «до» (границы включительно)." />
            </div>
            {salaryRangeOnly ? (
              <div className="ml-6 space-y-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                <p className="text-xs text-slate-600">
                  Сначала загружается полная выдача HH (до 2000 карточек), затем в
                  статистике и списке остаются только вакансии, у которых вилка
                  «от–до» целиком входит в ваш диапазон. Валюта BYN в фильтре
                  совпадает и с BYN, и с BYR в ответе HH (старый код рубля).
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="salary-filter-from"
                      className="mb-1 block text-xs font-medium text-slate-500"
                    >
                      Сумма от
                    </label>
                    <input
                      id="salary-filter-from"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={salaryFilterFrom}
                      onChange={(e) => setSalaryFilterFrom(e.target.value)}
                      placeholder="Напр. 1500"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="salary-filter-to"
                      className="mb-1 block text-xs font-medium text-slate-500"
                    >
                      Сумма до
                    </label>
                    <input
                      id="salary-filter-to"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={salaryFilterTo}
                      onChange={(e) => setSalaryFilterTo(e.target.value)}
                      placeholder="Напр. 4000"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="salary-filter-currency"
                      className="mb-1 block text-xs font-medium text-slate-500"
                    >
                      Валюта вилки
                    </label>
                    <select
                      id="salary-filter-currency"
                      value={salaryFilterCurrency}
                      onChange={(e) => setSalaryFilterCurrency(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25"
                    >
                      {SALARY_FILTER_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={
              loading ||
              !text.trim() ||
              !selectedAreaIds.length ||
              (salaryRangeOnly &&
                (!salaryFilterFrom.trim() || !salaryFilterTo.trim()))
            }
            onClick={runAnalysis}
            className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Считаем…" : "Показать статистику"}
          </button>
        </div>
      </section>

      {clientLog ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Отладочный лог</p>
            <button
              type="button"
              onClick={copyClientLog}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              Copy debug log
            </button>
          </div>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/80 p-2 text-xs text-amber-900">
            {clientLog}
          </pre>
        </div>
      ) : null}

      {stats && lastQuery ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Результаты</h2>
          <p className="text-xs leading-relaxed text-slate-500">
            Запрос: «{lastQuery.text}»
            {selectedAreaSummary ? (
              <>
                {" "}
                · регионы: {selectedAreaSummary}
              </>
            ) : (
              <>
                {" "}
                · id: {lastQuery.area.join(", ")}
              </>
            )}
            {lastQuery.exact_match ? " · точное совпадение в названии" : ""}
            {lastQuery.only_with_salary ? " · только с ЗП" : ""}
            {lastQuery.salary_range_only === true &&
            lastQuery.salary_filter_from != null &&
            lastQuery.salary_filter_to != null ? (
              <>
                {" "}
                · вилка {lastQuery.salary_filter_from}–
                {lastQuery.salary_filter_to}{" "}
                {lastQuery.salary_filter_currency ?? ""}
              </>
            ) : null}
            {filterSummaryParts.length > 0
              ? ` · ${filterSummaryParts.join(" · ")}`
              : ""}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Найдено (HH)"
              value={String(stats.found)}
              hint="Всего по выдаче API"
            />
            <StatCard
              label="Проанализировано"
              value={String(stats.fetched)}
              hint="До 2000 объявлений на один запрос"
            />
            <StatCard
              label="С указанной ЗП"
              value={String(stats.withSalary)}
              hint="Среди загруженных"
            />
            <StatCard
              label="Без указания ЗП"
              value={String(stats.withoutSalary)}
              hint="Среди загруженных"
            />
          </div>

          {stats.byCurrency.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Нет вакансий с числовой зарплатой в выборке. Снимите фильтры «только
              с ЗП» / «только вилки ОТ и ДО» или расширьте регион.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Валюта</th>
                    <th className="px-4 py-3">Вакансий</th>
                    <th className="px-4 py-3">Вилка min</th>
                    <th className="px-4 py-3">Вилка max</th>
                    <th className="px-4 py-3">Среднее</th>
                    <th className="px-4 py-3">Медиана</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.byCurrency.map((row) => (
                    <tr key={row.currency} className="text-slate-800">
                      <td className="px-4 py-3 font-medium">{row.currency}</td>
                      <td className="px-4 py-3">{row.count}</td>
                      <td className="px-4 py-3">
                        {formatMoney(row.min, row.currency)}
                      </td>
                      <td className="px-4 py-3">
                        {formatMoney(row.max, row.currency)}
                      </td>
                      <td className="px-4 py-3">
                        {formatMoney(row.mean, row.currency)}
                      </td>
                      <td className="px-4 py-3">
                        {formatMoney(row.median, row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                Для каждой вакансии берётся середина вилки (from+to)/2 или одно
                из граничных значений. Gross / net учитываются только как
                метки: до вычета налогов — {stats.byCurrency.reduce((a, b) => a + b.grossCount, 0)}, после —{" "}
                {stats.byCurrency.reduce((a, b) => a + b.netCount, 0)}.
              </p>
            </div>
          )}
        </section>
      ) : null}
        </div>

        <aside className="lg:col-span-7 lg:sticky lg:top-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:self-start">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Вакансии из выборки
            </h2>
            {!stats || !lastQuery ? (
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                После нажатия «Показать статистику» здесь появятся вакансии с
                вилками зарплат и ссылками на сайт (до 300 карточек: сначала с
                указанной ЗП).
              </p>
            ) : vacancyList.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                В выборке нет карточек для списка. Попробуйте снять фильтры «только
                с ЗП» / «только вилки ОТ и ДО» или расширить регионы.
              </p>
            ) : (
              <>
                {listMeta ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Показано {listMeta.shown} из {listMeta.uniqueLoaded}{" "}
                    уникальных загруженных
                    {listMeta.shown < listMeta.uniqueLoaded
                      ? " (лимит отображения 300)"
                      : ""}
                  </p>
                ) : null}
                <ul className="mt-4 space-y-3">
                  {vacancyList.map((v) => (
                    <li
                      key={v.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm"
                    >
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sky-700 hover:underline"
                      >
                        {v.name}
                      </a>
                      {v.employerName ? (
                        <p className="mt-1 text-xs text-slate-600">
                          {v.employerName}
                        </p>
                      ) : null}
                      {v.salaryLabel ? (
                        <p className="mt-1.5 text-sm font-medium text-slate-800">
                          {v.salaryLabel}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-slate-500">
                          Зарплата не указана
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
