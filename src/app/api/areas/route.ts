import { NextResponse } from "next/server";

import { hhFetchJson } from "@/lib/hh/client";
import { findBelarusRoot, flattenAreas } from "@/lib/hh/areas";
import type { HhArea } from "@/lib/hh/types";
import { createAppLog, serializeAppLog } from "@/lib/logger";
import { nextResponseFromHhFailure } from "@/lib/hh/routeErrors";

export async function GET() {
  try {
    const roots = await hhFetchJson<HhArea[]>(
      "/areas",
      undefined,
      "api:areas",
      { next: { revalidate: 86400 } },
    );
    const belarus = findBelarusRoot(roots);
    if (!belarus) {
      const log = createAppLog({
        source: "api:areas",
        severity: "error",
        message: "Belarus node not found in HH /areas tree",
      });
      console.error(serializeAppLog(log));
      return NextResponse.json(
        { error: "Belarus not found in areas catalog", log },
        { status: 500 },
      );
    }
    const areas = flattenAreas(belarus, 3);
    return NextResponse.json({ country: { id: belarus.id, name: belarus.name }, areas });
  } catch (e) {
    return nextResponseFromHhFailure("api:areas", e);
  }
}
