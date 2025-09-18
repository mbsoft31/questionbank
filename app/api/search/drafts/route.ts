import { mock, ok, paginate } from "../../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

/**
 * Query:
 * - q: text
 * - concept: code (e.g., ALG-10-LINEAR)
 * - status: draft|in_review|...
 * - item_type: mcq|...
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const concept = searchParams.get("concept");
    const status = searchParams.get("status");
    const itemType = searchParams.get("item_type");

    let docs = mock.msItemDraftDocs;
    if (q) docs = docs.filter((d) => (d.stem_ar + " " + (d.latex ?? "")).toLowerCase().includes(q));
    if (concept) docs = docs.filter((d) => d.concept_codes.includes(concept));
    if (status) docs = docs.filter((d) => d.status === status);
    if (itemType) docs = docs.filter((d) => d.item_type === itemType);

    return ok(paginate(docs, searchParams));
}
