import { ok, notFound } from "../../../_lib/utils";
import { fetchDraftById } from "../../../_lib/sql-dal";

export const runtime = 'nodejs'
export const dynamic = "force-dynamic";


/**
 * GET /api/items/draft/:id?include=options,hints,solution,media,tags,concepts
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { searchParams } = new URL(request.url);
    const include = (searchParams.get("include") ?? "")
        .split(",").map(s => s.trim()).filter(Boolean) as any;

    const row = await fetchDraftById(params.id, include);
    if (!row) return notFound("Draft item not found");
    return ok(row);
}