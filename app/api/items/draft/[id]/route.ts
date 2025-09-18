import { ok, notFound } from "../../../_lib/utils";
import { fetchDraftById } from "../../../_lib/sql-dal";
import {NextRequest} from "next/server";

export const runtime = 'nodejs'
export const dynamic = "force-dynamic";


/**
 * GET /api/items/draft/:id?include=options,hints,solution,media,tags,concepts
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/concepts/[id]">) {
    const { id } = await ctx.params; // Next 15: params is Promise
    const { searchParams } = new URL(_req.url);
    const include = (searchParams.get("include") ?? "")
        .split(",").map(s => s.trim()).filter(Boolean) as any;

    const row = await fetchDraftById(id, include);
    if (!row) return notFound("Draft item not found");
    return ok(row);
}