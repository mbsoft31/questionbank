import type {NextRequest} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ok, notFound } from "../../../_lib/utils";
import { fetchProdById } from "../../../_lib/sql-dal";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/concepts/[id]">) {
    const { id } = await ctx.params; // Next 15: params is Promise
    const { searchParams } = new URL(_req.url);
    const include = (searchParams.get("include") ?? "")
        .split(",").map(s => s.trim()).filter(Boolean) as any;

    const row = await fetchProdById(id, include);
    if (!row) return notFound("Item not found");
    return ok(row);
}