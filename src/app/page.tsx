import { SearchApp } from "@/components/SearchApp";

const AUTHOR_PROFILE = "https://github.com/ioffida";
const OPEN_PROJECT_URL = "https://github.com/ioffida/rabotaby-parser";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SearchApp />
      <footer className="mt-auto border-t border-slate-200/80 bg-white px-4 py-4 text-center text-xs text-slate-500">
        Данные:{" "}
        <a
          className="text-sky-700 underline-offset-2 hover:underline"
          href="https://github.com/hhru/api"
          target="_blank"
          rel="noreferrer"
        >
          HeadHunter public API
        </a>
        .{" "}
        <span className="text-slate-600">
          Powered by{" "}
          <a
            className="text-sky-700 underline-offset-2 hover:underline"
            href={AUTHOR_PROFILE}
            target="_blank"
            rel="noreferrer"
          >
            ioffida
          </a>
          .{" "}
          <a
            className="text-sky-700 underline-offset-2 hover:underline"
            href={OPEN_PROJECT_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open Project
          </a>
          .
        </span>
      </footer>
    </div>
  );
}
