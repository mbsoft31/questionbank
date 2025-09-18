// app/api/tags/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ok } from "../_lib/utils";
import { fetchTagPage } from "../_lib/sql-dal";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = await fetchTagPage(searchParams);
    return ok(page);
}
