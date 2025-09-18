import { mock, ok, paginate } from "../../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("item_type");
    const conceptId = searchParams.get("concept_id");
    const q = (searchParams.get("q") ?? "").trim();
    const include = (searchParams.get("include") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

    let items = mock.itemsProd;
    if (itemType) items = items.filter((i) => i.item_type === itemType);
    if (conceptId) items = items.filter((i) => i.concept_main_id === conceptId);
    if (q) {
        const needle = q.toLowerCase();
        items = items.filter((i) => (i.stem_ar + " " + (i.latex ?? "")).toLowerCase().includes(needle));
    }

    const page = paginate(items, searchParams);

    if (include.length) {
        const withChildren = page.data.map((i) => ({
            ...i,
            ...(include.includes("options") && {
                options: mock.prodOptions.filter((o) => o.owner_id === i.id && o.owner_type === "prod"),
            }),
            ...(include.includes("hints") && {
                hints: mock.prodHints.filter((h) => h.owner_id === i.id && h.owner_type === "prod"),
            }),
            ...(include.includes("solution") && {
                solution: mock.prodSolutions.find((s) => s.owner_id === i.id && s.owner_type === "prod"),
            }),
        }));
        return ok({ ...page, data: withChildren });
    }

    return ok(page);
}
