// app/api/media-assets/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ok } from "../_lib/utils";
import { fetchMediaPage } from "../_lib/sql-dal";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = await fetchMediaPage(searchParams);
    return ok(page);
}
