import { NextRequest, NextResponse } from "next/server";

import { hhFetchJson } from "@/lib/hh/client";
import type { HhVacanciesSearchResponse, HhVacancySnippet } from "@/lib/hh/types";
import {
  aggregateVacancySalaries,
  mergeStatsFound,
} from "@/lib/vacancyStats";
import {
  isAllowedEmployment,
  isAllowedExperience,
  isAllowedSchedule,
} from "@/lib/hh/dictionaries";
import { nextResponseFromHhFailure } from "@/lib/hh/routeErrors";
import { buildVacancyListForResponse } from "@/lib/vacancyListItem";
import { SALARY_FILTER_CURRENCY_SET } from "@/lib/hh/salaryFilterCurrencies";
import { filterVacanciesBySalaryForkRange } from "@/lib/vacancySalaryForkFilter";

const PER_PAGE = 100;
const MAX_PAGES = 20; // HH returns at most 2000 items for vacancy search

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text")?.trim() ?? "";
  const areaMulti = req.nextUrl.searchParams
    .getAll("area")
    .map((s) => s.trim())
    .filter(Boolean);
  const areaSingle = req.nextUrl.searchParams.get("area")?.trim() ?? "";
  const areaIds =
    areaMulti.length > 0 ? areaMulti : areaSingle ? [areaSingle] : [];
  const onlyWithSalary =
    req.nextUrl.searchParams.get("only_with_salary") === "1" ||
    req.nextUrl.searchParams.get("only_with_salary") === "true";
  const salaryRangeOnly =
    req.nextUrl.searchParams.get("salary_range_only") === "1" ||
    req.nextUrl.searchParams.get("salary_range_only") === "true";
  /** Fork + range filters run after fetch; do not force HH salary flag from them alone. */
  const hhOnlyWithSalary = onlyWithSalary;

  const currencyParam =
    req.nextUrl.searchParams.get("salary_filter_currency")?.trim().toUpperCase() ||
    "BYN";
  if (salaryRangeOnly && !SALARY_FILTER_CURRENCY_SET.has(currencyParam)) {
    return NextResponse.json(
      { error: "Invalid `salary_filter_currency`" },
      { status: 400 },
    );
  }
  const salaryFilterCurrency = SALARY_FILTER_CURRENCY_SET.has(currencyParam)
    ? currencyParam
    : "BYN";
  const sfFromRaw = req.nextUrl.searchParams.get("salary_filter_from")?.trim() ?? "";
  const sfToRaw = req.nextUrl.searchParams.get("salary_filter_to")?.trim() ?? "";

  const experience = req.nextUrl.searchParams.get("experience")?.trim() ?? "";
  const schedule = req.nextUrl.searchParams.get("schedule")?.trim() ?? "";
  const employment = req.nextUrl.searchParams.get("employment")?.trim() ?? "";

  if (!text) {
    return NextResponse.json(
      { error: "Query parameter `text` is required" },
      { status: 400 },
    );
  }
  if (!areaIds.length) {
    return NextResponse.json(
      { error: "At least one `area` query parameter is required" },
      { status: 400 },
    );
  }

  if (!isAllowedExperience(experience)) {
    return NextResponse.json(
      { error: "Invalid `experience` query parameter" },
      { status: 400 },
    );
  }
  if (!isAllowedSchedule(schedule)) {
    return NextResponse.json(
      { error: "Invalid `schedule` query parameter" },
      { status: 400 },
    );
  }
  if (!isAllowedEmployment(employment)) {
    return NextResponse.json(
      { error: "Invalid `employment` query parameter" },
      { status: 400 },
    );
  }

  let salaryFilterFrom: number | null = null;
  let salaryFilterTo: number | null = null;
  if (salaryRangeOnly) {
    if (!sfFromRaw || !sfToRaw) {
      return NextResponse.json(
        {
          error:
            "`salary_range_only` requires `salary_filter_from` and `salary_filter_to` (non-negative integers)",
        },
        { status: 400 },
      );
    }
    salaryFilterFrom = Number.parseInt(sfFromRaw, 10);
    salaryFilterTo = Number.parseInt(sfToRaw, 10);
    if (
      !Number.isFinite(salaryFilterFrom) ||
      !Number.isFinite(salaryFilterTo) ||
      salaryFilterFrom < 0 ||
      salaryFilterTo < 0
    ) {
      return NextResponse.json(
        { error: "`salary_filter_from` and `salary_filter_to` must be non-negative integers" },
        { status: 400 },
      );
    }
    if (salaryFilterFrom > salaryFilterTo) {
      return NextResponse.json(
        { error: "`salary_filter_from` must be less than or equal to `salary_filter_to`" },
        { status: 400 },
      );
    }
  }

  const allItems: HhVacancySnippet[] = [];
  let found = 0;
  let pages = 1;

  try {
    for (let page = 0; page < pages && page < MAX_PAGES; page += 1) {
      const data = await hhFetchJson<HhVacanciesSearchResponse>(
        "/vacancies",
        {
          text,
          area: areaIds,
          page,
          per_page: PER_PAGE,
          ...(hhOnlyWithSalary ? { only_with_salary: true } : {}),
          ...(experience ? { experience } : {}),
          ...(schedule ? { schedule } : {}),
          ...(employment ? { employment } : {}),
        },
        "api:vacancies/stats",
      );
      found = data.found;
      pages = Math.min(data.pages, MAX_PAGES);
      allItems.push(...data.items);
      if (!data.items.length) break;
    }

    const itemsForStats =
      salaryRangeOnly &&
      salaryFilterFrom != null &&
      salaryFilterTo != null
        ? filterVacanciesBySalaryForkRange(allItems, {
            userMin: salaryFilterFrom,
            userMax: salaryFilterTo,
            currency: salaryFilterCurrency,
          })
        : allItems;

    const base = aggregateVacancySalaries(itemsForStats);
    const stats = mergeStatsFound(base, found);
    const { items: listItems, uniqueLoaded } =
      buildVacancyListForResponse(itemsForStats);

    return NextResponse.json({
      stats,
      query: {
        text,
        area: areaIds,
        only_with_salary: onlyWithSalary,
        salary_range_only: salaryRangeOnly,
        salary_filter_from: salaryFilterFrom,
        salary_filter_to: salaryFilterTo,
        salary_filter_currency: salaryRangeOnly ? salaryFilterCurrency : null,
        experience: experience || null,
        schedule: schedule || null,
        employment: employment || null,
      },
      items: listItems,
      listMeta: {
        shown: listItems.length,
        uniqueLoaded,
      },
    });
  } catch (e) {
    return nextResponseFromHhFailure("api:vacancies/stats", e, {
      text,
      area: areaIds,
      only_with_salary: onlyWithSalary,
      salary_range_only: salaryRangeOnly,
      salary_filter_from: salaryFilterFrom,
      salary_filter_to: salaryFilterTo,
      salary_filter_currency: salaryRangeOnly ? salaryFilterCurrency : undefined,
      experience,
      schedule,
      employment,
      requestQuery: Object.fromEntries(req.nextUrl.searchParams.entries()),
    });
  }
}
