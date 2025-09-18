import { ok, badRequest } from "../../_lib/utils";
import { fetchDraftPage } from "../../_lib/sql-dal";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

/**
 * Query params:
 * - status: draft|in_review|changes_requested|archived
 * - item_type: mcq|multi_select|numeric|short_text|proof
 * - concept_id: UUID (filters by mapping)
 * - q: substring search in stem_ar/latex
 * - include: comma list of children: options,hints,solution,media,tags,concepts
 * - page, pageSize
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const include = (searchParams.get("include") ?? "")
        .split(",").map(s => s.trim()).filter(Boolean) as never;
    const page = await fetchDraftPage(searchParams, include);
    return ok(page);
}

export async function POST(request: Request) {
    // For mock-only dev: accept payload and echo (no persistence)
    try {
        const body = await request.json();
        return ok({ created: true, draft: body }, { status: 201 });
    } catch {
        return badRequest("Invalid JSON");
    }
}


