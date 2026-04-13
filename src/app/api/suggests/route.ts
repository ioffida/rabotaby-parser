import { NextRequest, NextResponse } from "next/server";

import { hhFetchJson } from "@/lib/hh/client";
import type { HhSuggestResponse } from "@/lib/hh/types";
import { nextResponseFromHhFailure } from "@/lib/hh/routeErrors";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text")?.trim() ?? "";
  if (text.length < 2) {
    return NextResponse.json({ items: [] as string[] });
  }

  try {
    const data = await hhFetchJson<HhSuggestResponse>(
      "/suggests/vacancy_positions",
      { text },
      "api:suggests",
    );
    const items = data.map((x) => x.text).filter(Boolean);
    return NextResponse.json({ items });
  } catch (e) {
    const res = nextResponseFromHhFailure("api:suggests", e, { text });
    const body = await res.json();
    return NextResponse.json(
      { ...body, items: [] as string[] },
      { status: res.status },
    );
  }
}
