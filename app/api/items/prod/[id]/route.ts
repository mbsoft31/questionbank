import { mock, ok, notFound } from "../../../_lib/utils";
export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { searchParams } = new URL(request.url);
    const include = (searchParams.get("include") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const item = mock.itemsProd.find((i) => i.id === params.id);
    if (!item) return notFound("Item not found");

    const full = {
        ...item,
        ...(include.includes("options") && {
            options: mock.prodOptions.filter((o) => o.owner_id === item.id && o.owner_type === "prod"),
        }),
        ...(include.includes("hints") && {
            hints: mock.prodHints.filter((h) => h.owner_id === item.id && h.owner_type === "prod"),
        }),
        ...(include.includes("solution") && {
            solution: mock.prodSolutions.find((s) => s.owner_id === item.id && s.owner_type === "prod"),
        }),
    };

    return ok(full);
}
