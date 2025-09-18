export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ok } from "../../_lib/utils";
import { fetchProdPage } from "../../_lib/sql-dal";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const include = (searchParams.get("include") ?? "")
        .split(",").map(s => s.trim()).filter(Boolean) as any;
    const page = await fetchProdPage(searchParams, include);
    return ok(page);
}