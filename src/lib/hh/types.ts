/** HeadHunter API — minimal types we use. */

export type HhArea = {
  id: string;
  name: string;
  areas?: HhArea[];
};

export type HhSalary = {
  from: number | null;
  to: number | null;
  currency: string;
  gross?: boolean;
};

export type HhVacancySnippet = {
  id: string;
  name: string;
  salary: HhSalary | null;
  alternate_url?: string;
  employer?: { name?: string; id?: string };
};

export type HhVacanciesSearchResponse = {
  found: number;
  pages: number;
  page: number;
  per_page: number;
  items: HhVacancySnippet[];
};

export type HhSuggestItem = {
  text: string;
};

export type HhSuggestResponse = HhSuggestItem[];
