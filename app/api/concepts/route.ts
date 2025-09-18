export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ok } from "../_lib/utils";
import { fetchConceptPage } from "../_lib/sql-dal";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = await fetchConceptPage(searchParams);
    return ok(page);
}