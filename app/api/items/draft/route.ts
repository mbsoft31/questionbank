import { mock, ok, paginate, badRequest } from "../../_lib/utils";
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
    const status = searchParams.get("status");
    const itemType = searchParams.get("item_type");
    const conceptId = searchParams.get("concept_id");
    const q = (searchParams.get("q") ?? "").trim();
    const include = (searchParams.get("include") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    let items = mock.itemsDraft;
    if (status) items = items.filter((i) => i.status === status);
    if (itemType) items = items.filter((i) => i.item_type === itemType);
    if (conceptId) {
        const allowed = new Set(
            mock.itemConcepts.filter((ic) => ic.concept_id === conceptId).map((ic) => ic.item_id)
        );
        items = items.filter((i) => allowed.has(i.id));
    }
    if (q) {
        const needle = q.toLowerCase();
        items = items.filter((i) =>
            (i.stem_ar + " " + (i.latex ?? "")).toLowerCase().includes(needle)
        );
    }

    const page = paginate(items, searchParams);

    // Optionally expand children (shallow)
    if (include.length) {
        const withChildren = page.data.map((i) => ({
            ...i,
            ...(include.includes("options") && {
                options: mock.itemOptions.filter((o) => o.owner_id === i.id && o.owner_type === "draft"),
            }),
            ...(include.includes("hints") && {
                hints: mock.itemHints.filter((h) => h.owner_id === i.id && h.owner_type === "draft"),
            }),
            ...(include.includes("solution") && {
                solution: mock.itemSolutions.find((s) => s.owner_id === i.id && s.owner_type === "draft"),
            }),
            ...(include.includes("media") && {
                media: mock.itemMedia.filter((m) => m.owner_id === i.id && m.owner_type === "draft"),
            }),
            ...(include.includes("tags") && {
                tags: mock.itemTags
                    .filter((t) => t.item_id === i.id)
                    .map((t) => mock.tags.find((tt) => tt.id === t.tag_id)),
            }),
            ...(include.includes("concepts") && {
                concepts: mock.itemConcepts
                    .filter((ic) => ic.item_id === i.id)
                    .map((ic) => mock.concepts.find((c) => c.id === ic.concept_id)),
            }),
        }));
        return ok({ ...page, data: withChildren });
    }

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
