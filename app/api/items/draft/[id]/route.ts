import { mock, ok, notFound } from "../../../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

/**
 * GET /api/items/draft/:id?include=options,hints,solution,media,tags,concepts
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { searchParams } = new URL(request.url);
    const include = (searchParams.get("include") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const item = mock.itemsDraft.find((i) => i.id === params.id);
    if (!item) return notFound("Draft item not found");

    const full = {
        ...item,
        ...(include.includes("options") && {
            options: mock.itemOptions.filter((o) => o.owner_id === item.id && o.owner_type === "draft"),
        }),
        ...(include.includes("hints") && {
            hints: mock.itemHints.filter((h) => h.owner_id === item.id && h.owner_type === "draft"),
        }),
        ...(include.includes("solution") && {
            solution: mock.itemSolutions.find((s) => s.owner_id === item.id && s.owner_type === "draft"),
        }),
        ...(include.includes("media") && {
            media: mock.itemMedia.filter((m) => m.owner_id === item.id && m.owner_type === "draft"),
        }),
        ...(include.includes("tags") && {
            tags: mock.itemTags
                .filter((t) => t.item_id === item.id)
                .map((t) => mock.tags.find((tt) => tt.id === t.tag_id)),
        }),
        ...(include.includes("concepts") && {
            concepts: mock.itemConcepts
                .filter((ic) => ic.item_id === item.id)
                .map((ic) => mock.concepts.find((c) => c.id === ic.concept_id)),
        }),
    };

    return ok(full);
}
