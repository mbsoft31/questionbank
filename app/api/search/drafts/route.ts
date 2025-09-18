// app/api/search/drafts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ok } from "../../_lib/utils";
import { searchDraftDocsPage } from "../../_lib/sql-dal";


/**
 * Query:
 * - q: text
 * - concept: code (e.g., ALG-10-LINEAR)
 * - status: draft|in_review|...
 * - item_type: mcq|...
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = await searchDraftDocsPage(searchParams);
    return ok(page);
}